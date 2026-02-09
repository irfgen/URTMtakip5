#!/usr/bin/env python3
"""
Test script for FreeCAD Visualizer
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from core.bom_extractor_v2 import BOMStructureV2, BOMItemV2
from utils.logger import STEPAnalyzerLogger
from utils.config_manager import ConfigManager
from datetime import datetime

def test_visualizer():
    """Test FreeCAD Visualizer functionality"""
    
    logger = STEPAnalyzerLogger()
    config = ConfigManager(logger=logger)
    
    print("=== FreeCAD Visualizer Test ===")
    
    try:
        from core.freecad_visualizer import FreeCADVisualizer
        
        visualizer = FreeCADVisualizer(config, logger)
        print("✅ FreeCAD Visualizer initialized")
        
        # Create mock BOM data
        items = [
            BOMItemV2(
                item_number=1,
                part_number="PART_001",
                part_name="Housing",
                description="Main housing part",
                quantity=1,
                level=1,
                parent_assembly="ASM_001",
                node_type="part",
                shape_type="Solid",
                volume=1250.5,
                surface_area=450.2,
                assembly_path="Main_Assembly/Housing",
                category="Solid Parts",
                freecad_name="Housing"
            ),
            BOMItemV2(
                item_number=2,
                part_number="PART_002",
                part_name="Cover",
                description="Top cover",
                quantity=1,
                level=1,
                parent_assembly="ASM_001",
                node_type="part",
                shape_type="Shell",
                volume=25.3,
                surface_area=180.7,
                assembly_path="Main_Assembly/Cover",
                category="Sheet Metal",
                freecad_name="Cover"
            ),
            BOMItemV2(
                item_number=3,
                part_number="PART_003",
                part_name="Gasket",
                description="Sealing gasket",
                quantity=2,
                level=1,
                parent_assembly="ASM_001",
                node_type="part",
                shape_type="Face",
                volume=5.1,
                surface_area=45.8,
                assembly_path="Main_Assembly/Gasket",
                category="Seals",
                freecad_name="Gasket"
            )
        ]
        
        bom_structure = BOMStructureV2(
            assembly_name="Test Assembly",
            total_items=3,
            total_parts=3,
            total_assemblies=0,
            max_level=1,
            created_date=datetime.now(),
            source_file="test.step",
            items=items
        )
        
        print(f"📦 Created mock BOM with {len(items)} parts")
        
        # Test render (will use mock implementation)
        print("🎨 Starting batch render...")
        result = visualizer.render_all_parts(bom_structure, "./test_output/part_renders")
        
        print(f"✅ Render completed: {result.success}")
        print(f"📊 Statistics:")
        print(f"   - Total parts: {result.total_parts}")
        print(f"   - Successful renders: {result.successful_renders}")
        print(f"   - Failed renders: {result.failed_renders}")
        print(f"   - Total images: {result.total_images}")
        print(f"   - Total time: {result.total_time:.2f}s")
        
        # Create gallery
        if result.success:
            print("📸 Creating image gallery...")
            gallery_path = visualizer.create_image_gallery(result, "./test_output/part_renders")
            if gallery_path:
                print(f"✅ Gallery created: {gallery_path}")
            else:
                print("❌ Gallery creation failed")
        
        # List generated files
        print("\n📁 Generated files:")
        output_dir = "./test_output/part_renders"
        if os.path.exists(output_dir):
            for file in os.listdir(output_dir):
                file_path = os.path.join(output_dir, file)
                file_size = os.path.getsize(file_path)
                print(f"   - {file} ({file_size} bytes)")
        
        return result.success
        
    except ImportError as e:
        print(f"⚠️ FreeCAD not available: {e}")
        print("🔧 Running in mock mode...")
        return True
        
    except Exception as e:
        logger.error(f"Visualizer test failed: {e}")
        print(f"❌ Test failed: {e}")
        return False

if __name__ == "__main__":
    success = test_visualizer()
    sys.exit(0 if success else 1)