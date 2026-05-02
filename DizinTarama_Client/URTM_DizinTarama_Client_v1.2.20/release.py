#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ÜRTM Takip - Complete Release Management Script
Tam otomatik versiyon yönetimi ve deployment scripti
"""

import sys
import subprocess
import os
from pathlib import Path
from datetime import datetime

def run_command(script_name, args=None):
    """Script çalıştır ve sonucu döndür"""
    if args is None:
        args = []

    script_path = Path(__file__).parent / script_name
    if not script_path.exists():
        print(f"❌ Script bulunamadı: {script_name}")
        return False

    try:
        cmd = [sys.executable, str(script_path)] + args
        print(f"🔄 Çalıştırılıyor: {script_name} {' '.join(args)}")

        result = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8')

        if result.returncode == 0:
            print(result.stdout)
            return True
        else:
            print(f"❌ {script_name} hatası:")
            print(result.stderr)
            return False

    except Exception as e:
        print(f"❌ {script_name} çalıştırma hatası: {str(e)}")
        return False

def main():
    print("🚀 ÜRTM Takip Complete Release Manager")
    print("=" * 50)
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()

    # Parametre kontrolü
    if len(sys.argv) < 2:
        print("""
📖 KULLANIM:

  python release.py <version_type> [changelog] [options]

🔢 VERSION TYPES:
  • patch (1.2.0 → 1.2.1) - Bug fixes, minor changes
  • minor (1.2.0 → 1.3.0) - New features, backward compatible
  • major (1.2.0 → 2.0.0) - Breaking changes

📝 ÖRNEKLER:
  python release.py patch "Bug düzeltmeleri"
  python release.py minor "Yeni özellik: Database entegrasyonu"
  python release.py major "Breaking: Yeni API versiyonu" --deploy

🎛️  OPTIONS:
  --deploy       : Web sunucusuna otomatik deploy
  --no-build     : Package build atla
  --force        : Onay almadan devam et

📋 RELEASE SÜRECI:
  1. Version bump (version.py güncelle)
  2. Package build (ZIP/TAR.GZ oluştur)
  3. Download links güncelle (web deployment)
  4. Cleanup (eski dosyaları temizle)
""")
        return

    version_type = sys.argv[1].lower()
    if version_type not in ['major', 'minor', 'patch']:
        print(f"❌ Geçersiz versiyon tipi: {version_type}")
        print("Geçerli tipler: major, minor, patch")
        return

    # Parametreler
    changelog_entry = None
    deploy = '--deploy' in sys.argv
    no_build = '--no-build' in sys.argv
    force = '--force' in sys.argv

    # Changelog çıkar
    changelog_args = [arg for arg in sys.argv[2:] if not arg.startswith('--')]
    if changelog_args:
        changelog_entry = ' '.join(changelog_args)

    print(f"📋 Release Parametreleri:")
    print(f"   Version Type: {version_type}")
    print(f"   Changelog: {changelog_entry or 'Yok'}")
    print(f"   Auto Deploy: {'Evet' if deploy else 'Hayır'}")
    print(f"   Build Skip: {'Evet' if no_build else 'Hayır'}")
    print()

    # Onay
    if not force:
        confirm = input("❓ Release işlemi başlatılsın mı? (y/N): ").strip().lower()
        if confirm not in ['y', 'yes', 'evet', 'e']:
            print("❌ Release iptal edildi.")
            return

    print("\n🎯 RELEASE İŞLEMLERİ BAŞLATIYOR...")
    print("=" * 50)

    # 1. Version Bump
    print("\n1️⃣  VERSION BUMP")
    print("-" * 20)

    bump_args = [version_type]
    if changelog_entry:
        bump_args.append(changelog_entry)

    if not run_command('bump_version.py', bump_args):
        print("❌ Version bump başarısız! Release durduruluyor.")
        return

    # 2. Package Build (bump_version.py içinde yapılıyor, ama manuel kontrol için)
    if not no_build:
        print("\n2️⃣  PACKAGE BUILD")
        print("-" * 20)
        print("ℹ️  Package build bump_version.py tarafından yapıldı.")

        # Build kontrolü
        from version import get_version
        current_version = get_version()
        expected_package = Path(__file__).parent.parent / f"URTM_DizinTarama_Client_v{current_version}.zip"

        if expected_package.exists():
            print(f"✅ Package dosyası mevcut: {expected_package.name}")
        else:
            print(f"⚠️  Package dosyası bulunamadı: {expected_package.name}")
            print("   Manuel build çalıştırılıyor...")
            if not run_command('build_package.py'):
                print("❌ Package build başarısız!")
                return

    # 3. Web Deployment
    if deploy:
        print("\n3️⃣  WEB DEPLOYMENT")
        print("-" * 20)

        if not run_command('update_download_links.py'):
            print("⚠️  Web deployment başarısız, ancak release devam ediyor...")
    else:
        print("\n3️⃣  WEB DEPLOYMENT (ATLANMIŞ)")
        print("-" * 20)
        print("ℹ️  Manuel deployment için:")
        print("   sudo python update_download_links.py")

    # 4. Final Report
    print("\n🎉 RELEASE TAMAMLANDI!")
    print("=" * 50)

    try:
        from version import get_version, get_version_full
        final_version = get_version()
        final_version_full = get_version_full()

        print(f"📦 Yeni Versiyon: {final_version_full}")
        print(f"📁 Package: URTM_DizinTarama_Client_v{final_version}")
        print(f"📅 Release Date: {datetime.now().strftime('%Y-%m-%d %H:%M')}")

        if changelog_entry:
            print(f"📝 Changelog: {changelog_entry}")

        print("\n📋 Sonraki Adımlar:")

        if not deploy:
            print("  • sudo python update_download_links.py  # Web deployment")

        print("  • git add -A && git commit -m \"Release v{final_version}\"  # Git commit")
        print("  • git tag v{final_version} && git push --tags  # Git tag")

        print("\n🌐 İndirme Linkleri:")
        print(f"  • Windows: /downloads/URTM_DizinTarama_Client_v{final_version}.zip")
        print(f"  • Linux: /downloads/URTM_DizinTarama_Client_v{final_version}.tar.gz")
        print(f"  • API: /api/dizin-tarama-latest.json")

    except Exception as e:
        print(f"⚠️  Final report oluşturulamadı: {e}")

    print("\n✨ Release işlemi başarıyla tamamlandı!")

if __name__ == "__main__":
    main()