# ÜRTM Takip - CNC Panel ve Python Araçları Dokümantasyonu

## İçindekiler

1. [CNC Panel (ESP32)](#cnc-panel-esp32)
2. [STEP BOM Analyzer](#step-bom-analyzer)
3. [CAD Import Client](#cad-import-client)
4. [Dizin Tarama Client](#dizin-tarama-client)

---

## CNC Panel (ESP32)

### Genel Bakış

CNC Panel, ESP32 tabanlı bir IoT cihazıdır ve üretim tezgahlarının gerçek zamanlı durumunu takip etmek için kullanılır.

### Teknik Özellikler

| Özellik | Değer |
|---------|-------|
| Mikrodenetleyici | ESP32-WROOM |
| Framework | Arduino (PlatformIO) |
| Bağlantı | Wi-Fi 802.11 b/g/n |
| Güç | 5V DC |
| GPIO | CNC durum pin okuma |

### Donanım Gereksinimleri

- ESP32 geliştirme kartı
- CNC durum sinyal kablosu (GPIO 26)
- 5V güç adaptörü
- Wi-Fi bağlantısı

### Yazılım Yapısı

#### Ana Dosyalar

```
CNC_panel/
├── src/
│   └── main.cpp              # Ana program
├── include/
│   ├── config.h              # Konfigürasyon ayarları
│   ├── wifi_manager.h        # WiFi yönetimi
│   ├── cnc_monitor.h         # CNC durum izleme
│   └── cnc_link.h            # Sunucu iletişimi
├── platformio.ini            # PlatformIO konfigürasyonu
└── README.md
```

#### Ana Fonksiyonlar

**setup()**
- Seri port başlatma (115200 baud)
- WiFi bağlantısı kurma
- CNC izleme sistemi başlatma
- CNC Link sistemi başlatma
- İlk durum okuma

**loop()**
- Memory kontrolü
- WiFi yeniden bağlantı kontrolü
- CNC durum izleme (3 saniyede bir)
- CNC Link sistemi kontrolü (10 saniyede bir)
- Bekleyen kayıtları gönderme

### Konfigürasyon

#### WiFi Ayarları

```cpp
// include/config.h
#define WIFI_SSID "CNC"
#define WIFI_PASSWORD "MizrakCnc1234"
#define SERVER_ADDRESS "http://192.168.1.206:3000"
```

#### CNC Ayarları

```cpp
#define CNC_NO 13                          // CNC makine numarası
#define CNC_STATUS_PIN 26                   // Durum pin'i
#define CNC_STATUS_STOPPED 0                // Durdu
#define CNC_STATUS_RUNNING 1                // Çalışıyor
```

#### Zaman Ayarları

```cpp
#define CHECK_INTERVAL 3000                 // 3 saniye
#define DEBOUNCE_TIME 500                   // 500ms debounce
#define WIFI_RECONNECT_INTERVAL 20000       // 20 saniye
#define PARCA_GONDERIM_TIMEOUT 8000         // 8 saniye
```

### CNC Durum Kodları

| Kod | Durum | Açıklama |
|-----|-------|----------|
| 0 | STOPPED | Tezgah durmuş |
| 1 | RUNNING | Tezgah çalışıyor |
| 2 | ERROR | Hata durumu (opsiyonel) |

### API Entegrasyonu

CNC Panel, backend API ile şu endpoint'leri kullanır:

#### Durum Gönderme

```
POST /api/cnc-link/status
Content-Type: application/json

{
  "cnc_no": 13,
  "durum": 1,
  "timestamp": "2026-01-07T10:30:00Z"
}
```

#### İş Emri Sorgulama

```
GET /api/cnc-link/aktif-is-emri?cnc_no=13

Response:
{
  "is_emri_no": "IE-2026-0001",
  "parca_kodu": "P-1001",
  "adet": 100
}
```

### Offline Kayıt Sistemi

CNC Panel, internet bağlantısı kesildiğinde verileri bellekte tutar:

```cpp
#define PARCA_KAYIT_BUFFER_SIZE 100  // 100 kayıt kapasitesi
```

### Güvenlik Özellikleri

- Memory overflow koruması
- WiFi otomatik yeniden bağlantı
- Health check mekanizması
- Watchdog timer (opsiyonel)

### Hata Ayıklama

#### Seri Port Çıktısı

```
--- ESP32 CNC Durum İzleme Sistemi ---
Sistem başlatılıyor...
WiFi bağlantısı kuruldu
Sistem hazır. CNC durum izleme başlatıldı...
CNC No: 13
Free memory: 280000 bytes
✓ CNC Link sistemi sağlıklı
```

#### Memory Kontrolü

```cpp
if (freeHeap < 10000) {
    Serial.printf("⚠ Düşük memory: %u bytes\n", freeHeap);
    ESP.restart();
}
```

### Kurulum Adımları

1. **PlatformIO Yükleme**
   ```bash
   # VS Code'da PlatformIO eklentisini yükleyin
   ```

2. **WiFi Ayarlarını Düzenleme**
   ```cpp
   // include/config.h dosyasını düzenleyin
   #define WIFI_SSID "SizinWiFiAdiniz"
   #define WIFI_PASSWORD "SizinSifreniz"
   ```

3. **CNC Numarasını Ayarlama**
   ```cpp
   #define CNC_NO 13  // Her cihaz için benzersiz olmalı
   ```

4. **Derleme ve Yükleme**
   ```bash
   cd CNC_panel
   pio run
   pio run -t upload
   ```

5. **Seri Port İzleme**
   ```bash
   pio device monitor
   ```

### PlatformIO Komutları

| Komut | Açıklama |
|-------|----------|
| `pio run` | Projeyi derle |
| `pio run -t upload` | Cihaza yükle |
| `pio device monitor` | Seri port izleme |
| `pio test` | Testleri çalıştır |
| `pio run -t clean` | Derleme dosyalarını temizle |

---

## STEP BOM Analyzer

### Genel Bakış

STEP BOM Analyzer, STEP CAD dosyalarından BOM (Bill of Materials) çıkaran ve 3D render yapan Python aracıdır.

### Teknik Özellikler

| Özellik | Değer |
|---------|-------|
| Dil | Python 3.8+ |
| GUI | Tkinter |
| CAD Entegrasyonu | FreeCAD |
| Format Desteği | STEP, STP, IGES |
| Platform | Linux, Windows, macOS |

### Gereksinimler

```
Python 3.8+
FreeCAD 0.19+
pip paketleri:
  - numpy
  - matplotlib
  - trimesh
  - Pillow
  - requests
```

### Kurulum

```bash
cd STEP_BOM_Analyzer
pip install -r requirements.txt
```

### Ana Modüller

```
STEP_BOM_Analyzer/
├── main.py                      # Ana program
├── gui/
│   └── main_window.py           # Ana pencere
├── core/
│   ├── step_processor.py        # STEP işleme
│   └── bom_extractor.py         # BOM çıkarma
├── utils/
│   ├── logger.py                # Logging
│   └── config_manager.py        # Konfigürasyon
└── requirements.txt
```

### Fonksiyonellik

#### 1. STEP Dosya İşleme

```python
# STEP dosyasını okuma
from core.step_processor import STEPProcessor

processor = STEPProcessor()
assembly = processor.load_step_file("model.step")
```

#### 2. BOM Çıkarma

```python
# Hiyerarşik BOM çıkarma
bom = processor.extract_bom(assembly)

# Çıktı formatı
{
  "parca_kodu": "P-1001",
  "parca_adi": "Ana Gövde",
  "miktar": 1,
  "malzeme": "Alüminyum",
  "alt_parcalar": [...]
}
```

#### 3. 3D Render

```python
# 3D render ve thumbnail
processor.render_3d(assembly, output="thumbnail.png")
```

#### 4. Export

- JSON formatında BOM export
- Excel formatında BOM export
- CSV formatında BOM export
- XML formatında BOM export

### API Entegrasyonu

```python
import requests

# Parça doğrulama
response = requests.get(
    f"{SERVER_URL}/api/parcalar/{parca_kodu}"
)

# BOM gönderme
requests.post(
    f"{SERVER_URL}/api/boms",
    json=bom_data
)
```

### Kullanım

#### GUI Modu

```bash
python main.py
```

#### CLI Modu

```bash
# BOM çıkarma
python main.py --input model.step --output bom.json

# Thumbnail oluşturma
python main.py --input model.step --render --output thumbnail.png
```

---

## CAD Import Client

### Genel Bakış

CAD Import Client, SolidWorks dosyalarını otomatik olarak import eden ve thumbnail oluşturan Windows uygulamasıdır.

### Teknik Özellikler

| Özellik | Değer |
|---------|-------|
| Dil | Python 3.8+ |
| GUI | Tkinter |
| CAD Entegrasyonu | SolidWorks COM API |
| Platform | Windows only |
| Format Desteği | .sldprt, .sldasm, .slddrw |

### Gereksinimler

```
Windows 10/11
SolidWorks 2018+
Python 3.8+
pip paketleri:
  - pywin32
  - requests
  - pillow
```

### Kurulum

```bash
cd CAD_Import_Client
pip install -r requirements.txt
```

### Ana Modüller

```
CAD_Import_Client/
├── main.py                      # Ana program
├── gui/
│   └── main_window.py           # Ana pencere
├── core/
│   ├── server_client.py         # Sunucu iletişimi
│   └── solidworks_processor.py  # SolidWorks işleme
├── solidworks/
│   └── sw_api.py                # SolidWorks COM API
└── requirements.txt
```

### Fonksiyonellik

#### 1. SolidWorks COM Entegrasyonu

```python
import win32com.client

# SolidWorks uygulamasını başlat
sw_app = win32com.client.Dispatch("SldWorks.Application")
sw_model = sw_app.OpenDoc6("part.sldprt", 1, 0, "", 0, 0)
```

#### 2. Thumbnail Oluşturma

```python
from solidworks.sw_api import SolidWorksAPI

sw = SolidWorksAPI()
thumbnail = sw.create_thumbnail("part.sldprt")
thumbnail.save("part_thumb.png")
```

#### 3. Batch Processing

```python
# Çoklu dosya işleme
files = ["part1.sldprt", "part2.sldprt", "assembly.sldasm"]
for file in files:
    sw.process_file(file)
```

#### 4. Real-time Progress

```python
# İlerleme güncellemeleri
def on_progress(progress, filename):
    print(f"{progress}% - {filename}")

sw.set_progress_callback(on_progress)
```

### API Entegrasyonu

#### İş Başlatma

```
POST /api/cad-import/job
Content-Type: application/json

{
  "filename": "part.sldprt",
  "file_path": "C:\\CAD\\part.sldprt"
}

Response:
{
  "job_id": "job_123456",
  "status": "processing"
}
```

#### Thumbnail Gönderme

```
POST /api/cad-import/thumbnail
Content-Type: multipart/form-data

job_id: job_123456
thumbnail: [binary data]
```

#### Durum Sorgulama

```
GET /api/cad-import/status/job_123456

Response:
{
  "status": "completed",
  "thumbnail_url": "/uploads/thumbnails/part_123456.png"
}
```

### WebSocket İletişimi

```python
import asyncio
import websockets

async def send_update(job_id, status):
    async with websockets.connect(WS_URL) as ws:
        await ws.send(json.dumps({
            "type": "progress",
            "job_id": job_id,
            "status": status
        }))
```

### Kullanım

#### GUI Modu

```bash
python main.py
```

#### CLI Modu

```bash
# Tek dosya işleme
python main.py --file part.sldprt

# Batch işleme
python main.py --dir C:\\CAD\\Parts

# Thumbnail oluştur
python main.py --file part.sldprt --thumbnail-only
```

---

## Sistem Entegrasyonu

### Veri Akışı

```
┌─────────────────┐
│   CAD Import    │
│   (Windows)     │
└────────┬────────┘
         │ HTTP/WebSocket
         ▼
┌─────────────────┐
│   Backend API   │
│   (Port 3000)   │
└────────┬────────┘
         │ HTTP
         ▼
┌─────────────────┐
│   STEP BOM      │
│   Analyzer      │
└─────────────────┘

┌─────────────────┐
│   CNC Panel     │
│   (ESP32)       │
└────────┬────────┘
         │ HTTP
         ▼
┌─────────────────┐
│   Backend API   │
│   /cnc-link     │
└─────────────────┘
```

### Konfigürasyon Yönetimi

Tüm araçlar merkezi konfigürasyon kullanabilir:

```json
{
  "server_url": "http://192.168.1.206:3000",
  "api_timeout": 30000,
  "retry_count": 3,
  "log_level": "INFO"
}
```

### Hata Yönetimi

#### Retry Mekanizması

```python
# Python araçları için
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

retry = Retry(
    total=3,
    backoff_factor=1,
    status_forcelist=[500, 502, 503, 504]
)
adapter = HTTPAdapter(max_retries=retry)
session.mount('http://', adapter)
```

```cpp
// CNC Panel için
bool sendWithRetry(String url, String data, int maxRetries) {
    for (int i = 0; i < maxRetries; i++) {
        if (httpClient.POST(url, data)) {
            return true;
        }
        delay(1000 * (i + 1));
    }
    return false;
}
```

---

## Troubleshooting

### CNC Panel

| Sorun | Çözüm |
|-------|--------|
| WiFi bağlanmıyor | SSID ve şifreyi kontrol edin |
| Durum gönderilemiyor | Sunucu adresini kontrol edin |
| Memory düşük | Buffer boyutunu azaltın |
| GPIO yanlış okuma | Debounce süresini artırın |

### STEP BOM Analyzer

| Sorun | Çözüm |
|-------|--------|
| FreeCAD bulunamadı | FreeCAD'i yükleyin ve PATH'e ekleyin |
| BOM boş geliyor | STEP dosyasının yapısını kontrol edin |
| Render başarısız | OpenGL sürücüsünü güncelleyin |

### CAD Import Client

| Sorun | Çözüm |
|-------|--------|
| SolidWorks erişilemiyor | SolidWorks'ün açık olduğundan emin olun |
| Thumbnail boş | SolidWorks versiyonunu kontrol edin |
| WebSocket bağlanmıyor | Sunucu adresini kontrol edin |

---

## Dizin Tarama Client

### Genel Bakış

Dizin Tarama Client, Windows tabanlı kullanıcı bilgisayarlarında çalışan, CAD dosyalarını tarayarak ana ÜRTM Takip sunucusuyla iletişim kuran Python uygulamasıdır. Bu araç, mühendislerin ağ depolama alanlarındaki CAD dosyalarını analiz etmesine ve parça veritabanını oluşturmasına olanak tanır.

### Teknik Özellikler

| Özellik | Değer |
|---------|-------|
| Dil | Python 3.8+ |
| GUI | Tkinter |
| Platform | Windows 10+ (64-bit önerilir) |
| Desteklenen Formatlar | .sldprt, .slddrw, .pdf |
| Network | UNC path ve network drive desteği |

### Gereksinimler

```
Windows 10+ (64-bit önerilir)
Python 3.8 veya üzeri
4 GB RAM (8 GB önerilir)
Ağ bağlantısı (ÜRTM Takip sunucusuna erişim)

Python paketleri:
  - requests
  - pillow
```

### Kurulum

#### Hızlı Kurulum (ÖNERİLEN)

```bash
cd DizinTarama_Client
simple_install.bat
```

#### Alternatif Kurulum Seçenekleri

```bash
# Hızlı kurulum
quick_install.bat

# Detaylı kurulum
install.bat

# Sorun giderme modu
debug_install.bat
```

### Çalıştırma

#### Basit Çalıştırma (ÖNERİLEN)

```bash
run_simple.bat
```

#### Normal Çalıştırma

```bash
# Batch dosyası ile
run.bat

# Doğrudan Python ile
python main.py
```

### Proje Yapısı

```
DizinTarama_Client/
├── main.py                      # Ana uygulama
├── windows_utils.py             # Windows spesifik yardımcılar
├── version.py                   # Versiyon yönetimi
├── part_detail_window.py        # Parça detay penceresi
├── database_client.py           # Veritabanı istemcisi
├── selection_manager.py         # Seçim yöneticisi
├── requirements.txt             # Python gereksinimleri
├── config.ini                   # Yapılandırma (otomatik oluşur)
├── simple_install.bat           # Basit kurulum (ÖNERİLEN)
├── install.bat                  # Detaylı kurulum
├── run.bat                      # Çalıştırma script
├── run_simple.bat               # Basit çalıştırma (ÖNERİLEN)
├── KURULUM_REHBERI.md          # Detaylı kurulum rehberi
├── SORUN_GIDERME.md            # Sorun giderme kılavuzu
├── CHANGELOG.md                 # Değişiklik kaydı
├── README.md                    # Bu dosya
├── DZNTRM_python/              # Python versiyonu
└── DZNTRM_cs/                  # C# versiyonu
```

### Fonksiyonellik

#### 1. CAD Dosya Tarama

Otomatik olarak CAD dosyalarını bulur ve kategorize eder:

```python
# Desteklenen dosya formatları
extensions = [".sldprt", ".slddrw", ".pdf"]

# Hariç tutulan klasörler
exclude_folders = ["IPTAL", "iptal", "temp", "Temp"]
```

#### 2. Parça Bazlı Gruplandırma

Dosyaları parça adına göre organize eder:

```python
# Örnek çıktı
{
  "parcaAdi": "AnaGovde",
  "sldprt": ["path/to/AnaGovde.sldprt"],
  "slddrw": ["path/to/AnaGovde.slddrw"],
  "pdf": ["path/to/AnaGovde.pdf"],
  "has3D": true,
  "hasDrawing": true,
  "hasPDF": true
}
```

#### 3. Sunucu Entegrasyonu

Backend API ile iletişim kurar:

```python
# Backend API endpoint'leri
POST /api/dizin-tarama/analiz      # Dizin analizi
GET  /api/dizin-tarama/durum       # Tarama durumu
POST /api/dizin-tarama/kaydet      # Veritabanına kaydet
```

#### 4. GUI Özellikleri

- **Dizin Tarayıcı**: Network drive ve yerel klasör gezgini
- **İlerleme Göstergesi**: Tarama ilerlemesi
- **İstatistikler**: Dosya sayıları ve türleri
- **Parça Detayı**: Her parça için detaylı bilgi
- **Toplu İşlem**: Birden fazla parçayı kaydetme

### Konfigürasyon

#### config.ini

```ini
[SERVER]
url = http://192.168.1.206:3000
timeout = 30

[SCAN]
extensions = .sldprt,.slddrw,.pdf
exclude_folders = IPTAL,iptal,temp,Temp
max_depth = 10

[UI]
theme = default
language = tr
```

### API Entegrasyonu

#### Dizin Analizi

```
POST /api/dizin-tarama/analiz
Content-Type: application/json

{
  "dizinYolu": "\\\\server\\share\\CAD\\Parts"
}

Response:
{
  "success": true,
  "istatistikler": {
    "toplamParca": 150,
    "toplamSLDPRT": 120,
    "toplamSLDDRW": 130,
    "toplamPDF": 100
  },
  "parcaListesi": [...]
}
```

#### Parça Kaydetme

```
POST /api/dizin-tarama/kaydet
Content-Type: application/json

{
  "parcaListesi": [
    {
      "parcaKodu": "P-1001",
      "parcaAdi": "Ana Gövde",
      "dosyalar": {
        "sldprt": ["path/to/part.sldprt"],
        "slddrw": ["path/to/part.slddrw"],
        "pdf": ["path/to/part.pdf"]
      }
    }
  ]
}
```

### Kullanım Adımları

#### 1. Kurulum

```bash
# Basit kurulum (ÖNERİLEN)
simple_install.bat

# Encoding test ve onarım
fix_encoding.bat
```

#### 2. Başlatma

```bash
# Basit çalıştırma
run_simple.bat
```

#### 3. Sunucu Bağlantısı

1. Sunucu URL'sini girin: `http://192.168.1.206:3000`
2. "Bağlantıyı Test Et" butonuna tıklayın
3. ✓ Yeşil işaretini görmelisiniz

#### 4. Dizin Seçimi

1. "Dizin Seç" butonuna tıklayın
2. Network drive veya yerel klasör seçin
3. UNC path'ler desteklenir: `\\server\share\folder`

#### 5. Tarama

1. "Dizini Analiz Et" butonuna tıklayın
2. Sonuçları bekleyin
3. İstatistikleri ve detayları görüntüleyin

#### 6. Kayıt

1. Analiz edilen parçaları seçin
2. "Parçaları Kaydet" butonuna tıklayın
3. Onay mesajını bekleyin

### Frontend Entegrasyonu

Frontend'de `DizinTarama` bileşeni ile entegre çalışır:

```javascript
// Dizin analizi
const analiziBaslat = async (dizinYolu) => {
  const response = await axios.post('/api/dizin-tarama/analiz', {
    dizinYolu
  });
  return response.data;
};

// Parça kaydetme
const parcalariKaydet = async (parcaListesi) => {
  const response = await axios.post('/api/dizin-tarama/kaydet', {
    parcaListesi
  });
  return response.data;
};
```

### Özellikler

- ✅ **Otomatik CAD Dosya Tarama**: .sldprt, .slddrw, .pdf dosyalarını bulur
- ✅ **Parça Bazlı Gruplandırma**: Dosyaları parça adına göre organize eder
- ✅ **Sunucu Entegrasyonu**: Ana ÜRTM Takip sistemiyle iletişim kurar
- ✅ **Windows Uyumluluğu**: Network drive'lar ve UNC path desteği
- ✅ **Kullanıcı Dostu GUI**: Tkinter tabanlı modern arayüz
- ✅ **Esnek Yapılandırma**: Ayarlanabilir tarama parametreleri
- ✅ **Hata Yönetimi**: Detaylı log kayıtları ve hata raporlama
- ✅ **Toplu İşlem**: Birden fazla parçayı aynı anda kaydetme
- ✅ **İlerleme Göstergesi**: Tarama ilerlemesi görselleştirme

### Sistem Entegrasyonu (Güncellenmiş)

```
┌─────────────────┐
│   CAD Import    │
│   (Windows)     │
└────────┬────────┘
         │ HTTP/WebSocket
         ▼
┌─────────────────┐
│   Backend API   │
│   (Port 3000)   │
└────────┬────────┘
         │ HTTP
         ▼
┌─────────────────┐     ┌─────────────────┐
│   STEP BOM      │     │  Dizin Tarama   │
│   Analyzer      │     │     Client      │
└─────────────────┘     └────────┬────────┘
                                 │ HTTP
                                 ▼
                        ┌─────────────────┐
                        │   Backend API   │
                        │  /dizin-tarama  │
                        └─────────────────┘

┌─────────────────┐
│   CNC Panel     │
│   (ESP32)       │
└────────┬────────┘
         │ HTTP
         ▼
┌─────────────────┐
│   Backend API   │
│   /cnc-link     │
└─────────────────┘
```

### Troubleshooting (Güncellenmiş)

### CNC Panel

| Sorun | Çözüm |
|-------|--------|
| WiFi bağlanmıyor | SSID ve şifreyi kontrol edin |
| Durum gönderilemiyor | Sunucu adresini kontrol edin |
| Memory düşük | Buffer boyutunu azaltın |
| GPIO yanlış okuma | Debounce süresini artırın |

### STEP BOM Analyzer

| Sorun | Çözüm |
|-------|--------|
| FreeCAD bulunamadı | FreeCAD'i yükleyin ve PATH'e ekleyin |
| BOM boş geliyor | STEP dosyasının yapısını kontrol edin |
| Render başarısız | OpenGL sürücüsünü güncelleyin |

### CAD Import Client

| Sorun | Çözüm |
|-------|--------|
| SolidWorks erişilemiyor | SolidWorks'ün açık olduğundan emin olun |
| Thumbnail boş | SolidWorks versiyonunu kontrol edin |
| WebSocket bağlanmıyor | Sunucu adresini kontrol edin |

### Dizin Tarama Client

| Sorun | Çözüm |
|-------|--------|
| Python bulunamadı | Python 3.8+ yükleyin ve PATH'e ekleyin |
| Sunucuya bağlanamıyor | Sunucu URL'sini ve bağlantıyı kontrol edin |
| Tarama yapmıyor | Dizin yolunu ve izinleri kontrol edin |
| Encoding hatası | `simple_install.bat` veya `fix_encoding.bat` çalıştırın |
| Network drive erişimi | UNC path kullanın: `\\server\share\folder` |
| Kaydetme başarısız | Parça kodlarını ve API endpoint'ini kontrol edin |

---

**Son Güncelleme**: 2026-01-07
**Versiyon**: v14.26
