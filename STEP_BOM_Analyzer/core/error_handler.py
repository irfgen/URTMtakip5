"""
Error Handler Module
STEP BOM Analyzer v3.0 - FreeCAD Native Edition

Bu modül kapsamlı hata yönetimi ve kullanıcı geri bildirimi sağlar.
Robust error handling, recovery suggestions ve diagnostic tools içerir.
"""

import os
import sys
import traceback
import logging
import json
from pathlib import Path
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, asdict
from enum import Enum
import subprocess
from datetime import datetime

class ErrorCategory(Enum):
    """Hata kategorileri"""
    FREECAD_NOT_FOUND = "freecad_not_found"
    FREECAD_VERSION_INCOMPATIBLE = "freecad_version_incompatible"
    MACRO_INSTALLATION_FAILED = "macro_installation_failed"
    STEP_FILE_ERROR = "step_file_error"
    MEMORY_PERFORMANCE = "memory_performance"
    PERMISSION_ERROR = "permission_error"
    NETWORK_ERROR = "network_error"
    CONFIGURATION_ERROR = "configuration_error"
    UNKNOWN_ERROR = "unknown_error"

@dataclass
class ErrorSolution:
    """Hata çözüm önerisi"""
    title: str
    description: str
    steps: List[str]
    links: List[Dict[str, str]] = None
    automatic_fix: Optional[str] = None  # Function name for automatic fix
    
    def __post_init__(self):
        if self.links is None:
            self.links = []

@dataclass
class DiagnosticInfo:
    """Sistem tanı bilgileri"""
    freecad_installed: bool = False
    freecad_version: str = "Unknown"
    freecad_path: str = ""
    python_version: str = ""
    os_info: str = ""
    memory_info: Dict[str, Any] = None
    disk_space: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.memory_info is None:
            self.memory_info = {}
        if self.disk_space is None:
            self.disk_space = {}

@dataclass
class ErrorReport:
    """Hata raporu"""
    error_id: str
    category: ErrorCategory
    title: str
    message: str
    technical_details: str = ""
    diagnostic_info: Optional[DiagnosticInfo] = None
    solutions: List[ErrorSolution] = None
    timestamp: str = ""
    
    def __post_init__(self):
        if self.solutions is None:
            self.solutions = []
        if not self.timestamp:
            self.timestamp = datetime.now().isoformat()

