# ÜRTM Takip Sistemi - Client Programları Dokümantasyonu

## 🖥️ Client Programları Genel Bakış

ÜRTM Takip Sistemi, ana web uygulamasına ek olarak çeşitli platformlarda çalışan özel client programları içermektedir. Bu client programları sistemin işlevselliğini artırmak ve farklı cihazlarla entegrasyon sağlamak için geliştirilmiştir.

### 📊 Client Programları İstatistikleri

- **Toplam Client**: 4 farklı platform
- **Diller**: Python (3), C++ (1)
- **Platformlar**: Windows, ESP32, Cross-platform
- **Toplam Kod**: ~20,000+ satır
- **Entegrasyon**: HTTP API, WebSocket, Direct API

---

## 🗂️ Client Programları Yapısı

```
URTMtakip/
├── CNC_panel/              # ESP32 CNC monitoring
├── STEP_BOM_Analyzer/      # STEP file BOM extraction
├── CAD_Import_Client/      # CAD file processing
└── DizinTarama_Client/     # Directory scanning
```

---

## 🔧 1. CNC Panel (ESP32)

### 📋 Genel Bakış
ESP32 tabanlı CNC makine monitoring cihazı. Real-time olarak CNC makine durumunu takip eder ve ana sistemle iletişim kurar.

### 🏗️ Teknik Özellikler
- **Platform**: ESP32 (ESP32-DevKitC)
- **Framework**: Arduino IDE + PlatformIO
- **Connectivity**: Wi-Fi (802.11 b/g/n)
- **Power**: 5V USB veya external power supply
- **Memory**: 520KB SRAM, 4MB Flash

### 🔗 Bağlantı Özellikleri
- **Network**: Wi-Fi connection to main system
- **Protocol**: HTTP + JSON
- **Update Frequency**: State change based
- **Fallback**: Auto-reconnection

### ⚙️ Konfigürasyon

#### platformio.ini
```ini
[env:esp32dev]
platform = espressif32
board = esp32dev
framework = arduino

monitor_speed = 115200

lib_deps =
    WiFi
    HTTPClient
    bblanchon/ArduinoJson@^6.21.3
    marian-craciunescu/ESP32Ping@^1.7

build_flags =
    -D CNC_STATUS_0=0    # Idle state
    -D CNC_STATUS_1=1    # Running state
    -D CNC_STATUS_2=2    # Error/maintenance state
    -D CORE_DEBUG_LEVEL=3
    -D CONFIG_ARDUHAL_LOG_COLORS=1
```

#### config.h
```cpp
#ifndef CONFIG_H
#define CONFIG_H

// WiFi Configuration
#define WIFI_SSID "YOUR_WIFI_SSID"
#define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"

// Server Configuration
#define SERVER_HOST "192.168.1.100"
#define SERVER_PORT 3000
#define CNC_ENDPOINT "/api/cnc_link/status"

// Timing Configuration
#define CONNECTION_TIMEOUT 10000  // 10 seconds
#define UPDATE_INTERVAL 5000       // 5 seconds
#define RETRY_DELAY 30000          // 30 seconds

// CNC Status Codes
#define CNC_STATUS_IDLE 0
#define CNC_STATUS_RUNNING 1
#define CNC_STATUS_ERROR 2

#endif
```

### 🚀 Kurulum ve Çalıştırma

#### Gereksinimler
- PlatformIO IDE veya Arduino IDE
- ESP32 development board
- USB cable
- WiFi network access

#### Kurulum Adımları
```bash
# PlatformIO ile kurulum
cd CNC_panel
pio run              # Build
pio run -t upload    # Upload to ESP32
pio device monitor   # Monitor serial output

# Arduino IDE ile
1. ESP32 board manager'ı kur
2. ESP32 board'ünü seç
3. WiFi credentials'ı güncelle
4. Upload ve serial monitor
```

### 📡 API Entegrasyonu

#### Status Update Endpoint
```http
POST /api/cnc_link/status
Content-Type: application/json

{
  "device_id": "cnc_panel_001",
  "status": 1,
  "timestamp": "2024-01-01T12:00:00.000Z",
  "ip_address": "192.168.1.50",
  "signal_strength": -45
}
```

### 🔧 Maintenance ve Troubleshooting

#### Common Issues
1. **WiFi Connection Problems**
   - Check SSID and password
   - Verify signal strength
   - Restart device

2. **Server Connection Issues**
   - Verify server IP and port
   - Check network connectivity
   - Monitor serial output

