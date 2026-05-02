# Import-Export Modülü Kurulum ve Kullanım Kılavuzu

Bu doküman ÜRTM Takip sistemine eklenen Import-Export modülünün kurulum ve kullanım talimatlarını içerir.

## Genel Bakış

Import-Export modülü SolidWorks CAD dosyalarını (.sldprt, .sldpart, .sldasm) otomatik olarak sisteme import edebilir. Modül dosyalardan screenshot alarak parça kayıtları oluşturur.

## Sistem Gereksinimleri

### Donanım
- Windows 10/11 işletim sistemi
- Minimum 8GB RAM (16GB önerilen)
- SSD depolama (performans için)

### Yazılım
- **SolidWorks** (herhangi bir versiyon) - COM automation için gerekli
- **Python 3.6+** (Python 3.8+ önerilen)
- **Node.js 18+** (mevcut backend gereksinimleri)

## Kurulum Adımları

### 1. Python Bağımlılıklarının Kurulumu

```bash
# Backend scripts dizinine git
cd backend/src/scripts

# Python bağımlılıklarını kur
pip install -r requirements.txt

# Ana bağımlılık: pywin32
pip install pywin32
```

### 2. SolidWorks COM Kaydı

SolidWorks'ü Administrator olarak en az bir kez çalıştırarak COM kaydını oluşturun:

```bash
# SolidWorks'ü Administrator olarak çalıştır
# Dosya > Aç/Kapat ile herhangi bir dosyayı açıp kapatın
# Bu COM registration'ı tamamlar
```

### 3. Database Migration

```bash
# Backend dizininde
cd backend

# Migration'ı çalıştır
npm run migrate

# Veya manual olarak:
node_modules/.bin/sequelize db:migrate
```

### 4. Gerekli Dizinleri Oluştur

```bash
# Backend dizininde
mkdir -p uploads/solidworks_screenshots
chmod 755 uploads/solidworks_screenshots
```

### 5. Environment Variables (Opsiyonel)

`.env` dosyasına ekleyebilir veya sistem environment variables olarak ayarlayabilirsiniz:

```env
# SolidWorks ayarları
SOLIDWORKS_TIMEOUT=30000
SOLIDWORKS_VISIBLE=false
SOLIDWORKS_LOG_LEVEL=INFO
SCREENSHOT_WIDTH=800
SCREENSHOT_HEIGHT=600

# Import ayarları
IMPORT_MAX_FILES=1000
IMPORT_PROCESSING_DELAY=100
IMPORT_LOG_LEVEL=info
```

## Test ve Doğrulama

### 1. SolidWorks Bağlantı Testi

```bash
cd backend/src/scripts
python test_solidworks.py
```

**Başarılı çıktı örneği:**
```
✅ Python sürümü uygun
✅ pywin32 kurulu
✅ pythoncom erişilebilir
✅ SolidWorks bulundu - Sürüm: 2023
✅ Wrapper SolidWorks bağlantısı başarılı
🎉 Tüm testler başarılı!
```

### 2. Manuel Test

```bash
# Test için örnek komut (SolidWorks dosyası gerekli)
cd backend/src/scripts
python solidworks_wrapper.py "C:\path\to\test.sldprt" "C:\temp\test_output.png"
```

### 3. API Test

Sistem çalıştıktan sonra:

```bash
# SolidWorks bağlantı testi
curl http://localhost:5000/api/import-export/test-solidworks

# Import durumu
curl http://localhost:5000/api/import-export/status
```

## Kullanım

### 1. Sisteme Giriş

- Web arayüzünde `Import-Export` menüsüne tıklayın
- Genel Durum sekmesinde sistem durumunu kontrol edin

### 2. Klasör İndeksleme

