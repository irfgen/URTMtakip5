#!/usr/bin/env python3
"""
Test script for complete Workflow Orchestrator
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from core.workflow_orchestrator import (
    WorkflowOrchestrator, WorkflowConfig, WorkflowPhase, 
    run_step_bom_analysis
)
from utils.logger import STEPAnalyzerLogger
from utils.config_manager import ConfigManager

def progress_callback(phase: WorkflowPhase, progress: float, message: str):
    """Progress callback for workflow"""
    phase_name = phase.value.replace('_', ' ').title()
    bar_length = 20
    filled_length = int(bar_length * progress)
    bar = '█' * filled_length + '░' * (bar_length - filled_length)
    print(f"   [{phase_name:<20}] {bar} {progress*100:5.1f}% - {message}")

def test_workflow():
    """Test complete workflow"""
    
    logger = STEPAnalyzerLogger()
    config = ConfigManager(logger=logger)
    
    print("=== Complete STEP BOM Analysis Workflow Test ===")
    
    # Look for available STEP files
    step_files = [
        "22322.stp",
        "test.step", 
        "sample.stp",
        "example.step"
    ]
    
    step_file = None
    for filename in step_files:
        if os.path.exists(filename):
            step_file = filename
            break
    
    if not step_file:
        print("⚠️ No STEP file found for full workflow testing")
        print("   Available files:", [f for f in os.listdir('.') if f.endswith(('.step', '.stp'))])
        print("   Testing orchestrator initialization only...")
        
        try:
            with WorkflowOrchestrator(config, logger) as orchestrator:
                print("✅ Workflow Orchestrator initialized successfully")
                print("   All core modules can be imported and initialized")
            return True
        except Exception as e:
            print(f"❌ Orchestrator initialization failed: {e}")
            return False
    
    # Full workflow test with actual STEP file
    print(f"📄 Testing with STEP file: {step_file} ({os.path.getsize(step_file)/1024/1024:.1f} MB)")
    
    try:
        # Test complete workflow
        print("\n🚀 Starting complete 7-phase workflow...")
        
        result = run_step_bom_analysis(
            step_file_path=step_file,
            output_directory="./test_full_workflow_output",
            config=config,
            logger=logger,
            progress_callback=progress_callback
        )
        
        print(f"\n{'='*60}")
        print(f"🏁 Workflow Result: {'SUCCESS' if result.success else 'FAILED'}")
        print(f"{'='*60}")
        
        # Summary statistics
        print(f"⏱️  Total Duration: {result.total_duration:.2f}s")
        print(f"✅ Completed Phases: {len(result.completed_phases)}/{len(WorkflowPhase)}")
        print(f"❌ Failed Phases: {len(result.failed_phases)}")
        print(f"📁 Output Files: {len(result.output_files)}")
        
        # Phase details
        print(f"\n📋 Phase Results:")
        for phase in WorkflowPhase:
            if phase in result.phase_results:
                phase_result = result.phase_results[phase]
                status = "✅" if phase_result.success else "❌"
                print(f"   {status} {phase.value:<25} ({phase_result.duration:6.2f}s)")
                if phase_result.errors:
                    for error in phase_result.errors[:2]:  # Show first 2 errors
                        print(f"        Error: {error}")
            else:
                print(f"   ⏭️  {phase.value:<25} (skipped)")
        
        # Final results
        if result.bom_structure:
            print(f"\n📦 BOM Results:")
            print(f"   - Assembly: {result.bom_structure.assembly_name}")
            print(f"   - Parts: {result.bom_structure.total_parts}")
            print(f"   - Assemblies: {result.bom_structure.total_assemblies}")
            print(f"   - Max Level: {result.bom_structure.max_level}")
        
        if result.render_result:
            print(f"\n🎨 Rendering Results:")
            print(f"   - Total Images: {result.render_result.total_images}")
            print(f"   - Successful Renders: {result.render_result.successful_renders}")
            print(f"   - Failed Renders: {result.render_result.failed_renders}")
            print(f"   - Render Time: {result.render_result.total_time:.2f}s")
        
        if result.report_result:
            print(f"\n📊 Report Results:")
            print(f"   - Generated Reports: {len(result.report_result.report_files)}")
            for report_file in result.report_result.report_files:
                file_name = os.path.basename(report_file)
                file_size = result.report_result.file_sizes.get(file_name, 0)
                print(f"     - {file_name} ({file_size:,} bytes)")
        
        if result.sync_result:
            print(f"\n🔄 Server Sync Results:")
            print(f"   - Synced Parts: {result.sync_result.synced_parts}")
            print(f"   - Created: {result.sync_result.created_parts}")
            print(f"   - Updated: {result.sync_result.updated_parts}")
            print(f"   - Existing: {result.sync_result.existing_parts}")
        
        # Output file details
        if result.output_files:
            print(f"\n📁 Generated Output Files:")
            output_dir = os.path.dirname(result.output_files[0]) if result.output_files else ""
            print(f"   Output Directory: {output_dir}")
            
            file_types = {}
            total_size = 0
            for file_path in result.output_files:
                ext = os.path.splitext(file_path)[1]
                size = os.path.getsize(file_path) if os.path.exists(file_path) else 0
                file_types[ext] = file_types.get(ext, 0) + 1
                total_size += size
            
            print(f"   File Types: {dict(file_types)}")
            print(f"   Total Size: {total_size/1024:.1f} KB")
        
        # Errors and warnings
        if result.errors:
            print(f"\n⚠️  Errors ({len(result.errors)}):")
            for i, error in enumerate(result.errors[:5]):  # Show first 5
                print(f"   {i+1}. {error}")
            if len(result.errors) > 5:
                print(f"   ... and {len(result.errors)-5} more errors")
        
        if result.warnings:
            print(f"\n⚠️  Warnings ({len(result.warnings)}):")
            for i, warning in enumerate(result.warnings[:3]):  # Show first 3  
                print(f"   {i+1}. {warning}")
            if len(result.warnings) > 3:
                print(f"   ... and {len(result.warnings)-3} more warnings")
        
        return result.success
        
    except Exception as e:
        logger.error(f"Full workflow test failed: {e}")
        print(f"❌ Workflow test failed: {e}")
        import traceback
        print(f"   Traceback: {traceback.format_exc()}")
        return False

if __name__ == "__main__":
    success = test_workflow()
    print(f"\n{'='*60}")
    print(f"Complete Workflow Test: {'PASSED' if success else 'FAILED'}")
    sys.exit(0 if success else 1)