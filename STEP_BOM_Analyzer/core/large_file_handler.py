"""
STEP BOM Analyzer - Large File Handler
Streaming and chunked processing for large STEP files with memory optimization.
"""

import os
import mmap
import tempfile
from pathlib import Path
from typing import Dict, Any, List, Optional, Iterator, Tuple, Generator
from dataclasses import dataclass
import logging
import threading
import time
from datetime import datetime
import gc
import hashlib
from enum import Enum
import subprocess
import queue
import psutil
from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor
import multiprocessing as mp

from .performance_monitor import PerformanceMonitor, ResourceTracker, memory_limit_decorator


class FileProcessingStrategy(Enum):
    """File processing strategies based on size and complexity"""
    DIRECT = "direct"          # < 50MB - process directly
    CHUNKED = "chunked"        # 50-500MB - chunk processing
    STREAMING = "streaming"    # 500MB-2GB - streaming with temp files
    DISTRIBUTED = "distributed" # > 2GB - multi-process distributed


class ChunkType(Enum):
    """Types of STEP file chunks"""
    HEADER = "header"
    ENTITIES = "entities"
    GEOMETRY = "geometry"
    ASSEMBLY = "assembly"
    MATERIALS = "materials"
    METADATA = "metadata"


@dataclass
class FileChunk:
    """Represents a chunk of STEP file data"""
    chunk_id: str
    chunk_type: ChunkType
    start_position: int
    end_position: int
    size_bytes: int
    temp_file_path: Optional[Path] = None
    processed: bool = False
    error_message: Optional[str] = None
    
    @property
    def size_mb(self) -> float:
        return self.size_bytes / 1024 / 1024


@dataclass
class FileAnalysis:
    """Analysis results for STEP file structure"""
    file_path: Path
    file_size_bytes: int
    estimated_entities: int
    estimated_parts: int
    complexity_score: float
    processing_strategy: FileProcessingStrategy
    recommended_chunk_size: int
    memory_requirement_mb: float
    estimated_processing_time: float
    
    @property
    def file_size_mb(self) -> float:
        return self.file_size_bytes / 1024 / 1024


