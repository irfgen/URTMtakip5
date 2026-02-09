"""
FreeCAD Python Wrapper for Windows
STEP BOM Analyzer için FreeCAD işlemlerini subprocess ile yönetir
"""

import subprocess
import sys
import os
import json
import tempfile
import time
from pathlib import Path
from dataclasses import dataclass
from typing import List, Optional, Dict, Any

@dataclass
class FreeCADResult:
    """FreeCAD işlem sonucu"""
    success: bool
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    stdout: Optional[str] = None
    processing_time: float = 0.0

class FreeCADPythonWrapper:
    """FreeCAD işlemlerini Windows'ta subprocess ile yönetir"""
    
    def __init__(self):
        self.freecad_python = self._find_freecad_python()
        self.freecad_available = self._test_freecad()
        
        if not self.freecad_available:
            raise RuntimeError(f"FreeCAD Python bulunamadı veya çalışmıyor: {self.freecad_python}")
        
        print(f"✅ FreeCAD Python Wrapper hazır: {self.freecad_python}")
    
    def _find_freecad_python(self) -> Optional[str]:
        """FreeCAD'ın kendi Python'unu bul"""
        possible_paths = [
            r"C:\Program Files\FreeCAD 1.0\bin\python.exe",
            r"C:\Program Files\FreeCAD 0.21\bin\python.exe",
            r"C:\Program Files\FreeCAD 0.20\bin\python.exe",
            r"C:\Program Files (x86)\FreeCAD 1.0\bin\python.exe",
            r"C:\Program Files (x86)\FreeCAD 0.21\bin\python.exe",
        ]
        
        for path in possible_paths:
            if os.path.exists(path):
                print(f"✅ FreeCAD Python bulundu: {path}")
                return path
        
        print("❌ FreeCAD Python bulunamadı")
        return None
    
    def _test_freecad(self) -> bool:
        """FreeCAD erişimini test et"""
        if not self.freecad_python:
            return False
            
        try:
            test_script = """
import FreeCAD
import Part
print("FreeCAD_TEST_OK")
"""
            result = subprocess.run(
                [self.freecad_python, '-c', test_script],
                capture_output=True, text=True, timeout=15
            )
            
            success = result.returncode == 0 and "FreeCAD_TEST_OK" in result.stdout
            if success:
                print("✅ FreeCAD import test başarılı")
            else:
                print(f"❌ FreeCAD test başarısız: {result.stderr}")
            
            return success
            
        except Exception as e:
            print(f"❌ FreeCAD test hatası: {e}")
            return False
    
    def get_freecad_info(self) -> FreeCADResult:
        """FreeCAD versiyon bilgileri"""
        info_script = """
import FreeCAD
import json
info = {
    "version": FreeCAD.Version(),
    "build_info": {
        "version": FreeCAD.Version()[0] + "." + FreeCAD.Version()[1] + "." + FreeCAD.Version()[2],
        "build": FreeCAD.Version()[3],
        "git_url": FreeCAD.Version()[4],
        "build_date": FreeCAD.Version()[5]
    }
}
print("FREECAD_INFO_START")
print(json.dumps(info, ensure_ascii=False))
print("FREECAD_INFO_END")
"""
        
        try:
            result = subprocess.run(
                [self.freecad_python, '-c', info_script],
                capture_output=True, text=True, timeout=10
            )
            
            if result.returncode == 0:
                # JSON veriyi çıkar
                lines = result.stdout.strip().split('\n')
                json_data = None
                capture = False
                
                for line in lines:
                    if "FREECAD_INFO_START" in line:
                        capture = True
                        continue
                    elif "FREECAD_INFO_END" in line:
                        break
                    elif capture:
                        try:
                            json_data = json.loads(line)
                            break
                        except:
                            continue
                
                return FreeCADResult(
                    success=True,
                    data=json_data,
                    stdout=result.stdout
                )
            else:
                return FreeCADResult(
                    success=False,
                    error=result.stderr
                )
                
        except Exception as e:
            return FreeCADResult(
                success=False,
                error=f"FreeCAD info error: {str(e)}"
            )
    
    def process_step_file(self, step_file_path: str, output_dir: str) -> FreeCADResult:
        """STEP dosyasını işle ve BOM çıkar"""
        
        start_time = time.time()
        
        step_script = f'''
import sys
import json
import FreeCAD
import Part
import os
from pathlib import Path

def process_step_file():
    step_file = r"{step_file_path}"
    output_dir = r"{output_dir}"
    
    try:
        print(f"📁 STEP dosyası: {{step_file}}")
        
        # Dosya kontrolü
        if not os.path.exists(step_file):
            raise FileNotFoundError(f"STEP dosyası bulunamadı: {{step_file}}")
        
        # Yeni dokümant oluştur
        doc = FreeCAD.newDocument("STEPAnalysis")
        print("📄 FreeCAD dokümantı oluşturuldu")
        
        # STEP dosyasını import et
        print("⚡ STEP dosyası yükleniyor...")
        Part.insert(step_file, doc.Name)
        
        # BOM analizi
        objects = doc.Objects
        print(f"🔍 {{len(objects)}} nesne bulundu")
        
        bom_data = {{
            "file_info": {{
                "file_path": step_file,
                "file_name": os.path.basename(step_file),
                "file_size": os.path.getsize(step_file)
            }},
            "analysis": {{
                "total_objects": len(objects),
                "processing_date": str(FreeCAD.Base.getCurrentDate()),
                "freecad_version": FreeCAD.Version()[0] + "." + FreeCAD.Version()[1] + "." + FreeCAD.Version()[2]
            }},
            "assemblies": [],
            "parts": []
        }}
        
        for obj in objects:
            obj_info = {{
                "name": obj.Name,
                "label": obj.Label,
                "type": obj.TypeId,
                "placement": str(obj.Placement) if hasattr(obj, 'Placement') else None
            }}
            
            # Shape bilgileri
            if hasattr(obj, 'Shape') and obj.Shape:
                try:
                    obj_info.update({{
                        "volume": float(obj.Shape.Volume),
                        "surface_area": float(obj.Shape.Area),
                        "mass": float(obj.Shape.Mass) if hasattr(obj.Shape, 'Mass') else 0,
                        "center_of_mass": str(obj.Shape.CenterOfMass) if hasattr(obj.Shape, 'CenterOfMass') else None,
                        "bounding_box": {{
                            "xmin": float(obj.Shape.BoundBox.XMin),
                            "ymin": float(obj.Shape.BoundBox.YMin), 
                            "zmin": float(obj.Shape.BoundBox.ZMin),
                            "xmax": float(obj.Shape.BoundBox.XMax),
                            "ymax": float(obj.Shape.BoundBox.YMax),
                            "zmax": float(obj.Shape.BoundBox.ZMax)
                        }}
                    }})
                except Exception as e:
                    print(f"⚠️  Shape analiz hatası {{obj.Name}}: {{e}}")
                    obj_info["shape_error"] = str(e)
            
            # Assembly vs Part sınıflandırması
            if "Assembly" in obj.TypeId or (hasattr(obj, 'OutList') and len(obj.OutList) > 0):
                obj_info["children_count"] = len(obj.OutList) if hasattr(obj, 'OutList') else 0
                bom_data["assemblies"].append(obj_info)
            else:
                bom_data["parts"].append(obj_info)
        
        # Sonuçları kaydet
        os.makedirs(output_dir, exist_ok=True)
        result_file = os.path.join(output_dir, "bom_analysis.json")
        
        with open(result_file, 'w', encoding='utf-8') as f:
            json.dump(bom_data, f, indent=2, ensure_ascii=False)
        
        print(f"💾 BOM analizi kaydedildi: {{result_file}}")
        
        # İstatistikler
        print(f"📊 Analiz Özeti:")
        print(f"   - Toplam nesne: {{bom_data['analysis']['total_objects']}}")
        print(f"   - Assembly: {{len(bom_data['assemblies'])}}")
        print(f"   - Part: {{len(bom_data['parts'])}}")
        
        print("FREECAD_SUCCESS")
        
        # Dokümantı kapat
        FreeCAD.closeDocument(doc.Name)
        
        return bom_data
        
    except Exception as e:
        print(f"FREECAD_ERROR: {{e}}")
        import traceback
        traceback.print_exc()
        return None

# Ana işlem
result = process_step_file()
if result:
    print("FREECAD_RESULT_START")
    print(json.dumps(result, ensure_ascii=False))
    print("FREECAD_RESULT_END")
'''
        
        try:
            result = subprocess.run(
                [self.freecad_python, '-c', step_script],
                capture_output=True, text=True, timeout=300,
                encoding='utf-8', errors='replace'
            )
            
            processing_time = time.time() - start_time
            
            if result.returncode == 0 and "FREECAD_SUCCESS" in result.stdout:
                # JSON data'yı çıkar
                lines = result.stdout.strip().split('\n')
                json_data = None
                capture = False
                
                for line in lines:
                    if "FREECAD_RESULT_START" in line:
                        capture = True
                        continue
                    elif "FREECAD_RESULT_END" in line:
                        break
                    elif capture:
                        try:
                            json_data = json.loads(line)
                            break
                        except:
                            continue
                
                return FreeCADResult(
                    success=True,
                    data=json_data,
                    stdout=result.stdout,
                    processing_time=processing_time
                )
            else:
                return FreeCADResult(
                    success=False,
                    error=result.stderr or "Unknown error",
                    stdout=result.stdout,
                    processing_time=processing_time
                )
                
        except subprocess.TimeoutExpired:
            return FreeCADResult(
                success=False,
                error="İşlem zaman aşımına uğradı (5dk)",
                processing_time=time.time() - start_time
            )
        except Exception as e:
            return FreeCADResult(
                success=False,
                error=f"Subprocess hatası: {str(e)}",
                processing_time=time.time() - start_time
            )

    def generate_part_screenshot(self, step_file_path: str, output_dir: str, part_name: str = None) -> FreeCADResult:
        """Part screenshot oluştur"""
        
        screenshot_script = f'''
import FreeCAD
import FreeCADGui
import Part
import os
import json

def generate_screenshots():
    step_file = r"{step_file_path}"
    output_dir = r"{output_dir}"
    part_name = "{part_name}" if "{part_name}" != "None" else None
    
    try:
        # GUI modunu başlat
        FreeCADGui.showMainWindow()
        
        # Dokümant oluştur
        doc = FreeCAD.newDocument("ScreenshotDoc")
        
        # STEP dosyasını yükle
        Part.insert(step_file, doc.Name)
        
        # Screenshot dizini oluştur
        os.makedirs(output_dir, exist_ok=True)
        
        screenshots = []
        
        # Tüm objeleri render et
        for obj in doc.Objects:
            if part_name and obj.Name != part_name:
                continue
                
            # Nesneyi seç ve odakla
            FreeCADGui.Selection.addSelection(obj)
            FreeCADGui.ActiveDocument.ActiveView.viewAxometric()
            FreeCADGui.ActiveDocument.ActiveView.fitAll()
            
            # Screenshot al
            screenshot_path = os.path.join(output_dir, f"{{obj.Name}}_screenshot.png")
            FreeCADGui.ActiveDocument.ActiveView.saveImage(screenshot_path, 1920, 1080, 'White')
            
            screenshots.append({{
                "part_name": obj.Name,
                "screenshot_path": screenshot_path,
                "exists": os.path.exists(screenshot_path)
            }})
            
            print(f"📸 Screenshot: {{obj.Name}} -> {{screenshot_path}}")
        
        FreeCAD.closeDocument(doc.Name)
        
        result = {{
            "screenshots": screenshots,
            "total_screenshots": len(screenshots)
        }}
        
        print("SCREENSHOT_SUCCESS")
        print("SCREENSHOT_RESULT_START")
        print(json.dumps(result, ensure_ascii=False))
        print("SCREENSHOT_RESULT_END")
        
        return result
        
    except Exception as e:
        print(f"SCREENSHOT_ERROR: {{e}}")
        return None

generate_screenshots()
'''
        
        try:
            result = subprocess.run(
                [self.freecad_python, '-c', screenshot_script],
                capture_output=True, text=True, timeout=120
            )
            
            if result.returncode == 0 and "SCREENSHOT_SUCCESS" in result.stdout:
                # JSON veriyi çıkar
                lines = result.stdout.strip().split('\n')
                json_data = None
                capture = False
                
                for line in lines:
                    if "SCREENSHOT_RESULT_START" in line:
                        capture = True
                        continue
                    elif "SCREENSHOT_RESULT_END" in line:
                        break
                    elif capture:
                        try:
                            json_data = json.loads(line)
                            break
                        except:
                            continue
                
                return FreeCADResult(
                    success=True,
                    data=json_data,
                    stdout=result.stdout
                )
            else:
                return FreeCADResult(
                    success=False,
                    error=result.stderr or "Screenshot error",
                    stdout=result.stdout
                )
                
        except Exception as e:
            return FreeCADResult(
                success=False,
                error=f"Screenshot subprocess error: {str(e)}"
            )

# Test fonksiyonu
def test_freecad_wrapper():
    """FreeCAD wrapper'ını test et"""
    try:
        wrapper = FreeCADPythonWrapper()
        print("✅ FreeCAD Wrapper başarıyla oluşturuldu")
        
        # FreeCAD bilgilerini al
        info_result = wrapper.get_freecad_info()
        if info_result.success:
            version_info = info_result.data['build_info']
            print(f"📋 FreeCAD Version: {version_info['version']}")
            print(f"📅 Build Date: {version_info['build_date']}")
        
        return wrapper
    except Exception as e:
        print(f"❌ FreeCAD Wrapper hatası: {e}")
        return None

if __name__ == "__main__":
    wrapper = test_freecad_wrapper()
    if wrapper:
        print(f"FreeCAD Python: {wrapper.freecad_python}")
        print("Test STEP dosyasını işlemek için wrapper.process_step_file() kullanın")