3. **Power Issues**
   - Use stable power supply
   - Check voltage levels
   - Monitor power consumption

#### Monitoring
```bash
# Serial monitor
pio device monitor --port /dev/ttyUSB0 --baud 115200

# Network connectivity test
ping 192.168.1.100
```

---

## 🔬 2. STEP BOM Analyzer (Python)

### 📋 Genel Bakış
STEP dosyalarından BOM (Bill of Materials) çıkaran, 3D rendering ve thumbnail oluşturan Python uygulaması. FreeCAD API ile entegre çalışır.

### 🏗️ Teknik Özellikler
- **Language**: Python 3.8+
- **Dependencies**: FreeCAD, numpy, matplotlib, trimesh
- **Platform**: Windows (Primary), Linux (Secondary)
- **GUI**: Tkinter
- **API**: FreeCAD Python API

### 📦 Dosya Yapısı
```
STEP_BOM_Analyzer/
├── main.py                 # Ana uygulama
├── gui/
│   ├── main_window.py      # Ana GUI penceresi
│   ├── settings_dialog.py  # Ayarlar diyalogu
│   └── progress_dialog.py  # İlerleme göstergesi
├── core/
│   ├── step_processor.py   # STEP dosya işleyici
│   ├── bom_analyzer.py     # BOM analizörü
│   ├── visualizer.py       # 3D görselleştirme
│   └── thumbnail_generator.py # Thumbnail oluşturucu
├── utils/
│   ├── logger.py           # Log sistemi
│   ├── config_manager.py   # Yapılandırma yönetimi
│   └── file_utils.py       # Dosya yardımcıları
├── api/
│   └── client.py           # API client
├── requirements.txt        # Python bağımlılıkları
├── config.ini             # Yapılandırma dosyası
└── KURULUM.bat            # Otomatik kurulum script
```

### ⚙️ Kurulum

#### Otomatik Kurulum (Windows)
```bash
# Önerilen yöntem
KURULUM.bat

# Manuel kurulum
pip install -r requirements.txt
```

#### requirements.txt
```txt
FreeCAD>=0.20
numpy>=1.24.0
matplotlib>=3.7.0
trimesh>=4.0.0
requests>=2.31.0
Pillow>=10.0.0
tkinter  # Genellikle Python ile birlikte gelir
```

### 🔧 Konfigürasyon

#### config.ini
```ini
[API]
server_url = http://localhost:3000
timeout = 30
retry_attempts = 3

[FREECAD]
freecad_path = C:\Program Files\FreeCAD 0.20\bin\FreeCAD.exe
python_path = C:\Program Files\FreeCAD 0.20\bin\python.exe

[PROCESSING]
max_file_size = 100MB
thumbnail_size = 256x256
output_format = json

[GUI]
theme = default
auto_save = true
backup_count = 5
```

### 🎯 Kullanım

#### 1. Adım: FreeCAD Kurulumu
- FreeCAD'i resmi siteden indir
- Windows PATH'e ekle
- Python modüllerini kontrol et

#### 2. Adım: Uygulamayı Başlatma
```bash
# GUI ile başlatma
python main.py

# veya batch file ile
START_GUI.bat
```

#### 3. Adım: STEP Dosyası İşleme
1. "STEP Dosyası Seç" butonuna tıkla
2. İşleme seçeneklerini ayarla
3. "BOM Çıkar" butonuna tıkla
4. Sonuçları görüntüle ve dışa aktar

### 📊 Çıktı Formatları

#### BOM JSON Formatı
```json
{
  "file_info": {
    "filename": "assembly.step",
    "size": "15.2MB",
    "processed_at": "2024-01-01T12:00:00.000Z"
  },
  "assembly_hierarchy": [
    {
      "name": "Main_Assembly",
      "level": 0,
      "quantity": 1,
      "children": [
        {
          "name": "Part_001",
          "level": 1,
          "quantity": 2,
          "properties": {
            "material": "Steel",
            "mass": "2.5kg",
            "volume": "320cm³"
          }
        }
      ]
    }
  ],
  "summary": {
    "total_parts": 15,
    "unique_parts": 8,
    "total_mass": "45.2kg"
  }
}
```

### 🔗 API Entegrasyonu

#### BOM Upload Endpoint
```http
POST /api/cad-import/bom-upload
Content-Type: multipart/form-data

{
  "step_file": <binary_data>,
  "bom_data": <json_data>,
  "thumbnails": <image_files>
}
```

### 🐛 Hata Ayıklama

