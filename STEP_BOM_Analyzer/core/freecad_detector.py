"""
FreeCAD Detection and Validation Module
STEP BOM Analyzer v3.0 - FreeCAD Native Edition

Bu modül Windows sistemlerinde FreeCAD kurulumunu otomatik tespit eder.
Registry, Path ve dosya sistemi taramaları yaparak çoklu versiyon desteği sağlar.
"""

import os
import sys
import winreg
import subprocess
from pathlib import Path
from typing import Dict, List, Optional, Tuple, NamedTuple
from dataclasses import dataclass
import logging
from datetime import datetime
import json

class FreeCADInstallation(NamedTuple):
    """FreeCAD kurulum bilgisi"""
    version: str
    path: str
    python_path: str
    is_valid: bool
    details: Dict

@dataclass
class DetectionResult:
    """Tespit sonucu"""
    found: bool
    installations: List[FreeCADInstallation] = None
    recommended: Optional[FreeCADInstallation] = None
    error: str = ""
    
    def __post_init__(self):
        if self.installations is None:
            self.installations = []

class FreeCADDetector:
    """Windows FreeCAD Tespit Sistemi"""
    
    def __init__(self):
        self.logger = self._setup_logger()
        self.supported_versions = ["1.0", "0.21", "0.20"]
        self.known_paths = [
            r"C:\Program Files\FreeCAD 1.0",
            r"C:\Program Files\FreeCAD 0.21", 
            r"C:\Program Files\FreeCAD 0.20",
            r"C:\Program Files (x86)\FreeCAD 1.0",
            r"C:\Program Files (x86)\FreeCAD 0.21",
            r"C:\Program Files (x86)\FreeCAD 0.20"
        ]
        
        self.logger.info("✅ FreeCAD Detector başlatıldı")
    
    def _setup_logger(self) -> logging.Logger:
        """Logger ayarla"""
        logger = logging.getLogger("FreeCADDetector")
        logger.setLevel(logging.INFO)
        
        if not logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            )
            handler.setFormatter(formatter)
            logger.addHandler(handler)
        
        return logger
    
    def detect_all_installations(self) -> DetectionResult:
        """Tüm FreeCAD kurulumlarını tespit et"""
        self.logger.info("🔍 FreeCAD kurulum tespiti başlatılıyor...")
        
        installations = []
        
        try:
            # 1. Windows Registry taraması
            registry_installations = self._detect_from_registry()
            installations.extend(registry_installations)
            self.logger.info(f"📋 Registry'den {len(registry_installations)} kurulum bulundu")
            
            # 2. Bilinen path'ları tara
            path_installations = self._detect_from_known_paths()
            installations.extend(path_installations)
            self.logger.info(f"📁 Bilinen path'lardan {len(path_installations)} kurulum bulundu")
            
            # 3. PATH environment variable taraması
            env_installations = self._detect_from_environment()
            installations.extend(env_installations)
            self.logger.info(f"🌐 Environment'tan {len(env_installations)} kurulum bulundu")
            
            # 4. Duplicate'leri temizle
            unique_installations = self._remove_duplicates(installations)
            self.logger.info(f"🔧 Toplam {len(unique_installations)} benzersiz kurulum tespit edildi")
            
            # 5. Her kurulum için validasyon
            validated_installations = []
            for install in unique_installations:
                validated = self._validate_installation(install)
                validated_installations.append(validated)
            
            # 6. Önerilen kurulumu seç
            recommended = self._select_recommended(validated_installations)
            
            valid_count = sum(1 for inst in validated_installations if inst.is_valid)
            
            self.logger.info(f"✅ Tespit tamamlandı: {valid_count}/{len(validated_installations)} geçerli kurulum")
            
            return DetectionResult(
                found=len(validated_installations) > 0,
                installations=validated_installations,
                recommended=recommended
            )
            
        except Exception as e:
            self.logger.error(f"❌ Tespit hatası: {e}")
            return DetectionResult(
                found=False,
                error=str(e)
            )
    
    def _detect_from_registry(self) -> List[FreeCADInstallation]:
        """Windows Registry'den FreeCAD kurulumlarını bul"""
        installations = []
        
        try:
            # HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall
            uninstall_key = winreg.OpenKey(
                winreg.HKEY_LOCAL_MACHINE,
                r"SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall"
            )
            
            i = 0
            while True:
                try:
                    subkey_name = winreg.EnumKey(uninstall_key, i)
                    subkey = winreg.OpenKey(uninstall_key, subkey_name)
                    
                    try:
                        display_name = winreg.QueryValueEx(subkey, "DisplayName")[0]
                        
                        if "FreeCAD" in display_name:
                            try:
                                install_location = winreg.QueryValueEx(subkey, "InstallLocation")[0]
                                display_version = winreg.QueryValueEx(subkey, "DisplayVersion")[0]
                                
                                # Python path'i tahmin et
                                python_path = os.path.join(install_location, "bin", "python.exe")
                                
                                installation = FreeCADInstallation(
                                    version=display_version,
                                    path=install_location,
                                    python_path=python_path,
                                    is_valid=False,  # Henüz validate edilmedi
                                    details={
                                        "source": "registry",
                                        "display_name": display_name,
                                        "registry_key": subkey_name
                                    }
                                )
                                
                                installations.append(installation)
                                self.logger.info(f"📋 Registry'de bulundu: {display_name} v{display_version}")
                                
                            except FileNotFoundError:
                                # InstallLocation veya DisplayVersion yok
                                pass
                    
                    except FileNotFoundError:
                        # DisplayName yok
                        pass
                    
                    finally:
                        winreg.CloseKey(subkey)
                    
                    i += 1
                
                except OSError:
                    # Daha fazla key yok
                    break
            
            winreg.CloseKey(uninstall_key)
            
        except Exception as e:
            self.logger.warning(f"Registry tarama hatası: {e}")
        
        return installations
    
    def _detect_from_known_paths(self) -> List[FreeCADInstallation]:
        """Bilinen path'lardan FreeCAD kurulumlarını bul"""
        installations = []
        
        for path in self.known_paths:
            if os.path.exists(path):
                try:
                    # Version'ı path'ten çıkar
                    version = "unknown"
                    for v in self.supported_versions:
                        if v in path:
                            version = v
                            break
                    
                    python_path = os.path.join(path, "bin", "python.exe")
                    
                    installation = FreeCADInstallation(
                        version=version,
                        path=path,
                        python_path=python_path,
                        is_valid=False,
                        details={
                            "source": "known_path"
                        }
                    )
                    
                    installations.append(installation)
                    self.logger.info(f"📁 Bilinen path'ta bulundu: {path}")
                    
                except Exception as e:
                    self.logger.warning(f"Path tarama hatası ({path}): {e}")
        
        return installations
    
    def _detect_from_environment(self) -> List[FreeCADInstallation]:
        """Environment PATH'ten FreeCAD kurulumlarını bul"""
        installations = []
        
        try:
            path_env = os.environ.get("PATH", "")
            paths = path_env.split(os.pathsep)
            
            for path in paths:
                if "freecad" in path.lower():
                    try:
                        # FreeCAD.exe'yi bul
                        freecad_exe = os.path.join(path, "FreeCAD.exe")
                        if os.path.exists(freecad_exe):
                            
                            # Parent directory'yi al (genellikle bin klasörü)
                            install_path = os.path.dirname(path)
                            python_path = os.path.join(path, "python.exe")
                            
                            installation = FreeCADInstallation(
                                version="unknown",
                                path=install_path,
                                python_path=python_path,
                                is_valid=False,
                                details={
                                    "source": "environment_path",
                                    "found_in": path
                                }
                            )
                            
                            installations.append(installation)
                            self.logger.info(f"🌐 Environment PATH'te bulundu: {path}")
                    
                    except Exception as e:
                        self.logger.warning(f"Environment tarama hatası ({path}): {e}")
        
        except Exception as e:
            self.logger.warning(f"Environment PATH tarama hatası: {e}")
        
        return installations
    
    def _remove_duplicates(self, installations: List[FreeCADInstallation]) -> List[FreeCADInstallation]:
        """Duplicate kurulumları temizle"""
        unique_paths = {}
        
        for installation in installations:
            # Path'i normalize et
            normalized_path = os.path.normpath(installation.path.lower())
            
            if normalized_path not in unique_paths:
                unique_paths[normalized_path] = installation
            else:
                # Var olan installation'ı güncelle (daha iyi source varsa)
                existing = unique_paths[normalized_path]
                if installation.details.get("source") == "registry" and existing.details.get("source") != "registry":
                    unique_paths[normalized_path] = installation
        
        return list(unique_paths.values())
    
    def _validate_installation(self, installation: FreeCADInstallation) -> FreeCADInstallation:
        """FreeCAD kurulumunu validate et"""
        try:
            self.logger.info(f"🔍 Validating: {installation.path}")
            
            details = installation.details.copy()
            is_valid = True
            validation_errors = []
            
            # 1. Python executable kontrolü
            if not os.path.exists(installation.python_path):
                validation_errors.append("Python executable bulunamadı")
                is_valid = False
            else:
                details["python_exists"] = True
            
            # 2. FreeCAD import testi
            if is_valid:
                try:
                    result = subprocess.run([
                        installation.python_path, 
                        "-c", 
                        "import FreeCAD; print(f'FreeCAD_{FreeCAD.Version()[0]}.{FreeCAD.Version()[1]}.{FreeCAD.Version()[2]}')"
                    ], 
                    capture_output=True, 
                    text=True, 
                    timeout=30
                    )
                    
                    if result.returncode == 0:
                        version_output = result.stdout.strip()
                        if "FreeCAD_" in version_output:
                            actual_version = version_output.replace("FreeCAD_", "")
                            details["actual_version"] = actual_version
                            details["freecad_import"] = True
                            
                            # Version'ı güncelle
                            installation = installation._replace(version=actual_version)
                        else:
                            validation_errors.append("FreeCAD version çıktısı beklenmeyen format")
                            is_valid = False
                    else:
                        validation_errors.append(f"FreeCAD import hatası: {result.stderr}")
                        is_valid = False
                
                except subprocess.TimeoutExpired:
                    validation_errors.append("FreeCAD import timeout")
                    is_valid = False
                except Exception as e:
                    validation_errors.append(f"FreeCAD import exception: {e}")
                    is_valid = False
            
            # 3. GUI capability testi (opsiyonel)
            if is_valid:
                try:
                    result = subprocess.run([
                        installation.python_path,
                        "-c",
                        "import FreeCADGui; print('GUI_AVAILABLE')"
                    ],
                    capture_output=True,
                    text=True,
                    timeout=30
                    )
                    
                    if result.returncode == 0 and "GUI_AVAILABLE" in result.stdout:
                        details["gui_available"] = True
                    else:
                        details["gui_available"] = False
                        # GUI yokluğu fatal değil, sadece warning
                        
                except Exception as e:
                    details["gui_available"] = False
                    details["gui_error"] = str(e)
            
            details["validation_errors"] = validation_errors
            details["validation_date"] = datetime.now().isoformat()
            
            validated_installation = installation._replace(
                is_valid=is_valid,
                details=details
            )
            
            if is_valid:
                self.logger.info(f"✅ Geçerli kurulum: {installation.path} v{installation.version}")
            else:
                self.logger.warning(f"❌ Geçersiz kurulum: {installation.path} - {validation_errors}")
            
            return validated_installation
            
        except Exception as e:
            self.logger.error(f"Validation hatası ({installation.path}): {e}")
            return installation._replace(
                is_valid=False,
                details={**installation.details, "validation_error": str(e)}
            )
    
    def _select_recommended(self, installations: List[FreeCADInstallation]) -> Optional[FreeCADInstallation]:
        """En uygun kurulumu seç"""
        valid_installations = [inst for inst in installations if inst.is_valid]
        
        if not valid_installations:
            return None
        
        # Öncelik sırası: 1.0 > 0.21 > 0.20 > diğer
        def get_version_priority(version_str: str) -> int:
            if version_str.startswith("1.0"):
                return 100
            elif version_str.startswith("0.21"):
                return 90
            elif version_str.startswith("0.20"):
                return 80
            else:
                return 50
        
        # En yüksek prioriteli kurulumu seç
        recommended = max(valid_installations, key=lambda x: get_version_priority(x.version))
        
        self.logger.info(f"🎯 Önerilen kurulum: {recommended.path} v{recommended.version}")
        
        return recommended
    
    def get_detection_summary(self, result: DetectionResult) -> Dict:
        """Tespit özeti oluştur"""
        if not result.found:
            return {
                "found": False,
                "error": result.error,
                "suggestion": "FreeCAD kurulumu yapılması gerekiyor"
            }
        
        valid_installations = [inst for inst in result.installations if inst.is_valid]
        
        summary = {
            "found": True,
            "total_installations": len(result.installations),
            "valid_installations": len(valid_installations),
            "recommended": None
        }
        
        if result.recommended:
            summary["recommended"] = {
                "version": result.recommended.version,
                "path": result.recommended.path,
                "has_gui": result.recommended.details.get("gui_available", False)
            }
        
        # Installation listesi
        summary["installations"] = []
        for inst in result.installations:
            summary["installations"].append({
                "version": inst.version,
                "path": inst.path,
                "is_valid": inst.is_valid,
                "source": inst.details.get("source", "unknown"),
                "validation_errors": inst.details.get("validation_errors", [])
            })
        
        return summary

