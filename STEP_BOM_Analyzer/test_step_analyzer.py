#!/usr/bin/env python3
"""
STEP BOM Analyzer Test Script

Ana fonksiyonları test etmek için basit test script'i.
"""

import os
import sys
import time
from pathlib import Path

# Ana modülleri import et
from utils.logger import STEPAnalyzerLogger
from utils.config_manager import ConfigManager
from core.step_parser import STEPParser
from core.bom_extractor import BOMExtractor
from core.mesh_converter import MeshConverter
from core.renderer import Renderer
from core.api_client import APIClient


def test_step_parser(test_file_path):
    """STEP parser'ı test et"""
    print("\n=== STEP Parser Test ===")
    
    # Logger oluştur
    logger = STEPAnalyzerLogger()
    config_manager = ConfigManager(logger=logger)
    
    # Parser oluştur
    parser = STEPParser(config_manager.config, logger)
    
    try:
        # Parse et
        print(f"STEP dosyası parse ediliyor: {test_file_path}")
        result = parser.parse_step_file(test_file_path)
        
        if result.success:
            print(f"[OK] Parse başarılı!")
            print(f"   Parts: {result.total_parts}")
            print(f"   Assemblies: {result.total_assemblies}")
            print(f"   Max Depth: {result.max_depth}")
            print(f"   Parse Time: {result.parse_time:.2f}s")
            
            # İstatistikler
            stats = parser.get_assembly_statistics(result)
            print(f"   File Size: {stats.get('file_size_mb', 0):.2f} MB")
            
            return result
        else:
            print(f"[ERROR] Parse başarısız:")
            for error in result.errors:
                print(f"   - {error}")
            return None
            
    except Exception as e:
        print(f"[ERROR] Exception: {str(e)}")
        return None
    
    finally:
        parser.cleanup()


def test_bom_extractor(parse_result):
    """BOM extractor'ı test et"""
    print("\n=== BOM Extractor Test ===")
    
    if not parse_result or not parse_result.success:
        print("[ERROR] Parse result gerekli")
        return None
    
    # Logger oluştur
    logger = STEPAnalyzerLogger()
    config_manager = ConfigManager(logger=logger)
    
    # BOM extractor oluştur
    extractor = BOMExtractor(config_manager.config, logger)
    
    try:
        # BOM çıkar
        print("BOM çıkarılıyor...")
        bom = extractor.extract_bom(parse_result)
        
        if bom:
            print(f"[OK] BOM çıkarma başarılı!")
            print(f"   Assembly: {bom.assembly_name}")
            print(f"   Total Items: {bom.total_items}")
            print(f"   Max Level: {bom.max_level}")
            print(f"   Source: {Path(bom.source_file).name}")
            
            # İlk 5 item'ı göster
            print("   İlk 5 BOM Item:")
            for i, item in enumerate(bom.items[:5]):
                indent = "  " * item.level
                print(f"   {i+1:2d}. {indent}{item.part_name} (x{item.quantity})")
            
            if len(bom.items) > 5:
                print(f"   ... ve {len(bom.items) - 5} item daha")
            
            return bom
        else:
            print("[ERROR] BOM çıkarılamadı")
            return None
            
    except Exception as e:
        print(f"[ERROR] Exception: {str(e)}")
        return None


def test_bom_export(bom):
    """BOM export'u test et"""
    print("\n=== BOM Export Test ===")
    
    if not bom:
        print("[ERROR] BOM gerekli")
        return False
    
    # Logger oluştur
    logger = STEPAnalyzerLogger()
    config_manager = ConfigManager(logger=logger)
    
    # BOM extractor oluştur
    extractor = BOMExtractor(config_manager.config, logger)
    
    try:
        # Output dizini oluştur
        output_dir = Path("./test_output")
        output_dir.mkdir(exist_ok=True)
        
        # Export et
        print("BOM export ediliyor...")
        result = extractor.export_bom(bom, str(output_dir), formats=['json', 'csv'])
        
        if result.success:
            print(f"[OK] BOM export başarılı!")
            print(f"   Export Time: {result.export_time:.2f}s")
            print("   Oluşturulan dosyalar:")
            for file_path in result.file_paths:
                file_size = Path(file_path).stat().st_size
                print(f"   - {Path(file_path).name} ({file_size} bytes)")
            
            return True
        else:
            print(f"[ERROR] BOM export başarısız:")
            for error in result.errors:
                print(f"   - {error}")
            return False
            
    except Exception as e:
        print(f"[ERROR] Exception: {str(e)}")
        return False


