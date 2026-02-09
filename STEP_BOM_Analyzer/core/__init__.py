"""
STEP BOM Analyzer - Core Modules
v3.0.0 FreeCAD Native Edition

Bu modül FreeCAD Native STEP BOM Analyzer'ın core bileşenlerini içerir.
"""

from .freecad_macro_manager import FreeCADMacroManager, MacroResult
from .freecad_processor import FreeCADProcessor, ProcessingResult
from .bom_analyzer import BOMAnalyzer, BOMStatistics, PartInfo
from .report_generator import ReportGenerator, ReportConfig

__version__ = "3.0.0"
__title__ = "STEP BOM Analyzer Core"
__author__ = "ÜRTM Takip Ekibi"

__all__ = [
    # Macro Management
    "FreeCADMacroManager",
    "MacroResult",
    
    # Processing Engine
    "FreeCADProcessor", 
    "ProcessingResult",
    
    # BOM Analysis
    "BOMAnalyzer",
    "BOMStatistics",
    "PartInfo",
    
    # Report Generation
    "ReportGenerator",
    "ReportConfig"
]

def get_version_info():
    """Versiyon bilgilerini döndür"""
    return {
        "version": __version__,
        "title": __title__,
        "author": __author__,
        "architecture": "FreeCAD Native",
        "supported_formats": ["STEP", "STP"],
        "export_formats": ["HTML", "JSON", "CSV", "PNG"]
    }

def test_all_modules():
    """Tüm core modülleri test et"""
    print("🧪 STEP BOM Analyzer Core Modules Test")
    print("=" * 60)
    
    try:
        # Version info
        version_info = get_version_info()
        print(f"📋 Version: {version_info['version']}")
        print(f"🏗️  Architecture: {version_info['architecture']}")
        print()
        
        # Test FreeCAD Macro Manager
        print("1️⃣  Testing FreeCAD Macro Manager...")
        try:
            manager = FreeCADMacroManager()
            test_result = manager.test_freecad_installation()
            if test_result.success:
                print("   ✅ FreeCAD Macro Manager: OK")
            else:
                print("   ⚠️  FreeCAD Macro Manager: Warning - FreeCAD kurulumu kontrol edin")
        except Exception as e:
            print(f"   ❌ FreeCAD Macro Manager: {e}")
        
        # Test FreeCAD Processor
        print("\n2️⃣  Testing FreeCAD Processor...")
        try:
            processor = FreeCADProcessor()
            processor_info = processor.get_processor_info()
            print(f"   ✅ FreeCAD Processor: OK - {processor_info['processor_type']}")
        except Exception as e:
            print(f"   ❌ FreeCAD Processor: {e}")
        
        # Test BOM Analyzer
        print("\n3️⃣  Testing BOM Analyzer...")
        try:
            analyzer = BOMAnalyzer()
            print("   ✅ BOM Analyzer: OK")
        except Exception as e:
            print(f"   ❌ BOM Analyzer: {e}")
        
        # Test Report Generator
        print("\n4️⃣  Testing Report Generator...")
        try:
            generator = ReportGenerator("test_temp")
            print("   ✅ Report Generator: OK")
        except Exception as e:
            print(f"   ❌ Report Generator: {e}")
        
        print("\n" + "=" * 60)
        print("✅ Core Modules Test Completed!")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Test hatası: {e}")
        return False

if __name__ == "__main__":
    test_all_modules()