class StepBomErrorHandler:
    """STEP BOM Analyzer Error Management System"""
    
    def __init__(self):
        self.logger = self._setup_logger()
        self.error_solutions = self._initialize_error_solutions()
        self.diagnostic_cache = {}
        
        self.logger.info("✅ Error Handler başlatıldı")
    
    def _setup_logger(self) -> logging.Logger:
        """Error logger ayarla"""
        logger = logging.getLogger("StepBomErrorHandler")
        logger.setLevel(logging.INFO)
        
        if not logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            )
            handler.setFormatter(formatter)
            logger.addHandler(handler)
        
        return logger
    
    def _initialize_error_solutions(self) -> Dict[ErrorCategory, List[ErrorSolution]]:
        """Önceden tanımlanmış hata çözümlerini yükle"""
        solutions = {
            ErrorCategory.FREECAD_NOT_FOUND: [
                ErrorSolution(
                    title="FreeCAD Kurulumu Gerekli",
                    description="STEP BOM Analyzer çalışması için FreeCAD kurulumu gereklidir.",
                    steps=[
                        "FreeCAD resmi websitesinden FreeCAD 1.0 veya üstünü indirin",
                        "İndirdiğiniz installer'ı çalıştırın",
                        "Kurulum tamamlandıktan sonra STEP BOM Analyzer'ı yeniden çalıştırın",
                        "Eğer sorun devam ederse, FreeCAD'i varsayılan dizine kurun"
                    ],
                    links=[
                        {"title": "FreeCAD 1.0 İndir", "url": "https://www.freecad.org/downloads.php"},
                        {"title": "FreeCAD 0.21 İndir", "url": "https://github.com/FreeCAD/FreeCAD/releases/tag/0.21.2"}
                    ]
                )
            ],
            
            ErrorCategory.FREECAD_VERSION_INCOMPATIBLE: [
                ErrorSolution(
                    title="FreeCAD Versiyonu Güncellenmeli",
                    description="Mevcut FreeCAD versiyonu uyumlu değil. En az FreeCAD 0.20 gereklidir.",
                    steps=[
                        "Mevcut FreeCAD versiyonunu kaldırın",
                        "FreeCAD 1.0 veya 0.21'i indirin ve kurun",
                        "Sistem yeniden başlatın",
                        "STEP BOM Analyzer kurulumunu yeniden çalıştırın"
                    ],
                    links=[
                        {"title": "FreeCAD Güncel Sürümler", "url": "https://www.freecad.org/downloads.php"}
                    ]
                )
            ],
            
            ErrorCategory.MACRO_INSTALLATION_FAILED: [
                ErrorSolution(
                    title="Macro Dosyaları Manuel Kurulumu",
                    description="FreeCAD macro dosyaları otomatik kurulamadı. Manuel kurulum gerekebilir.",
                    steps=[
                        "Windows + R tuşlarına basın ve %APPDATA% yazın",
                        "FreeCAD\\Macro klasörünü bulun (yoksa oluşturun)",
                        "STEP_BOM_Analyzer\\macros klasöründeki .FCMacro dosyalarını kopyalayın",
                        "FreeCAD\\Macro klasörüne yapıştırın",
                        "FreeCAD'i yeniden başlatın"
                    ]
                )
            ],
            
            ErrorCategory.STEP_FILE_ERROR: [
                ErrorSolution(
                    title="STEP Dosya Format Kontrolü",
                    description="STEP dosyası okunamıyor veya format hatası var.",
                    steps=[
                        "STEP dosyasının .step veya .stp uzantılı olduğundan emin olun",
                        "Dosya boyutunun çok büyük olmadığını kontrol edin (>500MB dikkat)",
                        "Dosyayı başka CAD programında açıp tekrar STEP olarak export edin",
                        "Dosya yolunda Türkçe karakter olmamasına dikkat edin",
                        "Dosyaya yazma izninin olduğundan emin olun"
                    ]
                )
            ],
            
            ErrorCategory.MEMORY_PERFORMANCE: [
                ErrorSolution(
                    title="Bellek ve Performans Optimizasyonu",
                    description="Sistem belleği yetersiz veya performans sorunları var.",
                    steps=[
                        "Diğer programları kapatın",
                        "Sistem RAM'inin en az 8GB olduğundan emin olun",
                        "STEP dosyasını daha küçük parçalara bölün",
                        "Quick Analysis modunu kullanın",
                        "Rendering'i devre dışı bırakın"
                    ]
                )
            ],
            
            ErrorCategory.PERMISSION_ERROR: [
                ErrorSolution(
                    title="Yönetici İzinleri Sorunu",
                    description="Dosya/klasör erişim izni yetersiz.",
                    steps=[
                        "Programı 'Yönetici olarak çalıştır' ile başlatın",
                        "Antivirus programını geçici olarak devre dışı bırakın",
                        "Windows Defender'da klasörü güvenilir listeye ekleyin",
                        "Output klasörü için yazma izni kontrol edin"
                    ]
                )
            ]
        }
        
        return solutions
    
    def handle_error(self, error: Exception, context: Dict[str, Any] = None) -> ErrorReport:
        """Ana hata işleme fonksiyonu"""
        if context is None:
            context = {}
        
        # Hata kategorisini belirle
        category = self._categorize_error(error, context)
        
        # Hata ID oluştur
        error_id = f"{category.value}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        # Diagnostic bilgilerini topla
        diagnostic_info = self._collect_diagnostic_info()
        
        # Çözüm önerilerini al
        solutions = self.error_solutions.get(category, [])
        
        # Error report oluştur
        error_report = ErrorReport(
            error_id=error_id,
            category=category,
            title=self._get_error_title(category),
            message=str(error),
            technical_details=self._format_technical_details(error, context),
            diagnostic_info=diagnostic_info,
            solutions=solutions
        )
        
        # Log the error
        self.logger.error(f"Error handled: {error_id} - {category.value} - {str(error)}")
        
        return error_report
    
    def _categorize_error(self, error: Exception, context: Dict[str, Any]) -> ErrorCategory:
        """Hatayı kategorize et"""
        error_str = str(error).lower()
        error_type = type(error).__name__
        
        # FreeCAD bulunamadı
        if "freecad" in error_str and ("not found" in error_str or "bulunamadı" in error_str):
            return ErrorCategory.FREECAD_NOT_FOUND
        
        # FreeCAD version problemi
        if "version" in error_str or "uyumsuz" in error_str:
            return ErrorCategory.FREECAD_VERSION_INCOMPATIBLE
        
        # Macro installation
        if "macro" in error_str or "fcmacro" in error_str:
            return ErrorCategory.MACRO_INSTALLATION_FAILED
        
        # STEP file problems
        if "step" in error_str or ".stp" in error_str or context.get("step_file"):
            return ErrorCategory.STEP_FILE_ERROR
        
        # Memory/Performance
        if "memory" in error_str or "timeout" in error_str or error_type in ["MemoryError", "TimeoutError"]:
            return ErrorCategory.MEMORY_PERFORMANCE
        
        # Permission errors
        if error_type in ["PermissionError", "FileNotFoundError"] or "permission" in error_str:
            return ErrorCategory.PERMISSION_ERROR
        
        # Network errors
        if "network" in error_str or "connection" in error_str or error_type in ["ConnectionError", "URLError"]:
            return ErrorCategory.NETWORK_ERROR
        
        # Configuration errors
        if "config" in error_str or "configuration" in error_str:
            return ErrorCategory.CONFIGURATION_ERROR
        
        return ErrorCategory.UNKNOWN_ERROR
    
    def _get_error_title(self, category: ErrorCategory) -> str:
        """Hata kategorisine göre başlık döndür"""
        titles = {
            ErrorCategory.FREECAD_NOT_FOUND: "FreeCAD Kurulumu Bulunamadı",
            ErrorCategory.FREECAD_VERSION_INCOMPATIBLE: "FreeCAD Versiyon Uyumsuzluğu",
            ErrorCategory.MACRO_INSTALLATION_FAILED: "Macro Kurulum Hatası",
            ErrorCategory.STEP_FILE_ERROR: "STEP Dosya Hatası",
            ErrorCategory.MEMORY_PERFORMANCE: "Bellek/Performans Sorunu",
            ErrorCategory.PERMISSION_ERROR: "Yetki/İzin Sorunu",
            ErrorCategory.NETWORK_ERROR: "Ağ Bağlantı Sorunu",
            ErrorCategory.CONFIGURATION_ERROR: "Konfigürasyon Hatası",
            ErrorCategory.UNKNOWN_ERROR: "Bilinmeyen Hata"
        }
        
        return titles.get(category, "Sistem Hatası")
    
    def _format_technical_details(self, error: Exception, context: Dict[str, Any]) -> str:
        """Teknik detayları formatla"""
        details = []
        
        # Exception info
        details.append(f"Exception Type: {type(error).__name__}")
        details.append(f"Error Message: {str(error)}")
        
        # Traceback
        if hasattr(error, '__traceback__') and error.__traceback__:
            tb_str = ''.join(traceback.format_tb(error.__traceback__))
            details.append(f"Traceback:\n{tb_str}")
        
        # Context information
        if context:
            details.append("Context Information:")
            for key, value in context.items():
                details.append(f"  {key}: {value}")
        
        # System info
        details.append(f"System: {sys.platform}")
        details.append(f"Python Version: {sys.version}")
        
        return "\n".join(details)
    
    def _collect_diagnostic_info(self) -> DiagnosticInfo:
        """Sistem tanı bilgilerini topla"""
        if "diagnostic_cache" in self.diagnostic_cache:
            cache_time = self.diagnostic_cache.get("cache_time", 0)
            if datetime.now().timestamp() - cache_time < 300:  # 5 minutes cache
                return self.diagnostic_cache["diagnostic_cache"]
        
        diagnostic = DiagnosticInfo()
        
        try:
            # FreeCAD detection
            from .freecad_detector import detect_freecad
            
            detection_result = detect_freecad()
            if detection_result.found and detection_result.recommended:
                diagnostic.freecad_installed = True
                diagnostic.freecad_version = detection_result.recommended.version
                diagnostic.freecad_path = detection_result.recommended.path
            
        except Exception as e:
            self.logger.warning(f"FreeCAD diagnostic failed: {e}")
        
        # Python version
        diagnostic.python_version = sys.version
        
        # OS info
        diagnostic.os_info = f"{sys.platform} - {os.name}"
        
        # Memory info (Windows)
        try:
            if sys.platform == "win32":
                result = subprocess.run([
                    "wmic", "OS", "get", "TotalVisibleMemorySize,FreePhysicalMemory", "/format:csv"
                ], capture_output=True, text=True, timeout=10)
                
                if result.returncode == 0:
                    lines = result.stdout.strip().split('\n')
                    for line in lines:
                        if "," in line and "Node" not in line:
                            parts = line.split(',')
                            if len(parts) >= 3:
                                free_mem = int(parts[1]) if parts[1].isdigit() else 0
                                total_mem = int(parts[2]) if parts[2].isdigit() else 0
                                
                                diagnostic.memory_info = {
                                    "total_memory_gb": round(total_mem / 1024 / 1024, 2),
                                    "free_memory_gb": round(free_mem / 1024 / 1024, 2),
                                    "used_memory_percent": round((1 - free_mem/total_mem) * 100, 1) if total_mem > 0 else 0
                                }
                            break
        
        except Exception as e:
            self.logger.warning(f"Memory info collection failed: {e}")
        
        # Disk space
        try:
            if sys.platform == "win32":
                result = subprocess.run([
                    "wmic", "logicaldisk", "get", "size,freespace,caption", "/format:csv"
                ], capture_output=True, text=True, timeout=10)
                
                if result.returncode == 0:
                    disk_info = {}
                    lines = result.stdout.strip().split('\n')
                    for line in lines:
                        if "," in line and "Node" not in line:
                            parts = line.split(',')
                            if len(parts) >= 4:
                                caption = parts[1]
                                free_space = int(parts[2]) if parts[2].isdigit() else 0
                                total_space = int(parts[3]) if parts[3].isdigit() else 0
                                
                                if caption and total_space > 0:
                                    disk_info[caption] = {
                                        "total_gb": round(total_space / 1024**3, 2),
                                        "free_gb": round(free_space / 1024**3, 2),
                                        "used_percent": round((1 - free_space/total_space) * 100, 1)
                                    }
                    
                    diagnostic.disk_space = disk_info
        
        except Exception as e:
            self.logger.warning(f"Disk space collection failed: {e}")
        
        # Cache the result
        self.diagnostic_cache = {
            "diagnostic_cache": diagnostic,
            "cache_time": datetime.now().timestamp()
        }
        
        return diagnostic
    
    def generate_error_report_text(self, error_report: ErrorReport) -> str:
        """Hata raporu metni oluştur"""
        report_lines = []
        
        # Header
        report_lines.append("="*80)
        report_lines.append("STEP BOM ANALYZER - ERROR REPORT")
        report_lines.append("="*80)
        report_lines.append("")
        
        # Basic info
        report_lines.append(f"Error ID: {error_report.error_id}")
        report_lines.append(f"Category: {error_report.category.value}")
        report_lines.append(f"Title: {error_report.title}")
        report_lines.append(f"Timestamp: {error_report.timestamp}")
        report_lines.append("")
        
        # Error message
        report_lines.append("ERROR MESSAGE:")
        report_lines.append("-" * 40)
        report_lines.append(error_report.message)
        report_lines.append("")
        
        # Solutions
        if error_report.solutions:
            report_lines.append("RECOMMENDED SOLUTIONS:")
            report_lines.append("-" * 40)
            
            for i, solution in enumerate(error_report.solutions, 1):
                report_lines.append(f"{i}. {solution.title}")
                report_lines.append(f"   {solution.description}")
                report_lines.append("   Steps:")
                for j, step in enumerate(solution.steps, 1):
                    report_lines.append(f"   {j}) {step}")
                
                if solution.links:
                    report_lines.append("   Useful Links:")
                    for link in solution.links:
                        report_lines.append(f"   - {link['title']}: {link['url']}")
                
                report_lines.append("")
        
        # Diagnostic info
        if error_report.diagnostic_info:
            diag = error_report.diagnostic_info
            report_lines.append("SYSTEM DIAGNOSTIC INFO:")
            report_lines.append("-" * 40)
            report_lines.append(f"FreeCAD Installed: {diag.freecad_installed}")
            if diag.freecad_installed:
                report_lines.append(f"FreeCAD Version: {diag.freecad_version}")
                report_lines.append(f"FreeCAD Path: {diag.freecad_path}")
            
            report_lines.append(f"Python Version: {diag.python_version}")
            report_lines.append(f"Operating System: {diag.os_info}")
            
            if diag.memory_info:
                mem = diag.memory_info
                report_lines.append(f"Memory: {mem.get('used_memory_percent', 0)}% used ({mem.get('total_memory_gb', 0)} GB total)")
            
            if diag.disk_space:
                report_lines.append("Disk Space:")
                for drive, info in diag.disk_space.items():
                    report_lines.append(f"  {drive} {info['used_percent']}% used ({info['free_gb']} GB free)")
            
            report_lines.append("")
        
        # Technical details
        if error_report.technical_details:
            report_lines.append("TECHNICAL DETAILS:")
            report_lines.append("-" * 40)
            report_lines.append(error_report.technical_details)
            report_lines.append("")
        
        report_lines.append("="*80)
        
        return "\n".join(report_lines)
    
    def save_error_report(self, error_report: ErrorReport, output_dir: str = None) -> str:
        """Hata raporunu dosyaya kaydet"""
        if output_dir is None:
            output_dir = Path.home() / "Documents" / "STEP_BOM_Analyzer" / "error_reports"
        
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)
        
        # Text report
        report_text = self.generate_error_report_text(error_report)
        text_file = output_dir / f"error_report_{error_report.error_id}.txt"
        
        with open(text_file, 'w', encoding='utf-8') as f:
            f.write(report_text)
        
        # JSON report
        json_file = output_dir / f"error_report_{error_report.error_id}.json"
        
        with open(json_file, 'w', encoding='utf-8') as f:
            json.dump(asdict(error_report), f, indent=2, ensure_ascii=False, default=str)
        
        self.logger.info(f"Error report saved: {text_file}")
        
        return str(text_file)
    
    def auto_fix_error(self, error_report: ErrorReport) -> Tuple[bool, str]:
        """Otomatik hata düzeltme (mümkünse)"""
        for solution in error_report.solutions:
            if solution.automatic_fix:
                try:
                    # Automatic fix function'ını çalıştır
                    fix_function = getattr(self, f"_auto_fix_{solution.automatic_fix}", None)
                    if fix_function:
                        result = fix_function(error_report)
                        if result:
                            return True, f"Automatic fix applied: {solution.title}"
                
                except Exception as e:
                    self.logger.warning(f"Auto-fix failed: {e}")
        
        return False, "No automatic fix available"