#### Common Issues
1. **FreeCAD Import Error**
   ```bash
   # FreeCAD Python path kontrol
   python -c "import FreeCAD; print('FreeCAD found')"
   ```

2. **STEP File Processing Error**
   ```bash
   # Dosya formatı kontrol
   python -c "import FreeCAD; doc = FreeCAD.openDocument('test.step')"
   ```

3. **Thumbnail Generation Error**
   ```bash
   # Grafik backend kontrol
   python -c "import matplotlib; print('Matplotlib OK')"
   ```

---

## 🖼️ 3. CAD Import Client (Python)

### 📋 Genel Bakış
SolidWorks otomasyon client'i. CAD dosyalarından thumbnail oluşturur ve meta-data çıkarır. Windows platformunda SolidWorks COM API kullanır.

### 🏗️ Teknik Özellikler
- **Language**: Python 3.8+
- **Framework**: Tkinter + SolidWorks COM API
- **Platform**: Windows Only
- **Dependencies**: pywin32, SolidWorks API
- **Communication**: HTTP + WebSocket

### 📦 Dosya Yapısı
```
CAD_Import_Client/
├── main.py                 # Ana uygulama
├── core/
│   ├── solidworks_client.py # SolidWorks COM client
│   ├── thumbnail_generator.py # Thumbnail oluşturucu
│   └── metadata_extractor.py  # Meta-data çıkaran
├── gui/
│   ├── main_window.py      # Ana GUI
│   ├── progress_dialog.py  # İlerleme penceresi
│   └── settings_dialog.py  # Ayarlar diyalogu
├── utils/
│   ├── config_manager.py   # Yapılandırma yönetimi
│   └── com_utils.py         # COM yardımcıları
├── api/
│   └── client.py           # API client
├── requirements.txt        # Bağımlılıklar
├── config.ini             # Yapılandırma
└── README.md               # Dokümantasyon
```

### ⚙️ Kurulum ve Gereksinimler

#### Sistem Gereksinimleri
- **OS**: Windows 10/11 (64-bit)
- **SolidWorks**: 2020 veya üzeri
- **Python**: 3.8+
- **RAM**: 8GB minimum
- **Storage**: 1GB free space

#### Kurulum Adımları
```bash
# Python bağımlılıkları
pip install -r requirements.txt

# SolidWorks COM API kaydı
# (SolidWorks kurulumu ile otomatik)
```

#### requirements.txt
```txt
pywin32>=306
requests>=2.31.0
pillow>=10.0.0
numpy>=1.24.0
tkinter  # Python ile birlikte gelir
```

### 🔧 Konfigürasyon

#### config.ini
```ini
[SOLIDWORKS]
app_path = C:\Program Files\SOLIDWORKS Corp\SOLIDWORKS
timeout = 60
auto_save = true

[PROCESSING]
thumbnail_size = 512x512
output_format = png
quality = high

[API]
server_url = http://localhost:3000
endpoint = /api/cad-import
websocket = /socket.io
```

### 🎯 Kullanım

#### 1. Adım: SolidWorks Bağlantısı
- SolidWorks'in açık olduğundan emin ol
- "SolidWorks Bağlan" butonuna tıkla
- Bağlantı durumunu kontrol et

#### 2. Adım: Dosya Seçimi
- "CAD Dosyaları Seç" butonuna tıkla
- .sldprt, .sldasm dosyalarını seç
- Toplu işleme seçeneğini kullan

#### 3. Adım: İşleme
- "İşlemeye Başla" butonuna tıkla
- İlerleme durumunu izle
- Sonuçları görüntüle

### 📊 İşleme Özellikleri

#### Desteklenen Dosya Formatları
- **Part Files**: .sldprt
- **Assembly Files**: .sldasm
- **Drawing Files**: .slddrw

#### Çıktı Formatları
- **Thumbnails**: PNG, JPG
- **Metadata**: JSON
- **3D Models**: STEP, IGES (dışa aktarım)

### 🔗 WebSocket Entegrasyonu

#### Real-time Progress Updates
```javascript
// Client-side socket connection
socket.on('cad-import-progress', (data) => {
  console.log('Progress:', data);
  // Update UI with progress
});

socket.on('cad-import-complete', (data) => {
  console.log('Complete:', data);
  // Handle completion
});
```

