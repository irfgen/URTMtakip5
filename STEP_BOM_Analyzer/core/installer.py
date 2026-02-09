"""
Auto-Installer Module
STEP BOM Analyzer v3.0 - FreeCAD Native Edition

Bu modül otomatik kurulum işlemlerini yönetir.
Windows sistemlerinde zero-configuration deneyimi sağlar.
"""

import os
import sys
import shutil
import subprocess
import tempfile
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
import logging
from datetime import datetime
import json

from .freecad_detector import FreeCADDetector, DetectionResult, FreeCADInstallation

@dataclass
class InstallationConfig:
    """Kurulum konfigürasyonu"""
    freecad_path: Optional[str] = None
    target_directory: Optional[str] = None
    install_macros: bool = True
    install_dependencies: bool = True
    create_shortcuts: bool = True
    run_tests: bool = True

@dataclass
class InstallationResult:
    """Kurulum sonucu"""
    success: bool
    freecad_installation: Optional[FreeCADInstallation] = None
    installed_components: List[str] = None
    installation_directory: str = ""
    error: str = ""
    warnings: List[str] = None
    
    def __post_init__(self):
        if self.installed_components is None:
            self.installed_components = []
        if self.warnings is None:
            self.warnings = []

class StepBomInstaller:
    """STEP BOM Analyzer Otomatik Kurulumu"""
    
    def __init__(self, config: Optional[InstallationConfig] = None):
        self.config = config or InstallationConfig()
        self.logger = self._setup_logger()
        self.detector = FreeCADDetector()
        
        # Installation directories
        self.app_name = "STEP_BOM_Analyzer"
        self.base_dir = Path(__file__).parent.parent
        
        self.logger.info("✅ STEP BOM Installer başlatıldı")
    
    def _setup_logger(self) -> logging.Logger:
        """Logger ayarla"""
        logger = logging.getLogger("StepBomInstaller")
        logger.setLevel(logging.INFO)
        
        if not logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            )
            handler.setFormatter(formatter)
            logger.addHandler(handler)
        
        return logger
    
    def install(self) -> InstallationResult:
        """Ana kurulum fonksiyonu"""
        self.logger.info("🚀 STEP BOM Analyzer kurulumu başlatılıyor...")
        self.logger.info("=" * 80)
        
        try:
            # 1. FreeCAD tespiti
            self.logger.info("🔍 Phase 1: FreeCAD Detection")
            freecad_result = self._detect_freecad()
            
            if not freecad_result.success:
                return freecad_result
            
            # 2. Target directory belirleme
            self.logger.info("📁 Phase 2: Installation Directory Setup")
            target_dir = self._setup_target_directory()
            
            # 3. Dependencies kurulumu
            installed_components = []
            
            if self.config.install_dependencies:
                self.logger.info("📦 Phase 3: Dependencies Installation")
                deps_result = self._install_dependencies(freecad_result.freecad_installation)
                if not deps_result:
                    return InstallationResult(
                        success=False,
                        error="Dependencies kurulumu başarısız"
                    )
                installed_components.append("dependencies")
            
            # 4. Macro kurulumu
            if self.config.install_macros:
                self.logger.info("🔧 Phase 4: FreeCAD Macros Installation")
                macro_result = self._install_macros(freecad_result.freecad_installation)
                if not macro_result:
                    return InstallationResult(
                        success=False,
                        error="Macro kurulumu başarısız"
                    )
                installed_components.append("macros")
            
            # 5. Konfigürasyon dosyaları
            self.logger.info("⚙️  Phase 5: Configuration Files")
            config_result = self._create_configuration(freecad_result.freecad_installation, target_dir)
            if config_result:
                installed_components.append("configuration")
            
            # 6. Batch script'ler
            if self.config.create_shortcuts:
                self.logger.info("📋 Phase 6: Batch Scripts Creation")
                script_result = self._create_batch_scripts(freecad_result.freecad_installation, target_dir)
                if script_result:
                    installed_components.append("batch_scripts")
            
            # 7. Test workflow
            test_warnings = []
            if self.config.run_tests:
                self.logger.info("🧪 Phase 7: Installation Testing")
                test_result, warnings = self._run_installation_tests(freecad_result.freecad_installation)
                test_warnings.extend(warnings)
                if test_result:
                    installed_components.append("tests_passed")
            
            self.logger.info("=" * 80)
            self.logger.info("✅ STEP BOM ANALYZER KURULUM TAMAMLANDI!")
            self.logger.info(f"📁 Installation Directory: {target_dir}")
            self.logger.info(f"🔧 FreeCAD: {freecad_result.freecad_installation.version}")
            self.logger.info(f"📦 Components: {len(installed_components)}")
            self.logger.info("=" * 80)
            
            return InstallationResult(
                success=True,
                freecad_installation=freecad_result.freecad_installation,
                installed_components=installed_components,
                installation_directory=str(target_dir),
                warnings=test_warnings
            )
            
        except Exception as e:
            self.logger.error(f"❌ Kurulum hatası: {e}")
            return InstallationResult(
                success=False,
                error=str(e)
            )
    
    def _detect_freecad(self) -> InstallationResult:
        """FreeCAD kurulumunu tespit et ve validate et"""
        try:
            detection_result = self.detector.detect_all_installations()
            
            if not detection_result.found:
                return InstallationResult(
                    success=False,
                    error="FreeCAD kurulumu bulunamadı. Lütfen önce FreeCAD kurulumu yapın."
                )
            
            if not detection_result.recommended:
                return InstallationResult(
                    success=False,
                    error="Geçerli FreeCAD kurulumu bulunamadı"
                )
            
            freecad_install = detection_result.recommended
            
            self.logger.info(f"✅ FreeCAD bulundu: v{freecad_install.version}")
            self.logger.info(f"📁 Path: {freecad_install.path}")
            self.logger.info(f"🐍 Python: {freecad_install.python_path}")
            
            return InstallationResult(
                success=True,
                freecad_installation=freecad_install
            )
            
        except Exception as e:
            return InstallationResult(
                success=False,
                error=f"FreeCAD tespit hatası: {e}"
            )
    
    def _setup_target_directory(self) -> Path:
        """Target kurulum dizinini ayarla"""
        if self.config.target_directory:
            target_dir = Path(self.config.target_directory)
        else:
            # Varsayılan: Documents/STEP_BOM_Analyzer
            documents = Path.home() / "Documents"
            target_dir = documents / self.app_name
        
        target_dir.mkdir(parents=True, exist_ok=True)
        
        self.logger.info(f"📂 Target Directory: {target_dir}")
        
        # Core dosyaları kopyala
        source_core = self.base_dir / "core"
        target_core = target_dir / "core"
        
        if source_core.exists():
            if target_core.exists():
                shutil.rmtree(target_core)
            shutil.copytree(source_core, target_core)
            self.logger.info("📁 Core modülleri kopyalandı")
        
        # API dosyaları kopyala
        source_api = self.base_dir / "api"
        target_api = target_dir / "api"
        
        if source_api.exists():
            if target_api.exists():
                shutil.rmtree(target_api)
            shutil.copytree(source_api, target_api)
            self.logger.info("📁 API modülleri kopyalandı")
        
        return target_dir
    
    def _install_dependencies(self, freecad_install: FreeCADInstallation) -> bool:
        """Python dependencies'leri FreeCAD Python ile kur"""
        try:
            self.logger.info("📦 Python dependencies kuruluyor...")
            
            # Required packages
            required_packages = [
                "jinja2",  # Report template engine
            ]
            
            for package in required_packages:
                try:
                    self.logger.info(f"  Installing {package}...")
                    
                    result = subprocess.run([
                        freecad_install.python_path,
                        "-m", "pip", "install", package, "--quiet"
                    ], 
                    capture_output=True, 
                    text=True,
                    timeout=120
                    )
                    
                    if result.returncode == 0:
                        self.logger.info(f"  ✅ {package} kuruldu")
                    else:
                        self.logger.warning(f"  ⚠️  {package} kurulumu atlandı: {result.stderr}")
                
                except subprocess.TimeoutExpired:
                    self.logger.warning(f"  ⚠️  {package} kurulum timeout")
                except Exception as e:
                    self.logger.warning(f"  ⚠️  {package} kurulum hatası: {e}")
            
            self.logger.info("✅ Dependencies kurulumu tamamlandı")
            return True
            
        except Exception as e:
            self.logger.error(f"❌ Dependencies kurulum hatası: {e}")
            return False
    
    def _install_macros(self, freecad_install: FreeCADInstallation) -> bool:
        """FreeCAD macro'larını kurulum dizinine kopyala"""
        try:
            self.logger.info("🔧 FreeCAD macro'lar kurulyor...")
            
            # FreeCAD Macro directory
            appdata = os.environ.get('APPDATA')
            if not appdata:
                self.logger.error("APPDATA environment variable bulunamadı")
                return False
            
            freecad_macro_dir = Path(appdata) / "FreeCAD" / "Macro"
            freecad_macro_dir.mkdir(parents=True, exist_ok=True)
            
            # Source macros directory
            source_macros = self.base_dir / "macros"
            
            if not source_macros.exists():
                self.logger.error("Source macros dizini bulunamadı")
                return False
            
            # Macro dosyalarını kopyala
            copied_count = 0
            for macro_file in source_macros.glob("*.FCMacro"):
                target_file = freecad_macro_dir / macro_file.name
                shutil.copy2(macro_file, target_file)
                copied_count += 1
                self.logger.info(f"  📄 {macro_file.name} kopyalandı")
            
            self.logger.info(f"✅ {copied_count} macro dosyası FreeCAD'a yüklendi")
            self.logger.info(f"📁 Macro Directory: {freecad_macro_dir}")
            
            return True
            
        except Exception as e:
            self.logger.error(f"❌ Macro kurulum hatası: {e}")
            return False
    
    def _create_configuration(self, freecad_install: FreeCADInstallation, target_dir: Path) -> bool:
        """Konfigürasyon dosyalarını oluştur"""
        try:
            self.logger.info("⚙️  Konfigürasyon dosyaları oluşturuluyor...")
            
            # Config dictionary
            config_data = {
                "installation": {
                    "version": "3.0.0",
                    "installation_date": datetime.now().isoformat(),
                    "installation_directory": str(target_dir)
                },
                "freecad": {
                    "version": freecad_install.version,
                    "path": freecad_install.path,
                    "python_path": freecad_install.python_path,
                    "gui_available": freecad_install.details.get("gui_available", False)
                },
                "directories": {
                    "base": str(target_dir),
                    "output": str(target_dir / "output"),
                    "temp": str(target_dir / "temp"),
                    "templates": str(target_dir / "templates")
                },
                "settings": {
                    "default_render_viewpoints": ["front", "back", "iso"],
                    "default_export_formats": ["html", "json"],
                    "default_resolution": [1280, 720],
                    "enable_rendering": True,
                    "include_images": True
                }
            }
            
            # JSON config file
            config_file = target_dir / "config.json"
            with open(config_file, 'w', encoding='utf-8') as f:
                json.dump(config_data, f, indent=2, ensure_ascii=False)
            
            self.logger.info(f"✅ Config dosyası oluşturuldu: {config_file}")
            
            # Required directories
            for dir_key, dir_path in config_data["directories"].items():
                if dir_key != "base":
                    Path(dir_path).mkdir(parents=True, exist_ok=True)
            
            self.logger.info("📁 Required directories oluşturuldu")
            
            return True
            
        except Exception as e:
            self.logger.error(f"❌ Konfigürasyon hatası: {e}")
            return False
    
    def _create_batch_scripts(self, freecad_install: FreeCADInstallation, target_dir: Path) -> bool:
        """Batch script'leri oluştur"""
        try:
            self.logger.info("📋 Batch script'ler oluşturuluyor...")
            
            # CALISTIR.bat - Ana GUI launcher
            calistir_content = f'''@echo off
echo ========================================
echo STEP BOM Analyzer v3.0 - FreeCAD Native
echo ========================================
echo.

cd /d "{target_dir}"

echo FreeCAD kurulumu kontrol ediliyor...
if not exist "{freecad_install.python_path}" (
    echo HATA: FreeCAD Python bulunamadi!
    echo Path: {freecad_install.python_path}
    pause
    exit /b 1
)

echo FreeCAD Python ile GUI baslatiliyor...
echo.
"{freecad_install.python_path}" -c "
import sys
sys.path.append(r'{target_dir}')
from gui.step_bom_gui import main
main()
"

if errorlevel 1 (
    echo.
    echo HATA: GUI baslatma hatasi!
    echo Detayli log icin log dosyalarini kontrol edin.
    pause
)
'''
            
            calistir_file = target_dir / "CALISTIR.bat"
            with open(calistir_file, 'w', encoding='utf-8') as f:
                f.write(calistir_content)
            
            # TEST.bat - System test
            test_content = f'''@echo off
echo ========================================
echo STEP BOM Analyzer - System Test
echo ========================================
echo.

cd /d "{target_dir}"

echo FreeCAD Test...
"{freecad_install.python_path}" -c "
import sys
sys.path.append(r'{target_dir}')
from core import test_all_modules
test_all_modules()
"

echo.
echo Test tamamlandi. Sonuclari kontrol edin.
pause
'''
            
            test_file = target_dir / "TEST.bat"
            with open(test_file, 'w', encoding='utf-8') as f:
                f.write(test_content)
            
            # QUICK_ANALYSIS.bat - Hızlı analiz
            quick_content = f'''@echo off
echo ========================================
echo STEP BOM Analyzer - Quick Analysis
echo ========================================
echo.

if "%~1"=="" (
    echo Kullanim: QUICK_ANALYSIS.bat "step_file_path"
    echo Ornek: QUICK_ANALYSIS.bat "C:\\path\\to\\file.step"
    pause
    exit /b 1
)

cd /d "{target_dir}"

echo Analyzing: %1
echo.

"{freecad_install.python_path}" -c "
import sys
sys.path.append(r'{target_dir}')
from api import StepBomAPI
from api.step_bom_api import AnalysisOptions

api = StepBomAPI()
options = AnalysisOptions(quick_mode=True)
result = api.analyze_step_file(r'%1', options=options)

if result.success:
    print('✅ Analysis completed successfully!')
    summary = api.get_analysis_summary(result)
    print(f'📊 Results: {{summary}}')
else:
    print(f'❌ Analysis failed: {{result.error}}')
"

echo.
pause
'''
            
            quick_file = target_dir / "QUICK_ANALYSIS.bat"
            with open(quick_file, 'w', encoding='utf-8') as f:
                f.write(quick_content)
            
            self.logger.info("✅ Batch script'ler oluşturuldu:")
            self.logger.info(f"  📄 CALISTIR.bat - Ana GUI")
            self.logger.info(f"  📄 TEST.bat - System test")
            self.logger.info(f"  📄 QUICK_ANALYSIS.bat - Hızlı analiz")
            
            return True
            
        except Exception as e:
            self.logger.error(f"❌ Batch script hatası: {e}")
            return False
    
    def _run_installation_tests(self, freecad_install: FreeCADInstallation) -> Tuple[bool, List[str]]:
        """Kurulum testlerini çalıştır"""
        warnings = []
        
        try:
            self.logger.info("🧪 Installation testleri başlatılıyor...")
            
            # 1. FreeCAD import test
            self.logger.info("  1️⃣ FreeCAD import test...")
            try:
                result = subprocess.run([
                    freecad_install.python_path,
                    "-c",
                    "import FreeCAD; import Part; print('FREECAD_OK')"
                ],
                capture_output=True,
                text=True,
                timeout=30
                )
                
                if result.returncode == 0 and "FREECAD_OK" in result.stdout:
                    self.logger.info("    ✅ FreeCAD import başarılı")
                else:
                    warnings.append("FreeCAD import testi başarısız")
                    self.logger.warning(f"    ❌ FreeCAD import hatası: {result.stderr}")
            
            except Exception as e:
                warnings.append(f"FreeCAD test exception: {e}")
                self.logger.warning(f"    ❌ FreeCAD test hatası: {e}")
            
            # 2. Core modules test
            self.logger.info("  2️⃣ Core modules test...")
            try:
                test_script = f'''
import sys
sys.path.append(r"{self.base_dir}")
from core.freecad_macro_manager import FreeCADMacroManager

manager = FreeCADMacroManager(r"{freecad_install.path}")
test_result = manager.test_freecad_installation()

if test_result.success:
    print("CORE_MODULES_OK")
else:
    print(f"CORE_MODULES_ERROR: {{test_result.error}}")
'''
                
                result = subprocess.run([
                    freecad_install.python_path,
                    "-c", test_script
                ],
                capture_output=True,
                text=True,
                timeout=60
                )
                
                if result.returncode == 0 and "CORE_MODULES_OK" in result.stdout:
                    self.logger.info("    ✅ Core modules test başarılı")
                else:
                    warnings.append("Core modules test başarısız")
                    self.logger.warning(f"    ❌ Core modules test hatası: {result.stdout}")
            
            except Exception as e:
                warnings.append(f"Core modules test exception: {e}")
                self.logger.warning(f"    ❌ Core modules test hatası: {e}")
            
            # 3. GUI test (opsiyonel)
            if freecad_install.details.get("gui_available", False):
                self.logger.info("  3️⃣ GUI capability test...")
                try:
                    result = subprocess.run([
                        freecad_install.python_path,
                        "-c",
                        "import FreeCADGui; print('GUI_OK')"
                    ],
                    capture_output=True,
                    text=True,
                    timeout=30
                    )
                    
                    if result.returncode == 0 and "GUI_OK" in result.stdout:
                        self.logger.info("    ✅ GUI test başarılı")
                    else:
                        warnings.append("GUI test başarısız")
                        self.logger.warning("    ❌ GUI test başarısız")
                
                except Exception as e:
                    warnings.append(f"GUI test exception: {e}")
                    self.logger.warning(f"    ❌ GUI test hatası: {e}")
            
            test_success = len(warnings) == 0
            
            if test_success:
                self.logger.info("✅ Tüm testler başarılı")
            else:
                self.logger.warning(f"⚠️  {len(warnings)} test uyarısı var")
            
            return test_success, warnings
            
        except Exception as e:
            self.logger.error(f"❌ Test execution hatası: {e}")
            return False, [f"Test execution error: {e}"]