1. **Klasör Seç** butonuna tıklayın
2. SolidWorks dosyalarının bulunduğu klasör yolunu girin
   - Örnek: `C:\CAD_Files\SolidWorks\`
3. **İndeksle** butonuna tıklayın
4. Sistem klasör ve alt klasörlerdeki tüm `.sldprt`, `.sldpart`, `.sldasm` dosyalarını tarar

### 3. Tekil Import

1. **Dosya Listesi** sekmesine gidin
2. "Import Hazır" durumundaki dosyaları göreceksiniz
3. Her dosya için **Import Et** butonuna tıklayarak tekil import yapabilirsiniz

### 4. Toplu Import

1. **Genel Durum** sekmesinde **Başlat** butonuna tıklayın
2. Sistem tüm hazır dosyaları otomatik olarak import eder
3. İlerleme çubuğundan durumu takip edebilirsiniz
4. **Durdur** butonu ile işlemi iptal edebilirsiniz

### 5. İstatistikleri İnceleme

- **İş Geçmişi** sekmesinde geçmiş import işlerini görüntüleyebilirsiniz
- **İstatistikler** sekmesinde genel performans metriklerini inceleyebilirsiniz

## Dosya Yapısı

```
backend/
├── src/
│   ├── controllers/importExportController.js    # API Controller
│   ├── routes/importExportRoutes.js            # API Routes
│   ├── services/importService.js               # İş mantığı
│   ├── models/
│   │   ├── ImportIndex.js                      # İndeks tablosu modeli
│   │   └── ImportJob.js                        # İş takip modeli
│   ├── config/importConfig.js                  # Konfigürasyon
│   ├── scripts/
│   │   ├── solidworks_wrapper.py               # SolidWorks COM wrapper
│   │   ├── test_solidworks.py                  # Test script
│   │   └── requirements.txt                    # Python bağımlılıkları
│   └── migrations/20250119000001-create-import-tables.js
└── uploads/solidworks_screenshots/             # Screenshot çıktıları