#### Progress Event Format
```json
{
  "client_id": "cad_client_001",
  "job_id": "job_12345",
  "progress": 75,
  "status": "processing",
  "current_file": "part_001.sldprt",
  "estimated_time": 30,
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

---

## 📁 4. Dizin Tarama Client (Python)

### 📋 Genel Bakış
Windows tabanlı dizin tarama uygulaması. CAD dosyalarını bulur, organize eder ve ana sistemle senkronize eder.

### 🏗️ Teknik Özellikler
- **Language**: Python 3.8+
- **GUI**: Tkinter
- **Platform**: Windows
- **Features**: Network scanning, UNC path support
- **Database**: SQLite (local cache)

### 📦 Dosya Yapısı
```
DizinTarama_Client/
├── main.py                 # Ana uygulama
├── database_client.py      # Veritabanı client
├── selection_manager.py    # Seçim yöneticisi
├── part_detail_window.py   # Parça detay penceresi
├── windows_utils.py        # Windows yardımcıları
├── version.py              # Versiyon yönetimi
├── DZNTRM_python/          # Python modülleri
├── DZNTRM_cs/              # C# modülleri
├── requirements.txt        # Bağımlılıklar
├── config.ini             # Yapılandırma
└── batch files/           # Kurulum scriptleri
```

### ⚙️ Kurulum

#### Hızlı Kurulum (Önerilen)
```bash
# Otomatik kurulum
simple_install.bat

# Encoding onarımı
fix_encoding.bat
```

#### Manuel Kurulum
```bash
# Python bağımlılıkları
pip install -r requirements.txt

# Yapılandırma oluştur
python main.py --init-config
```

#### requirements.txt
```txt
requests>=2.31.0
Pillow>=10.0.0
tkinter  # Python ile birlikte gelir
pywin32>=306
pathlib  # Python 3.8+ ile birlikte gelir
configparser
threading
queue
logging
```

### 🔧 Konfigürasyon

#### config.ini
```ini
[SERVER]
url = http://localhost:3000
timeout = 30
retry_attempts = 3

[SCAN]
extensions = .sldprt,.slddrw,.pdf,.step,.stp
exclude_folders = IPTAL,iptal,temp,Temp,temp2
max_depth = 10
follow_symlinks = false

[DATABASE]
cache_enabled = true
cache_duration = 3600  # 1 hour
db_path = DizinTaramaCache.db

[GUI]
theme = default
auto_refresh = 300  # 5 minutes
show_hidden = false
```

### 🎯 Kullanım

#### 1. Adım: Sunucu Bağlantısı
- Sunucu URL'sini gir
- "Bağlantıyı Test Et" butonuna tıkla
- Yeşil onay işaretini bekle

#### 2. Adım: Dizin Seçimi
- "Dizin Seç" butonuna tıkla
- Network drive veya yerel klasör seç
- UNC path desteği (`\\server\share\folder`)

#### 3. Adım: Tarama İşlemi
- "Dizini Analiz Et" butonuna tıkla
- Tarama sonuçlarını bekle
- İstatistikleri ve detayları görüntüle

#### 4. Adım: Senkronizasyon
- "Sunucuyla Senkronize Et" butonuna tıkla
- İlerleme durumunu izle
- Sonuçları ana sistemde kontrol et

### 📊 Tarama Özellikleri

#### Desteklenen Dosya Formatları
- **SolidWorks**: .sldprt, .slddrw, .sldasm
- **STEP**: .step, .stp
- **PDF**: Technical drawings
- **Image**: .jpg, .png, .bmp (thumbnail'lar için)

#### Tarama Seçenekleri
- **Recursive scanning**: Alt klasörleri dahil et
- **File size filtering**: Boyut bazlı filtreleme
- **Date filtering**: Tarih bazlı filtreleme
- **Pattern matching**: Dosya adı desenleri

### 🔗 API Entegrasyonu

#### Directory Scan Endpoint
```http
POST /api/dizin-tarama/scan
Content-Type: application/json

{
  "scan_path": "\\server\\share\\cad_files",
  "file_count": 150,
  "files": [
    {
      "name": "part_001.sldprt",
      "path": "\\server\\share\\cad_files\\part_001.sldprt",
      "size": 2048576,
      "modified": "2024-01-01T12:00:00.000Z",
      "type": "solidworks_part"
    }
  ],
  "scan_duration": 15.2
}
```

### 🔄 Otomasyon Özellikleri

#### Scheduled Scanning
```python
# Otomatik tarama (config.ini ile)
[SCHEDULE]
enabled = true
interval = 3600  # 1 hour
auto_sync = true
```

#### Batch Processing
```bash
# Toplu tarama
python main.py --batch --path="\\server\share\cad_files"

