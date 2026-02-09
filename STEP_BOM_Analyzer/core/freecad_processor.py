"""
FreeCAD Native Processor
STEP BOM Analyzer v3.0 - FreeCAD Native Edition

Bu modül FreeCAD macro'larını koordine eden ana işleme sistemidir.
Tüm FreeCAD operasyonlarını yönetir ve sonuçları birleştirir.
"""

import os
import sys
import json
import time
from pathlib import Path
from typing import Dict, List, Optional, Any, Union
from dataclasses import dataclass, asdict
import logging
from datetime import datetime

from .freecad_macro_manager import FreeCADMacroManager, MacroResult

@dataclass
class ProcessingResult:
    """FreeCAD işleme sonucu"""
    success: bool
    step_analysis: Optional[Dict] = None
    bom_extraction: Optional[Dict] = None  
    part_rendering: Optional[Dict] = None
    export_generation: Optional[Dict] = None
    output_files: List[str] = None
    execution_time: float = 0.0
    error: str = ""
    
    def __post_init__(self):
        if self.output_files is None:
            self.output_files = []

class FreeCADProcessor:
    """FreeCAD Native STEP BOM Processing Engine"""
    
    def __init__(self, freecad_path: Optional[str] = None, temp_dir: Optional[str] = None):
        self.macro_manager = FreeCADMacroManager(freecad_path)
        self.temp_dir = Path(temp_dir) if temp_dir else Path.cwd() / "temp"
        self.temp_dir.mkdir(exist_ok=True)
        
        # Logger setup
        self.logger = self._setup_logger()
        
        self.logger.info("✅ FreeCAD Processor başlatıldı")
        self.logger.info(f"🔧 FreeCAD Path: {self.macro_manager.freecad_path}")
    
    def _setup_logger(self) -> logging.Logger:
        """Logger ayarla"""
        logger = logging.getLogger("FreeCADProcessor")
        logger.setLevel(logging.INFO)
        
        if not logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            )
            handler.setFormatter(formatter)
            logger.addHandler(handler)
        
        return logger
    
    def test_freecad_installation(self) -> MacroResult:
        """FreeCAD kurulumunu test et"""
        return self.macro_manager.test_freecad_installation()
    
    def process_step_file(self, step_file_path: str, output_dir: str, 
                         options: Optional[Dict] = None) -> ProcessingResult:
        """Ana STEP dosya işleme pipeline'ı"""
        start_time = time.time()
        
        self.logger.info("=" * 80)
        self.logger.info("STEP BOM ANALYZER - FREECAD NATIVE PROCESSING")
        self.logger.info("=" * 80)
        
        try:
            # Dosya kontrolü
            if not os.path.exists(step_file_path):
                raise FileNotFoundError(f"STEP dosyası bulunamadı: {step_file_path}")
            
            # Output dizini oluştur
            os.makedirs(output_dir, exist_ok=True)
            
            # Options varsayılan değerleri
            if options is None:
                options = {}
            
            render_options = options.get('rendering', {})
            export_options = options.get('export', {})
            
            # PHASE 1: STEP Import ve Analysis
            self.logger.info("🔄 PHASE 1: STEP Import ve Analysis")
            step_result = self._execute_step_analysis(step_file_path, output_dir)
            
            if not step_result.success:
                return ProcessingResult(
                    success=False,
                    error=f"STEP analysis failed: {step_result.error}",
                    execution_time=time.time() - start_time
                )
            
            # PHASE 2: BOM Extraction
            self.logger.info("🔄 PHASE 2: Hierarchical BOM Extraction")
            bom_result = self._execute_bom_extraction(step_file_path, output_dir)
            
            if not bom_result.success:
                return ProcessingResult(
                    success=False,
                    step_analysis=self._extract_macro_data(step_result),
                    error=f"BOM extraction failed: {bom_result.error}",
                    execution_time=time.time() - start_time
                )
            
            # PHASE 3: Part Rendering (optional)
            part_result = None
            if render_options.get('enabled', True):
                self.logger.info("🔄 PHASE 3: Part Screenshot Rendering")
                part_result = self._execute_part_rendering(
                    step_file_path, 
                    output_dir,
                    render_options
                )
            
            # PHASE 4: Export Generation
            self.logger.info("🔄 PHASE 4: Multi-format Export Generation")
            export_result = self._execute_export_generation(
                output_dir,
                export_options
            )
            
            # Sonuç toplama
            output_files = self._collect_output_files(output_dir)
            execution_time = time.time() - start_time
            
            self.logger.info("=" * 80)
            self.logger.info("✅ FREECAD NATIVE PROCESSING COMPLETED!")
            self.logger.info(f"⏱️  Total Execution Time: {execution_time:.2f}s")
            self.logger.info(f"📁 Output Directory: {output_dir}")
            self.logger.info(f"📄 Generated Files: {len(output_files)}")
            self.logger.info("=" * 80)
            
            return ProcessingResult(
                success=True,
                step_analysis=self._extract_macro_data(step_result),
                bom_extraction=self._extract_macro_data(bom_result),
                part_rendering=self._extract_macro_data(part_result) if part_result else None,
                export_generation=self._extract_macro_data(export_result),
                output_files=output_files,
                execution_time=execution_time
            )
            
        except Exception as e:
            self.logger.error(f"❌ Processing error: {str(e)}")
            return ProcessingResult(
                success=False,
                error=str(e),
                execution_time=time.time() - start_time
            )
    
    def _execute_step_analysis(self, step_file_path: str, output_dir: str) -> MacroResult:
        """STEP processor macro'sunu çalıştır"""
        parameters = {
            "step_file_path": step_file_path,
            "output_directory": output_dir
        }
        
        return self.macro_manager.execute_macro("step_processor", parameters)
    
    def _execute_bom_extraction(self, step_file_path: str, output_dir: str) -> MacroResult:
        """BOM extractor macro'sunu çalıştır"""
        parameters = {
            "step_file_path": step_file_path,
            "output_directory": output_dir,
            "export_formats": ["json", "csv"]
        }
        
        return self.macro_manager.execute_macro("bom_extractor", parameters)
    
    def _execute_part_rendering(self, step_file_path: str, output_dir: str, 
                               options: Dict) -> MacroResult:
        """Part renderer macro'sunu çalıştır"""
        parameters = {
            "step_file_path": step_file_path,
            "output_directory": os.path.join(output_dir, "renders"),
            "viewpoints": options.get("viewpoints", ["front", "back", "iso"]),
            "resolution": options.get("resolution", [1280, 720])
        }
        
        return self.macro_manager.execute_macro("part_renderer", parameters)
    
    def _execute_export_generation(self, output_dir: str, options: Dict) -> MacroResult:
        """Export manager macro'sunu çalıştır"""
        parameters = {
            "input_directory": output_dir,
            "output_directory": output_dir,
            "export_formats": options.get("formats", ["html", "json"]),
            "include_images": options.get("include_images", True),
            "template_style": options.get("template", "professional")
        }
        
        return self.macro_manager.execute_macro("export_manager", parameters)
    
    def _extract_macro_data(self, macro_result: MacroResult) -> Optional[Dict]:
        """Macro sonucundan veriyi çıkar"""
        if not macro_result or not macro_result.success:
            return None
        
        # Macro output'undan JSON veri çıkarma
        lines = macro_result.output.split('\n')
        json_data = None
        capture = False
        json_lines = []
        
        for line in lines:
            if "_DATA_START" in line:
                capture = True
                continue
            elif "_DATA_END" in line:
                break
            elif capture:
                json_lines.append(line)
        
        if json_lines:
            try:
                json_str = '\n'.join(json_lines)
                json_data = json.loads(json_str)
            except json.JSONDecodeError as e:
                self.logger.warning(f"JSON parse error: {e}")
        
        return json_data
    
    def _collect_output_files(self, output_dir: str) -> List[str]:
        """Output dizinindeki tüm dosyaları topla"""
        output_files = []
        
        for root, dirs, files in os.walk(output_dir):
            for file in files:
                file_path = os.path.join(root, file)
                relative_path = os.path.relpath(file_path, output_dir)
                output_files.append(relative_path)
        
        return sorted(output_files)
    
    def quick_analysis(self, step_file_path: str, output_dir: str) -> Dict:
        """Hızlı STEP analizi (sadece temel bilgiler)"""
        self.logger.info("🚀 Quick Analysis Mode")
        
        options = {
            'rendering': {'enabled': False},
            'export': {'formats': ['json']}
        }
        
        result = self.process_step_file(step_file_path, output_dir, options)
        
        if result.success:
            # Temel istatistikleri çıkar
            stats = {}
            if result.step_analysis:
                analysis = result.step_analysis.get('analysis', {})
                stats.update({
                    'total_objects': analysis.get('total_objects', 0),
                    'assemblies_count': analysis.get('assemblies_count', 0),
                    'parts_count': analysis.get('parts_count', 0)
                })
            
            if result.bom_extraction:
                bom_stats = result.bom_extraction.get('statistics', {})
                stats.update({
                    'unique_parts': bom_stats.get('unique_parts', 0),
                    'max_hierarchy_depth': bom_stats.get('max_hierarchy_depth', 0)
                })
            
            return {
                'success': True,
                'statistics': stats,
                'execution_time': result.execution_time
            }
        else:
            return {
                'success': False,
                'error': result.error,
                'execution_time': result.execution_time
            }
    
    def batch_process(self, step_files: List[str], output_base_dir: str) -> Dict:
        """Çoklu STEP dosya işleme"""
        self.logger.info(f"🔄 Batch Processing: {len(step_files)} files")
        
        start_time = time.time()
        results = {}
        successful = 0
        
        for i, step_file in enumerate(step_files):
            try:
                self.logger.info(f"📋 Processing {i+1}/{len(step_files)}: {os.path.basename(step_file)}")
                
                # Her dosya için ayrı output dizini
                file_output_dir = os.path.join(
                    output_base_dir,
                    Path(step_file).stem
                )
                
                result = self.process_step_file(step_file, file_output_dir)
                results[step_file] = asdict(result)
                
                if result.success:
                    successful += 1
                
            except Exception as e:
                self.logger.error(f"❌ Batch item error ({step_file}): {e}")
                results[step_file] = {
                    'success': False,
                    'error': str(e),
                    'execution_time': 0.0
                }
        
        total_time = time.time() - start_time
        
        self.logger.info("=" * 80)
        self.logger.info("✅ BATCH PROCESSING COMPLETED!")
        self.logger.info(f"📊 Success Rate: {successful}/{len(step_files)}")
        self.logger.info(f"⏱️  Total Time: {total_time:.2f}s")
        self.logger.info("=" * 80)
        
        return {
            'success': successful > 0,
            'results': results,
            'statistics': {
                'total_files': len(step_files),
                'successful_files': successful,
                'failed_files': len(step_files) - successful,
                'execution_time': total_time
            }
        }
    
    def get_processor_info(self) -> Dict:
        """Processor bilgilerini al"""
        freecad_info = self.macro_manager.get_freecad_info()
        
        return {
            'version': '3.0.0',
            'processor_type': 'FreeCAD Native',
            'freecad_info': freecad_info,
            'temp_directory': str(self.temp_dir),
            'available_macros': [
                'step_processor',
                'bom_extractor', 
                'part_renderer',
                'export_manager'
            ]
        }

# Test fonksiyonu
def test_processor():
    """Processor'ı test et"""
    try:
        print("🔧 FreeCAD Processor Test")
        print("=" * 50)
        
        processor = FreeCADProcessor()
        
        # Processor bilgilerini göster
        info = processor.get_processor_info()
        print(f"📋 Processor Version: {info['version']}")
        print(f"🔧 Type: {info['processor_type']}")
        
        # FreeCAD kurulumu test et
        print("\n🧪 FreeCAD kurulum testi...")
        test_result = processor.test_freecad_installation()
        
        if test_result.success:
            print("✅ FreeCAD kurulum testi başarılı!")
        else:
            print(f"❌ FreeCAD kurulum testi başarısız: {test_result.error}")
        
        return processor
        
    except Exception as e:
        print(f"❌ Test hatası: {e}")
        return None

if __name__ == "__main__":
    test_processor()