frontend/
├── src/
│   ├── pages/ImportExport.jsx                  # Ana sayfa
│   └── components/Layout.jsx                   # Menu güncellemesi
```

## Veritabanı Yapısı

### import_index Tablosu
- `id`: Primary key
- `full_path`: Dosya tam yolu (unique)
- `file_name`: Dosya adı (uzantısız)
- `extension`: Dosya uzantısı
- `status`: İşlem durumu (pending, exists, ready_to_import, importing, imported, failed)
- `hash`: Dosya hash'i (değişiklik kontrolü için)
- `error_message`: Hata mesajı

### import_job Tablosu
- `id`: Primary key
- `job_name`: İş adı
- `started_at`: Başlangıç zamanı
- `finished_at`: Bitiş zamanı
- `total`: Toplam dosya sayısı
- `success_count`: Başarılı sayısı
- `fail_count`: Başarısız sayısı
- `state`: İş durumu (running, completed, canceled, failed)
- `config`: JSON konfigürasyon

## API Endpoints

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | `/api/import-export/index-folder` | Klasör indeksleme |
| GET | `/api/import-export/index-list` | İndeks listesi |
| GET | `/api/import-export/status` | Durum bilgisi |
| POST | `/api/import-export/import-single/:id` | Tekil import |
| POST | `/api/import-export/bulk-import` | Toplu import başlat |
| POST | `/api/import-export/stop-bulk-import` | Toplu import durdur |
| GET | `/api/import-export/job-history` | İş geçmişi |
| GET | `/api/import-export/statistics` | İstatistikler |
| GET | `/api/import-export/test-solidworks` | SolidWorks test |

## Sorun Giderme

### 1. SolidWorks COM Hatası

**Problem**: `SolidWorks COM hatası: Invalid class string`

**Çözüm**:
```bash
# SolidWorks'ü Administrator olarak çalıştır
# Alternatif: COM registration manual
regsvr32 "C:\Program Files\SOLIDWORKS Corp\SOLIDWORKS\sldworks.tlb"
```

### 2. Python Import Hatası

**Problem**: `ModuleNotFoundError: No module named 'win32com'`

**Çözüm**:
```bash
pip install --upgrade pywin32
python -c "import win32com.client; print('OK')"
```

### 3. Screenshot Boş

**Problem**: PNG dosyası oluşuyor ama boş

**Çözümler**:
- SolidWorks'ü görünür modda çalıştırmayı deneyin: `SOLIDWORKS_VISIBLE=true`
- Timeout süresini artırın: `SOLIDWORKS_TIMEOUT=60000`
- Model karmaşıklığını kontrol edin

### 4. Performance Sorunları

**Problem**: Import çok yavaş

**Çözümler**:
- `IMPORT_PROCESSING_DELAY` değerini azaltın (varsayılan: 100ms)
- `concurrentModels` değerini artırın (dikkatli - SolidWorks için genelde 1)
- SSD kullanın ve anti-virüs exception'ı ekleyin

### 5. Memory Hatası

**Problem**: `MemoryError` veya `COM object has been disconnected`

**Çözümler**:
```env
IMPORT_MEMORY_LIMIT_MB=1024
SOLIDWORKS_TIMEOUT=15000
```

## Performans Optimizasyonu

### Önerilen Ayarlar

**Küçük projeler** (< 100 dosya):
```env
IMPORT_PROCESSING_DELAY=50
SOLIDWORKS_TIMEOUT=20000
SCREENSHOT_WIDTH=600
SCREENSHOT_HEIGHT=450
```

**Büyük projeler** (> 500 dosya):
```env
IMPORT_PROCESSING_DELAY=200
SOLIDWORKS_TIMEOUT=45000
IMPORT_MAX_FILES=100
SOLIDWORKS_VISIBLE=false
```

### Sistem Optimizasyonu

1. **SSD kullanın** - HDD ile 3-5x daha yavaş
2. **Anti-virüs exception** - Python ve SolidWorks için
3. **Background uygulamaları** - Kapatın (özellikle CAD programları)
4. **Admin hakları** - SolidWorks ve Python için

## Güvenlik Notları

- **Admin hakları**: SolidWorks COM automation admin hakları gerektirir
- **Dosya erişimi**: Python script'i full file system erişimi gerektirir
- **Network**: Backend sadece local network'te çalışacak şekilde konfigüre edin
- **Sandbox**: Production ortamında Python script'ini sandbox ortamında çalıştırın

## Destek ve Geliştirme

### Log Dosyaları

```bash
# Backend logları
tail -f backend/error.log
tail -f backend/combined.log

# Python logları (eğer file handler eklenirse)
tail -f backend/solidworks_import.log
```

### Debug Modu

```env
NODE_ENV=development
IMPORT_LOG_LEVEL=debug
SOLIDWORKS_LOG_LEVEL=DEBUG
IMPORT_LOG_TIMINGS=true
```

### Test Modu

```env
IMPORT_TEST_MODE=true
IMPORT_MOCK_SCREENSHOTS=true
```

Test modunda gerçek SolidWorks işlemleri yapılmaz, mock veriler kullanılır.

---

## Sık Sorulan Sorular

**S: Hangi SolidWorks versiyonları destekleniyor?**
C: 2010 ve sonrası tüm versiyonlar. COM API geriye uyumludur.

**S: Network drive'daki dosyalar destekleniyor mu?**
C: Evet, ancak performance düşük olabilir. Local kopyalama önerilir.

**S: Montaj dosyaları (.sldasm) import edilebilir mi?**
C: Evet, ancak alt parça referansları otomatik çözümlenmez.

**S: Toplu import sırasında SolidWorks kapanırsa ne olur?**
C: Sistem otomatik recovery yapar ve kaldığı yerden devam eder.

**S: Screenshot kalitesi artırılabilir mi?**
C: Evet, `SCREENSHOT_WIDTH` ve `SCREENSHOT_HEIGHT` environment variables ile.

---

Bu dokümanda bulunmayan konular için sistem loglarını kontrol edin veya geliştirici ile iletişime geçin.