# Config file ile
python main.py --config="production_config.ini"
```

---

## 🌐 Client Programları Arası Entegrasyon

### 🔄 Veri Akışı

```
DizinTarama Client → HTTP API → Backend Database
CAD Import Client → WebSocket → Frontend Real-time
STEP BOM Analyzer → HTTP API → BOM Database
CNC Panel → HTTP API → Tezgah Durumları
```

### 📡 Ortak Protokoller

#### HTTP REST API
```javascript
// Tüm client'lar için ortak endpoint format
POST /api/{module}/{action}
Headers: {
  "Content-Type": "application/json",
  "User-Agent": "{client_name}/{version}"
}
```

#### WebSocket Events
```javascript
// Real-time events
socket.on('{client_name}-status', (data) => {
  // Client status updates
});

socket.on('{client_name}-progress', (data) => {
  // Progress updates
});

socket.on('{client_name}-complete', (data) => {
  // Completion notifications
});
```

### 🔐 Authentication & Security

#### Client Authentication
```javascript
// JWT token-based authentication
const authHeaders = {
  'Authorization': `Bearer ${jwt_token}`,
  'Client-Id': client_id,
  'Client-Version': client_version
};
```

#### Secure Communication
- HTTPS/TLS encryption
- Certificate validation
- API key authentication
- Rate limiting per client

---

## 🛠️ Development ve Maintenance

### 🔧 Development Tools

#### Python Client Development
```bash
# Virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows

# Development dependencies
pip install -r requirements-dev.txt
```

#### ESP32 Development
```bash
# PlatformIO CLI
pio project init --board esp32dev
pio lib install
pio run
```

### 📊 Monitoring ve Logging

#### Client Logs
```python
# Python logging configuration
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('client.log'),
        logging.StreamHandler()
    ]
)
```

#### Performance Metrics
```bash
# Resource monitoring
htop  # System resources
iotop # Network I/O
nethogs # Network usage per process
```

### 🔄 Update ve Deployment

#### Automated Updates
```python
# Version check
def check_for_updates():
    current_version = get_current_version()
    latest_version = get_latest_version_from_server()

    if latest_version > current_version:
        download_and_install_update()
```

#### Deployment Scripts
```bash
# Windows deployment script
deploy_client.bat:
  1. Stop running client
  2. Backup current version
  3. Download new version
  4. Install dependencies
  5. Restart client
```

---

## 🐛 Troubleshooting

### 🔧 Common Issues ve Çözümleri

#### 1. Bağlantı Problemleri
```bash
# Network connectivity test
ping server_address
telnet server_address 3000

# Firewall check
netsh advfirewall show allprofiles
netsh advfirewall firewall add rule name="URTMClients" dir=in action=allow protocol=TCP localport=3000
```

#### 2. Python Dependency Issues
```bash
# Clean install
pip uninstall -r requirements.txt -y
pip install -r requirements.txt

# Force reinstall
pip install --force-reinstall package_name
```

#### 3. ESP32 Flashing Issues
```bash
# ESP32 reset and flash
pio run -t clean
pio run -t upload --upload-port /dev/ttyUSB0
```

### 📞 Support ve Documentation

#### Log Collection
```bash
# Collect all client logs
python collect_logs.py --output=client_logs.zip
```

#### Remote Diagnostics
```python
# Remote diagnostics endpoint
POST /api/diagnostics/client-info
{
  "client_name": "STEP_BOM_Analyzer",
  "version": "3.0.0",
  "system_info": {...},
  "last_error": {...}
}
```

---

## 📚 Ek Kaynaklar

### 📖 Documentation Links
- [Python Documentation](https://docs.python.org/3/)
- [ESP32 Dev Guide](https://docs.espressif.com/projects/esp-idf/en/latest/)
- [FreeCAD API](https://wiki.freecad.org/FreeCAD_Scripting_Basics)
- [SolidWorks API](https://help.solidworks.com/2024/english/api/sldworksapi/Welcome.html)

### 🛠️ Development Tools
- **Python**: PyCharm, VS Code
- **ESP32**: PlatformIO IDE
- **Version Control**: Git + GitHub Desktop
- **Testing**: pytest, unittest

### 📡 Communication Protocols
- **HTTP/HTTPS**: REST API communication
- **WebSocket**: Real-time updates
- **TCP/IP**: Raw socket communication (ESP32)

---

*Bu dokümantasyon ÜRTM Takip Sistemi client programlarının güncel durumunu yansıtmaktadır. Son güncelleme: 2024-11-02*