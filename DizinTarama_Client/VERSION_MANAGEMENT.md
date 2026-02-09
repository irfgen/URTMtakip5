# ÜRTM Takip - Versiyon Yönetimi ve Otomatik Release Sistemi

## 🎯 Amaç
Dizin Tarama Client için otomatik versiyon yönetimi ve paketleme sistemi. Eski versiyon paketlerinin yanlışlıkla indirilmesini engeller ve her değişiklikle birlikte yeni versiyonun otomatik paketlenmesini sağlar.

## 🔧 Sistem Bileşenleri

### 1. **version.py** - Versiyon Bilgi Deposu
- Mevcut versiyon numarası (MAJOR.MINOR.PATCH)
- Build timestamp ve release tarihi
- Changelog/release notes
- Client bilgileri

### 2. **bump_version.py** - Versiyon Artırma
- Otomatik versiyon numarası artırma (patch/minor/major)
- version.py dosyasını güncelleme
- Changelog ekleme
- Otomatik build tetikleme

### 3. **build_package.py** - Paket Oluşturma
- Eski paketleri temizleme
- Yeni paket klasörü oluşturma (__pycache__ hariç)
- ZIP ve TAR.GZ arşivleri oluşturma
- Paket bilgileri (JSON) oluşturma
- Deployment scripti hazırlama

### 4. **update_download_links.py** - Web Deployment
- Web sunucusundaki eski dosyaları temizleme
- Yeni paketleri web dizinine kopyalama
- API endpoints oluşturma (latest.json)
- Sabit download linkleri (symlinks)
- HTML download sayfası güncelleme

### 5. **release.py** - Tam Otomatik Release
- Tüm işlemleri sırayla çalıştırma
- Version bump → Build → Deploy
- Hata yönetimi ve geri bildirim
- Release raporu oluşturma

## 🚀 Kullanım Kılavuzu

### Hızlı Release (Önerilen)
```bash
# Patch release (bug fix)
python release.py patch "Bug düzeltmeleri" --deploy

# Minor release (yeni özellik)
python release.py minor "Checkbox seçim sistemi eklendi" --deploy

# Major release (breaking changes)
python release.py major "API v2.0 - Breaking changes" --deploy
```

### Manuel İşlemler

#### 1. Sadece Versiyon Artırma
```bash
python bump_version.py patch "Bug fix açıklaması"
python bump_version.py minor "Yeni özellik açıklaması"
python bump_version.py major "Breaking change açıklaması"
```

#### 2. Sadece Paket Build
```bash
python build_package.py
```

#### 3. Sadece Web Deployment
```bash
sudo python update_download_links.py
```

## 📁 Dosya Yapısı

```
DizinTarama_Client/
├── version.py                    # Versiyon bilgileri
├── bump_version.py              # Versiyon artırma scripti
├── build_package.py             # Paket oluşturma scripti
├── update_download_links.py     # Web deployment scripti
├── release.py                   # Tam otomatik release scripti
├── VERSION_MANAGEMENT.md        # Bu dosya
└── ... (diğer client dosyaları)

# Build sonuçları (parent directory'de):
../URTM_DizinTarama_Client_v1.2.0/          # Paket klasörü
../URTM_DizinTarama_Client_v1.2.0.zip       # Windows paketi
../URTM_DizinTarama_Client_v1.2.0.tar.gz    # Linux paketi
../LATEST_RELEASE.json                       # İndirme bilgileri
../deploy.sh                                 # Deployment scripti
```

## 🎯 Versiyon Numaralandırma

### MAJOR.MINOR.PATCH Sistemi
- **MAJOR**: Breaking changes, API değişiklikleri (1.x.x → 2.0.0)
- **MINOR**: Yeni özellik, geriye uyumlu (1.2.x → 1.3.0)
- **PATCH**: Bug fix, küçük değişiklik (1.2.0 → 1.2.1)

### Build Number
- Format: YYYYMMDDXXX (örn: 20250924001)
- YYYY: Yıl
- MM: Ay
- DD: Gün
- XXX: Gün içindeki build sırası (001, 002, ...)

