#!/usr/bin/env python3
"""
Test script to verify render workflow fixes
"""

import sys
import os
from pathlib import Path
import tempfile

# Add current directory to path
sys.path.insert(0, str(Path(__file__).parent))

from core.renderer import Renderer, RenderResult, RenderSettings
from utils.logger import STEPAnalyzerLogger
from utils.config_manager import ConfigManager

def test_render_result_detection():
    """Test that RenderResult success detection works correctly"""
    
    print("Testing RenderResult success detection...")
    
    # Test successful render result
    success_result = RenderResult(
        success=True,
        mesh_file="test.stl", 
        output_images=["image1.png", "image2.png"],
        render_time=1.5
    )
    
    # Test failed render result  
    failed_result = RenderResult(
        success=False,
        mesh_file="test.stl",
        output_images=[],
        render_time=1.0,
        errors=["Test error"]
    )
    
    print(f"Success result evaluates to: {bool(success_result)}")
    print(f"Success result.success: {success_result.success}")
    print(f"Failed result evaluates to: {bool(failed_result)}")
    print(f"Failed result.success: {failed_result.success}")
    
    # Test the fixed logic
    if success_result and success_result.success:
        print("[OK] Success result properly detected")
    else:
        print("[FAIL] Success result detection failed")
        
    if failed_result and failed_result.success:
        print("[FAIL] Failed result incorrectly detected as success")
    else:
        print("[OK] Failed result properly detected")

def test_placeholder_render():
    """Test placeholder render functionality"""
    
    print("\nTesting placeholder render...")
    
    try:
        logger = STEPAnalyzerLogger()
        config = ConfigManager(logger=logger)
        renderer = Renderer(config, logger)
        
        # Create temp directory for test
        with tempfile.TemporaryDirectory() as temp_dir:
            print(f"Testing placeholder render in: {temp_dir}")
            
            # Test basic render functionality
            result = renderer.render_mesh(
                mesh_file="nonexistent.stl",  # This should fail
                output_dir=temp_dir
            )
            
            print(f"Render result success: {result.success}")
            print(f"Render result errors: {result.errors}")
            
            # This should fail since file doesn't exist, which is expected
            if not result.success:
                print("[OK] Render correctly failed for nonexistent file")
            else:
                print("[FAIL] Render unexpectedly succeeded")
        
    except Exception as e:
        print(f"[FAIL] Placeholder render test failed: {e}")

if __name__ == "__main__":
    print("STEP BOM Analyzer - Render Fix Test")
    print("=" * 50)
    
    test_render_result_detection()
    test_placeholder_render()
    
    print("\nTest completed!")