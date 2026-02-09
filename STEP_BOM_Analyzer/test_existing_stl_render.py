#!/usr/bin/env python3
"""
Test existing STL files rendering
"""

import sys
import os
import glob
from pathlib import Path

# Add current directory to path
sys.path.insert(0, str(Path(__file__).parent))

def test_existing_stl_render():
    """Test render with existing STL files"""
    print("Testing with existing STL files...")
    
    # STL dosyalarının bulunduğu dizin
    stl_dir = "C:/Users/irfan/OneDrive/Belgeler/Projeler/_CAD/Yeni klasör"
    
    if not os.path.exists(stl_dir):
        print(f"[FAIL] STL directory not found: {stl_dir}")
        return False
    
    # STL dosyalarını bul
    stl_files = glob.glob(os.path.join(stl_dir, "*.stl"))
    print(f"[INFO] Found {len(stl_files)} STL files")
    
    if not stl_files:
        print("[FAIL] No STL files found")
        return False
    
    # İlk birkaç STL dosyasını test et
    test_files = stl_files[:3]  # İlk 3 dosya
    
    try:
        from core.freecad_renderer import FreeCADRenderer
        from utils.logger import STEPAnalyzerLogger
        from utils.config_manager import ConfigManager
        
        logger = STEPAnalyzerLogger()
        config = ConfigManager(logger=logger)
        renderer = FreeCADRenderer(config, logger)
        
        output_dir = "test_stl_renders"
        os.makedirs(output_dir, exist_ok=True)
        
        success_count = 0
        
        for i, stl_file in enumerate(test_files):
            print(f"\n[TEST {i+1}] Testing STL: {Path(stl_file).name}")
            
            try:
                # STL dosya boyutunu kontrol et
                file_size = os.path.getsize(stl_file)
                print(f"  File size: {file_size} bytes")
                
                if file_size < 100:
                    print(f"  [SKIP] File too small")
                    continue
                
                # Render test
                images = renderer._render_stl_with_matplotlib(
                    stl_file, Path(output_dir), part_index=i
                )
                
                if images:
                    print(f"  [OK] Generated {len(images)} images:")
                    for img in images:
                        img_size = os.path.getsize(img)
                        print(f"    - {Path(img).name} ({img_size} bytes)")
                    success_count += 1
                else:
                    print(f"  [FAIL] No images generated")
                    
            except Exception as stl_error:
                print(f"  [ERROR] STL render failed: {stl_error}")
                continue
        
        print(f"\n[SUMMARY] Successfully rendered {success_count}/{len(test_files)} STL files")
        return success_count > 0
        
    except Exception as e:
        print(f"[ERROR] Test setup failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def inspect_stl_file():
    """Inspect STL file structure"""
    print("\nInspecting STL file structure...")
    
    stl_dir = "C:/Users/irfan/OneDrive/Belgeler/Projeler/_CAD/Yeni klasör"
    stl_files = glob.glob(os.path.join(stl_dir, "*.stl"))
    
    if not stl_files:
        print("[FAIL] No STL files to inspect")
        return False
    
    # İlk dosyayı incele
    test_file = stl_files[0]
    print(f"Inspecting: {Path(test_file).name}")
    
    try:
        import struct
        
        with open(test_file, 'rb') as f:
            # Header
            header = f.read(80)
            print(f"Header: {header[:20]}...")
            
            # Triangle count
            triangle_data = f.read(4)
            if len(triangle_data) == 4:
                triangle_count = struct.unpack('<I', triangle_data)[0]
                print(f"Triangle count: {triangle_count}")
                
                if triangle_count > 0:
                    # İlk triangle'ı oku
                    normal = struct.unpack('<fff', f.read(12))
                    v1 = struct.unpack('<fff', f.read(12))
                    v2 = struct.unpack('<fff', f.read(12)) 
                    v3 = struct.unpack('<fff', f.read(12))
                    attr = f.read(2)
                    
                    print(f"First triangle:")
                    print(f"  Normal: {normal}")
                    print(f"  V1: {v1}")
                    print(f"  V2: {v2}")
                    print(f"  V3: {v3}")
                    
                    return True
            
    except Exception as e:
        print(f"[ERROR] STL inspection failed: {e}")
        return False
    
    return False

if __name__ == "__main__":
    print("STEP BOM Analyzer - STL Render Test")
    print("=" * 50)
    
    inspect_ok = inspect_stl_file()
    render_ok = test_existing_stl_render()
    
    print(f"\nResults:")
    print(f"- STL inspection: {'OK' if inspect_ok else 'FAIL'}")
    print(f"- STL rendering: {'OK' if render_ok else 'FAIL'}")
    
    if inspect_ok and render_ok:
        print("\n[SUCCESS] STL rendering system works!")
    else:
        print("\n[ISSUE] Problems detected in STL processing")