# ÜRTM Takip - Dizin Tarama Client

Windows tabanlı kullanıcı bilgisayarlarında çalışan, CAD dosyalarını tarayarak ana ÜRTM Takip sunucusuyla iletişim kuran Python uygulamasıdır.

## 🚀 Hızlı Başlangıç

### 1. Kurulum
```bash
# Basit kurulum (ÖNERİLEN - Encoding sorunu çözülmüş)
simple_install.bat

# Encoding test ve onarım
fix_encoding.bat

# Alternatif kurulum seçenekleri
quick_install.bat
install.bat
debug_install.bat
```

### 2. Çalıştırma
```bash
# Basit çalıştırma (ÖNERİLEN)
run_simple.bat

# Normal kullanım
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
- ✅ **Esnek Yapılandırma**: Ayarlanabilir tarama parametreleri
- ✅ **Hata Yönetimi**: Detaylı log kayıtları ve hata raporlama

## 🛠️ Sistem Gereksinimleri

- **OS**: Windows 10+ (64-bit önerilir)
- **Python**: 3.8 veya üzeri
- **RAM**: 4 GB (8 GB önerilir)
- **Network**: ÜRTM Takip sunucusuna erişim

## 📦 Dosya Yapısı

```
DizinTarama_Client/
├── main.py                 # Ana uygulama
├── windows_utils.py        # Windows spesifik yardımcılar
├── version.py             # Versiyon yönetimi
├── requirements.txt        # Python gereksinimleri
├── quick_install.bat      # Hızlı kurulum script (ÖNERİLEN)
├── install.bat            # Detaylı kurulum script
├── run.bat               # Çalıştırma script
├── debug_install.bat     # Sorun giderme script
├── KURULUM_REHBERI.md    # Detaylı kurulum rehberi
├── README.md             # Bu dosya
└── config.ini            # Yapılandırma (otomatik oluşur)
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

## 📝 Log Dosyaları

Sorun yaşadığınızda `dizin_tarama.log` dosyasını kontrol edin:

```
2024-01-15 10:30:45 - INFO - Sunucu bağlantısı başarılı
2024-01-15 10:31:20 - INFO - Dizin taraması başlatıldı: Z:\CAD_Files
2024-01-15 10:32:15 - INFO - 245 dosya bulundu, 89 parça gruplandırıldı
```

## 🔒 Güvenlik

- Sadece güvenilir sunuculara bağlanın
- VPN kullanın
- Şirket politikalarına uyun
- Hassas dosyaları paylaşmayın

## 📞 Destek

- **IT Departmanı**: Ağ ve sistem sorunları
- **ÜRTM Takip Admin**: Uygulama sorunları
- **Kurulum Rehberi**: `KURULUM_REHBERI.md`

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

---

**© 2024 ÜRTM Takip Sistemi**