## 🌐 Web Deployment Detayları

### Dizin Yapısı
```
/var/www/urtmtakip/
├── downloads/
│   ├── URTM_DizinTarama_Client_v1.2.0.zip
│   ├── URTM_DizinTarama_Client_v1.2.0.tar.gz
│   ├── latest.zip → URTM_DizinTarama_Client_v1.2.0.zip
│   ├── latest.tar.gz → URTM_DizinTarama_Client_v1.2.0.tar.gz
│   └── latest.json
├── api/
│   └── dizin-tarama-latest.json
└── dizin-tarama-download.html
```

### API Endpoints
- `GET /api/dizin-tarama-latest.json` - Latest versiyon bilgisi
- `GET /downloads/latest.json` - İndirme linkleri
- `GET /downloads/latest.zip` - Son Windows paketi
- `GET /downloads/latest.tar.gz` - Son Linux paketi

## 🔒 Güvenlik ve İzinler

### Web Deployment İzinleri
```bash
# Web sunucu dosyalarına yazma izni
sudo chown -R urtmtakip:www-data /var/www/urtmtakip/
sudo chmod -R 755 /var/www/urtmtakip/
sudo chmod -R 644 /var/www/urtmtakip/downloads/*
```

### Script İzinleri
```bash
chmod +x *.py
chmod +x deploy.sh
```

## 🐛 Sorun Giderme

### Build Hataları
```bash
# Manual cleanup
rm -rf ../URTM_DizinTarama_Client_v*
python build_package.py
```

### Web Deployment Hataları
```bash
# İzin kontrolü
ls -la /var/www/urtmtakip/downloads/

# Manuel symlink
sudo ln -sf URTM_DizinTarama_Client_v1.2.0.zip /var/www/urtmtakip/downloads/latest.zip
```

### Version Conflict
```bash
# version.py manual düzenleme
nano version.py

# Force rebuild
python build_package.py
```

## 📋 Örnek Release Senaryoları

### 1. Bug Fix Release
```bash
# Mevcut: v1.2.0
python release.py patch "TreeView checkbox click hatası düzeltildi" --deploy
# Sonuç: v1.2.1
```

### 2. Feature Release
```bash
# Mevcut: v1.2.1
python release.py minor "Export to Excel özelliği eklendi" --deploy
# Sonuç: v1.3.0
```

### 3. Breaking Change Release
```bash
# Mevcut: v1.3.0
python release.py major "Database API v2.0 - Yeni authentication sistemi" --deploy
# Sonuç: v2.0.0
```

### 4. Test Release (Deploy olmadan)
```bash
python release.py patch "Test değişiklikleri"
# Sadece build yapar, deploy yapmaz
```

## ✅ Release Checklist

### Her Release Öncesi:
- [ ] Kod testleri tamamlandı mı?
- [ ] CHANGELOG.md güncellendi mi?
- [ ] Breaking changes dokümante edildi mi?
- [ ] Version type doğru seçildi mi? (patch/minor/major)

### Release Sonrası:
- [ ] İndirme linkleri çalışıyor mu?
- [ ] Web sayfası güncel mi?
- [ ] API endpoint'ler yanıt veriyor mu?
- [ ] Git commit ve tag oluşturuldu mu?

## 🎉 Faydaları

### ✅ Problem Çözüldü:
- **Eski Versiyon Sorunu**: Eski paketler otomatik temizlenir
- **Manuel Hata**: Otomatik süreç, insan hatası riski düşük
- **Versiyon Karışıklığı**: Tek doğruluk kaynağı (version.py)
- **Deployment Tutarsızlığı**: Otomatik web güncelleme

### ✅ Yeni Avantajlar:
- **Hızlı Release**: Tek komutla tam süreç
- **Tutarlı Paketleme**: Her seferinde aynı yapı
- **API Entegrasyonu**: Otomatik endpoint güncelleme
- **Backup**: Otomatik eski versiyon arşivleme

---

**🎊 Artık her değişiklikle birlikte yanlışlıkla eski versiyon indirilemeyecek!**