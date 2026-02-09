#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
URTM Takip - Dizin Tarama Client Version Manager
Versiyon yonetim dosyasi
"""

# Ana versiyon bilgileri
VERSION_MAJOR = 1
VERSION_MINOR = 2
VERSION_PATCH = 17
VERSION_BUILD = 20250107001  # YYYYMMDDXXX format

# Tam versiyon string'i
VERSION = f"{VERSION_MAJOR}.{VERSION_MINOR}.{VERSION_PATCH}"
VERSION_FULL = f"{VERSION}.{VERSION_BUILD}"

# Surum bilgileri
RELEASE_DATE = "2025-01-07"
RELEASE_NOTES = [
    "v1.2.17 - 2025-01-07:",
    "- YENİ: Dizin temizliği - 40+ gereksiz dosya kaldırıldı",
    "- YENİ: version.py ana dizine eklendi (önceden sadece DZNTRM_python içinde vardi)",
    "- GELİŞTİRME: README.md daha temiz ve anlaşılır hale getirildi",
    "- GELİŞTİRME: Proje yapısı sadeleştirildi",
    "",
    "v1.2.16 - 2025-10-07:",
    "- KRITIK: VERSION_FULL tanımlanmamış hatası düzeltildi",
    "- KRITIK: Enhanced tarama modunda versiyon gönderme sorunu çözüldü",
    "- GELİŞTİRME: Her iki client versiyonunda da VERSION_FULL kullanımı düzeltildi",
    "",
    "v1.2.15 - 2025-01-06:",
    "- KRITIK: Backend API URL'si port 3000'e düzeltildi",
    "- YENİ: Parça detay penceresinde veritabanına kaydetme butonu eklendi",
    "- YENİ: Seçili parçaları toplu olarak veritabanına kaydetme özelliği",
    "- YENİ: Database client'a save_parts_to_database fonksiyonu eklendi",
    "- GELİŞTİRME: Kaydetme sonuçlarını detaylı gösterim",
    "- GELİŞTİRME: Progress indicator ve onay dialog'lari",
    "",
    "v1.2.14 - 2025-01-06:",
    "- YENİ: Parça detay penceresinde veritabanına kaydetme butonu eklendi",
    "- YENİ: Seçili parçaları toplu olarak veritabanına kaydetme özelliği",
    "- YENİ: Database client'a save_parts_to_database fonksiyonu eklendi",
    "",
    "v1.2.13 - 2025-01-06:",
    "- KRITIK: Parça seçim limiti 100'den 1.000.000'a çıkarıldı",
    "- KRITIK: Backend API limitleri güncellendi",
    "- GELİŞTİRME: Büyük ölçekli dizin tarama desteği",
    "",
    "v1.2.12 - 2025-10-03:",
    "- KRITIK: Lambda closure sorunu düzeltildi (buton karışması)",
    "- KRITIK: Her buton kendi dosyasını doğru şekilde açar",
    "- GELİŞTİRME: Lambda default value kullanıldı",
    "",
    "v1.2.11 - 2025-10-03:",
    "- KRITIK: CAD dosya anahtar adları düzeltildi",
    "- KRITIK: Yanlış anahtar isimleri düzeltildi (sldprt→sldprt_files)",
    "- KRITIK: Image loading unpack hatası düzeltildi",
    "- YENİ: Doğru veri yapısı ile CAD dosyaları artık gösterilecek",
    "",
    "v1.2.10 - 2025-10-03:",
    "- KRITIK: UI queue hatası düzeltildi (ValueError: too many values to unpack)",
    "- GELİŞTİRME: Queue processing daha güvenli hale getirildi",
    "- GELİŞTİRME: DEBUG level log'lar INFO seviyesine çekildi",
    "- YENİ: Part data keys ve file listesi artık log'da görünür",
    "",
    "v1.2.9 - 2025-10-03:",
    "- GELİŞTİRME: Kapsamlı debug logging eklendi",
    "- GELİŞTİRME: CAD dosya veri yapısı analizi için log'lar",
    "- KRITIK: Part data keys ve file listesi kontrolü",
    "- YENİ: Detaylı debug mesajları ile sorun tespiti",
    "",
    "v1.2.8 - 2025-10-03:",
    "- KRITIK: CAD dosya butonları görünmeme sorunu düzeltildi",
    "- GELİŞTİRME: Lambda closure sorunları çözüldü",
    "- GELİŞTİRME: Butonlar daha belirgin hale getirildi (padding artırıldı)",
    "- YENİ: Hand cursor ve hover background efektleri",
    "",
    "v1.2.7 - 2025-10-03:",
    "- YENİ: CAD dosyaları için tıklanabilir dosya yolu linkleri",
    "- YENİ: .sldprt ve .slddrw dosyaları doğrudan açılabilir",
    "- YENİ: Link stili ile kullanıcı dostu dosya gösterimi",
    "- GELİŞTİRME: Dosya linkleri için hover efektleri ve altı çizili stil",
    "",
    "v1.2.6 - 2025-10-03:",
    "- YENİ: 2 saniye gecikmeli otomatik resim yükleme özelliği",
    "- YENİ: Sayfa açıldıktan sonra resimler otomatik yüklenir",
    "- GELİŞTİRME: Auto-load mekanizması ile kullanıcı deneyimi iyileştirildi",
    "",
    "v1.2.5 - 2025-10-03:",
    "- KRITIK: İlk açılışta resim yükleme sorunu düzeltildi",
    "- YENİ: Enhanced image loading with direct label tracking",
    "- YENİ: Cache'den resimleri hemen gösterme özelliği",
    "- GELİŞTİRME: Thread-safe image widget referans yönetimi",
    "",
    "v1.2.4 - 2025-10-03:",
    "- KRITIK: ttk.Label height sorunu düzeltildi",
    "- KRITIK: GUI crash hatası giderildi",
    "- YENİ: Frame-based image placeholder sistemi",
    "- GELİŞTİRME: PIL/Pillow kurulum script'i eklendi",
    "",
    "v1.2.3 - 2025-10-03:",
    "- YENİ: Parça detay penceresinde görsel gösterim özelliği",
    "- YENİ: Otomatik resim yükleme ve görüntüleme",
    "- GELİŞTİRME: Parça kartlarında entegre görseller",
    "- GELİŞTİRME: İmage display component'i güncellendi",
    "",
    "v1.2.2 - 2025-09-26:",
    "- KRITIK: Parça resim ve teknik resim görünmeme sorunu düzeltildi",
    "- YENİ: Server image path'leri web tarayıcısında açılma özelliği",
    "- GELİŞTİRME: Image URL helper fonksiyonu eklendi",
    "- GELİŞTİRME: Web browser integration for database images",
    "",
    "v1.2.1 - 2025-09-26:",
    "- KRITIK: TreeView güncelleme hatası düzeltildi (dict->string conversion)",
    "- KRITIK: Parça detay formu veri geçiş sorunu çözüldü (parcaAdi eksikliği)",
    "- KRITIK: Backend SQLite ILIKE syntax hatası düzeltildi",
    "- GELİŞTİRME: missingFields API response formatı düzeltildi",
    "- GELİŞTİRME: Selection manager veri yapısı iyileştirildi",
    "",
    "v1.2.0 - 2025-09-24:",
    "- MAJOR: Checkbox parca secim sistemi eklendi",
    "- MAJOR: Database entegrasyonu ve parca detay penceresi",
    "- YENİ: Scrollable parca kartlari goruntuleme",
    "- YENİ: Real-time database durum gosterimi",
    "- YENİ: Toplu parca secim kontrolleri",
    "- YENİ: Durum bazli filtreleme (tam/kismi/eksik)",
    "- YENİ: Selection istatistikleri ve callback sistemi",
    "- YENİ: Asenkron veri yukleme ve thread-safe UI",
    "- YENİ: 3 yeni Python modulu (database_client, selection_manager, part_detail_window)",
    "- GELİŞTİRME: TreeView checkbox kolonu entegrasyonu",
    "- GELİŞTİRME: Backend API genişletildi (3 yeni endpoint)",
    "- GELİŞTİRME: Hata yonetimi ve graceful degradation",
    "",
    "v1.1.1 - 2024-12-23:",
    "- KRITIK: Batch dosya encoding sorunu cozuldu",
    "- Yeni basit kurulum scriptleri eklendi",
    "- REM komutu yerine :: kullanildi",
    "- Encoding test scripti eklendi",
    "",
    "v1.1.0 - 2024-12-23:",
    "- Turkce karakter sorunu cozuldu",
    "- requirements.txt sorunu duzeltildi",
    "- Yeni kurulum scriptleri eklendi",
    "- Hata kontrolu gelistirildi",
    "- Debug modlari eklendi",
    "",
    "v1.0.0 - 2024-12-22:",
    "- Ilk surum",
    "- Temel dizin tarama ozelligi",
    "- Windows uyumlulugu",
    "- Sunucu iletisimi"
]

# Client bilgileri
CLIENT_NAME = "URTM Takip Dizin Tarama Client"
CLIENT_DESCRIPTION = "Windows tabanli CAD dosya tarama uygulamasi"

def get_version():
    """Versiyon string'ini dondur"""
    return VERSION

def get_version_full():
    """Tam versiyon string'ini dondur"""
    return VERSION_FULL

def get_version_info():
    """Detayli versiyon bilgilerini dondur"""
    return {
        'name': CLIENT_NAME,
        'version': VERSION,
        'version_full': VERSION_FULL,
        'build': VERSION_BUILD,
        'release_date': RELEASE_DATE,
        'description': CLIENT_DESCRIPTION
    }

def get_release_notes():
    """Surum notlarini dondur"""
    return RELEASE_NOTES

def print_version():
    """Versiyon bilgilerini yazdir"""
    print(f"{CLIENT_NAME}")
    print(f"Versiyon: {VERSION_FULL}")
    print(f"Cikis Tarihi: {RELEASE_DATE}")
    print(f"Aciklama: {CLIENT_DESCRIPTION}")

if __name__ == "__main__":
    print_version()
    print("\nSurum Notlari:")
    for note in get_release_notes():
        print(note)