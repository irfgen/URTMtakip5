#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ÜRTM Takip - Dizin Tarama Client Package Builder
Otomatik versiyon yönetimi ve paketleme scripti
"""

import os
import sys
import shutil
import tarfile
import zipfile
import json
from datetime import datetime
from pathlib import Path

# Versiyon bilgilerini import et
try:
    from version import get_version, get_version_full, get_version_info
except ImportError:
    print("❌ HATA: version.py dosyası bulunamadı!")
    sys.exit(1)

class PackageBuilder:
    def __init__(self):
        self.base_dir = Path(__file__).parent.parent
        self.client_dir = Path(__file__).parent
        self.version_info = get_version_info()
        self.version = get_version()
        self.version_full = get_version_full()

        print(f"📦 ÜRTM Takip Package Builder")
        print(f"Version: {self.version_full}")
        print(f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("-" * 50)

    def clean_old_packages(self):
        """Eski paketleri temizle"""
        print("🧹 Eski paketleri temizleniyor...")

        # Eski klasörleri bul ve sil
        for item in self.base_dir.glob("URTM_DizinTarama_Client_v*"):
            if item.is_dir() and item.name != f"URTM_DizinTarama_Client_v{self.version}":
                print(f"   Siliniyor: {item.name}")
                shutil.rmtree(item)

        # Eski arşiv dosyalarını sil
        for item in self.base_dir.glob("URTM_DizinTarama_Client_v*.tar.gz"):
            if item.name != f"URTM_DizinTarama_Client_v{self.version}.tar.gz":
                print(f"   Siliniyor: {item.name}")
                item.unlink()

        for item in self.base_dir.glob("URTM_DizinTarama_Client_v*.zip"):
            if item.name != f"URTM_DizinTarama_Client_v{self.version}.zip":
                print(f"   Siliniyor: {item.name}")
                item.unlink()

    def create_package_directory(self):
        """Yeni paket klasörü oluştur"""
        package_dir = self.base_dir / f"URTM_DizinTarama_Client_v{self.version}"

        print(f"📁 Paket klasörü oluşturuluyor: {package_dir.name}")

        # Klasör varsa sil
        if package_dir.exists():
            shutil.rmtree(package_dir)

        # Yeni klasör oluştur
        package_dir.mkdir()

        # Dosyaları kopyala (pycache hariç)
        exclude_patterns = ['__pycache__', '*.pyc', '*.pyo', '.git*', 'build_package.py']

        for item in self.client_dir.iterdir():
            if item.name.startswith('.'):
                continue

            skip = False
            for pattern in exclude_patterns:
                if pattern.endswith('*'):
                    if item.name.startswith(pattern[:-1]):
                        skip = True
                        break
                elif pattern.startswith('*'):
                    if item.name.endswith(pattern[1:]):
                        skip = True
                        break
                else:
                    if item.name == pattern:
                        skip = True
                        break

            if skip:
                continue

            if item.is_file():
                shutil.copy2(item, package_dir / item.name)
                print(f"   ✓ {item.name}")
            elif item.is_dir() and item.name not in ['__pycache__']:
                shutil.copytree(item, package_dir / item.name)
                print(f"   ✓ {item.name}/")

        return package_dir

    def create_package_info(self, package_dir):
        """Paket bilgi dosyası oluştur"""
        print("📋 Paket bilgileri oluşturuluyor...")

        package_info = {
            'name': 'URTM Takip Dizin Tarama Client',
            'version': self.version,
            'version_full': self.version_full,
            'build_date': datetime.now().isoformat(),
            'build_timestamp': int(datetime.now().timestamp()),
            'description': 'Enhanced CAD file scanning with part selection and database integration',
            'features': [
                'Checkbox part selection system',
                'Database integration with URTM Takip server',
                'Part detail cards with scrollable view',
                'Real-time database status display',
                'Bulk selection controls',
                'Status-based filtering (complete/partial/incomplete)',
                'Asynchronous data loading',
                'Thread-safe UI updates'
            ],
            'requirements': {
                'python': '>=3.8',
                'packages': ['requests>=2.25.0'],
                'builtin_modules': [
                    'tkinter', 'json', 'configparser', 'pathlib',
                    'threading', 'logging', 'datetime', 'queue', 'os', 'sys'
                ]
            },
            'files': {
                'main': 'main.py',
                'modules': [
                    'database_client.py',
                    'selection_manager.py',
                    'part_detail_window.py',
                    'version.py',
                    'windows_utils.py'
                ],
                'setup': [
                    'setup_windows.bat',
                    'install_pillow.bat',
                    'requirements.txt'
                ],
                'tools': [
                    'test_image_loading.py',
                    'test_windows_client.py',
                    'QUICK_FIX_GUIDE.md'
                ],
                'docs': [
                    'README.md',
                    'README_WINDOWS.md',
                    'KURULUM_REHBERI.md',
                    'SORUN_GIDERME.md',
                    'CHANGELOG.md'
                ]
            }
        }

        # JSON dosyası oluştur
        with open(package_dir / 'package_info.json', 'w', encoding='utf-8') as f:
            json.dump(package_info, f, indent=2, ensure_ascii=False)

        # VERSION.txt dosyası oluştur
        with open(package_dir / 'VERSION.txt', 'w', encoding='utf-8') as f:
            f.write(f"{self.version_full}\n")
            f.write(f"Build Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")

    def create_archives(self, package_dir):
        """Arşiv dosyalarını oluştur"""
        print("📦 Arşiv dosyaları oluşturuluyor...")

        base_name = f"URTM_DizinTarama_Client_v{self.version}"

        # TAR.GZ arşivi (Linux/Unix için)
        tar_path = self.base_dir / f"{base_name}.tar.gz"
        with tarfile.open(tar_path, 'w:gz') as tar:
            tar.add(package_dir, arcname=package_dir.name)
        print(f"   ✓ {tar_path.name} ({tar_path.stat().st_size // 1024}KB)")

        # ZIP arşivi (Windows için)
        zip_path = self.base_dir / f"{base_name}.zip"
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            for file_path in package_dir.rglob('*'):
                if file_path.is_file():
                    arcname = str(file_path.relative_to(package_dir.parent))
                    zip_file.write(file_path, arcname)
        print(f"   ✓ {zip_path.name} ({zip_path.stat().st_size // 1024}KB)")

        return tar_path, zip_path

    def create_download_info(self, tar_path, zip_path):
        """İndirme bilgileri dosyası oluştur"""
        print("📥 İndirme bilgileri oluşturuluyor...")

        download_info = {
            'current_version': self.version,
            'current_version_full': self.version_full,
            'release_date': datetime.now().strftime('%Y-%m-%d'),
            'build_timestamp': int(datetime.now().timestamp()),
            'downloads': {
                'windows': {
                    'file': zip_path.name,
                    'size': zip_path.stat().st_size,
                    'format': 'ZIP',
                    'recommended': True
                },
                'linux': {
                    'file': tar_path.name,
                    'size': tar_path.stat().st_size,
                    'format': 'TAR.GZ',
                    'recommended': False
                }
            },
            'changelog_highlight': [
                'Checkbox part selection system',
                'Database integration with part details',
                'Enhanced UI with scrollable part cards',
                'Real-time database status indicators'
            ],
            'system_requirements': {
                'os': 'Windows 10/11, Linux (Ubuntu 18.04+)',
                'python': '3.8 or higher',
                'ram': '512MB minimum',
                'disk_space': '50MB'
            }
        }

        download_file = self.base_dir / 'LATEST_RELEASE.json'
        with open(download_file, 'w', encoding='utf-8') as f:
            json.dump(download_info, f, indent=2, ensure_ascii=False)

        print(f"   ✓ {download_file.name}")

    def generate_deployment_script(self):
        """Deployment scripti oluştur"""
        print("🚀 Deployment scripti oluşturuluyor...")

        deploy_script = f"""#!/bin/bash