def create_installer(config: Optional[InstallationConfig] = None) -> StepBomInstaller:
    """Installer factory fonksiyonu"""
    return StepBomInstaller(config)

# Test fonksiyonu
def test_installer():
    """Installer'ı test et"""
    try:
        print("🔧 STEP BOM Installer Test")
        print("=" * 60)
        
        # Test config
        config = InstallationConfig(
            install_macros=True,
            install_dependencies=True,
            create_shortcuts=True,
            run_tests=True
        )
        
        installer = create_installer(config)
        
        print("Test kurulumu başlatılıyor...")
        result = installer.install()
        
        if result.success:
            print("✅ Test kurulumu başarılı!")
            print(f"📁 Directory: {result.installation_directory}")
            print(f"🔧 FreeCAD: v{result.freecad_installation.version}")
            print(f"📦 Components: {len(result.installed_components)}")
            
            if result.warnings:
                print(f"⚠️  Warnings: {len(result.warnings)}")
                for warning in result.warnings:
                    print(f"  • {warning}")
        
        else:
            print(f"❌ Test kurulumu başarısız: {result.error}")
        
        return installer
        
    except Exception as e:
        print(f"❌ Test hatası: {e}")
        return None

if __name__ == "__main__":
    # Windows kontrolü
    if sys.platform != "win32":
        print("⚠️  Bu modül sadece Windows'ta çalışır")
        sys.exit(1)
    
    test_installer()