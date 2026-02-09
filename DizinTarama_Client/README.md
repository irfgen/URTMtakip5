# ÜRTM Takip - Dizin Tarama Client

Windows tabanlı bilgisayarlarda çalışan, CAD dosyalarını tarayarak ana ÜRTM Takip sunucusuyla iletişim kuran Python uygulaması.

## 🚀 Hızlı Başlangıç

### 1. Kurulum
```bash
install.bat
```

### 2. Çalıştırma
```bash
# ÖNERİLEN - Basit çalıştırma
run.bat

# Veya doğrudan Python ile
python main.py
```

## 📋 Özellikler

- ✅ **Otomatik CAD Dosya Tarama**: .sldprt, .slddrw, .pdf dosyalarını bulur
- ✅ **Parça Bazlı Gruplandırma**: Dosyaları parça adına göre organize eder
- ✅ **Sunucu Entegrasyonu**: Ana ÜRTM Takip sistemiyle iletişim kurar
- ✅ **Windows Uyumluluğu**: Network drive'lar ve UNC path desteği
- ✅ **Kullanıcı Dostu GUI**: Tkinter tabanlı modern arayüz
- ✅ **Parça Detay Penceresi**: Parça bilgilerini görüntüleme ve düzenleme

## 🛠️ Sistem Gereksinimleri

- **OS**: Windows 10+ (64-bit)
- **Python**: 3.8+
- **RAM**: 4 GB (8 GB önerilir)
- **Network**: ÜRTM Takip sunucusuna erişim

## 📦 Dosya Yapısı

```
DizinTarama_Client/
├── main.py                 # Ana uygulama
├── database_client.py      # Veritabanı iletişim
├── part_detail_window.py   # Parça detay penceresi
├── selection_manager.py    # Seçim yöneticisi
├── windows_utils.py        # Windows yardımcıları
├── requirements.txt        # Python bağımlılıkları
├── install.bat            # Kurulum script
├── run.bat                # Çalıştırma script
├── README.md              # Bu dosya
├── LATEST_RELEASE.json    # Versiyon bilgisi
├── DZNTRM_cs/            # C# Client (alternative)
└── DZNTRM_python/        # Python Client (enhanced)
```

## ⚙️ Yapılandırma

### Sunucu Ayarları
```ini
[SERVER]
url = http://192.168.1.100:3000
timeout = 30
```

### Tarama Ayarları
```ini
[SCAN]
extensions = .sldprt,.slddrw,.pdf
exclude_folders = IPTAL,iptal,temp,Temp
max_depth = 10
```

## 🔧 Kullanım

### 1. Sunucu Bağlantısı
- Sunucu URL'sini girin
- "Bağlantıyı Test Et" butonuna tıklayın
- ✓ yeşil işareti görmelisiniz

### 2. Dizin Seçimi
- "Dizin Seç" butonuna tıklayın
- Network drive veya yerel klasör seçin
- UNC path'ler desteklenir (`\\server\share\folder`)

### 3. Tarama
- "Dizini Analiz Et" butonuna tıklayın
- Sonuçları bekleyin
- İstatistikleri ve detayları görüntüleyin

## 🔗 Network Klasörleri

### Eşlenmiş Sürücüler
```
Z:\ → \\server\engineering\cad
Y:\ → \\nas\projects\solidworks
```

### UNC Yolları
```
\\mzrktasarim.local\mzk%20makineler\
\\fileserver\shared\cad_files\
```

## 📊 Sonuç Türleri

- **Tam**: 3D + Çizim + PDF dosyaları mevcut
- **Kısmi**: Bazı dosya türleri eksik
- **Eksik**: Sadece 3D dosya var

## 🚨 Sorun Giderme

### Python Hatası
```bash
# PATH'e Python ekleyin
setx PATH "%PATH%;C:\Python39"
```

### Bağlantı Hatası
- Sunucu IP adresini kontrol edin
- Firewall ayarlarını kontrol edin
- VPN bağlantısını doğrulayın

### Dosya Erişim Hatası
- Network sürücüsünü yeniden eşleyin
- Kullanıcı izinlerini kontrol edin

## 🔒 Güvenlik

- Sadece güvenilir sunuculara bağlanın
- VPN kullanın
- Şirket politikalarına uyun
- Hassas dosyaları paylaşmayın

## 🔄 API Endpoints

Client şu endpoint'leri kullanır:

```
GET  /api/health                    # Sunucu durumu
POST /api/dizin-tarama/client-result # Sonuç gönderimi
```

## 🎯 Örnekler

### Başarılı Tarama Çıktısı
```
Toplam Parça: 89
Toplam Dosya: 245 (3D: 89, Çizim: 78, PDF: 78)
Tam Dosyalar: 67, Eksik Çizim: 11, Eksik PDF: 11
```

### Yapılandırma Örneği
```ini
[SERVER]
url = https://urtm.company.com
timeout = 60

[SCAN]
extensions = .sldprt,.slddrw,.pdf,.dwg
exclude_folders = IPTAL,OLD,BACKUP,temp
max_depth = 15
```

## 📞 Destek

- **IT Departmanı**: Ağ ve sistem sorunları
- **ÜRTM Takip Admin**: Uygulama sorunları

## 📝 Versiyon Bilgisi

En son versiyon bilgisi için `LATEST_RELEASE.json` dosyasını kontrol edin.

---

**© 2024-2025 ÜRTM Takip Sistemi** | v1.2.4+