def test_mesh_converter(step_file):
    """Mesh converter'ı test et"""
    print("\n=== Mesh Converter Test ===")
    
    # Logger oluştur
    logger = STEPAnalyzerLogger()
    config_manager = ConfigManager(logger=logger)
    
    # Mesh converter oluştur
    converter = MeshConverter(config_manager.config, logger)
    
    try:
        # Output dizini oluştur
        output_dir = Path("./test_output/meshes")
        output_dir.mkdir(parents=True, exist_ok=True)
        
        # Mesh'e dönüştür
        print("STEP -> Mesh conversion...")
        result = converter.convert_step_to_mesh(
            step_file, 
            str(output_dir),
            formats=['stl'],
            separate_parts=False  # Assembly olarak tek mesh
        )
        
        if result.success:
            print(f"[OK] Mesh conversion başarılı!")
            print(f"   Conversion Time: {result.conversion_time:.2f}s")
            print(f"   Output Files: {len(result.output_files)}")
            
            # Dosya bilgileri
            for file_path in result.output_files:
                file_size = Path(file_path).stat().st_size / (1024*1024)  # MB
                print(f"   - {Path(file_path).name} ({file_size:.2f} MB)")
            
            # Mesh istatistikleri
            if result.mesh_stats:
                stats = result.mesh_stats
                print(f"   Total Vertices: {stats.get('total_vertices', 0)}")
                print(f"   Total Faces: {stats.get('total_faces', 0)}")
            
            return result.output_files
        else:
            print(f"[ERROR] Mesh conversion başarısız:")
            for error in result.errors:
                print(f"   - {error}")
            return []
            
    except Exception as e:
        print(f"[ERROR] Exception: {str(e)}")
        return []


def test_renderer(mesh_files):
    """Renderer'ı test et"""
    print("\n=== Renderer Test ===")
    
    if not mesh_files:
        print("[ERROR] Mesh dosyaları gerekli")
        return []
    
    # Logger oluştur
    logger = STEPAnalyzerLogger()
    config_manager = ConfigManager(logger=logger)
    
    # Renderer oluştur
    renderer = Renderer(config_manager.config, logger)
    
    try:
        # Output dizini oluştur
        output_dir = Path("./test_output/renders")
        output_dir.mkdir(parents=True, exist_ok=True)
        
        # İlk mesh dosyasını render et
        mesh_file = mesh_files[0]
        print(f"Mesh rendering: {Path(mesh_file).name}")
        
        # Sadece birkaç viewpoint
        from core.renderer import ViewPoint
        viewpoints = [
            ViewPoint("front", (0, -3, 0), (0, 0, 0)),
            ViewPoint("isometric", (2, -2, 2), (0, 0, 0))
        ]
        
        result = renderer.render_mesh(
            mesh_file,
            str(output_dir),
            viewpoints=viewpoints
        )
        
        if result.success:
            print(f"[OK] Rendering başarılı!")
            print(f"   Render Time: {result.render_time:.2f}s")
            print(f"   Output Images: {len(result.output_images)}")
            
            # Render bilgileri
            if result.render_stats:
                stats = result.render_stats
                print(f"   Render Engine: {stats.get('render_engine')}")
                print(f"   Mesh Vertices: {stats.get('mesh_vertices', 0)}")
                print(f"   Viewpoints: {stats.get('viewpoints_rendered', 0)}")
            
            # Görüntü dosyaları
            for img_path in result.output_images:
                file_size = Path(img_path).stat().st_size / 1024  # KB
                print(f"   - {Path(img_path).name} ({file_size:.1f} KB)")
            
            return result.output_images
        else:
            print(f"[ERROR] Rendering başarısız:")
            for error in result.errors:
                print(f"   - {error}")
            return []
            
    except Exception as e:
        print(f"[ERROR] Exception: {str(e)}")
        return []