# ÜRTM Takip Dizin Tarama Client v{self.version} Deployment Script
# Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

VERSION="{self.version}"
VERSION_FULL="{self.version_full}"

echo "🚀 ÜRTM Takip Dizin Tarama Client Deployment"
echo "Version: $VERSION_FULL"
echo "Date: $(date)"
echo "----------------------------------------"

# Web sunucusu için dosyaları kopyala
if [ -d "/var/www/urtmtakip/downloads" ]; then
    echo "📁 Web sunucusuna dosyalar kopyalanıyor..."

    # Eski dosyaları temizle
    rm -f /var/www/urtmtakip/downloads/URTM_DizinTarama_Client_v*.zip
    rm -f /var/www/urtmtakip/downloads/URTM_DizinTarama_Client_v*.tar.gz

    # Yeni dosyaları kopyala
    cp URTM_DizinTarama_Client_v${{VERSION}}.zip /var/www/urtmtakip/downloads/
    cp URTM_DizinTarama_Client_v${{VERSION}}.tar.gz /var/www/urtmtakip/downloads/
    cp LATEST_RELEASE.json /var/www/urtmtakip/downloads/

    # İndirme linklerini güncelle (symlink)
    ln -sf URTM_DizinTarama_Client_v${{VERSION}}.zip /var/www/urtmtakip/downloads/URTM_DizinTarama_Client_latest.zip

    echo "✅ Web deployment tamamlandı"
