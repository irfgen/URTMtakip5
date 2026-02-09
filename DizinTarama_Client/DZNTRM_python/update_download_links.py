#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ÜRTM Takip - İndirme Linklerini Güncelleme Scripti
Web sunucusundaki download linklerini yeni versiyonla günceller
"""

import json
import shutil
import os
from pathlib import Path
from datetime import datetime

# Versiyon bilgilerini import et
try:
    from version import get_version, get_version_full, get_version_info
except ImportError:
    print("❌ HATA: version.py dosyası bulunamadı!")
    exit(1)

class DownloadManager:
    def __init__(self):
        self.base_dir = Path(__file__).parent.parent
        self.version = get_version()
        self.version_full = get_version_full()
        self.version_info = get_version_info()

        # Web server paths - gerçek sunucu yolları
        self.web_root = Path("/var/www/urtmtakip")
        self.download_dir = self.web_root / "downloads"
        self.api_dir = self.web_root / "api"

        print(f"🌐 ÜRTM Takip Download Manager")
        print(f"Version: {self.version_full}")
        print(f"Target: {self.download_dir}")
        print("-" * 50)

    def check_web_directories(self):
        """Web dizinlerini kontrol et ve oluştur"""
        print("📁 Web dizinleri kontrol ediliyor...")

        try:
            self.download_dir.mkdir(parents=True, exist_ok=True)
            self.api_dir.mkdir(parents=True, exist_ok=True)

            print(f"   ✓ {self.download_dir}")
            print(f"   ✓ {self.api_dir}")
            return True

        except PermissionError:
            print(f"   ❌ Yetki hatası: {self.web_root}")
            print("   💡 Çözüm: sudo ile çalıştırın veya web sunucu yetkilerini kontrol edin")
            return False

        except Exception as e:
            print(f"   ❌ Hata: {str(e)}")
            return False

    def clean_old_downloads(self):
        """Eski download dosyalarını temizle"""
        print("🧹 Eski indirme dosyaları temizleniyor...")

        patterns = [
            "URTM_DizinTarama_Client_v*.zip",
            "URTM_DizinTarama_Client_v*.tar.gz"
        ]

        for pattern in patterns:
            for old_file in self.download_dir.glob(pattern):
                # Mevcut versiyonu silme
                if self.version not in old_file.name:
                    print(f"   Siliniyor: {old_file.name}")
                    try:
                        old_file.unlink()
                    except Exception as e:
                        print(f"   ⚠️  Silinemedi {old_file.name}: {e}")

    def copy_new_packages(self):
        """Yeni paket dosyalarını web dizinine kopyala"""
        print("📦 Yeni paketler kopyalanıyor...")

        source_files = [
            f"URTM_DizinTarama_Client_v{self.version}.zip",
            f"URTM_DizinTarama_Client_v{self.version}.tar.gz"
        ]

        copied_files = []

        for filename in source_files:
            source_path = self.base_dir / filename
            target_path = self.download_dir / filename

            if source_path.exists():
                try:
                    shutil.copy2(source_path, target_path)
                    file_size = target_path.stat().st_size
                    print(f"   ✓ {filename} ({file_size // 1024}KB)")
                    copied_files.append((filename, file_size))
                except Exception as e:
                    print(f"   ❌ {filename} kopyalanamadı: {e}")
            else:
                print(f"   ⚠️  Bulunamadı: {filename}")

        return copied_files

    def create_api_endpoints(self, copied_files):
        """API endpoints oluştur"""
        print("🔗 API endpoints oluşturuluyor...")

        # Latest version API
        version_api = {
            "version": self.version,
            "version_full": self.version_full,
            "release_date": self.version_info.get('release_date', datetime.now().strftime('%Y-%m-%d')),
            "build_timestamp": int(datetime.now().timestamp()),
            "downloads": {
                "windows": {
                    "url": f"/downloads/URTM_DizinTarama_Client_v{self.version}.zip",
                    "filename": f"URTM_DizinTarama_Client_v{self.version}.zip",
                    "size": next((size for name, size in copied_files if name.endswith('.zip')), 0),
                    "type": "application/zip"
                },
                "linux": {
                    "url": f"/downloads/URTM_DizinTarama_Client_v{self.version}.tar.gz",
                    "filename": f"URTM_DizinTarama_Client_v{self.version}.tar.gz",
                    "size": next((size for name, size in copied_files if name.endswith('.tar.gz')), 0),
                    "type": "application/gzip"
                }
            },
            "features": [
                "Checkbox part selection system",
                "Database integration with part details",
                "Enhanced UI with scrollable part cards",
                "Real-time database status indicators"
            ]
        }

        # API dosyası oluştur
        api_file = self.api_dir / "dizin-tarama-latest.json"
        try:
            with open(api_file, 'w', encoding='utf-8') as f:
                json.dump(version_api, f, indent=2, ensure_ascii=False)
            print(f"   ✓ {api_file.name}")
        except Exception as e:
            print(f"   ❌ API dosyası oluşturulamadı: {e}")

        # Genel latest.json
        latest_file = self.download_dir / "latest.json"
        try:
            with open(latest_file, 'w', encoding='utf-8') as f:
                json.dump(version_api, f, indent=2, ensure_ascii=False)
            print(f"   ✓ {latest_file.name}")
        except Exception as e:
            print(f"   ❌ Latest dosyası oluşturulamadı: {e}")

    def create_symlinks(self):
        """Sabit indirme linklerini oluştur (symlinks)"""
        print("🔗 Sabit linkler oluşturuluyor...")

        links = [
            ("latest.zip", f"URTM_DizinTarama_Client_v{self.version}.zip"),
            ("latest.tar.gz", f"URTM_DizinTarama_Client_v{self.version}.tar.gz"),
            ("client-latest.zip", f"URTM_DizinTarama_Client_v{self.version}.zip")
        ]

        for link_name, target in links:
            link_path = self.download_dir / link_name
            target_path = self.download_dir / target

            try:
                # Mevcut linki sil
                if link_path.exists() or link_path.is_symlink():
                    link_path.unlink()

                # Yeni link oluştur
                if target_path.exists():
                    os.symlink(target, link_path)
                    print(f"   ✓ {link_name} → {target}")
                else:
                    print(f"   ⚠️  Target bulunamadı: {target}")

            except Exception as e:
                print(f"   ❌ {link_name} oluşturulamadı: {e}")

    def update_download_page(self):
        """İndirme sayfası HTML'ini güncelle"""
        print("📄 İndirme sayfası güncelleniyor...")

        download_page = self.web_root / "dizin-tarama-download.html"

        html_content = f'''<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ÜRTM Takip - Dizin Tarama Client İndir</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }}
        .container {{ max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }}
        .version {{ color: #666; font-size: 0.9em; }}
        .download-btn {{ display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }}
        .download-btn:hover {{ background: #0056b3; }}
        .features {{ background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; }}
        .changelog {{ background: #e7f3ff; padding: 20px; border-left: 4px solid #007bff; margin: 20px 0; }}
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 ÜRTM Takip - Dizin Tarama Client</h1>
        <div class="version">Son Güncelleme: {datetime.now().strftime('%d.%m.%Y %H:%M')}</div>
        <div class="version">Versiyon: {self.version_full}</div>

        <h2>📥 İndirme</h2>
        <a href="/downloads/URTM_DizinTarama_Client_v{self.version}.zip" class="download-btn">
            🪟 Windows İçin İndir (.ZIP)
        </a>
        <br>
        <a href="/downloads/URTM_DizinTarama_Client_v{self.version}.tar.gz" class="download-btn">
            🐧 Linux İçin İndir (.TAR.GZ)
        </a>

        <div class="features">
            <h3>✨ v{self.version} Yeni Özellikler</h3>
            <ul>
                <li>✅ <strong>Checkbox Seçim Sistemi</strong> - Parça seçimi için checkbox'lar</li>
                <li>✅ <strong>Database Entegrasyonu</strong> - ÜRTM Takip sunucusu ile entegrasyon</li>
                <li>✅ <strong>Detaylı Parça Görünümü</strong> - Scrollable parça kartları</li>
                <li>✅ <strong>Real-time Durum</strong> - Anlık database durumu gösterimi</li>
                <li>✅ <strong>Toplu İşlemler</strong> - Seçim kontrolleri ve filtreleme</li>
                <li>✅ <strong>Asenkron Yükleme</strong> - Responsive kullanıcı arayüzü</li>
            </ul>
        </div>

        <div class="changelog">
            <h3>📋 Kurulum</h3>
            <ol>
                <li>ZIP dosyasını indirin ve çıkarın</li>
                <li><code>setup_windows.bat</code> dosyasını çalıştırın</li>
                <li>Kurulum tamamlandıktan sonra <code>python main.py</code></li>
            </ol>
        </div>

        <h3>⚙️ Sistem Gereksinimleri</h3>
        <ul>
            <li>Python 3.8 veya üzeri</li>
            <li>Windows 10/11 (Linux desteği mevcut)</li>
            <li>512MB RAM</li>
            <li>50MB disk alanı</li>
        </ul>

        <p><strong>API Endpoint:</strong> <a href="/api/dizin-tarama-latest.json">/api/dizin-tarama-latest.json</a></p>
    </div>
</body>
</html>'''

        try:
            with open(download_page, 'w', encoding='utf-8') as f:
                f.write(html_content)
            print(f"   ✓ {download_page.name}")
        except Exception as e:
            print(f"   ❌ HTML sayfası oluşturulamadı: {e}")

    def run(self):
        """Ana işlemi çalıştır"""
        print("🌐 Download link güncelleme başlatılıyor...\n")

        # Web dizinlerini kontrol et
        if not self.check_web_directories():
            print("❌ Web dizinleri oluşturulamadı!")
            return False

        # Eski dosyaları temizle
        self.clean_old_downloads()

        # Yeni paketleri kopyala
        copied_files = self.copy_new_packages()

        if not copied_files:
            print("❌ Hiçbir paket dosyası kopyalanamadı!")
            return False

        # API endpoints oluştur
        self.create_api_endpoints(copied_files)

        # Symlink'ler oluştur
        self.create_symlinks()

        # HTML sayfası güncelle
        self.update_download_page()

        print(f"\n🎉 Download linkleri başarıyla güncellendi!")
        print(f"📦 Aktif versiyon: v{self.version}")
        print(f"🌐 İndirme URL: http://sunucu/downloads/latest.zip")
        print(f"📡 API URL: http://sunucu/api/dizin-tarama-latest.json")

        return True

def main():
    manager = DownloadManager()

    # Yetki kontrolü
    if os.geteuid() != 0:
        print("⚠️  Bu script genellikle root yetkisi gerektirir.")
        print("   Devam etmek için: sudo python update_download_links.py")
        print()

    # Onay al
    confirm = input("❓ Download linkleri güncellensin mi? (y/N): ").strip().lower()
    if confirm not in ['y', 'yes', 'evet', 'e']:
        print("❌ İşlem iptal edildi.")
        return

    success = manager.run()
    return 0 if success else 1

if __name__ == "__main__":
    exit(main())