def handle_global_exception(error: Exception, context: Dict[str, Any] = None) -> ErrorReport:
    """Global exception handler"""
    handler = StepBomErrorHandler()
    return handler.handle_error(error, context)

# Test fonksiyonu
def test_error_handler():
    """Error Handler'ı test et"""
    try:
        print("🚨 Error Handler Test")
        print("=" * 60)
        
        handler = StepBomErrorHandler()
        
        # Test different error types
        test_errors = [
            (FileNotFoundError("FreeCAD not found"), {"context": "freecad_detection"}),
            (PermissionError("Access denied to macro directory"), {"context": "macro_installation"}),
            (ValueError("Invalid STEP file format"), {"step_file": "test.step"}),
            (MemoryError("Not enough memory"), {"context": "large_step_processing"})
        ]
        
        for i, (error, context) in enumerate(test_errors, 1):
            print(f"\n🧪 Test {i}: {type(error).__name__}")
            
            error_report = handler.handle_error(error, context)
            
            print(f"  Category: {error_report.category.value}")
            print(f"  Title: {error_report.title}")
            print(f"  Solutions: {len(error_report.solutions)}")
            
            # Save report
            report_file = handler.save_error_report(error_report)
            print(f"  Report saved: {report_file}")
        
        print("\n✅ Error Handler test completed")
        
        return handler
        
    except Exception as e:
        print(f"❌ Test hatası: {e}")
        return None

if __name__ == "__main__":
    test_error_handler()