def test_api_client():
    """API client'ı test et"""
    print("\n=== API Client Test ===")
    
    # Logger oluştur
    logger = STEPAnalyzerLogger()
    config_manager = ConfigManager(logger=logger)
    
    # API client oluştur
    api_client = APIClient(config_manager.config, logger)
    
    try:
        # Server'a bağlan
        print("Server'a bağlanılıyor...")
        response = api_client.connect_and_register()
        
        if response.success:
            print(f"[OK] API bağlantısı başarılı!")
            print(f"   Client ID: {api_client.client_id}")
            print(f"   Response Time: {response.response_time:.3f}s")
            
            # Server status
            print("Server durumu kontrol ediliyor...")
            status_response = api_client.get_server_status()
            
            if status_response.success and status_response.data:
                data = status_response.data
                print(f"   Active Clients: {len(data.get('active_clients', []))}")
                print(f"   Index Stats: {data.get('index_stats', {})}")
            
            return True
        else:
            print(f"[ERROR] API bağlantısı başarısız:")
            print(f"   Error: {response.error}")
            print(f"   Status Code: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"[ERROR] Exception: {str(e)}")
        return False
    
    finally:
        api_client.close()


def main():
    """Ana test fonksiyonu"""
    print("STEP BOM Analyzer Test Suite")
    print("=" * 50)
    
    # Test STEP dosyası bul
    test_file = None
    
    # Mevcut dizinde STEP dosyası ara
    current_dir = Path(".")
    for ext in ['.step', '.stp', '.STEP', '.STP']:
        for file in current_dir.glob(f"*{ext}"):
            test_file = str(file)
            break
        if test_file:
            break
    
    # Örnek dizinlerinde ara
    if not test_file:
        sample_dirs = [
            Path("../backend/importlar"),
            Path("../../samples"),
            Path("./samples")
        ]
        
        for sample_dir in sample_dirs:
            if sample_dir.exists():
                for ext in ['.step', '.stp', '.STEP', '.STP']:
                    for file in sample_dir.glob(f"*{ext}"):
                        test_file = str(file)
                        break
                    if test_file:
                        break
            if test_file:
                break
    
    if test_file:
        print(f"Test dosyası: {Path(test_file).name}")
    else:
        print("UYARI: Test STEP dosyası bulunamadı!")
        print("   Mevcut dizine bir .step veya .stp dosyası koyun")
        return
    
    # Test sonuçları
    results = {
        'parse': False,
        'bom': False,
        'export': False,
        'mesh': False,
        'render': False,
        'api': False
    }
    
    # 1. STEP Parser testi
    parse_result = test_step_parser(test_file)
    results['parse'] = parse_result is not None and parse_result.success
    
    # 2. BOM Extractor testi
    bom_result = None
    if results['parse']:
        bom_result = test_bom_extractor(parse_result)
        results['bom'] = bom_result is not None
    
    # 3. BOM Export testi
    if results['bom']:
        results['export'] = test_bom_export(bom_result)
    
    # 4. Mesh Converter testi
    mesh_files = []
    if results['parse']:
        mesh_files = test_mesh_converter(test_file)
        results['mesh'] = len(mesh_files) > 0
    
    # 5. Renderer testi
    if results['mesh']:
        render_files = test_renderer(mesh_files)
        results['render'] = len(render_files) > 0
    
    # 6. API Client testi
    results['api'] = test_api_client()
    
    # Özet sonuçlar
    print("\n" + "=" * 50)
    print("TEST SONUÇLARI")
    print("=" * 50)
    
    test_names = {
        'parse': 'STEP Parser',
        'bom': 'BOM Extractor',
        'export': 'BOM Export',
        'mesh': 'Mesh Converter',
        'render': '3D Renderer',
        'api': 'API Client'
    }
    
    passed = 0
    total = len(results)
    
    for key, name in test_names.items():
        status = "PASS" if results[key] else "FAIL"
        print(f"{name:15s}: {status}")
        if results[key]:
            passed += 1
    
    print("=" * 50)
    print(f"ÖZET: {passed}/{total} test geçti ({passed/total*100:.1f}%)")
    
    if passed == total:
        print("Tüm testler başarılı!")
    else:
        print("Bazı testler başarısız. Log'ları kontrol edin.")
    
    # Output dizini bilgisi
    output_dir = Path("./test_output")
    if output_dir.exists():
        total_files = len(list(output_dir.rglob("*")))
        total_size = sum(f.stat().st_size for f in output_dir.rglob("*") if f.is_file())
        print(f"Test output: {total_files} files, {total_size/(1024*1024):.2f} MB")


if __name__ == "__main__":
    main()