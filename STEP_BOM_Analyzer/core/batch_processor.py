"""
STEP BOM Analyzer - Batch Processing Engine
Handles multiple STEP file processing with advanced workflow orchestration.
"""

import os
import asyncio
import concurrent.futures
from pathlib import Path
from typing import List, Dict, Any, Optional, Callable
from dataclasses import dataclass
from enum import Enum
import logging
from datetime import datetime
import json
import threading
import queue
import time

from .workflow_orchestrator import WorkflowOrchestrator, WorkflowProgress, WorkflowState
from .error_handler import StepBomErrorHandler


class BatchProcessingState(Enum):
    IDLE = "idle"
    SCANNING = "scanning"
    PROCESSING = "processing"
    PAUSED = "paused"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    ERROR = "error"


@dataclass
class BatchFile:
    """Represents a single file in batch processing"""
    file_path: Path
    file_size: int
    status: str = "pending"  # pending, processing, completed, failed, skipped
    progress: float = 0.0
    error_message: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    output_files: List[str] = None
    
    def __post_init__(self):
        if self.output_files is None:
            self.output_files = []


@dataclass
class BatchProgress:
    """Overall batch processing progress"""
    state: BatchProcessingState
    total_files: int
    completed_files: int
    failed_files: int
    skipped_files: int
    current_file: Optional[str] = None
    current_file_progress: float = 0.0
    estimated_time_remaining: Optional[float] = None
    total_progress: float = 0.0
    start_time: Optional[datetime] = None


