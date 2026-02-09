"""
STEP BOM API
STEP BOM Analyzer v3.0 - FreeCAD Native Edition

Bu modül STEP BOM Analyzer'ın ana API katmanıdır.
Tüm FreeCAD işlemlerini koordine eder ve üst düzey interface sağlar.
"""

import os
import sys
import json
import time
from pathlib import Path
from typing import Dict, List, Optional, Any, Union, Tuple
from dataclasses import dataclass, asdict
import logging
from datetime import datetime

# Core modules import
sys.path.append(str(Path(__file__).parent.parent))
from core import (
    FreeCADProcessor, ProcessingResult, 
    BOMAnalyzer, BOMStatistics,
    ReportGenerator, ReportConfig
)

@dataclass
class AnalysisOptions:
    """Analiz seçenekleri"""
    enable_rendering: bool = True
    render_viewpoints: List[str] = None
    render_resolution: Tuple[int, int] = (1280, 720)
    export_formats: List[str] = None
    include_images: bool = True
    report_template: str = "professional"
    quick_mode: bool = False
    
    def __post_init__(self):
        if self.render_viewpoints is None:
            self.render_viewpoints = ["front", "back", "iso"]
        if self.export_formats is None:
            self.export_formats = ["html", "json"]

@dataclass 
class AnalysisResult:
    """Analiz sonucu"""
    success: bool
    step_file_path: str = ""
    output_directory: str = ""
    execution_time: float = 0.0
    
    # Processing results
    processing_result: Optional[ProcessingResult] = None
    bom_statistics: Optional[BOMStatistics] = None
    generated_reports: List[str] = None
    
    # Error handling
    error: str = ""
    warnings: List[str] = None
    
    def __post_init__(self):
        if self.generated_reports is None:
            self.generated_reports = []
        if self.warnings is None:
            self.warnings = []

