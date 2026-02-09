#!/usr/bin/env python
"""
STEP BOM Analyzer GUI Başlatıcı
Windows için FreeCAD entegrasyonu ile
"""

import sys
import os
from pathlib import Path

def setup_freecad_path():
    """FreeCAD Python modüllerini sys.path'e ekle"""
    possible_paths = [
        r"C:\Program Files\FreeCAD 1.0\bin",
        r"C:\Program Files\FreeCAD 1.0\Mod",
        r"C:\Program Files\FreeCAD 0.21\bin",
        r"C:\Program Files\FreeCAD 0.21\Mod", 
        r"C:\Program Files\FreeCAD 0.20\bin",
        r"C:\Program Files\FreeCAD 0.20\Mod",
        r"C:\Program Files (x86)\FreeCAD 1.0\bin",
        r"C:\Program Files (x86)\FreeCAD 0.21\bin"
    ]
    
    added_paths = []
    for path in possible_paths:
        if os.path.exists(path) and path not in sys.path:
            sys.path.insert(0, path)
            added_paths.append(path)
    
    if added_paths:
        print(f"✅ FreeCAD yolları eklendi: {len(added_paths)} adet")
        for path in added_paths[:2]:  # İlk 2 yolu göster
            print(f"   - {path}")
    else:
        print("⚠️ FreeCAD yolları bulunamadı")

def main():
    print("🚀 STEP BOM Analyzer GUI Başlatıcı")
    print("=" * 50)
    
    # FreeCAD yollarını ayarla
    setup_freecad_path()
    
    # GUI klasörünün varlığını kontrol et
    gui_path = Path("gui")
    if not gui_path.exists():
        print("❌ GUI klasörü bulunamadı!")
        print("   Çalıştırma dizinini kontrol edin.")
        input("Çıkmak için Enter'a basın...")
        return
    
    # Workflow GUI'yi başlat
    gui_file = gui_path / "workflow_gui.py"
    if gui_file.exists():
        print("🖥️ GUI başlatılıyor...")
        try:
            # GUI modülünü import et ve çalıştır
            sys.path.insert(0, str(Path.cwd()))
            from gui.workflow_gui import main as gui_main
            gui_main()
        except Exception as e:
            print(f"❌ GUI başlatma hatası: {e}")
            print("\n🔧 Sorun giderme:")
            print("1. FreeCAD kurulumunu kontrol edin")
            print("2. Python bağımlılıklarını kurun: pip install -r requirements.txt")
            print("3. ÇALIŞTIR.bat dosyasını kullanmayı deneyin")
            input("\nÇıkmak için Enter'a basın...")
    else:
        print("❌ workflow_gui.py bulunamadı!")
        input("Çıkmak için Enter'a basın...")

if __name__ == "__main__":
    main()