class StepFileAnalyzer:
    """Analyzes STEP files to determine optimal processing strategy"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
    
    def analyze_file(self, file_path: Path) -> FileAnalysis:
        """Analyze STEP file and determine processing strategy"""
        file_size = file_path.stat().st_size
        file_size_mb = file_size / 1024 / 1024
        
        # Quick analysis using file scanning
        entity_count, part_count, complexity = self._quick_scan_file(file_path)
        
        # Determine strategy
        if file_size_mb < 50:
            strategy = FileProcessingStrategy.DIRECT
            chunk_size = file_size
            memory_req = file_size_mb * 2  # 2x overhead
            time_est = file_size_mb * 0.1  # 0.1 min per MB
        elif file_size_mb < 500:
            strategy = FileProcessingStrategy.CHUNKED
            chunk_size = min(50 * 1024 * 1024, file_size // 10)  # 50MB chunks or 10 parts
            memory_req = 100  # Fixed 100MB for chunked
            time_est = file_size_mb * 0.2
        elif file_size_mb < 2000:
            strategy = FileProcessingStrategy.STREAMING
            chunk_size = 100 * 1024 * 1024  # 100MB chunks
            memory_req = 200  # Fixed 200MB for streaming
            time_est = file_size_mb * 0.3
        else:
            strategy = FileProcessingStrategy.DISTRIBUTED
            chunk_size = 200 * 1024 * 1024  # 200MB chunks
            memory_req = 500  # 500MB for distributed
            time_est = file_size_mb * 0.4
        
        return FileAnalysis(
            file_path=file_path,
            file_size_bytes=file_size,
            estimated_entities=entity_count,
            estimated_parts=part_count,
            complexity_score=complexity,
            processing_strategy=strategy,
            recommended_chunk_size=chunk_size,
            memory_requirement_mb=memory_req,
            estimated_processing_time=time_est
        )
    
    def _quick_scan_file(self, file_path: Path) -> Tuple[int, int, float]:
        """Quick scan to estimate file complexity"""
        entity_count = 0
        part_count = 0
        complexity_indicators = 0
        
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                # Scan first 1MB for quick analysis
                sample_size = min(1024 * 1024, file_path.stat().st_size)
                content = f.read(sample_size)
                
                # Count entities (rough estimate)
                entity_count = content.count('#')
                
                # Count geometric entities
                geometric_keywords = [
                    'CARTESIAN_POINT', 'DIRECTION', 'VECTOR', 
                    'PLANE', 'CYLINDRICAL_SURFACE', 'SPHERICAL_SURFACE',
                    'B_SPLINE_CURVE', 'B_SPLINE_SURFACE'
                ]
                
                for keyword in geometric_keywords:
                    complexity_indicators += content.count(keyword)
                
                # Count parts/products
                part_keywords = ['PRODUCT', 'SHAPE_REPRESENTATION', 'MANIFOLD_SOLID_BREP']
                for keyword in part_keywords:
                    part_count += content.count(keyword)
                
                # Estimate total from sample
                if sample_size < file_path.stat().st_size:
                    scale_factor = file_path.stat().st_size / sample_size
                    entity_count = int(entity_count * scale_factor)
                    part_count = int(part_count * scale_factor)
                    complexity_indicators = int(complexity_indicators * scale_factor)
        
        except Exception as e:
            self.logger.warning(f"Error scanning file {file_path}: {e}")
        
        # Calculate complexity score (0-10)
        complexity_score = min(10, (complexity_indicators / max(entity_count, 1)) * 10)
        
        return entity_count, part_count, complexity_score


class ChunkedFileProcessor:
    """Processes large files using chunked approach"""
    
    def __init__(self, analysis: FileAnalysis, temp_dir: Path = None):
        self.analysis = analysis
        self.temp_dir = temp_dir or Path(tempfile.gettempdir()) / "step_bom_analyzer"
        self.temp_dir.mkdir(exist_ok=True)
        
        self.chunks: List[FileChunk] = []
        self.resource_tracker = ResourceTracker()
        self.logger = logging.getLogger(__name__)
    
    def split_file_into_chunks(self) -> List[FileChunk]:
        """Split file into manageable chunks"""
        self.logger.info(f"Splitting file into chunks: {self.analysis.file_path}")
        
        chunk_size = self.analysis.recommended_chunk_size
        file_size = self.analysis.file_size_bytes
        
        chunks = []
        chunk_id = 0
        
        try:
            with open(self.analysis.file_path, 'rb') as f:
                while True:
                    start_pos = f.tell()
                    chunk_data = f.read(chunk_size)
                    
                    if not chunk_data:
                        break
                    
                    # Find safe break point (end of line)
                    if len(chunk_data) == chunk_size and not f.tell() >= file_size:
                        # Look for line ending within last 1KB
                        search_back = min(1024, len(chunk_data))
                        for i in range(len(chunk_data) - 1, len(chunk_data) - search_back - 1, -1):
                            if chunk_data[i:i+1] == b'\n':
                                # Adjust chunk to end at line break
                                f.seek(start_pos + i + 1)
                                chunk_data = chunk_data[:i+1]
                                break
                    
                    end_pos = f.tell()
                    
                    # Create temporary file for chunk
                    chunk_file = self.temp_dir / f"chunk_{chunk_id:04d}.step"
                    with open(chunk_file, 'wb') as chunk_f:
                        chunk_f.write(chunk_data)
                    
                    # Determine chunk type
                    chunk_type = self._determine_chunk_type(chunk_data)
                    
                    chunk = FileChunk(
                        chunk_id=f"chunk_{chunk_id:04d}",
                        chunk_type=chunk_type,
                        start_position=start_pos,
                        end_position=end_pos,
                        size_bytes=len(chunk_data),
                        temp_file_path=chunk_file
                    )
                    
                    chunks.append(chunk)
                    self.resource_tracker.register_temp_file(chunk_file)
                    chunk_id += 1
            
            self.chunks = chunks
            self.logger.info(f"Created {len(chunks)} chunks, total size: {sum(c.size_mb for c in chunks):.1f} MB")
            return chunks
            
        except Exception as e:
            self.logger.error(f"Error splitting file into chunks: {e}")
            return []
    
    def _determine_chunk_type(self, chunk_data: bytes) -> ChunkType:
        """Determine the type of content in chunk"""
        content = chunk_data.decode('utf-8', errors='ignore')[:1000]  # Check first 1KB
        
        if 'ISO-10303' in content or 'HEADER' in content:
            return ChunkType.HEADER
        elif 'CARTESIAN_POINT' in content or 'DIRECTION' in content:
            return ChunkType.GEOMETRY
        elif 'PRODUCT' in content or 'NEXT_ASSEMBLY' in content:
            return ChunkType.ASSEMBLY
        elif 'MATERIAL' in content or 'SURFACE_STYLE' in content:
            return ChunkType.MATERIALS
        else:
            return ChunkType.ENTITIES
    
    def process_chunks_sequential(self) -> List[Dict[str, Any]]:
        """Process chunks sequentially with memory management"""
        results = []
        
        for i, chunk in enumerate(self.chunks):
            self.logger.info(f"Processing chunk {i+1}/{len(self.chunks)}: {chunk.chunk_id}")
            
            try:
                # Process chunk
                result = self._process_single_chunk(chunk)
                results.append(result)
                chunk.processed = True
                
                # Memory cleanup after each chunk
                gc.collect()
                
                # Check memory usage
                current_memory = psutil.Process().memory_info().rss / 1024 / 1024
                if current_memory > 1000:  # 1GB limit
                    self.logger.warning(f"High memory usage: {current_memory:.1f} MB")
                    gc.collect()
                
            except Exception as e:
                self.logger.error(f"Error processing chunk {chunk.chunk_id}: {e}")
                chunk.error_message = str(e)
                results.append({'chunk_id': chunk.chunk_id, 'error': str(e)})
        
        return results
    
    def process_chunks_parallel(self, max_workers: int = None) -> List[Dict[str, Any]]:
        """Process chunks in parallel"""
        if max_workers is None:
            max_workers = min(4, mp.cpu_count())
        
        results = []
        
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            futures = []
            
            for chunk in self.chunks:
                future = executor.submit(self._process_single_chunk, chunk)
                futures.append((chunk, future))
            
            # Collect results
            for chunk, future in futures:
                try:
                    result = future.result(timeout=300)  # 5 minute timeout
                    results.append(result)
                    chunk.processed = True
                except Exception as e:
                    self.logger.error(f"Error in parallel processing chunk {chunk.chunk_id}: {e}")
                    chunk.error_message = str(e)
                    results.append({'chunk_id': chunk.chunk_id, 'error': str(e)})
        
        return results
    
    @memory_limit_decorator(500)  # 500MB limit per chunk
    def _process_single_chunk(self, chunk: FileChunk) -> Dict[str, Any]:
        """Process a single chunk"""
        if not chunk.temp_file_path or not chunk.temp_file_path.exists():
            raise FileNotFoundError(f"Chunk file not found: {chunk.temp_file_path}")
        
        result = {
            'chunk_id': chunk.chunk_id,
            'chunk_type': chunk.chunk_type.value,
            'size_mb': chunk.size_mb,
            'entities': [],
            'parts': [],
            'processing_time': 0
        }
        
        start_time = time.time()
        
        try:
            # Read chunk content
            with open(chunk.temp_file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            
            # Extract entities based on chunk type
            if chunk.chunk_type == ChunkType.HEADER:
                result['header_info'] = self._extract_header_info(content)
            elif chunk.chunk_type == ChunkType.GEOMETRY:
                result['geometry_entities'] = self._extract_geometry_entities(content)
            elif chunk.chunk_type == ChunkType.ASSEMBLY:
                result['assembly_structure'] = self._extract_assembly_info(content)
            elif chunk.chunk_type == ChunkType.MATERIALS:
                result['materials'] = self._extract_material_info(content)
            else:
                result['entities'] = self._extract_general_entities(content)
            
            processing_time = time.time() - start_time
            result['processing_time'] = processing_time
            
            self.logger.info(f"Processed chunk {chunk.chunk_id} in {processing_time:.2f}s")
            
        except Exception as e:
            result['error'] = str(e)
            self.logger.error(f"Error processing chunk {chunk.chunk_id}: {e}")
        
        return result
    
    def _extract_header_info(self, content: str) -> Dict[str, Any]:
        """Extract header information"""
        header_info = {}
        lines = content.split('\n')
        
        for line in lines:
            line = line.strip()
            if line.startswith('FILE_NAME'):
                header_info['file_name'] = line
            elif line.startswith('FILE_DESCRIPTION'):
                header_info['file_description'] = line
            elif line.startswith('FILE_SCHEMA'):
                header_info['file_schema'] = line
        
        return header_info
    
    def _extract_geometry_entities(self, content: str) -> List[Dict[str, Any]]:
        """Extract geometry entities"""
        entities = []
        lines = content.split('\n')
        
        for line in lines:
            line = line.strip()
            if 'CARTESIAN_POINT' in line:
                entities.append({'type': 'point', 'data': line})
            elif 'DIRECTION' in line:
                entities.append({'type': 'direction', 'data': line})
            elif 'CYLINDRICAL_SURFACE' in line:
                entities.append({'type': 'cylinder', 'data': line})
        
        return entities
    
    def _extract_assembly_info(self, content: str) -> Dict[str, Any]:
        """Extract assembly structure"""
        assembly_info = {'products': [], 'relationships': []}
        lines = content.split('\n')
        
        for line in lines:
            line = line.strip()
            if 'PRODUCT(' in line:
                assembly_info['products'].append(line)
            elif 'NEXT_ASSEMBLY_USAGE_OCCURRENCE' in line:
                assembly_info['relationships'].append(line)
        
        return assembly_info
    
    def _extract_material_info(self, content: str) -> List[Dict[str, Any]]:
        """Extract material information"""
        materials = []
        lines = content.split('\n')
        
        for line in lines:
            line = line.strip()
            if 'SURFACE_STYLE_FILL_AREA' in line:
                materials.append({'type': 'surface_style', 'data': line})
            elif 'COLOUR_RGB' in line:
                materials.append({'type': 'color', 'data': line})
        
        return materials
    
    def _extract_general_entities(self, content: str) -> List[str]:
        """Extract general entities"""
        entities = []
        lines = content.split('\n')
        
        for line in lines:
            line = line.strip()
            if line.startswith('#') and '=' in line:
                entities.append(line)
        
        return entities[:100]  # Limit to first 100 entities
    
    def merge_results(self, chunk_results: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Merge results from all chunks"""
        merged = {
            'file_info': {
                'path': str(self.analysis.file_path),
                'size_mb': self.analysis.file_size_mb,
                'chunks_processed': len(chunk_results),
                'processing_strategy': self.analysis.processing_strategy.value
            },
            'header_info': {},
            'geometry_entities': [],
            'assembly_structure': {'products': [], 'relationships': []},
            'materials': [],
            'total_entities': 0,
            'processing_summary': {
                'total_time': 0,
                'successful_chunks': 0,
                'failed_chunks': 0
            }
        }
        
        for result in chunk_results:
            if 'error' in result:
                merged['processing_summary']['failed_chunks'] += 1
                continue
            
            merged['processing_summary']['successful_chunks'] += 1
            merged['processing_summary']['total_time'] += result.get('processing_time', 0)
            
            # Merge specific data types
            if 'header_info' in result:
                merged['header_info'].update(result['header_info'])
            
            if 'geometry_entities' in result:
                merged['geometry_entities'].extend(result['geometry_entities'])
            
            if 'assembly_structure' in result:
                merged['assembly_structure']['products'].extend(
                    result['assembly_structure'].get('products', [])
                )
                merged['assembly_structure']['relationships'].extend(
                    result['assembly_structure'].get('relationships', [])
                )
            
            if 'materials' in result:
                merged['materials'].extend(result['materials'])
            
            if 'entities' in result:
                merged['total_entities'] += len(result['entities'])
        
        self.logger.info(f"Merged results: {merged['processing_summary']}")
        return merged
    
    def cleanup(self):
        """Cleanup temporary files"""
        self.resource_tracker.cleanup_resources()
        
        # Remove temp directory if empty
        try:
            if self.temp_dir.exists() and not any(self.temp_dir.iterdir()):
                self.temp_dir.rmdir()
        except Exception as e:
            self.logger.warning(f"Could not remove temp directory: {e}")