class StepBomAPI:
    """STEP BOM Analyzer Ana API Sınıfı"""
    
    def __init__(self, freecad_path: Optional[str] = None, base_output_dir: Optional[str] = None):
        """
        STEP BOM API'yi başlat
        
        Args:
            freecad_path: FreeCAD kurulum dizini (None ise otomatik bul)
            base_output_dir: Varsayılan output dizini
        """
        self.freecad_path = freecad_path
        self.base_output_dir = Path(base_output_dir) if base_output_dir else Path.cwd() / "output"
        self.base_output_dir.mkdir(exist_ok=True)
        
        # Logger setup
        self.logger = self._setup_logger()
        
        # Core components
        try:
            self.processor = FreeCADProcessor(freecad_path)
            self.bom_analyzer = BOMAnalyzer()
            
            self.logger.info("✅ STEP BOM API başlatıldı")
            self.logger.info(f"📁 Base Output Dir: {self.base_output_dir}")
            
        except Exception as e:
            self.logger.error(f"❌ API başlatma hatası: {e}")
            raise RuntimeError(f"STEP BOM API başlatılamadı: {e}")
    
    def _setup_logger(self) -> logging.Logger:
        """Logger ayarla"""
        logger = logging.getLogger("StepBomAPI")
        logger.setLevel(logging.INFO)
        
        if not logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            )
            handler.setFormatter(formatter)
            logger.addHandler(handler)
        
        return logger
    
    def analyze_step_file(self, step_file_path: str, 
                         output_dir: Optional[str] = None,
                         options: Optional[AnalysisOptions] = None) -> AnalysisResult:
        """
        STEP dosyasını analiz et - Ana API fonksiyonu
        
        Args:
            step_file_path: STEP dosyasının yolu
            output_dir: Output dizini (None ise otomatik oluştur)
            options: Analiz seçenekleri
            
        Returns:
            AnalysisResult: Kapsamlı analiz sonucu
        """
        start_time = time.time()
        
        self.logger.info("🚀 STEP BOM Analysis başlatılıyor...")
        self.logger.info(f"📁 STEP File: {os.path.basename(step_file_path)}")
        
        try:
            # Parametreleri hazırla
            if options is None:
                options = AnalysisOptions()
            
            if output_dir is None:
                # STEP dosya ismine göre output dizini oluştur
                step_name = Path(step_file_path).stem
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                output_dir = self.base_output_dir / f"{step_name}_{timestamp}"
            
            output_dir = Path(output_dir)
            output_dir.mkdir(parents=True, exist_ok=True)
            
            self.logger.info(f"📂 Output Directory: {output_dir}")
            
            # Processing options hazırla
            processing_options = {
                'rendering': {
                    'enabled': options.enable_rendering,
                    'viewpoints': options.render_viewpoints,
                    'resolution': list(options.render_resolution)
                },
                'export': {
                    'formats': options.export_formats,
                    'include_images': options.include_images,
                    'template': options.report_template
                }
            }
            
            # Ana processing
            if options.quick_mode:
                processing_result = self.processor.quick_analysis(step_file_path, str(output_dir))
                # Quick mode sonucunu ProcessingResult formatına çevir
                proc_result = ProcessingResult(
                    success=processing_result.get('success', False),
                    step_analysis=processing_result.get('statistics'),
                    execution_time=processing_result.get('execution_time', 0)
                )
            else:
                proc_result = self.processor.process_step_file(
                    step_file_path, 
                    str(output_dir), 
                    processing_options
                )
            
            if not proc_result.success:
                return AnalysisResult(
                    success=False,
                    step_file_path=step_file_path,
                    output_directory=str(output_dir),
                    error=proc_result.error,
                    execution_time=time.time() - start_time
                )
            
            # BOM Analysis (eğer available ise)
            bom_stats = None
            if proc_result.bom_extraction:
                try:
                    # BOM JSON dosyasını bul ve analiz et
                    bom_file = output_dir / "hierarchical_bom.json"
                    if bom_file.exists():
                        if self.bom_analyzer.load_bom_data(str(bom_file)):
                            bom_stats = self.bom_analyzer.analyze_bom_structure()
                except Exception as e:
                    self.logger.warning(f"BOM analizi yapılamadı: {e}")
            
            # Report Generation
            generated_reports = []
            if not options.quick_mode:
                try:
                    report_generator = ReportGenerator(str(output_dir))
                    report_config = ReportConfig(
                        title=f"STEP BOM Analysis - {Path(step_file_path).stem}",
                        include_images=options.include_images,
                        template_style=options.report_template,
                        export_formats=options.export_formats
                    )
                    
                    report_result = report_generator.generate_comprehensive_report(
                        asdict(proc_result), 
                        report_config
                    )
                    
                    if report_result["success"]:
                        generated_reports = list(report_result["generated_files"].values())
                
                except Exception as e:
                    self.logger.warning(f"Rapor oluşturulamadı: {e}")
            
            execution_time = time.time() - start_time
            
            self.logger.info("=" * 80)
            self.logger.info("✅ STEP BOM ANALYSIS COMPLETED!")
            self.logger.info(f"⏱️  Total Time: {execution_time:.2f}s")
            self.logger.info(f"📁 Output: {output_dir}")
            self.logger.info(f"📋 Reports: {len(generated_reports)}")
            self.logger.info("=" * 80)
            
            return AnalysisResult(
                success=True,
                step_file_path=step_file_path,
                output_directory=str(output_dir),
                execution_time=execution_time,
                processing_result=proc_result,
                bom_statistics=bom_stats,
                generated_reports=generated_reports
            )
            
        except Exception as e:
            self.logger.error(f"❌ Analysis error: {e}")
            return AnalysisResult(
                success=False,
                step_file_path=step_file_path,
                output_directory=str(output_dir) if 'output_dir' in locals() else "",
                error=str(e),
                execution_time=time.time() - start_time
            )
    
    def batch_analyze(self, step_files: List[str], 
                     batch_output_dir: Optional[str] = None,
                     options: Optional[AnalysisOptions] = None) -> Dict[str, AnalysisResult]:
        """
        Çoklu STEP dosya analizi
        
        Args:
            step_files: STEP dosyaları listesi
            batch_output_dir: Batch output dizini
            options: Analiz seçenekleri
            
        Returns:
            Dict[str, AnalysisResult]: Her dosya için analiz sonucu
        """
        self.logger.info(f"📦 Batch Analysis başlatılıyor: {len(step_files)} files")
        
        if batch_output_dir is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            batch_output_dir = self.base_output_dir / f"batch_analysis_{timestamp}"
        
        batch_output_dir = Path(batch_output_dir)
        batch_output_dir.mkdir(parents=True, exist_ok=True)
        
        results = {}
        successful = 0
        
        for i, step_file in enumerate(step_files):
            try:
                self.logger.info(f"📋 Processing {i+1}/{len(step_files)}: {os.path.basename(step_file)}")
                
                # Her dosya için ayrı output dizini
                file_output_dir = batch_output_dir / Path(step_file).stem
                
                result = self.analyze_step_file(step_file, str(file_output_dir), options)
                results[step_file] = result
                
                if result.success:
                    successful += 1
                
            except Exception as e:
                self.logger.error(f"❌ Batch item error ({step_file}): {e}")
                results[step_file] = AnalysisResult(
                    success=False,
                    step_file_path=step_file,
                    error=str(e)
                )
        
        self.logger.info(f"✅ Batch Analysis tamamlandı: {successful}/{len(step_files)} başarılı")
        
        return results
    
    def get_analysis_summary(self, result: AnalysisResult) -> Dict:
        """Analiz sonucu özetini al"""
        if not result.success:
            return {
                "success": False,
                "error": result.error
            }
        
        summary = {
            "success": True,
            "file_info": {
                "step_file": os.path.basename(result.step_file_path),
                "output_directory": result.output_directory,
                "execution_time": f"{result.execution_time:.2f}s"
            }
        }
        
        # Processing summary
        if result.processing_result:
            proc = result.processing_result
            if proc.step_analysis:
                analysis = proc.step_analysis.get("analysis", {})
                summary["step_analysis"] = {
                    "total_objects": analysis.get("total_objects", 0),
                    "parts_count": analysis.get("parts_count", 0),
                    "assemblies_count": analysis.get("assemblies_count", 0)
                }
            
            if proc.output_files:
                summary["output_files"] = len(proc.output_files)
        
        # BOM summary
        if result.bom_statistics:
            bom_stats = result.bom_statistics
            summary["bom_analysis"] = {
                "unique_parts": bom_stats.unique_parts,
                "unique_assemblies": bom_stats.unique_assemblies,
                "max_hierarchy_depth": bom_stats.max_hierarchy_depth,
                "total_volume": f"{bom_stats.total_volume:.3f}",
                "total_mass": f"{bom_stats.total_mass:.3f}"
            }
        
        # Reports
        summary["generated_reports"] = len(result.generated_reports)
        
        return summary
    
    def test_installation(self) -> Dict:
        """Kurulum testini yap"""
        self.logger.info("🧪 Installation test başlatılıyor...")
        
        try:
            # FreeCAD kurulum testi
            freecad_test = self.processor.test_freecad_installation()
            
            # Core modules testi
            test_result = {
                "success": freecad_test.success,
                "freecad_test": {
                    "success": freecad_test.success,
                    "execution_time": freecad_test.execution_time,
                    "data": freecad_test.data
                },
                "processor_info": self.processor.get_processor_info(),
                "api_info": {
                    "version": "3.0.0",
                    "base_output_dir": str(self.base_output_dir)
                }
            }
            
            if freecad_test.success:
                self.logger.info("✅ Installation test başarılı!")
            else:
                self.logger.error("❌ Installation test başarısız!")
                test_result["error"] = freecad_test.error
            
            return test_result
            
        except Exception as e:
            self.logger.error(f"❌ Test error: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def get_api_info(self) -> Dict:
        """API bilgilerini al"""
        return {
            "version": "3.0.0",
            "title": "STEP BOM Analyzer API",
            "architecture": "FreeCAD Native",
            "author": "ÜRTM Takip Ekibi",
            "supported_formats": ["STEP", "STP"],
            "export_formats": ["HTML", "JSON", "CSV", "PNG"],
            "base_output_dir": str(self.base_output_dir),
            "freecad_path": self.freecad_path,
            "processor_info": self.processor.get_processor_info() if hasattr(self, 'processor') else None
        }

def create_api(freecad_path: Optional[str] = None, output_dir: Optional[str] = None) -> StepBomAPI:
    """API factory fonksiyonu"""
    return StepBomAPI(freecad_path, output_dir)

# Test fonksiyonu
def test_api():
    """API'yi test et"""
    try:
        print("🔧 STEP BOM API Test")
        print("=" * 60)
        
        # API oluştur
        api = create_api()
        
        # API bilgilerini göster
        info = api.get_api_info()
        print(f"📋 Version: {info['version']}")
        print(f"🏗️  Architecture: {info['architecture']}")
        print(f"📁 Output Dir: {info['base_output_dir']}")
        
        # Installation test
        print("\n🧪 Installation testi...")
        test_result = api.test_installation()
        
        if test_result["success"]:
            print("✅ Installation test başarılı!")
            freecad_data = test_result["freecad_test"].get("data", {})
            if freecad_data:
                version_info = freecad_data.get("freecad_version", {}).get("build_info", {})
                print(f"📋 FreeCAD Version: {version_info.get('version_string', 'Unknown')}")
        else:
            print(f"❌ Installation test başarısız: {test_result.get('error')}")
        
        return api
        
    except Exception as e:
        print(f"❌ Test hatası: {e}")
        return None

if __name__ == "__main__":
    test_api()