class BatchProcessor:
    """Advanced batch processing engine for multiple STEP files"""
    
    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or {}
        self.orchestrator = WorkflowOrchestrator(self.config)
        self.error_handler = StepBomErrorHandler()
        
        # Batch processing state
        self.state = BatchProcessingState.IDLE
        self.files: List[BatchFile] = []
        self.progress = BatchProgress(
            state=BatchProcessingState.IDLE,
            total_files=0,
            completed_files=0,
            failed_files=0,
            skipped_files=0
        )
        
        # Processing settings
        self.max_concurrent_files = self.config.get('max_concurrent_files', 2)
        self.max_file_size_mb = self.config.get('max_file_size_mb', 1000)
        self.timeout_per_file = self.config.get('timeout_per_file', 1800)  # 30 minutes
        self.pause_on_error = self.config.get('pause_on_error', False)
        self.skip_existing = self.config.get('skip_existing', True)
        
        # Callbacks
        self.progress_callback: Optional[Callable[[BatchProgress], None]] = None
        self.file_completed_callback: Optional[Callable[[BatchFile], None]] = None
        
        # Threading
        self.executor = concurrent.futures.ThreadPoolExecutor(
            max_workers=self.max_concurrent_files
        )
        self.cancel_event = threading.Event()
        self.pause_event = threading.Event()
        
        # Logging
        self.logger = logging.getLogger(__name__)
    
    def set_progress_callback(self, callback: Callable[[BatchProgress], None]):
        """Set callback for progress updates"""
        self.progress_callback = callback
    
    def set_file_completed_callback(self, callback: Callable[[BatchFile], None]):
        """Set callback for individual file completion"""
        self.file_completed_callback = callback
    
    def scan_directory(self, directory: Path, recursive: bool = True) -> List[Path]:
        """Scan directory for STEP files"""
        self.state = BatchProcessingState.SCANNING
        self._update_progress()
        
        step_files = []
        extensions = ['.step', '.stp', '.STEP', '.STP']
        
        try:
            if recursive:
                for ext in extensions:
                    step_files.extend(directory.rglob(f'*{ext}'))
            else:
                for ext in extensions:
                    step_files.extend(directory.glob(f'*{ext}'))
            
            # Filter by size
            valid_files = []
            for file_path in step_files:
                try:
                    file_size = file_path.stat().st_size
                    size_mb = file_size / (1024 * 1024)
                    
                    if size_mb <= self.max_file_size_mb:
                        valid_files.append(file_path)
                    else:
                        self.logger.warning(
                            f"Skipping large file: {file_path} ({size_mb:.1f} MB)"
                        )
                except Exception as e:
                    self.logger.error(f"Error checking file {file_path}: {e}")
            
            return sorted(valid_files)
            
        except Exception as e:
            self.logger.error(f"Error scanning directory {directory}: {e}")
            return []
        finally:
            self.state = BatchProcessingState.IDLE
    
    def add_files(self, file_paths: List[Path]):
        """Add files to batch processing queue"""
        self.files.clear()
        
        for file_path in file_paths:
            try:
                file_size = file_path.stat().st_size
                batch_file = BatchFile(
                    file_path=file_path,
                    file_size=file_size
                )
                
                # Check if output already exists
                if self.skip_existing and self._output_exists(file_path):
                    batch_file.status = "skipped"
                    batch_file.error_message = "Output already exists"
                
                self.files.append(batch_file)
                
            except Exception as e:
                self.logger.error(f"Error adding file {file_path}: {e}")
        
        self.progress.total_files = len(self.files)
        self.progress.completed_files = 0
        self.progress.failed_files = 0
        self.progress.skipped_files = sum(1 for f in self.files if f.status == "skipped")
        self._update_progress()
    
    def _output_exists(self, input_file: Path) -> bool:
        """Check if output files already exist for input file"""
        output_dir = input_file.parent / f"{input_file.stem}_analysis"
        return output_dir.exists() and any(output_dir.iterdir())
    
    async def process_batch_async(self, workflow_name: str = "standard") -> bool:
        """Process all files in batch asynchronously"""
        if not self.files:
            return False
        
        self.state = BatchProcessingState.PROCESSING
        self.progress.start_time = datetime.now()
        self.cancel_event.clear()
        self.pause_event.clear()
        self._update_progress()
        
        try:
            # Create tasks for concurrent processing
            semaphore = asyncio.Semaphore(self.max_concurrent_files)
            tasks = []
            
            for batch_file in self.files:
                if batch_file.status == "skipped":
                    continue
                
                task = asyncio.create_task(
                    self._process_single_file_async(batch_file, workflow_name, semaphore)
                )
                tasks.append(task)
            
            # Wait for all tasks to complete
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Process results
            success_count = 0
            for i, result in enumerate(results):
                if isinstance(result, Exception):
                    self.logger.error(f"Task failed: {result}")
                elif result:
                    success_count += 1
            
            self.state = BatchProcessingState.COMPLETED
            self._update_progress()
            
            return success_count > 0
            
        except Exception as e:
            self.logger.error(f"Batch processing error: {e}")
            self.state = BatchProcessingState.ERROR
            self._update_progress()
            return False
    
    async def _process_single_file_async(
        self, 
        batch_file: BatchFile, 
        workflow_name: str, 
        semaphore: asyncio.Semaphore
    ) -> bool:
        """Process a single file asynchronously"""
        async with semaphore:
            return await asyncio.get_event_loop().run_in_executor(
                self.executor,
                self._process_single_file,
                batch_file,
                workflow_name
            )
    
    def _process_single_file(self, batch_file: BatchFile, workflow_name: str) -> bool:
        """Process a single file (synchronous)"""
        if self.cancel_event.is_set():
            batch_file.status = "cancelled"
            return False
        
        # Wait if paused
        while self.pause_event.is_set() and not self.cancel_event.is_set():
            time.sleep(0.1)
        
        if self.cancel_event.is_set():
            batch_file.status = "cancelled"
            return False
        
        batch_file.status = "processing"
        batch_file.start_time = datetime.now()
        self.progress.current_file = str(batch_file.file_path.name)
        self._update_progress()
        
        try:
            # Setup file-specific progress callback
            def file_progress_callback(progress: WorkflowProgress):
                batch_file.progress = progress.progress_percentage
                self.progress.current_file_progress = progress.progress_percentage
                self._update_progress()
            
            self.orchestrator.set_progress_callback(file_progress_callback)
            
            # Process file
            parameters = {
                'step_file': str(batch_file.file_path),
                'output_dir': str(batch_file.file_path.parent / f"{batch_file.file_path.stem}_analysis"),
                'generate_html': True,
                'generate_json': True,
                'generate_csv': True,
                'generate_images': True
            }
            
            result = self.orchestrator.execute_workflow(workflow_name, parameters)
            
            if result.success:
                batch_file.status = "completed"
                batch_file.output_files = result.output_files
                self.progress.completed_files += 1
                
                if self.file_completed_callback:
                    self.file_completed_callback(batch_file)
                
            else:
                batch_file.status = "failed"
                batch_file.error_message = result.error_message
                self.progress.failed_files += 1
                
                if self.pause_on_error:
                    self.pause_event.set()
            
            batch_file.end_time = datetime.now()
            self._update_progress()
            
            return result.success
            
        except Exception as e:
            batch_file.status = "failed"
            batch_file.error_message = str(e)
            batch_file.end_time = datetime.now()
            self.progress.failed_files += 1
            
            error_report = self.error_handler.handle_error(e, {
                'file_path': str(batch_file.file_path),
                'workflow': workflow_name
            })
            
            self.logger.error(f"File processing failed: {error_report}")
            
            if self.pause_on_error:
                self.pause_event.set()
            
            self._update_progress()
            return False
    
    def pause_processing(self):
        """Pause batch processing"""
        self.pause_event.set()
        self.state = BatchProcessingState.PAUSED
        self._update_progress()
    
    def resume_processing(self):
        """Resume batch processing"""
        self.pause_event.clear()
        self.state = BatchProcessingState.PROCESSING
        self._update_progress()
    
    def cancel_processing(self):
        """Cancel batch processing"""
        self.cancel_event.set()
        self.pause_event.clear()
        self.state = BatchProcessingState.CANCELLED
        self._update_progress()
    
    def _update_progress(self):
        """Update progress calculations and notify callbacks"""
        if self.progress.total_files > 0:
            self.progress.total_progress = (
                (self.progress.completed_files + self.progress.failed_files + self.progress.skipped_files) 
                / self.progress.total_files
            ) * 100
        
        # Estimate time remaining
        if (self.progress.start_time and 
            self.progress.completed_files > 0 and 
            self.progress.total_files > 0):
            
            elapsed = (datetime.now() - self.progress.start_time).total_seconds()
            avg_time_per_file = elapsed / self.progress.completed_files
            remaining_files = (
                self.progress.total_files - 
                self.progress.completed_files - 
                self.progress.failed_files - 
                self.progress.skipped_files
            )
            self.progress.estimated_time_remaining = avg_time_per_file * remaining_files
        
        self.progress.state = self.state
        
        if self.progress_callback:
            self.progress_callback(self.progress)
    
    def get_processing_summary(self) -> Dict[str, Any]:
        """Get detailed processing summary"""
        total_time = None
        if self.progress.start_time:
            end_time = datetime.now()
            total_time = (end_time - self.progress.start_time).total_seconds()
        
        return {
            'total_files': self.progress.total_files,
            'completed_files': self.progress.completed_files,
            'failed_files': self.progress.failed_files,
            'skipped_files': self.progress.skipped_files,
            'success_rate': (
                (self.progress.completed_files / self.progress.total_files * 100) 
                if self.progress.total_files > 0 else 0
            ),
            'total_processing_time': total_time,
            'average_time_per_file': (
                total_time / self.progress.completed_files 
                if self.progress.completed_files > 0 and total_time else None
            ),
            'state': self.state.value,
            'files': [
                {
                    'path': str(f.file_path),
                    'status': f.status,
                    'error': f.error_message,
                    'processing_time': (
                        (f.end_time - f.start_time).total_seconds() 
                        if f.start_time and f.end_time else None
                    ),
                    'output_files': f.output_files
                }
                for f in self.files
            ]
        }
    
    def export_processing_report(self, output_file: Path):
        """Export detailed processing report"""
        summary = self.get_processing_summary()
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(summary, f, indent=2, ensure_ascii=False, default=str)
        
        self.logger.info(f"Processing report exported to: {output_file}")
    
    def cleanup(self):
        """Cleanup resources"""
        self.cancel_processing()
        self.executor.shutdown(wait=True)