else
    echo "⚠️  Web sunucu dizini bulunamadı: /var/www/urtmtakip/downloads"
fi

# Backup oluştur
if [ -d "/backup/urtmtakip/releases" ]; then
    echo "💾 Backup oluşturuluyor..."
    mkdir -p /backup/urtmtakip/releases/v$VERSION
    cp -r URTM_DizinTarama_Client_v$VERSION /backup/urtmtakip/releases/v$VERSION/
    cp URTM_DizinTarama_Client_v${{VERSION}}.* /backup/urtmtakip/releases/v$VERSION/
    echo "✅ Backup tamamlandı"
fi

echo "🎉 Deployment başarıyla tamamlandı!"
echo "İndirme linki: http://server/downloads/URTM_DizinTarama_Client_v${{VERSION}}.zip"
"""

        deploy_file = self.base_dir / 'deploy.sh'
        with open(deploy_file, 'w', encoding='utf-8') as f:
            f.write(deploy_script)

        # Executable yap
        os.chmod(deploy_file, 0o755)
        print(f"   ✓ {deploy_file.name}")

    def build(self):
        """Ana build işlemi"""
        try:
            print("🔨 Build işlemi başlatılıyor...\n")

            # 1. Eski paketleri temizle
            self.clean_old_packages()

            # 2. Yeni paket klasörü oluştur
            package_dir = self.create_package_directory()

            # 3. Paket bilgileri oluştur
            self.create_package_info(package_dir)

            # 4. Arşiv dosyalarını oluştur
            tar_path, zip_path = self.create_archives(package_dir)

            # 5. İndirme bilgileri oluştur
            self.create_download_info(tar_path, zip_path)

            # 6. Deployment scripti oluştur
            self.generate_deployment_script()

            print("\n🎉 BUILD BAŞARILI!")
            print(f"📦 Paket: URTM_DizinTarama_Client_v{self.version}")
            print(f"📁 Klasör: {package_dir.name}")
            print(f"🗜️  Arşivler: {tar_path.name}, {zip_path.name}")
            print(f"📋 Versiyon: {self.version_full}")
            print("\n🚀 Deployment için:")
            print("   ./deploy.sh")

            return True

        except Exception as e:
            print(f"\n❌ BUILD HATASI: {str(e)}")
            return False

if __name__ == "__main__":
    builder = PackageBuilder()
    success = builder.build()
    sys.exit(0 if success else 1)