class LargeFileHandler:
    """Main interface for large file processing"""
    
    def __init__(self, performance_monitor: PerformanceMonitor = None):
        self.analyzer = StepFileAnalyzer()
        self.performance_monitor = performance_monitor
        self.logger = logging.getLogger(__name__)
    
    def process_large_file(self, file_path: Path, output_dir: Path = None) -> Dict[str, Any]:
        """Process large STEP file using optimal strategy"""
        # Analyze file
        analysis = self.analyzer.analyze_file(file_path)
        self.logger.info(f"File analysis: {analysis.processing_strategy.value}, "
                        f"estimated time: {analysis.estimated_processing_time:.1f} min")
        
        if output_dir is None:
            output_dir = file_path.parent / f"{file_path.stem}_analysis"
        output_dir.mkdir(exist_ok=True)
        
        # Start performance monitoring
        monitor_context = None
        if self.performance_monitor:
            monitor_context = self.performance_monitor.start_operation(
                f"large_file_processing_{analysis.processing_strategy.value}"
            )
            monitor_context.__enter__()
        
        try:
            if analysis.processing_strategy == FileProcessingStrategy.DIRECT:
                result = self._process_direct(analysis, output_dir)
            elif analysis.processing_strategy == FileProcessingStrategy.CHUNKED:
                result = self._process_chunked(analysis, output_dir)
            elif analysis.processing_strategy == FileProcessingStrategy.STREAMING:
                result = self._process_streaming(analysis, output_dir)
            else:  # DISTRIBUTED
                result = self._process_distributed(analysis, output_dir)
            
            # Save results
            result_file = output_dir / "processing_results.json"
            import json
            with open(result_file, 'w') as f:
                json.dump(result, f, indent=2, default=str)
            
            self.logger.info(f"Large file processing completed: {result_file}")
            return result
            
        finally:
            if monitor_context:
                monitor_context.__exit__(None, None, None)
    
    def _process_direct(self, analysis: FileAnalysis, output_dir: Path) -> Dict[str, Any]:
        """Process file directly (small files)"""
        self.logger.info("Processing file directly")
        
        # Use standard workflow for small files
        return {
            'strategy': 'direct',
            'file_size_mb': analysis.file_size_mb,
            'message': 'Processed using standard workflow'
        }
    
    def _process_chunked(self, analysis: FileAnalysis, output_dir: Path) -> Dict[str, Any]:
        """Process file using chunked approach"""
        self.logger.info("Processing file using chunked approach")
        
        processor = ChunkedFileProcessor(analysis)
        
        try:
            # Split into chunks
            chunks = processor.split_file_into_chunks()
            if not chunks:
                raise Exception("Failed to create chunks")
            
            # Process chunks
            chunk_results = processor.process_chunks_sequential()
            
            # Merge results
            merged_result = processor.merge_results(chunk_results)
            merged_result['strategy'] = 'chunked'
            
            return merged_result
            
        finally:
            processor.cleanup()
    
    def _process_streaming(self, analysis: FileAnalysis, output_dir: Path) -> Dict[str, Any]:
        """Process file using streaming approach"""
        self.logger.info("Processing file using streaming approach")
        
        # For streaming, we use chunked processing with larger chunks
        # and more aggressive memory management
        processor = ChunkedFileProcessor(analysis)
        
        try:
            chunks = processor.split_file_into_chunks()
            
            # Process with more frequent garbage collection
            results = []
            for i, chunk in enumerate(chunks):
                result = processor._process_single_chunk(chunk)
                results.append(result)
                
                # Aggressive cleanup every 5 chunks
                if (i + 1) % 5 == 0:
                    gc.collect()
                    if self.performance_monitor:
                        self.performance_monitor.optimize_performance()
            
            merged_result = processor.merge_results(results)
            merged_result['strategy'] = 'streaming'
            
            return merged_result
            
        finally:
            processor.cleanup()
    
    def _process_distributed(self, analysis: FileAnalysis, output_dir: Path) -> Dict[str, Any]:
        """Process file using distributed approach"""
        self.logger.info("Processing file using distributed approach")
        
        processor = ChunkedFileProcessor(analysis)
        
        try:
            chunks = processor.split_file_into_chunks()
            
            # Use parallel processing for distributed
            chunk_results = processor.process_chunks_parallel(max_workers=mp.cpu_count())
            
            merged_result = processor.merge_results(chunk_results)
            merged_result['strategy'] = 'distributed'
            
            return merged_result
            
        finally:
            processor.cleanup()


