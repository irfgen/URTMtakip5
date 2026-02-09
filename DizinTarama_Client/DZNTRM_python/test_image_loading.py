#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Image Loading Test Script
Tests PIL/Pillow installation and image loading functionality
"""

import sys
import os

def test_pil_installation():
    """Test PIL/Pillow installation"""
    print("🔍 PIL/Pillow Kurulum Testi")
    print("=" * 40)

    try:
        from PIL import Image, ImageTk
        print("✅ PIL/Pillow kurulu")

        # Test basic functionality
        print("🧪 PIL test ediliyor...")

        # Create a test image
        test_image = Image.new('RGB', (100, 100), color='blue')
        print("✅ Image creation: OK")

        # Test thumbnail
        test_image.thumbnail((50, 50))
        print("✅ Image resize: OK")

        return True

    except ImportError as e:
        print(f"❌ PIL/Pillow kurulu değil: {e}")
        print("\n📋 Kurulum için:")
        print("   Windows: install_pillow.bat calistirin")
        print("   Manuel: pip install Pillow")
        return False
    except Exception as e:
        print(f"❌ PIL test hatası: {e}")
        return False

def test_tkinter():
    """Test tkinter availability"""
    print("\n🔍 Tkinter Testi")
    print("=" * 40)

    try:
        import tkinter as tk
        from tkinter import ttk
        print("✅ tkinter mevcut")

        # Test basic window
        root = tk.Tk()
        root.title("Test")
        root.geometry("200x100")

        label = ttk.Label(root, text="✅ GUI Test")
        label.pack(pady=20)

        print("✅ GUI çalışıyor")

        root.after(1000, root.quit)
        root.mainloop()

        return True

    except ImportError as e:
        print(f"❌ tkinter mevcut değil: {e}")
        return False
    except Exception as e:
        print(f"❌ GUI test hatası: {e}")
        return False

def test_requests():
    """Test requests library"""
    print("\n🔍 Requests Testi")
    print("=" * 40)

    try:
        import requests
        print("✅ requests kurulu")

        # Test basic HTTP request
        response = requests.get('https://httpbin.org/get', timeout=5)
        if response.status_code == 200:
            print("✅ HTTP istekleri çalışıyor")
            return True
        else:
            print(f"⚠️ HTTP sorunu: {response.status_code}")
            return False

    except ImportError as e:
        print(f"❌ requests kurulu değil: {e}")
        return False
    except Exception as e:
        print(f"❌ Requests test hatası: {e}")
        return False

def test_complete_system():
    """Test complete image loading system"""
    print("\n🔍 Tam Sistem Testi")
    print("=" * 40)

    try:
        # Import required modules
        from PIL import Image, ImageTk
        import tkinter as tk
        from tkinter import ttk
        import requests
        from io import BytesIO

        print("✅ Tüm modüller yüklendi")

        # Create test window
        root = tk.Tk()
        root.title("Image Loading Test")
        root.geometry("400x300")

        # Frame for test
        test_frame = ttk.Frame(root, padding="20")
        test_frame.pack(fill='both', expand=True)

        ttk.Label(test_frame, text="🖼️ Resim Yükleme Testi", font=('Arial', 12, 'bold')).pack(pady=(0, 20))

        # Create a test image programmatically
        test_image = Image.new('RGB', (150, 150), color='lightblue')

        # Add some text to the image
        from PIL import ImageDraw, ImageFont
        draw = ImageDraw.Draw(test_image)
        draw.text((50, 60), "TEST", fill='black')

        # Convert to PhotoImage
        photo_image = ImageTk.PhotoImage(test_image)

        # Display the image
        image_label = ttk.Label(test_frame, image=photo_image)
        image_label.image = photo_image  # Keep reference
        image_label.pack(pady=10)

        ttk.Label(test_frame, text="✅ Resim başarıyla gösterildi!", foreground='green').pack()

        # Auto-close after 3 seconds
        root.after(3000, root.quit)

        print("✅ Resim oluşturma ve gösterme başarılı")
        root.mainloop()

        return True

    except Exception as e:
        print(f"❌ Tam sistem testi başarısız: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Main test function"""
    print("🔍 ÜRTM Dizin Tarama Client - Resim Test Aracı")
    print("=" * 60)

    results = []

    # Test 1: PIL/Pillow
    results.append(("PIL/Pillow", test_pil_installation()))

    # Test 2: tkinter
    results.append(("tkinter", test_tkinter()))

    # Test 3: requests
    results.append(("requests", test_requests()))

    # Test 4: Complete system
    results.append(("Complete System", test_complete_system()))

    # Summary
    print("\n" + "=" * 60)
    print("📊 TEST SONUÇLARI:")
    print("=" * 60)

    all_passed = True
    for test_name, result in results:
        status = "✅ BAŞARILI" if result else "❌ BAŞARISIZ"
        print(f"{test_name:20} : {status}")
        if not result:
            all_passed = False

    print("=" * 60)

    if all_passed:
        print("🎉 TÜM TESTLER BAŞARILI!")
        print("\n✅ Resim gösterim özelliği hazır:")
        print("   - PIL/Pillow kurulu")
        print("   - GUI çalışıyor")
        print("   - HTTP istekleri çalışıyor")
        print("   - Tam sistem testi başarılı")
        print("\n🚀 Client'ı çalıştırabilirsiniz: python main.py")
    else:
        print("❌ BAZI TESTLER BAŞARISIZ!")
        print("\n📋 Çözüm önerileri:")
        print("   - PIL/Pillow yoksa: install_pillow.bat çalıştırın")
        print("   - tkinter yoksa: Python'u yeniden kurun (tkinter ile)")
        print("   - requests yoksa: pip install requests")
        print("   - İnternet bağlantısını kontrol edin")

    print("=" * 60)
    return all_passed

if __name__ == "__main__":
    success = main()
    input("\nDevam etmek için Enter tuşuna basın...")
    sys.exit(0 if success else 1)