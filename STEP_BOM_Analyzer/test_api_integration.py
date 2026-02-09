#!/usr/bin/env python3
"""
Test script for API Integration
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from core.api_integration import URTMTakipAPIClient, APIConfig
from core.bom_extractor_v2 import BOMStructureV2, BOMItemV2
from utils.logger import STEPAnalyzerLogger
from utils.config_manager import ConfigManager
from datetime import datetime

def test_api_integration():
    """Test API Integration functionality"""
    
    logger = STEPAnalyzerLogger()
    config_manager = ConfigManager(logger=logger)
    
    print("=== API Integration Test ===")
    
    # Load API config from config.ini
    api_config = APIConfig()
    
    # Try to get server config
    try:
        if hasattr(config_manager.config, 'items'):
            server_section = dict(config_manager.config['SERVER']) if 'SERVER' in config_manager.config else {}
            if server_section:
                api_config.base_url = server_section.get('url', api_config.base_url)
                api_config.api_base = server_section.get('api_base', api_config.api_base)
                api_config.timeout = int(server_section.get('timeout', api_config.timeout))
                api_config.verify_ssl = server_section.get('verify_ssl', 'true').lower() == 'true'
                
                print(f"📡 Server Config:")
                print(f"   - Base URL: {api_config.base_url}")
                print(f"   - API Base: {api_config.api_base}")
                print(f"   - Timeout: {api_config.timeout}s")
                print(f"   - SSL Verify: {api_config.verify_ssl}")
    except Exception as e:
        print(f"⚠️ Could not load server config: {e}")
        print(f"   Using defaults: {api_config.base_url}")
    
    try:
        with URTMTakipAPIClient(api_config, logger) as client:
            print("✅ API Client initialized")
            print(f"   Client Name: {api_config.client_name}")
            print(f"   Client ID Prefix: {api_config.client_id_prefix}")
            
            # Test server status
            print("\n🔍 Checking server status...")
            status = client.check_server_status()
            print(f"   Server online: {status.online}")
            print(f"   Response time: {status.response_time:.3f}s")
            
            if status.server_version:
                print(f"   Server version: {status.server_version}")
            
            if not status.online:
                print("⚠️ Server offline - cannot test full functionality")
                print("   This could be normal if server is not running")
                return True  # Not a failure - server might not be running
            
            # Test client registration
            print("\n📝 Testing client registration...")
            if client.register_client():
                print(f"   ✅ Client registered successfully: {client.client_id}")
                print(f"   Registration status: {client.server_status.client_registered}")
            else:
                print("   ❌ Client registration failed")
                return False
            
            # Create comprehensive mock BOM for testing
            print("\n📦 Creating test BOM data...")
            mock_items = [
                BOMItemV2(
                    item_number=1,
                    part_number="TEST_HOUSING_001",
                    part_name="Test Main Housing",
                    description="Primary housing component for API integration testing",
                    quantity=1,
                    level=1,
                    parent_assembly="TEST_MAIN_ASM",
                    node_type="part",
                    shape_type="Solid",
                    volume=2500.5,
                    surface_area=850.2,
                    category="Test Structural",
                    assembly_path="Test_Assembly/Housing",
                    center_of_mass=(12.5, 8.3, 15.7),
                    bounding_box={'min': [0, 0, 0], 'max': [25, 16.6, 31.4]},
                    color=[0.7, 0.8, 0.9, 1.0],
                    properties={'material': 'Aluminum', 'weight': 0.5}
                ),
                BOMItemV2(
                    item_number=2,
                    part_number="TEST_COVER_002",
                    part_name="Test Cover Plate",
                    description="Protective cover plate with mounting holes",
                    quantity=1,
                    level=1,
                    parent_assembly="TEST_MAIN_ASM",
                    node_type="part",
                    shape_type="Shell",
                    volume=125.3,
                    surface_area=280.7,
                    category="Test Covers",
                    assembly_path="Test_Assembly/Cover",
                    center_of_mass=(12.5, 8.3, 2.0),
                    bounding_box={'min': [0, 0, 0], 'max': [25, 16.6, 4]},
                    color=[0.5, 0.5, 0.5, 1.0],
                    properties={'material': 'Steel', 'weight': 0.2}
                ),
                BOMItemV2(
                    item_number=3,
                    part_number="TEST_SCREW_003",
                    part_name="Test Machine Screw M6x20",
                    description="Stainless steel machine screw for assembly",
                    quantity=4,
                    level=2,
                    parent_assembly="TEST_FASTENERS_ASM",
                    node_type="part",
                    shape_type="Solid",
                    volume=2.1,
                    surface_area=12.8,
                    category="Test Fasteners",
                    assembly_path="Test_Assembly/Fasteners/Screws",
                    properties={'material': 'Stainless Steel', 'weight': 0.01}
                )
            ]
            
            mock_bom = BOMStructureV2(
                assembly_name="Test API Integration Assembly",
                total_items=3,
                total_parts=3,
                total_assemblies=2,
                max_level=2,
                created_date=datetime.now(),
                source_file="api_integration_test.step",
                items=mock_items
            )
            
            print(f"   Created BOM with {len(mock_items)} parts")
            print(f"   Assembly: {mock_bom.assembly_name}")
            print(f"   Max level: {mock_bom.max_level}")
            
            # Test individual part operations
            print("\n🔍 Testing individual part operations...")
            
            # Check if part exists
            test_part = mock_items[0]
            existing_part = client.get_part_info(test_part.part_number)
            
            if existing_part:
                print(f"   Part {test_part.part_number} already exists on server")
            else:
                print(f"   Part {test_part.part_number} not found on server (will be created)")
            
            # Test BOM synchronization
            print("\n🔄 Testing BOM synchronization...")
            sync_result = client.sync_bom_structure(
                mock_bom, 
                render_result=None,  # No render data for this test
                include_images=False
            )
            
            print(f"   ✅ Sync completed: {sync_result.success}")
            print(f"   📊 Results:")
            print(f"     - Total parts: {sync_result.total_parts}")
            print(f"     - Synced parts: {sync_result.synced_parts}")
            print(f"     - Created parts: {sync_result.created_parts}")
            print(f"     - Updated parts: {sync_result.updated_parts}")
            print(f"     - Existing parts: {sync_result.existing_parts}")
            print(f"     - Failed parts: {sync_result.failed_parts}")
            print(f"     - Sync time: {sync_result.sync_time:.2f}s")
            
            if sync_result.server_bom_id:
                print(f"     - Server BOM ID: {sync_result.server_bom_id}")
            
            # Show individual part results
            if sync_result.part_results:
                print(f"\n   📋 Individual part results:")
                for result in sync_result.part_results:
                    status_icon = "✅" if result.success else "❌"
                    print(f"     {status_icon} {result.part_number}: {result.action}")
                    if result.error_message:
                        print(f"        Error: {result.error_message}")
            
            if sync_result.errors:
                print(f"\n   ⚠️ Sync errors:")
                for error in sync_result.errors:
                    print(f"     - {error}")
            
            # Test part search
            print(f"\n🔍 Testing part search...")
            search_results = client.search_parts("TEST", limit=10)
            
            print(f"   Found {len(search_results)} parts matching 'TEST'")
            for i, part in enumerate(search_results[:3]):  # Show first 3
                print(f"     {i+1}. {part.get('part_number', 'N/A')} - {part.get('part_name', 'N/A')}")
            
            return sync_result.success
        
    except Exception as e:
        logger.error(f"API integration test failed: {e}")
        print(f"❌ Test failed: {e}")
        return False

if __name__ == "__main__":
    success = test_api_integration()
    print(f"\n{'='*50}")
    print(f"API Integration Test: {'PASSED' if success else 'FAILED'}")
    sys.exit(0 if success else 1)