def detect_freecad() -> DetectionResult:
    """Kısa fonksiyon - FreeCAD tespit et"""
    detector = FreeCADDetector()
    return detector.detect_all_installations()

def get_recommended_freecad() -> Optional[FreeCADInstallation]:
    """Önerilen FreeCAD kurulumunu al"""
    result = detect_freecad()
    return result.recommended

# Test fonksiyonu
def test_detector():
    """FreeCAD Detector'ı test et"""
    try:
        print("🔍 FreeCAD Detector Test")
        print("=" * 60)
        
        detector = FreeCADDetector()
        
        # Tespit yap
        print("Tespit başlatılıyor...")
        result = detector.detect_all_installations()
        
        if result.found:
            print(f"✅ {len(result.installations)} FreeCAD kurulumu bulundu")
            
            # Özet göster
            summary = detector.get_detection_summary(result)
            print(f"📊 Geçerli kurulum sayısı: {summary['valid_installations']}")
            
            if summary["recommended"]:
                rec = summary["recommended"]
                print(f"🎯 Önerilen: v{rec['version']} - {rec['path']}")
                print(f"🖥️  GUI: {'✅' if rec['has_gui'] else '❌'}")
            
            # Detayları göster
            print("\n📋 Bulunan kurulumlar:")
            for inst in summary["installations"]:
                status = "✅ Geçerli" if inst["is_valid"] else "❌ Geçersiz"
                print(f"  {status} - v{inst['version']} - {inst['source']}")
                if inst["validation_errors"]:
                    for error in inst["validation_errors"]:
                        print(f"    ⚠️  {error}")
        
        else:
            print("❌ FreeCAD kurulumu bulunamadı")
            if result.error:
                print(f"Hata: {result.error}")
        
        return detector
        
    except Exception as e:
        print(f"❌ Test hatası: {e}")
        return None

if __name__ == "__main__":
    # Windows kontrolü
    if sys.platform != "win32":
        print("⚠️  Bu modül sadece Windows'ta çalışır")
        sys.exit(1)
    
    test_detector()