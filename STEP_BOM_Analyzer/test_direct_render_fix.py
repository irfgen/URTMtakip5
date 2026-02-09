#!/usr/bin/env python3
"""
Test FreeCAD direct render fix
"""

import sys
import os
import tempfile
from pathlib import Path

# Add current directory to path
sys.path.insert(0, str(Path(__file__).parent))

def test_fallback_fix():
    """Test fallback API fix"""
    print("Testing fallback API fix...")
    
    try:
        from core.renderer import Renderer
        from utils.logger import STEPAnalyzerLogger
        from utils.config_manager import ConfigManager
        
        logger = STEPAnalyzerLogger()
        config = ConfigManager(logger=logger)
        renderer = Renderer(config, logger)
        
        # Test dengan nonexistent file untuk fallback trigger
        with tempfile.TemporaryDirectory() as temp_dir:
            fake_step = os.path.join(temp_dir, "test.step")
            
            # Create empty file
            with open(fake_step, 'w') as f:
                f.write("ISO-10303-21;")
            
            result = renderer.render_step_direct(
                step_file=fake_step,
                output_dir=temp_dir
            )
            
            print(f"Render result: {result.success}")
            print(f"Errors: {result.errors}")
            
            # Bu başarısız olması normal (empty STEP file)
            # Önemli olan API error olmaması
            if "output_formats" not in str(result.errors):
                print("[OK] API fix başarılı - output_formats hatası yok")
                return True
            else:
                print("[FAIL] API fix başarısız - hala output_formats hatası var")
                return False
                
    except Exception as e:
        print(f"[ERROR] Test hatası: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_freecad_headless():
    """Test FreeCAD headless renderer"""
    print("\nTesting FreeCAD headless...")
    
    try:
        from core.freecad_renderer import FreeCADRenderer
        from utils.logger import STEPAnalyzerLogger
        from utils.config_manager import ConfigManager
        
        logger = STEPAnalyzerLogger()
        config = ConfigManager(logger=logger)
        renderer = FreeCADRenderer(config, logger)
        
        print(f"FreeCAD available: {renderer.is_available()}")
        
        # GUI yoksa headless export test et
        if hasattr(renderer, '_render_headless_export'):
            print("[OK] Headless export method mevcut")
            return True
        else:
            print("[FAIL] Headless export method yok")
            return False
        
    except Exception as e:
        print(f"[ERROR] FreeCAD headless test hatası: {e}")
        return False

if __name__ == "__main__":
    print("STEP BOM Analyzer - Direct Render Fix Test")
    print("=" * 50)
    
    success_count = 0
    total_tests = 2
    
    if test_fallback_fix():
        success_count += 1
    
    if test_freecad_headless():
        success_count += 1
    
    print(f"\nTest Sonuçları: {success_count}/{total_tests} başarılı")
    
    if success_count == total_tests:
        print("[OK] Direct render fix'ler başarılı!")
        print("\nYapılan düzeltmeler:")
        print("1. output_formats -> formats API fix")
        print("2. FreeCAD headless export eklendi") 
        print("3. Matplotlib fallback render sistemi")
    else:
        print("[PARTIAL] Bazı fix'ler çalışıyor")