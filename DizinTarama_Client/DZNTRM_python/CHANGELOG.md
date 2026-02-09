# URTM Takip - Dizin Tarama Client Değişiklik Günlüğü

Bu dosya projenin tüm önemli değişikliklerini belgeler.

Versiyon formatı: [Semantic Versioning](https://semver.org/) (MAJOR.MINOR.PATCH)

## [v1.1.1] - 2024-12-23

### 🚨 KRITIK DÜZELTME
- **Batch dosya encoding sorunu** tamamen çözüldü
- **`'EM' is not recognized` hatası** düzeltildi
- **`REM` komutları** `::` ile değiştirildi

### ✅ Eklenen
- **`simple_install.bat`** - En basit kurulum scripti (ÖNERİLEN)
- **`run_simple.bat`** - Basit çalıştırma scripti
- **`fix_encoding.bat`** - Encoding test ve onarım aracı
- **Gelişmiş dosya kontrolleri** - Eksik dosya uyarıları

### 🔧 Düzeltilen
- **Windows batch encoding** sorunları
- **Komut tanınmama** hataları
- **Türkçe karakter** görüntüleme sorunları

---

## [v1.1.0] - 2024-12-23

### ✅ Eklenen
- **Versiyon yönetim sistemi** (`version.py`)
- **Hızlı kurulum scripti** (`quick_install.bat`)
- **Sorun giderme scripti** (`debug_install.bat`)
- **"Hakkında" dialog'u** (versiyon bilgileri ve sürüm notları)
- **UTF-8 encoding desteği** (Turkish character desteği)
- **Gelişmiş hata kontrolü** (dosya varlığı, internet bağlantısı)
- **Manuel paket kurulum yedekleme sistemi**

### 🔧 Düzeltilen
- **Türkçe karakter sorunu** (`chcp 65001` eklendi)
- **requirements.txt bulunamıyor hatası** (manuel kurulum alternatifi)
- **Encoding sorunları** (tüm batch dosyalarında UTF-8)
- **Dosya eksikliği kontrolleri** iyileştirildi
- **Python/PIP kurulum doğrulaması** geliştirildi

### 🎨 Değiştirilen
- **GUI başlık çubuğu** dinamik versiyon gösterir
- **Ana pencere** versiyon bilgisi eklendi
- **Alt bar** "Hakkında" butonu eklendi
- **Kurulum scriptleri** Türkçe karaktersiz
- **Download endpoint** yeni dosyaları içerir

### 🗑️ Kaldırılan
- **Gereksiz requirements.txt yorumları**
- **Kullanılmayan import'lar**

---

## [v1.0.0] - 2024-12-22

### ✅ İlk Sürüm
- **Temel dizin tarama özelliği**
- **CAD dosya tanıma** (.sldprt, .slddrw, .pdf)
- **Parça bazlı gruplandırma**
- **Windows uyumluluğu** ve network drive desteği
- **Sunucu API entegrasyonu**
- **GUI arayüz** (Tkinter)
- **Yapılandırma sistemi** (config.ini)
- **Logging sistemi**
- **Otomatik kurulum scriptleri**

---

## Versiyon Planlama

### [v1.2.0] - Planlanan
- [ ] **Otomatik güncelleme** sistemi
- [ ] **Çoklu dizin** tarama desteği
- [ ] **Tarama geçmişi** ve rapor kaydetme
- [ ] **Gelişmiş filtreleme** seçenekleri
- [ ] **Dark mode** tema desteği

### [v1.3.0] - Planlanan
- [ ] **Tarama zamanlaması** (cronjob benzeri)
- [ ] **Email bildirimleri**
- [ ] **Excel export** özelliği
- [ ] **Gelişmiş istatistikler**

---

## Katkıda Bulunma

1. Değişiklik yap
2. `version.py` dosyasında versiyon numarasını artır
3. Bu dosyaya değişiklikleri ekle
4. Test et ve commit et

## Versiyon Numaralandırma Kuralları

- **MAJOR**: Geriye dönük uyumsuz değişiklikler
- **MINOR**: Yeni özellikler (geriye dönük uyumlu)
- **PATCH**: Hata düzeltmeleri
- **BUILD**: YYYYMMDDXXX formatında build numarası

Örnek: `1.1.0.20241223001`