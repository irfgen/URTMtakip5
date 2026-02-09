#!/usr/bin/env python3
"""
Test script to verify render encoding fixes
"""

import sys
import os
import tempfile
from pathlib import Path

# Add current directory to path
sys.path.insert(0, str(Path(__file__).parent))

def test_placeholder_render():
    """Test new placeholder render system"""
    
    print("Testing placeholder render system...")
    
    try:
        from gui.main_window import STEPAnalyzerMainWindow
        from utils.logger import STEPAnalyzerLogger
        from utils.config_manager import ConfigManager
        
        # Create minimal setup
        logger = STEPAnalyzerLogger()
        config = ConfigManager(logger=logger)
        
        # Create GUI instance (but don't show window)
        gui = STEPAnalyzerMainWindow(config, logger)
        
        # Test placeholder render in temp directory
        with tempfile.TemporaryDirectory() as temp_dir:
            print(f"Testing placeholder render in: {temp_dir}")
            
            # Call the new placeholder render method
            result = gui._render_placeholder(temp_dir)
            
            if result and result.success:
                print(f"[OK] Placeholder render başarılı: {len(result.output_images)} images")
                for img in result.output_images:
                    if os.path.exists(img):
                        print(f"[OK] Image oluşturuldu: {os.path.basename(img)}")
                    else:
                        print(f"[FAIL] Image dosyası bulunamadı: {img}")
                return True
            else:
                error_msg = result.errors if result and result.errors else "Unknown error"
                print(f"[FAIL] Placeholder render başarısız: {error_msg}")
                return False
                
    except Exception as e:
        print(f"[FAIL] Placeholder render test hatası: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_renderer_fallback():
    """Test renderer's new fallback loading system"""
    
    print("\nTesting renderer fallback loading...")
    
    try:
        from core.renderer import Renderer
        from utils.logger import STEPAnalyzerLogger
        from utils.config_manager import ConfigManager
        
        logger = STEPAnalyzerLogger()
        config = ConfigManager(logger=logger)
        renderer = Renderer(config, logger)
        
        # Test with nonexistent file to trigger fallback
        with tempfile.TemporaryDirectory() as temp_dir:
            fake_stl = os.path.join(temp_dir, "nonexistent.stl")
            
            result = renderer.render_mesh(
                mesh_file=fake_stl,
                output_dir=temp_dir
            )
            
            print(f"Render result success: {result.success}")
            print(f"Render result errors: {result.errors}")
            
            # This should fail gracefully with detailed error messages
            if not result.success and result.errors:
                print("[OK] Renderer correctly failed with detailed error messages")
                return True
            else:
                print("[FAIL] Renderer should have failed but didn't")
                return False
                
    except Exception as e:
        print(f"[FAIL] Renderer test hatası: {e}")
        return False

if __name__ == "__main__":
    print("STEP BOM Analyzer - Render Encoding Fix Test")
    print("=" * 55)
    
    success_count = 0
    total_tests = 2
    
    if test_placeholder_render():
        success_count += 1
    
    if test_renderer_fallback():
        success_count += 1
    
    print(f"\nTest Sonuçları: {success_count}/{total_tests} başarılı")
    
    if success_count == total_tests:
        print("[OK] Tüm testler geçti - render fix'leri çalışıyor!")
    else:
        print("[FAIL] Bazı testler başarısız - ek düzeltme gerekli")