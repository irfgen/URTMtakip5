"""
FreeCAD Python Wrapper Test Script
STEP dosyası işleme testleri için
"""

import os
import sys
from pathlib import Path
from core.freecad_python_wrapper import test_freecad_wrapper

def main():
    print("🔧 FreeCAD Python Wrapper Test")
    print("=" * 60)
    
    # Wrapper'ı test et
    wrapper = test_freecad_wrapper()
    
    if not wrapper:
        print("❌ FreeCAD Wrapper başlatılamadı")
        return
    
    print("\n📋 Test Seçenekleri:")
    print("1. Sadece FreeCAD bilgilerini göster")
    print("2. STEP dosyası işle")
    print("3. Screenshot test (GUI gerekli)")
    print("4. Çıkış")
    
    while True:
        choice = input("\nSeçiminizi yapın (1-4): ").strip()
        
        if choice == "1":
            test_freecad_info(wrapper)
        elif choice == "2":
            test_step_processing(wrapper)
        elif choice == "3":
            test_screenshot(wrapper)
        elif choice == "4":
            print("👋 Çıkılıyor...")
            break
        else:
            print("❌ Geçersiz seçim")

def test_freecad_info(wrapper):
    """FreeCAD bilgilerini test et"""
    print("\n🔍 FreeCAD Bilgileri Test Ediliyor...")
    
    info_result = wrapper.get_freecad_info()
    
    if info_result.success:
        print("✅ FreeCAD bilgileri başarıyla alındı")
        print(f"📋 Version: {info_result.data['build_info']['version']}")
        print(f"🏗️ Build: {info_result.data['build_info']['build']}")
        print(f"📅 Build Date: {info_result.data['build_info']['build_date']}")
        print(f"🔗 Git URL: {info_result.data['build_info']['git_url']}")
    else:
        print(f"❌ FreeCAD bilgi hatası: {info_result.error}")

def test_step_processing(wrapper):
    """STEP dosyası işleme testini yap"""
    print("\n📁 STEP Dosyası İşleme Test")
    print("-" * 40)
    
    # Test dosyası yolu al
    print("STEP dosya yolu girin:")
    print("Örnek: C:\\Users\\irfan\\Desktop\\22322.step")
    
    step_file = input("STEP dosya yolu: ").strip().strip('"')
    
    if not step_file:
        print("❌ Dosya yolu girilmedi")
        return
    
    if not os.path.exists(step_file):
        print(f"❌ STEP dosyası bulunamadı: {step_file}")
        return
    
    # Output dizini
    output_dir = os.path.join(os.getcwd(), "test_output", "freecad_test")
    print(f"📂 Çıktı dizini: {output_dir}")
    
    # İşlemi başlat
    print(f"\n⚡ STEP dosyası işleniyor: {os.path.basename(step_file)}")
    print("Bu işlem birkaç dakika sürebilir...")
    
    result = wrapper.process_step_file(step_file, output_dir)
    
    if result.success:
        print("✅ STEP dosyası başarıyla işlendi!")
        print(f"⏱️ İşlem süresi: {result.processing_time:.2f} saniye")
        
        data = result.data
        print(f"\n📊 Analiz Sonuçları:")
        print(f"   📁 Dosya: {data['file_info']['file_name']}")
        print(f"   📏 Boyut: {data['file_info']['file_size']:,} bytes")
        print(f"   🔢 Toplam nesne: {data['analysis']['total_objects']}")
        print(f"   🏗️ Assembly: {len(data['assemblies'])}")
        print(f"   🔧 Part: {len(data['parts'])}")
        
        # Detaylı part bilgileri
        if data['parts']:
            print(f"\n🔧 Part Detayları:")
            for i, part in enumerate(data['parts'][:5]):  # İlk 5 part
                print(f"   {i+1}. {part['name']} ({part['type']})")
                if 'volume' in part:
                    print(f"      Volume: {part['volume']:.2f} mm³")
                if 'surface_area' in part:
                    print(f"      Surface Area: {part['surface_area']:.2f} mm²")
        
        print(f"\n💾 Detaylı sonuç: {output_dir}\\bom_analysis.json")
        
        # JSON dosyasını aç
        if input("\nJSON sonuç dosyasını açmak ister misiniz? (y/N): ").strip().lower() == 'y':
            json_file = os.path.join(output_dir, "bom_analysis.json")
            if os.path.exists(json_file):
                os.startfile(json_file)  # Windows'ta dosyayı aç
            
    else:
        print(f"❌ STEP işleme hatası: {result.error}")
        print(f"⏱️ İşlem süresi: {result.processing_time:.2f} saniye")
        
        if result.stdout:
            print("\n📄 İşlem çıktısı:")
            print(result.stdout)

def test_screenshot(wrapper):
    """Screenshot test"""
    print("\n📸 Screenshot Test")
    print("-" * 30)
    print("⚠️ Bu test GUI modunu gerektirir")
    
    step_file = input("STEP dosya yolu: ").strip().strip('"')
    
    if not step_file or not os.path.exists(step_file):
        print("❌ Geçersiz STEP dosyası")
        return
    
    output_dir = os.path.join(os.getcwd(), "test_output", "screenshots")
    
    print(f"📸 Screenshot oluşturuluyor...")
    result = wrapper.generate_part_screenshot(step_file, output_dir)
    
    if result.success:
        print("✅ Screenshot başarılı!")
        data = result.data
        print(f"📷 {data['total_screenshots']} screenshot oluşturuldu")
        
        for screenshot in data['screenshots']:
            status = "✅" if screenshot['exists'] else "❌"
            print(f"   {status} {screenshot['part_name']}: {screenshot['screenshot_path']}")
    else:
        print(f"❌ Screenshot hatası: {result.error}")

if __name__ == "__main__":
    main()