def large_file_handler_example():
    """Example usage of large file handler"""
    from .performance_monitor import PerformanceMonitor
    
    # Initialize components
    performance_monitor = PerformanceMonitor()
    performance_monitor.start_monitoring()
    
    handler = LargeFileHandler(performance_monitor)
    
    try:
        # Example large file processing
        test_file = Path("test_large_file.step")
        if test_file.exists():
            result = handler.process_large_file(test_file)
            print(f"Processing result: {result}")
        else:
            print("No test file found")
            
            # Create example analysis
            analyzer = StepFileAnalyzer()
            
            # Test different file sizes
            test_sizes = [30, 100, 800, 3000]  # MB
            for size_mb in test_sizes:
                # Create mock analysis
                mock_analysis = FileAnalysis(
                    file_path=Path(f"mock_{size_mb}mb.step"),
                    file_size_bytes=size_mb * 1024 * 1024,
                    estimated_entities=size_mb * 1000,
                    estimated_parts=size_mb * 10,
                    complexity_score=5.0,
                    processing_strategy=FileProcessingStrategy.DIRECT,
                    recommended_chunk_size=50 * 1024 * 1024,
                    memory_requirement_mb=size_mb * 2,
                    estimated_processing_time=size_mb * 0.1
                )
                
                print(f"\nMock analysis for {size_mb}MB file:")
                print(f"Strategy: {analyzer.analyze_file(Path('dummy')).processing_strategy}")
    
    finally:
        performance_monitor.stop_monitoring_system()
        performance_monitor.resource_tracker.cleanup_resources()


if __name__ == "__main__":
    large_file_handler_example()