def run_batch_processing_example():
    """Example usage of batch processor"""
    import asyncio
    
    async def main():
        # Configure batch processor
        config = {
            'max_concurrent_files': 2,
            'max_file_size_mb': 500,
            'timeout_per_file': 1800,
            'skip_existing': True
        }
        
        processor = BatchProcessor(config)
        
        # Progress callback
        def progress_callback(progress: BatchProgress):
            print(f"Progress: {progress.total_progress:.1f}% - "
                  f"Completed: {progress.completed_files}/{progress.total_files} - "
                  f"Current: {progress.current_file}")
        
        processor.set_progress_callback(progress_callback)
        
        # Scan for STEP files
        step_directory = Path("test_files")
        if step_directory.exists():
            files = processor.scan_directory(step_directory)
            processor.add_files(files)
            
            print(f"Found {len(files)} STEP files")
            
            # Process batch
            success = await processor.process_batch_async("standard")
            
            # Get summary
            summary = processor.get_processing_summary()
            print(f"\nBatch processing completed!")
            print(f"Success rate: {summary['success_rate']:.1f}%")
            print(f"Total time: {summary['total_processing_time']:.1f} seconds")
            
            # Export report
            processor.export_processing_report(Path("batch_report.json"))
        
        processor.cleanup()
    
    asyncio.run(main())


if __name__ == "__main__":
    run_batch_processing_example()