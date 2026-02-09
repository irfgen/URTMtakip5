#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ÜRTM Takip - Dizin Tarama Client Version Bumper
Otomatik versiyon artırma ve paketleme scripti
"""

import re
import sys
import subprocess
from datetime import datetime
from pathlib import Path

class VersionBumper:
    def __init__(self):
        self.version_file = Path(__file__).parent / 'version.py'

        if not self.version_file.exists():
            print("❌ HATA: version.py dosyası bulunamadı!")
            sys.exit(1)

        self.current_version = None
        self.new_version = None

    def read_current_version(self):
        """Mevcut versiyon bilgilerini oku"""
        with open(self.version_file, 'r', encoding='utf-8') as f:
            content = f.read()

        # Version bilgilerini parse et
        major_match = re.search(r'VERSION_MAJOR\s*=\s*(\d+)', content)
        minor_match = re.search(r'VERSION_MINOR\s*=\s*(\d+)', content)
        patch_match = re.search(r'VERSION_PATCH\s*=\s*(\d+)', content)

        if not all([major_match, minor_match, patch_match]):
            print("❌ HATA: version.py dosyasında versiyon bilgileri bulunamadı!")
            sys.exit(1)

        self.current_version = {
            'major': int(major_match.group(1)),
            'minor': int(minor_match.group(1)),
            'patch': int(patch_match.group(1))
        }

        print(f"📋 Mevcut versiyon: {self.current_version['major']}.{self.current_version['minor']}.{self.current_version['patch']}")

    def bump_version(self, version_type='patch'):
        """Versiyon numarasını artır"""
        self.new_version = self.current_version.copy()

        if version_type == 'major':
            self.new_version['major'] += 1
            self.new_version['minor'] = 0
            self.new_version['patch'] = 0
        elif version_type == 'minor':
            self.new_version['minor'] += 1
            self.new_version['patch'] = 0
        else:  # patch
            self.new_version['patch'] += 1

        print(f"🆙 Yeni versiyon: {self.new_version['major']}.{self.new_version['minor']}.{self.new_version['patch']}")

    def update_version_file(self, changelog_entry=None):
        """version.py dosyasını güncelle"""
        with open(self.version_file, 'r', encoding='utf-8') as f:
            content = f.read()

        # Build timestamp oluştur
        now = datetime.now()
        build_number = now.strftime('%Y%m%d') + '001'
        release_date = now.strftime('%Y-%m-%d')

        # Version numaralarını güncelle
        content = re.sub(r'VERSION_MAJOR\s*=\s*\d+', f'VERSION_MAJOR = {self.new_version["major"]}', content)
        content = re.sub(r'VERSION_MINOR\s*=\s*\d+', f'VERSION_MINOR = {self.new_version["minor"]}', content)
        content = re.sub(r'VERSION_PATCH\s*=\s*\d+', f'VERSION_PATCH = {self.new_version["patch"]}', content)
        content = re.sub(r'VERSION_BUILD\s*=\s*\d+', f'VERSION_BUILD = {build_number}', content)

        # Release date güncelle
        content = re.sub(r'RELEASE_DATE\s*=\s*"[^"]*"', f'RELEASE_DATE = "{release_date}"', content)

        # Changelog güncelle
        if changelog_entry:
            version_string = f"v{self.new_version['major']}.{self.new_version['minor']}.{self.new_version['patch']}"
            new_entry = f'    "{version_string} - {release_date}:",\\n    "- {changelog_entry}",\\n    "",'

            # RELEASE_NOTES listesinin başına ekle
            content = re.sub(
                r'(RELEASE_NOTES\s*=\s*\[)',
                f'\\1\\n{new_entry}',
                content
            )

        # Dosyayı güncelle
        with open(self.version_file, 'w', encoding='utf-8') as f:
            f.write(content)

        print(f"✅ version.py güncellendi")

    def run_build(self):
        """Build scriptini çalıştır"""
        print("🔨 Package build başlatılıyor...")

        try:
            build_script = Path(__file__).parent / 'build_package.py'
            result = subprocess.run([sys.executable, str(build_script)],
                                 capture_output=True, text=True, encoding='utf-8')

            if result.returncode == 0:
                print("✅ Package build başarılı!")
                print(result.stdout)
                return True
            else:
                print("❌ Package build hatası!")
                print(result.stderr)
                return False

        except Exception as e:
            print(f"❌ Build script çalıştırma hatası: {str(e)}")
            return False

    def show_usage(self):
        """Kullanım bilgilerini göster"""
        print("""
📖 KULLANIM:

  python bump_version.py [version_type] [changelog]

  version_type: major | minor | patch (varsayılan: patch)
  changelog: Değişiklik açıklaması (opsiyonel)

🔢 VERSIYON TİPLERİ:
  • patch (1.2.0 → 1.2.1) - Bug fix, küçük değişiklikler
  • minor (1.2.0 → 1.3.0) - Yeni özellik, geriye uyumlu
  • major (1.2.0 → 2.0.0) - Breaking change, büyük değişiklik

📝 ÖRNEKLER:
  python bump_version.py                           # Patch artır
  python bump_version.py patch "Bug düzeltmeleri"  # Patch artır + changelog
  python bump_version.py minor "Yeni özellik"      # Minor artır + changelog
  python bump_version.py major "Breaking changes"  # Major artır + changelog
""")

def main():
    if len(sys.argv) > 1 and sys.argv[1] in ['-h', '--help', 'help']:
        bumper = VersionBumper()
        bumper.show_usage()
        return

    # Parametreleri parse et
    version_type = 'patch'
    changelog_entry = None

    if len(sys.argv) > 1:
        version_type = sys.argv[1].lower()
        if version_type not in ['major', 'minor', 'patch']:
            print(f"❌ Geçersiz versiyon tipi: {version_type}")
            print("Geçerli tipler: major, minor, patch")
            sys.exit(1)

    if len(sys.argv) > 2:
        changelog_entry = ' '.join(sys.argv[2:])

    # Version bump işlemi
    bumper = VersionBumper()

    print("🚀 ÜRTM Takip Version Bumper")
    print("-" * 40)

    # Mevcut versiyonu oku
    bumper.read_current_version()

    # Yeni versiyonu hesapla
    bumper.bump_version(version_type)

    # Kullanıcı onayı
    confirm = input(f"\n❓ Versiyon güncellensin mi? (y/N): ").strip().lower()
    if confirm not in ['y', 'yes', 'evet', 'e']:
        print("❌ İşlem iptal edildi.")
        return

    # Version dosyasını güncelle
    bumper.update_version_file(changelog_entry)

    # Package build
    build_confirm = input(f"\n❓ Otomatik package build yapılsın mı? (Y/n): ").strip().lower()
    if build_confirm not in ['n', 'no', 'hayır', 'h']:
        success = bumper.run_build()
        if success:
            print("\n🎉 Version bump ve package build başarıyla tamamlandı!")
            new_ver = f"{bumper.new_version['major']}.{bumper.new_version['minor']}.{bumper.new_version['patch']}"
            print(f"📦 Yeni paket: URTM_DizinTarama_Client_v{new_ver}")
        else:
            print("\n⚠️  Version güncellendi ama package build başarısız!")
    else:
        print("\n✅ Version güncellendi. Manuel build için:")
        print("   python build_package.py")

if __name__ == "__main__":
    main()