#!/usr/bin/env python3
"""
Test script for Visual BOM Generator
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from core.visual_bom_generator import VisualBOMGenerator, BOMReportConfig
from core.bom_extractor_v2 import BOMStructureV2, BOMItemV2
from utils.logger import STEPAnalyzerLogger
from utils.config_manager import ConfigManager
from datetime import datetime

def test_visual_bom():
    """Test Visual BOM Generator functionality"""
    
    logger = STEPAnalyzerLogger()
    config = ConfigManager(logger=logger)
    
    print("=== Visual BOM Generator Test ===")
    
    try:
        generator = VisualBOMGenerator(config, logger)
        print("✅ Visual BOM Generator initialized")
        
        # Create comprehensive mock BOM data
        items = [
            BOMItemV2(
                item_number=1,
                part_number="HOUSING_001",
                part_name="Main Housing",
                description="Primary structural housing component made of aluminum",
                quantity=1,
                level=1,
                parent_assembly="ASM_MAIN",
                node_type="part",
                shape_type="Solid",
                volume=2500.5,
                surface_area=850.2,
                category="Structural",
                assembly_path="Main_Assembly/Housing"
            ),
            BOMItemV2(
                item_number=2,
                part_number="COVER_002",
                part_name="Top Cover",
                description="Protective top cover with ventilation holes",
                quantity=1,
                level=1,
                parent_assembly="ASM_MAIN",
                node_type="part",
                shape_type="Shell",
                volume=125.3,
                surface_area=280.7,
                category="Covers",
                assembly_path="Main_Assembly/Cover"
            ),
            BOMItemV2(
                item_number=3,
                part_number="BRACKET_003",
                part_name="Mounting Bracket",
                description="Steel mounting bracket for wall installation",
                quantity=2,
                level=2,
                parent_assembly="ASM_MOUNTING",
                node_type="part",
                shape_type="Solid",
                volume=75.8,
                surface_area=156.4,
                category="Fasteners",
                assembly_path="Main_Assembly/Mounting_System/Bracket"
            ),
            BOMItemV2(
                item_number=4,
                part_number="GASKET_004",
                part_name="Sealing Gasket",
                description="Rubber gasket for weatherproofing",
                quantity=1,
                level=1,
                parent_assembly="ASM_MAIN",
                node_type="part",
                shape_type="Face",
                volume=15.2,
                surface_area=85.6,
                category="Seals",
                assembly_path="Main_Assembly/Gasket"
            ),
            BOMItemV2(
                item_number=5,
                part_number="SCREW_005",
                part_name="Machine Screw M6x20",
                description="Stainless steel machine screw",
                quantity=8,
                level=2,
                parent_assembly="ASM_FASTENERS",
                node_type="part",
                shape_type="Solid",
                volume=2.1,
                surface_area=12.8,
                category="Fasteners",
                assembly_path="Main_Assembly/Fasteners/Screws"
            )
        ]
        
        bom_structure = BOMStructureV2(
            assembly_name="Industrial Control Unit",
            total_items=5,
            total_parts=5,
            total_assemblies=2,
            max_level=2,
            created_date=datetime.now(),
            source_file="industrial_control_unit.step",
            items=items
        )
        
        print(f"📦 Created mock BOM with {len(items)} parts, {bom_structure.max_level} levels")
        
        # Configure comprehensive report
        report_config = BOMReportConfig(
            title="Industrial Control Unit - Bill of Materials",
            company="ÜRTM Takip Manufacturing",
            project_name="Industrial_Control_Unit",
            revision="Rev-A",
            formats=["html"],
            include_images=False,  # No real images for test
            include_thumbnails=False,
            include_part_details=True,
            include_geometry_info=True,
            include_assembly_tree=True,
            include_statistics=True,
            show_quantities=True,
            show_part_numbers=True,
            show_descriptions=True,
            group_by_category=True,
            table_style="modern"
        )
        
        print("🎨 Generating comprehensive visual BOM report...")
        result = generator.generate_visual_bom(
            bom_structure, None, "./test_output/bom_reports", report_config
        )
        
        print(f"✅ Report generation completed: {result.success}")
        print(f"📊 Results:")
        print(f"   - Total parts processed: {result.total_parts}")
        print(f"   - Total assemblies: {result.total_assemblies}")
        print(f"   - Generation time: {result.generation_time:.2f}s")
        
        print(f"📁 Generated files:")
        for file_path in result.report_files:
            file_name = os.path.basename(file_path)
            file_size = result.file_sizes.get(file_name, 0)
            print(f"   - {file_name} ({file_size:,} bytes)")
        
        if result.errors:
            print("⚠️  Errors encountered:")
            for error in result.errors:
                print(f"   - {error}")
        
        # Verify files exist
        print("\n🔍 File verification:")
        for file_path in result.report_files:
            if os.path.exists(file_path):
                print(f"   ✅ {os.path.basename(file_path)} - exists")
            else:
                print(f"   ❌ {os.path.basename(file_path)} - missing")
        
        return result.success
        
    except Exception as e:
        logger.error(f"Visual BOM Generator test failed: {e}")
        print(f"❌ Test failed: {e}")
        return False

if __name__ == "__main__":
    success = test_visual_bom()
    sys.exit(0 if success else 1)