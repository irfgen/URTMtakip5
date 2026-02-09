#!/usr/bin/env python3
"""
Test script for new FreeCAD STEP Processor
"""

import os
import sys
import time
from pathlib import Path

# Add current directory to path
sys.path.insert(0, str(Path(__file__).parent))

from utils.logger import STEPAnalyzerLogger
from utils.config_manager import ConfigManager
from core.freecad_step_processor import FreeCADStepProcessor

def test_new_processor():
    """Test new FreeCAD STEP processor"""
    print("=== FreeCAD STEP Processor Test ===")
    
    # Setup logger and config
    logger = STEPAnalyzerLogger()
    config = ConfigManager(logger=logger)
    
    # Test file
    test_file = Path("22322.stp")
    if not test_file.exists():
        logger.error(f"Test file not found: {test_file}")
        return False
    
    logger.info(f"Testing with file: {test_file} ({test_file.stat().st_size / (1024*1024):.1f} MB)")
    
    try:
        # Create processor
        with FreeCADStepProcessor(config, logger) as processor:
            logger.info("Starting STEP import...")
            start_time = time.time()
            
            # Import STEP file
            result = processor.import_step_file(str(test_file))
            
            end_time = time.time()
            
            # Print results
            print(f"\n=== IMPORT RESULTS ===")
            print(f"Success: {result.success}")
            print(f"Import Time: {result.import_time:.2f}s")
            print(f"Total Parts: {result.total_parts}")
            print(f"Total Assemblies: {result.total_assemblies}")
            print(f"Max Hierarchy Depth: {result.max_hierarchy_depth}")
            
            if result.errors:
                print(f"Errors: {result.errors}")
            
            if result.warnings:
                print(f"Warnings: {result.warnings}")
            
            if result.success and result.all_parts:
                print(f"\n=== SAMPLE PARTS ===")
                for i, part in enumerate(result.all_parts[:5]):  # First 5 parts
                    print(f"Part {i+1}: {part.label}")
                    print(f"  - Part Number: {part.part_number}")
                    print(f"  - Shape Type: {part.shape_type}")
                    print(f"  - Volume: {part.volume:.2f}")
                    print(f"  - Surface Area: {part.surface_area:.2f}")
                    print(f"  - Bounding Box: {part.bounding_box.get('x_length', 0):.2f} x {part.bounding_box.get('y_length', 0):.2f} x {part.bounding_box.get('z_length', 0):.2f}")
                    print("")
            
            # Get statistics
            if result.success:
                stats = processor.get_assembly_statistics(result)
                print(f"=== STATISTICS ===")
                print(f"Parts by Type: {stats['parts_by_type']}")
                if stats.get('volume_stats'):
                    vol_stats = stats['volume_stats']
                    print(f"Total Volume: {vol_stats['total']:.2f}")
                    print(f"Average Volume: {vol_stats['average']:.2f}")
            
            return result.success
    
    except Exception as e:
        logger.error(f"Test failed: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return False

if __name__ == "__main__":
    success = test_new_processor()
    sys.exit(0 if success else 1)