#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SolidWorks Test Script

Bu script SolidWorks kurulumunu ve COM erişimini test eder.
Kullanım: python test_solidworks.py
"""

import sys
import os
import tempfile
from pathlib import Path

def check_python_version():
    """Python sürümünü kontrol et"""
    print("=== Python Sürüm Kontrolü ===")
    print(f"Python versiyonu: {sys.version}")
    
    if sys.version_info < (3, 6):
        print("❌ Python 3.6+ gerekli")
        return False
    else:
        print("✅ Python sürümü uygun")
        return True

def check_dependencies():
    """Gerekli kütüphaneleri kontrol et"""
    print("\n=== Bağımlılık Kontrolü ===")
    
    try:
        import win32com.client
        print("✅ pywin32 kurulu")
    except ImportError:
        print("❌ pywin32 bulunamadı. Kurmak için: pip install pywin32")
        return False
    
    try:
        import pythoncom
        print("✅ pythoncom erişilebilir")
    except ImportError:
        print("❌ pythoncom bulunamadı")
        return False
    
    return True

def check_solidworks_installation():
    """SolidWorks kurulumunu kontrol et"""
    print("\n=== SolidWorks Kurulum Kontrolü ===")
    
    try:
        import win32com.client as win32
        import pythoncom
        
        pythoncom.CoInitialize()
        
        # Registry'den SolidWorks'u bul
        try:
            sw_app = win32.Dispatch("SldWorks.Application")
            version = sw_app.RevisionNumber()
            print(f"✅ SolidWorks bulundu - Sürüm: {version}")
            
            # SolidWorks'u gizli modda çalıştır
            sw_app.Visible = False
            print("✅ SolidWorks gizli modda başlatıldı")
            
            # Kapatma işlemi
            try:
                sw_app.ExitApp()
                print("✅ SolidWorks başarıyla kapatıldı")
            except:
                print("⚠️ SolidWorks kapatma uyarısı (normal olabilir)")
                
            pythoncom.CoUninitialize()
            return True
            
        except Exception as e:
            print(f"❌ SolidWorks COM hatası: {str(e)}")
            pythoncom.CoUninitialize()
            return False
            
    except Exception as e:
        print(f"❌ COM başlatma hatası: {str(e)}")
        return False

def test_wrapper_functionality():
    """Wrapper fonksiyonalitesini test et"""
    print("\n=== Wrapper Fonksiyonalite Testi ===")
    
    try:
        # Wrapper'ı import et
        sys.path.append(os.path.dirname(os.path.abspath(__file__)))
        from solidworks_wrapper import SolidWorksWrapper
        
        # Test instance oluştur
        wrapper = SolidWorksWrapper(visible=False, log_level='ERROR')
        
        # SolidWorks bağlantısını test et
        if wrapper.connect_to_solidworks():
            print("✅ Wrapper SolidWorks bağlantısı başarılı")
            wrapper.disconnect()
            return True
        else:
            print("❌ Wrapper SolidWorks bağlantısı başarısız")
            return False
            
    except ImportError as e:
        print(f"❌ Wrapper import hatası: {str(e)}")
        return False
    except Exception as e:
        print(f"❌ Wrapper test hatası: {str(e)}")
        return False

def create_test_environment():
    """Test ortamı oluştur"""
    print("\n=== Test Ortamı ===")
    
    # Geçici dizin oluştur
    temp_dir = tempfile.mkdtemp(prefix='solidworks_test_')
    print(f"Test dizini: {temp_dir}")
    
    # Screenshot dizini oluştur
    screenshot_dir = os.path.join(temp_dir, 'screenshots')
    os.makedirs(screenshot_dir, exist_ok=True)
    print(f"Screenshot dizini: {screenshot_dir}")
    
    return temp_dir, screenshot_dir

def print_environment_info():
    """Ortam bilgilerini yazdır"""
    print("\n=== Ortam Bilgileri ===")
    print(f"İşletim Sistemi: {sys.platform}")
    print(f"Python Yolu: {sys.executable}")
    print(f"Çalışma Dizini: {os.getcwd()}")
    print(f"Script Dizini: {os.path.dirname(os.path.abspath(__file__))}")
    
    # Environment variables
    print("\nÖnemli Environment Variables:")
    env_vars = [
        'SOLIDWORKS_TIMEOUT', 'SOLIDWORKS_VISIBLE', 'SOLIDWORKS_LOG_LEVEL',
        'SCREENSHOT_WIDTH', 'SCREENSHOT_HEIGHT', 'PYTHON_PATH'
    ]
    
    for var in env_vars:
        value = os.environ.get(var, 'Tanımlanmamış')
        print(f"  {var}: {value}")

def main():
    """Ana test fonksiyonu"""
    print("SolidWorks COM Automation Test Script")
    print("=" * 50)
    
    all_passed = True
    
    # Testleri sırasıyla çalıştır
    tests = [
        ("Python Sürümü", check_python_version),
        ("Bağımlılıklar", check_dependencies),
        ("SolidWorks Kurulumu", check_solidworks_installation),
        ("Wrapper Fonksiyonalitesi", test_wrapper_functionality)
    ]
    
    for test_name, test_func in tests:
        try:
            if not test_func():
                all_passed = False
        except Exception as e:
            print(f"❌ {test_name} test hatası: {str(e)}")
            all_passed = False
    
    # Ortam bilgileri
    print_environment_info()
    
    # Test ortamı oluştur
    temp_dir, screenshot_dir = create_test_environment()
    
    # Sonuç
    print("\n" + "=" * 50)
    if all_passed:
        print("🎉 Tüm testler başarılı! SolidWorks COM automation kullanıma hazır.")
        print(f"\nTest için örnek komut:")
        print(f"python solidworks_wrapper.py \"C:\\path\\to\\model.sldprt\" \"{screenshot_dir}\\test.png\"")
    else:
        print("❌ Bazı testler başarısız. Yukarıdaki hataları düzeltin.")
        return 1
    
    return 0

if __name__ == "__main__":
    try:
        exit_code = main()
        sys.exit(exit_code)
    except KeyboardInterrupt:
        print("\n\nTest kullanıcı tarafından iptal edildi.")
        sys.exit(2)
    except Exception as e:
        print(f"\nBeklenmeyen test hatası: {str(e)}")
        sys.exit(1)