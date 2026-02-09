# ÜRTM Takip - Dizin Tarama Client v1.2.0
## Windows Kurulum ve Kullanım Kılavuzu

### 🚀 Hızlı Başlangıç

1. **setup_windows.bat** dosyasını çift tıklayarak çalıştırın
2. Kurulum tamamlandıktan sonra: `python main.py`

### 📋 Manuel Kurulum

Windows Command Prompt veya PowerShell'de:

```cmd
# Pip ile gerekli paketleri yükle
pip install requests

# Uygulamayı çalıştır
python main.py
```

### ⚠️ Hata Çözümleri

#### "ModuleNotFoundError: No module named 'requests'"
```cmd
pip install requests
```

#### "ModuleNotFoundError: No module named 'tkinter'"
- **Windows**: Python 3.x ile birlikte gelir, Python'u yeniden yükleyin
- **Çözüm**: Python kurulumunda "tcl/tk and IDLE" seçeneğinin işaretli olduğundan emin olun

#### Python Bulunamıyor Hatası
1. Python'un yüklü olduğundan emin olun: https://python.org/downloads
2. PATH değişkenine Python'un eklendiğinden emin olun
3. Alternatif: `py main.py` komutunu deneyin

### 🔧 Sistem Gereksinimleri

- **Python**: 3.8 veya üzeri
- **İşletim Sistemi**: Windows 10/11
- **RAM**: En az 512MB
- **Disk Alanı**: 50MB
- **Ağ**: ÜRTM Takip sunucusuna erişim (isteğe bağlı)

### 🎯 v1.2.0 Yeni Özellikler

#### ✨ Checkbox Seçim Sistemi
- Tarama sonuçlarında parça seçimi için checkbox'lar
- Tümünü seç/seçimi temizle butonları
- Durum bazlı filtreleme (tam/kısmi/eksik)

#### 📊 Database Entegrasyonu
- Parça bilgileri ÜRTM Takip sunucusundan çekilir
- Eksik alanların otomatik tespiti
- Real-time database durumu gösterimi

#### 🎨 Detaylı Parça Görünümü
- Seçili parçalar için ayrı detay penceresi
- Scrollable parça kartları
- Dosya açma ve görüntüleme bağlantıları

### 📁 Dosya Yapısı

```
DizinTarama_Client/
├── main.py                 # Ana uygulama
├── database_client.py      # Database entegrasyonu (v1.2.0)
├── selection_manager.py    # Seçim yönetimi (v1.2.0)
├── part_detail_window.py   # Detay penceresi (v1.2.0)
├── version.py              # Versiyon bilgileri
├── windows_utils.py        # Windows yardımcıları
├── requirements.txt        # Python bağımlılıkları
├── setup_windows.bat       # Otomatik kurulum
├── config.ini              # Yapılandırma (otomatik oluşur)
└── dizin_tarama.log        # Log dosyası
```

### ⚙️ Yapılandırma

İlk çalıştırmada `config.ini` otomatik oluşturulur:

```ini
[SERVER]
url = http://localhost:3000
timeout = 30

[SCAN]
extensions = .sldprt,.slddrw,.pdf
exclude_folders = IPTAL,iptal,temp,Temp
max_depth = 10

[UI]
last_directory =
auto_scan_interval = 0
```

### 🐛 Sorun Giderme

#### Uygulama Açılmıyor
1. Command prompt'da çalıştırarak hata mesajını görün
2. `dizin_tarama.log` dosyasını kontrol edin
3. Python ve tkinter kurulumunu doğrulayın

#### Database Bağlantı Hatası
1. ÜRTM Takip sunucusunun çalıştığından emin olun
2. `config.ini` dosyasında sunucu URL'ini kontrol edin
3. Ağ bağlantısını test edin

#### Seçim Sistemi Çalışmıyor
1. v1.2.0 özelliği - tüm dosyaların güncel olduğundan emin olun
2. Database bağlantısı olmadan da çalışır (degraded mode)

### 💡 İpuçları

- **Network Drive**: Mapped drive'ları tarayabilirsiniz
- **Çoklu Seçim**: Ctrl+Click ile birden fazla parça seçin
- **Detay Görünüm**: Parçaya çift tıklayarak hızla detay görün
- **Toplu İşlemler**: Filtrelerle hızlı parça grupları seçin

### 📞 Destek

Sorun yaşadığınızda:
1. `dizin_tarama.log` dosyasını kontrol edin
2. Sistem bilgilerini toplayın (Python versiyon, Windows versiyon)
3. Hata mesajının tam metnini kaydedin

---

**v1.2.0 - Geliştirilmiş Parça Seçimi ve Database Entegrasyonu**