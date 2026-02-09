"""
FreeCAD Macro Manager
STEP BOM Analyzer v3.0 - FreeCAD Native Edition

Bu modül FreeCAD macro'larını çalıştırmak ve yönetmek için tasarlanmıştır.
Windows'ta FreeCAD'ın kendi Python'u ile çalışır.
"""

import subprocess
import os
import sys
import json
import time
import tempfile
from pathlib import Path
from typing import Dict, List, Optional, Any, Union
from dataclasses import dataclass
import logging

@dataclass
class MacroResult:
    """FreeCAD Macro çalıştırma sonucu"""
    success: bool
    output: str = ""
    error: str = ""
    data: Optional[Dict] = None
    execution_time: float = 0.0
    freecad_version: Optional[str] = None

class FreeCADMacroManager:
    """FreeCAD Macro yöneticisi - Native FreeCAD macro execution"""
    
    def __init__(self, freecad_path: Optional[str] = None):
        self.freecad_path = freecad_path or self._find_freecad()
        self.freecad_python = self._get_freecad_python()
        self.macro_dir = Path(__file__).parent.parent / "macros"
        self.temp_dir = Path(tempfile.gettempdir()) / "step_bom_analyzer"
        self.temp_dir.mkdir(exist_ok=True)
        
        # Logger setup
        self.logger = self._setup_logger()
        
        if not self.freecad_python:
            raise RuntimeError("FreeCAD Python bulunamadı")
        
        self.logger.info(f"✅ FreeCAD Python: {self.freecad_python}")
    
    def _setup_logger(self) -> logging.Logger:
        """Logger ayarla"""
        logger = logging.getLogger("FreeCADMacroManager")
        logger.setLevel(logging.INFO)
        
        if not logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            )
            handler.setFormatter(formatter)
            logger.addHandler(handler)
        
        return logger
    
    def _find_freecad(self) -> Optional[str]:
        """Windows'ta FreeCAD kurulumunu bul"""
        possible_paths = [
            r"C:\Program Files\FreeCAD 1.0",
            r"C:\Program Files\FreeCAD 0.21", 
            r"C:\Program Files\FreeCAD 0.20",
            r"C:\Program Files (x86)\FreeCAD 1.0",
            r"C:\Program Files (x86)\FreeCAD 0.21",
            r"C:\Program Files (x86)\FreeCAD 0.20"
        ]
        
        for path in possible_paths:
            if os.path.exists(path):
                return path
        
        return None
    
    def _get_freecad_python(self) -> Optional[str]:
        """FreeCAD Python executable'ını bul"""
        if not self.freecad_path:
            return None
        
        python_path = os.path.join(self.freecad_path, "bin", "python.exe")
        
        if os.path.exists(python_path):
            return python_path
        
        return None
    
    def test_freecad_installation(self) -> MacroResult:
        """FreeCAD kurulumunu test et"""
        try:
            self.logger.info("FreeCAD kurulum testi başlatılıyor...")
            
            test_script = """
import FreeCAD as App
import FreeCADGui as Gui
import Part
import sys
import json

# FreeCAD version bilgisi
version_info = {
    "version": App.Version(),
    "build_info": {
        "version_string": ".".join(App.Version()[:3]),
        "build_hash": App.Version()[3] if len(App.Version()) > 3 else "Unknown",
        "python_version": sys.version
    }
}

# Test dokümantı oluştur
doc = App.newDocument("TestDoc")

# Basit geometri oluştur
box = doc.addObject("Part::Box", "TestBox")
box.Length = 10
box.Width = 10 
box.Height = 10

doc.recompute()

# Test sonuçları
test_results = {
    "freecad_version": version_info,
    "document_created": True,
    "objects_count": len(doc.Objects),
    "part_module": "Part" in sys.modules,
    "gui_available": hasattr(Gui, "ActiveDocument")
}

# Dokümantı kapat
App.closeDocument("TestDoc")

print("FREECAD_TEST_SUCCESS")
print("FREECAD_TEST_DATA_START")
print(json.dumps(test_results, indent=2, default=str))
print("FREECAD_TEST_DATA_END")
"""
            
            result = self._execute_python_script(test_script)
            
            if result.success and "FREECAD_TEST_SUCCESS" in result.output:
                # Test verilerini çıkar
                lines = result.output.split('\n')
                json_data = None
                capture = False
                
                for line in lines:
                    if "FREECAD_TEST_DATA_START" in line:
                        capture = True
                        continue
                    elif "FREECAD_TEST_DATA_END" in line:
                        break
                    elif capture:
                        try:
                            json_data = json.loads(line)
                            break
                        except:
                            continue
                
                self.logger.info("✅ FreeCAD kurulum testi başarılı")
                return MacroResult(
                    success=True,
                    output=result.output,
                    data=json_data,
                    execution_time=result.execution_time
                )
            else:
                self.logger.error("❌ FreeCAD kurulum testi başarısız")
                return MacroResult(
                    success=False,
                    error=result.error or "FreeCAD test failed",
                    output=result.output,
                    execution_time=result.execution_time
                )
        
        except Exception as e:
            self.logger.error(f"FreeCAD test exception: {e}")
            return MacroResult(
                success=False,
                error=str(e)
            )
    
    def _execute_python_script(self, script: str, timeout: int = 120) -> MacroResult:
        """Python script'ini FreeCAD Python ile çalıştır"""
        start_time = time.time()
        
        try:
            # Geçici script dosyası oluştur
            script_file = self.temp_dir / f"temp_script_{int(time.time())}.py"
            
            with open(script_file, 'w', encoding='utf-8') as f:
                f.write(script)
            
            # FreeCAD Python ile çalıştır
            cmd = [self.freecad_python, str(script_file)]
            
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=timeout,
                encoding='utf-8',
                errors='replace'
            )
            
            execution_time = time.time() - start_time
            
            # Geçici dosyayı temizle
            try:
                script_file.unlink()
            except:
                pass
            
            if result.returncode == 0:
                return MacroResult(
                    success=True,
                    output=result.stdout,
                    execution_time=execution_time
                )
            else:
                return MacroResult(
                    success=False,
                    output=result.stdout,
                    error=result.stderr,
                    execution_time=execution_time
                )
        
        except subprocess.TimeoutExpired:
            return MacroResult(
                success=False,
                error=f"Script timeout ({timeout}s)",
                execution_time=time.time() - start_time
            )
        except Exception as e:
            return MacroResult(
                success=False,
                error=str(e),
                execution_time=time.time() - start_time
            )
    
    def execute_macro(self, macro_name: str, parameters: Dict = None) -> MacroResult:
        """FreeCAD macro'sunu çalıştır"""
        try:
            self.logger.info(f"Macro çalıştırılıyor: {macro_name}")
            
            # Macro dosyasını bul
            macro_file = self.macro_dir / f"{macro_name}.FCMacro"
            
            if not macro_file.exists():
                return MacroResult(
                    success=False,
                    error=f"Macro dosyası bulunamadı: {macro_file}"
                )
            
            # Macro içeriğini oku
            with open(macro_file, 'r', encoding='utf-8') as f:
                macro_content = f.read()
            
            # Parametreleri ekle (eğer varsa)
            if parameters:
                param_script = f"""
# Macro parameters
import json
MACRO_PARAMETERS = {json.dumps(parameters, default=str)}

"""
                macro_content = param_script + macro_content
            
            # Macro'yu çalıştır
            result = self._execute_python_script(macro_content)
            
            if result.success:
                self.logger.info(f"✅ Macro başarıyla çalıştırıldı: {macro_name}")
            else:
                self.logger.error(f"❌ Macro hatası ({macro_name}): {result.error}")
            
            return result
            
        except Exception as e:
            self.logger.error(f"Macro çalıştırma exception: {e}")
            return MacroResult(
                success=False,
                error=str(e)
            )
    
    def execute_step_processor(self, step_file: str, output_dir: str) -> MacroResult:
        """STEP processor macro'sunu çalıştır"""
        parameters = {
            "step_file_path": step_file,
            "output_directory": output_dir
        }
        
        # step_processor macro'sunu çalıştır
        return self.execute_macro("step_processor", parameters)
    
    def get_freecad_info(self) -> Dict:
        """FreeCAD kurulum bilgilerini al"""
        return {
            "freecad_path": self.freecad_path,
            "freecad_python": self.freecad_python,
            "macro_directory": str(self.macro_dir),
            "temp_directory": str(self.temp_dir)
        }
    
    def install_macros(self, target_dir: Optional[str] = None) -> bool:
        """Macro'ları FreeCAD macro dizinine kopyala"""
        try:
            if not target_dir:
                # Windows FreeCAD macro dizini
                appdata = os.environ.get('APPDATA')
                if appdata:
                    target_dir = os.path.join(appdata, 'FreeCAD', 'Macro')
                else:
                    return False
            
            # Hedef dizini oluştur
            os.makedirs(target_dir, exist_ok=True)
            
            # Macro dosyalarını kopyala
            import shutil
            copied_count = 0
            
            for macro_file in self.macro_dir.glob("*.FCMacro"):
                target_file = os.path.join(target_dir, macro_file.name)
                shutil.copy2(macro_file, target_file)
                copied_count += 1
                self.logger.info(f"Kopyalandı: {macro_file.name} → {target_dir}")
            
            self.logger.info(f"✅ {copied_count} macro dosyası FreeCAD'a yüklendi")
            return True
            
        except Exception as e:
            self.logger.error(f"Macro yükleme hatası: {e}")
            return False

# Test fonksiyonu
def test_macro_manager():
    """Macro manager'ı test et"""
    try:
        print("🔧 FreeCAD Macro Manager Test")
        print("=" * 50)
        
        # Manager oluştur
        manager = FreeCADMacroManager()
        
        # FreeCAD bilgilerini göster
        info = manager.get_freecad_info()
        print(f"📁 FreeCAD Path: {info['freecad_path']}")
        print(f"🐍 Python Path: {info['freecad_python']}")
        print(f"📂 Macro Dir: {info['macro_directory']}")
        
        # FreeCAD kurulumu test et
        print("\n🧪 FreeCAD kurulum testi...")
        test_result = manager.test_freecad_installation()
        
        if test_result.success:
            print("✅ FreeCAD kurulum testi başarılı!")
            if test_result.data:
                version_info = test_result.data.get('freecad_version', {}).get('build_info', {})
                print(f"📋 FreeCAD Version: {version_info.get('version_string', 'Unknown')}")
        else:
            print(f"❌ FreeCAD kurulum testi başarısız: {test_result.error}")
        
        return manager
        
    except Exception as e:
        print(f"❌ Test hatası: {e}")
        return None

if __name__ == "__main__":
    test_macro_manager()