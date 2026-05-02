# CAD Import Client

ÜRTM Takip Sistemi için Python tabanlı SolidWorks CAD dosya import client'ı.

## Özellikler

- 🔧 **SolidWorks COM Automation**: Otomatik dosya açma ve thumbnail oluşturma
- 📁 **Dosya Sistemi Tarama**: Klasörlerde CAD dosyalarını bulma ve indeksleme
- 🌐 **Server İletişimi**: HTTP API ve WebSocket ile real-time iletişim
- 🖥️ **GUI Interface**: Kullanıcı dostu Tkinter arayüzü
- 📊 **İlerleme Takibi**: Real-time import ilerlemesi ve durum güncelleme
- 📝 **Loglama**: Detaylı işlem kayıtları

## Desteklenen Dosya Formatları

- `.sldprt` - SolidWorks Part dosyaları
- `.sldpart` - SolidWorks Part dosyaları (alternatif uzantı)
- `.sldasm` - SolidWorks Assembly dosyaları

## Sistem Gereksinimleri

### Yazılım Gereksinimleri
- **Windows 10/11** (SolidWorks COM automation için)
- **Python 3.8+**
- **SolidWorks 2018+** (COM automation destekli)
- **Internet bağlantısı** (ÜRTM Takip server'ına erişim için)

### Python Bağımlılıkları
```bash
pip install -r requirements.txt
```

## Kurulum

### 1. Repository'yi Clone Edin
```bash
git clone <repository-url>
cd CAD_Import_Client
```

### 2. Bağımlılıkları Yükleyin
```bash
pip install -r requirements.txt
```

### 3. Konfigürasyonu Düzenleyin
`config.ini` dosyasını düzenleyerek server URL'ini ve diğer ayarları yapılandırın:

```ini
[SERVER]
url = http://192.168.1.206:3000
api_base = /api/cad-import
socket_namespace = /cad-import

[CLIENT]
client_name = CAD Import Client - YourName

[SOLIDWORKS]
timeout_seconds = 120
concurrent_models = 1
```

## Kullanım

### 1. Backend Server'ın Çalıştığından Emin Olun
ÜRTM Takip backend server'ının çalışır durumda olması gerekir.

### 2. Client'ı Başlatın
```bash
python main.py
```

### 3. İş Akışı
1. **Server Bağlantısı**: Uygulama otomatik olarak server'a bağlanır
2. **SolidWorks Bağlantısı**: "SolidWorks'e Bağlan" butonuna tıklayın
3. **Klasör Seçimi**: CAD dosyalarının bulunduğu klasörü seçin
4. **Tarama**: "Tara" butonuna tıklayarak dosyaları bulun
5. **Parça Kontrolü**: "Parça Kontrolü" ile hangi dosyaların eksik olduğunu öğrenin
6. **Import**: "Eksikleri İmport Et" ile thumbnail'ları oluşturup server'a gönderin

## Mimari

### Klasör Yapısı
```
CAD_Import_Client/
├── main.py                 # Ana giriş noktası
├── config.ini              # Konfigürasyon dosyası
├── requirements.txt        # Python bağımlılıkları
├── gui/                    # GUI modülleri
│   ├── __init__.py
│   └── main_window.py      # Ana pencere
├── core/                   # Core işlevsellik
│   ├── __init__.py
│   ├── server_client.py    # Server iletişimi
│   ├── solidworks_api.py   # SolidWorks COM automation
│   └── file_scanner.py     # Dosya sistemi tarama
└── utils/                  # Yardımcı modüller
    ├── __init__.py
    ├── config_manager.py    # Konfigürasyon yönetimi
    └── logger.py            # Loglama
```

### İletişim Protokolü

#### HTTP API Endpoints
- `POST /api/cad-import/register-client` - Client kaydı
- `POST /api/cad-import/index-files` - Dosya indeksleme
- `POST /api/cad-import/check-parts` - Parça varlık kontrolü
- `POST /api/cad-import/upload-part` - Parça upload (thumbnail ile)
- `POST /api/cad-import/start-job` - İş başlatma
- `POST /api/cad-import/update-job-progress` - İlerleme güncelleme
- `GET /api/cad-import/status` - Genel durum

#### WebSocket Events
- `register-client` - Client kayıt
- `job-progress` - İlerleme bildirimi
- `file-processed` - Dosya işleme durumu
- `heartbeat` - Canlılık sinyali

## Sorun Giderme

### SolidWorks Bağlantı Sorunları
1. SolidWorks'ün kurulu ve lisanslı olduğundan emin olun
2. Python'ı Administrator olarak çalıştırmayı deneyin
3. SolidWorks'ü kapatıp tekrar açın
4. Windows COM servisleri çalışıyor mu kontrol edin

### Server Bağlantı Sorunları
1. Backend server'ın çalıştığından emin olun
2. `config.ini`'deki server URL'ini kontrol edin
3. Firewall ayarlarını kontrol edin
4. Network bağlantısını test edin

### Import Sorunları
1. Dosya yollarında Türkçe karakter olmamasına dikkat edin
2. Dosya izinlerini kontrol edin
3. Disk alanının yeterli olduğundan emin olun
4. SolidWorks dosyalarının bozuk olmadığını kontrol edin

## Log Dosyaları

Client işlem kayıtları şu konumlarda saklanır:
- **GUI Log**: Uygulama içi log penceresi
- **Dosya Log**: `cad_import.log` (rotating log)
- **Konfigürasyon**: `config.ini` dosyasında log ayarları

## Geliştirme

### Test Etme
```bash
# Backend'i başlat
cd ../backend
npm start

# Client'ı test et
python main.py
```

### Yeni Özellik Ekleme
1. İlgili modülde (`core/`, `gui/`, `utils/`) değişiklik yapın
2. `config.ini`'ye gerekli ayarları ekleyin
3. Test edin ve log'ları kontrol edin

### Build (Executable)
PyInstaller ile tek dosya executable oluşturmak için:
```bash
pip install pyinstaller
pyinstaller --onefile --windowed main.py
```

## API Referansı

### ServerClient Sınıfı
```python
client = ServerClient(config, logger)

# Bağlantı
client.connect_to_server()

# Dosya işlemleri
client.index_files(files)
client.check_parts(part_codes)
client.upload_part(part_data, thumbnail_path)

# İş yönetimi
client.start_job(job_name, total_files)
client.update_job_progress(job_id, success, fail)
client.finish_job(job_id, state)
```

### SolidWorksAPI Sınıfı
```python
sw_api = SolidWorksAPI(config, logger)

# Bağlantı
sw_api.connect()

# Dosya işlemleri
sw_api.generate_thumbnail(file_path, output_path)
sw_api.get_document_properties(file_path)
sw_api.batch_process(file_list, progress_callback)
```

## Güvenlik Notları

- Client sadece localhost üzerinden COM automation yapar
- Server iletişimi HTTPS üzerinden yapılabilir
- Dosya upload'ları size limit'li
- Hassas bilgiler log'larda saklanmaz

## Lisans

ÜRTM Takip Sistemi'nin bir parçasıdır. İç kullanım için tasarlanmıştır.

---

**Geliştirici**: ÜRTM Takip Ekibi  
**Versiyon**: 1.0.0  
**Son Güncelleme**: 2025-08-20