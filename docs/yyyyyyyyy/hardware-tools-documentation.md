# ÜRTM Takip - CNC Panel ve Python Araçları Dokümantasyonu

## Genel Bakış

ÜRTM Takip sistemi, ana uygulamanın yanı sıra özel donanım ve Python tabanlı yardımcı araçlar içerir. Bu araçlar, üretim süreçlerini otomatize etmek ve CAD/CAM entegrasyonu sağlamak için geliştirilmiştir.

## CNC Panel (ESP32)

### Donanım Mimarisi

CNC Panel, ESP32 tabanlı bir mikrodenetleyici sistemi olup, tezgahların gerçek zamanlı durum takibini sağlar.

**Teknik Özellikler:**
- **Mikrodenetleyici**: ESP32-WROOM-32
- **İletişim**: Wi-Fi 802.11 b/g/n
- **Güç**: 5V DC
- **Ölçüler**: 100mm x 70mm PCB
- **Konnektörler**: 5V GND, Status LED'leri, Reset butonu

### Proje Yapısı

```
CNC_panel/
├── include/
│   ├── config.h           # Konfigürasyon ayarları
│   ├── wifi_manager.h     # Wi-Fi yönetimi
│   ├── tezgah_status.h    # Tezgah durumu yönetimi
│   └── http_client.h      # HTTP istemcisi
├── src/
│   ├── main.cpp           # Ana program
│   ├── wifi_manager.cpp   # Wi-Fi implementasyonu
│   ├── tezgah_status.cpp  # Durum yönetimi
│   └── http_client.cpp    # HTTP implementasyonu
├── platformio.ini        # PlatformIO konfigürasyonu
├── README.md             # Donanım dokümantasyonu
└── docs/                 # Şematik ve kılavuzlar
```

### Konfigürasyon

**include/config.h**
```cpp
#ifndef CONFIG_H
#define CONFIG_H

// Wi-Fi Ayarları
#define WIFI_SSID "Your_WiFi_SSID"
#define WIFI_PASSWORD "Your_WiFi_Password"

// Server Ayarları
#define SERVER_HOST "192.168.1.206"
#define SERVER_PORT 3000
#define SERVER_ENDPOINT "/api/tezgahlar/status"

// Tezgah Ayarları
#define TEZGAH_ID 13
#define STATUS_UPDATE_INTERVAL 5000  // 5 saniye
#define CONNECTION_TIMEOUT 10000     // 10 saniye

// Durum Kodları
#define DURUM_DURDU 0
#define DURUM_CALISIYOR 1
#define DURUM_HATA 2

// LED Pin'leri
#define STATUS_LED_PIN 2
#define ERROR_LED_PIN 4
#define CONNECTED_LED_PIN 5

#endif // CONFIG_H
```

### Çalışma Mantığı

**Başlangıç Sequence:**
1. Wi-Fi bağlantısı kurulur
2. Sunucuya ilk durum raporu gönderilir
3. Periyodik durum güncellemeleri başlar
4. Hata durumunda otomatik yeniden bağlanma

**Durum Yönetimi:**
```cpp
// Tezgah durumu güncelleme fonksiyonu
void updateTezgahDurumu(int yeniDurum) {
    currentDurum = yeniDurum;
    lastUpdate = millis();

    // LED durumunu güncelle
    switch(yeniDurum) {
        case DURUM_DURDU:
            digitalWrite(STATUS_LED_PIN, HIGH);
            digitalWrite(ERROR_LED_PIN, LOW);
            break;
        case DURUM_CALISIYOR:
            digitalWrite(STATUS_LED_PIN, HIGH);
            digitalWrite(ERROR_LED_PIN, HIGH);
            break;
        case DURUM_HATA:
            digitalWrite(STATUS_LED_PIN, LOW);
            digitalWrite(ERROR_LED_PIN, HIGH);
            break;
    }

    // Sunucuya bildir
    sendDurumUpdate();
}
```

**Sunucu İletişimi:**
```cpp
void sendDurumUpdate() {
    if (WiFi.status() != WL_CONNECTED) {
        return;
    }

    HTTPClient http;
    String url = String("http://") + SERVER_HOST + ":" + SERVER_PORT + SERVER_ENDPOINT;

    http.begin(url);
    http.addHeader("Content-Type", "application/json");

    // JSON payload oluştur
    String payload = "{\"tezgahId\":" + String(TEZGAH_ID) +
                    ",\"durum\":" + String(currentDurum) +
                    ",\"timestamp\":" + String(millis()) + "}";

    int httpResponseCode = http.POST(payload);

    if (httpResponseCode == 200) {
        Serial.println("Durum güncellemesi başarılı");
        digitalWrite(CONNECTED_LED_PIN, HIGH);
    } else {
        Serial.println("Durum güncelleme hatası: " + String(httpResponseCode));
        digitalWrite(CONNECTED_LED_PIN, LOW);
    }

    http.end();
}
```

### Kurulum ve Yapılandırma

**Gerekli Araçlar:**
- PlatformIO Core
- VS Code + PlatformIO Extension
- ESP32 Geliştirme Kartı
- USB Programming Kablosu

**Adımlar:**
1. `include/config.h` dosyasında Wi-Fi ve sunucu ayarlarını yapılandırın
2. ESP32 kartını USB ile bağlayın
3. PlatformIO ile derleyin ve yükleyin:
   ```bash
   cd CNC_panel
   pio run
   pio run -t upload
   ```
4. Seri monitör ile durum takibi yapın:
   ```bash
   pio device monitor
   ```

### Entegrasyon

**Backend Entegrasyonu:**
```javascript
// backend/src/routes/tezgahRoutes.js
router.post('/status', async (req, res) => {
  try {
    const { tezgahId, durum, timestamp } = req.body;

    // Tezgah durumunu güncelle
    const tezgah = await Tezgah.findByPk(tezgahId);
    if (tezgah) {
      tezgah.durum = durum;
      await tezgah.save();

      // Socket.IO ile bildir
      io.emit('tezgahDurumGuncelle', {
        tezgahId,
        durum,
        timestamp
      });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## STEP BOM Analyzer

### Amaç ve Kapsam

STEP BOM Analyzer, CAD dosyalarından (özellikle STEP formatında) Malzeme Listesi (BOM) çıkaran ve 3D görselleştirme sağlayan Python uygulamasıdır.

### Teknik Altyapı

**Bağımlılıklar:**
- Python 3.8+
- FreeCAD 0.19+
- numpy, matplotlib
- trimesh
- requests
- tkinter (GUI)

### Proje Yapısı

```
STEP_BOM_Analyzer/
├── main.py                    # Ana GUI uygulaması
├── step_parser.py            # STEP dosya ayrıştırıcı
├── bom_extractor.py          # BOM çıkarma mantığı
├── viewer3d.py               # 3D görüntüleyici
├── export_manager.py         # Dışa aktarım yöneticisi
├── api_client.py             # ÜRTM API istemcisi
├── requirements.txt          # Python bağımlılıkları
├── config.py                 # Konfigürasyon
└── README.md                 # Kullanım kılavuzu
```

### Ana Fonksiyonlar

**STEP Dosya Ayrıştırma:**
```python
# step_parser.py
import FreeCAD
import FreeCADGui
from FreeCAD import Base

class STEPParser:
    def __init__(self):
        self.document = None
        self.parts = []

    def load_step_file(self, file_path):
        """STEP dosyasını yükle ve ayrıştır"""
        try:
            # FreeCAD belgesi oluştur
            self.document = FreeCAD.newDocument("BOM_Analyzer")

            # STEP dosyasını içe aktar
            FreeCADGui.Application.openDocument(file_path)

            # Parçaları ayıkla
            self.extract_parts()

            return True, "Dosya başarıyla yüklendi"
        except Exception as e:
            return False, f"Hata: {str(e)}"

    def extract_parts(self):
        """Bileşenleri ve hiyerarşiyi çıkar"""
        if not self.document:
            return

        for obj in self.document.Objects:
            if hasattr(obj, 'TypeId'):
                part_info = {
                    'name': obj.Label,
                    'type': obj.TypeId,
                    'volume': obj.Shape.Volume if hasattr(obj, 'Shape') else 0,
                    'mass': obj.Shape.Mass if hasattr(obj, 'Shape') and hasattr(obj.Shape, 'Mass') else 0,
                    'material': self.get_material_info(obj),
                    'properties': self.extract_properties(obj)
                }
                self.parts.append(part_info)

    def get_material_info(self, obj):
        """Parça malzeme bilgisini al"""
        if hasattr(obj, 'Material'):
            return obj.Material
        return "Bilinmiyor"

    def extract_properties(self, obj):
        """Özellikleri çıkar"""
        properties = {}
        if hasattr(obj, 'PropertiesList'):
            for prop in obj.PropertiesList():
                try:
                    properties[prop] = obj.getPropertyByName(prop)
                except:
                    continue
        return properties
```

**BOM Çıkarma:**
```python
# bom_extractor.py
class BOMExtractor:
    def __init__(self, parts_data):
        self.parts = parts_data
        self.bom_items = []

    def create_bom(self):
        """Malzeme listesi oluştur"""
        # Parçaları malzeme tipine göre grupla
        material_groups = {}

        for part in self.parts:
            material = part['material']
            if material not in material_groups:
                material_groups[material] = {
                    'material': material,
                    'parts': [],
                    'total_volume': 0,
                    'total_mass': 0
                }

            material_groups[material]['parts'].append({
                'name': part['name'],
                'quantity': 1,  # Varsayılan miktar
                'volume': part['volume'],
                'mass': part['mass']
            })

            material_groups[material]['total_volume'] += part['volume']
            material_groups[material]['total_mass'] += part['mass']

        self.bom_items = list(material_groups.values())
        return self.bom_items

    def export_to_json(self, filename):
        """JSON formatında dışa aktar"""
        import json
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(self.bom_items, f, ensure_ascii=False, indent=2)

    def export_to_excel(self, filename):
        """Excel formatında dışa aktar"""
        import pandas as pd

        # BOM tablosu oluştur
        bom_data = []
        for item in self.bom_items:
            for part in item['parts']:
                bom_data.append({
                    'Malzeme': item['material'],
                    'Parça Adı': part['name'],
                    'Miktar': part['quantity'],
                    'Hacim (mm³)': part['volume'],
                    'Ağırlık (kg)': part['mass']
                })

        df = pd.DataFrame(bom_data)
        df.to_excel(filename, index=False, engine='openpyxl')

    def export_to_csv(self, filename):
        """CSV formatında dışa aktar"""
        import csv

        with open(filename, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(['Malzeme', 'Parça Adı', 'Miktar', 'Hacim (mm³)', 'Ağırlık (kg)'])

            for item in self.bom_items:
                for part in item['parts']:
                    writer.writerow([
                        item['material'],
                        part['name'],
                        part['quantity'],
                        part['volume'],
                        part['mass']
                    ])
```

**3D Görüntüleyici:**
```python
# viewer3d.py
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D
import numpy as np

class Viewer3D:
    def __init__(self):
        self.fig = None
        self.ax = None

    def visualize_parts(self, parts):
        """Parçaları 3D görselleştir"""
        self.fig = plt.figure(figsize=(10, 8))
        self.ax = self.fig.add_subplot(111, projection='3d')

        for part in parts:
            if hasattr(part, 'Shape') and part.Shape:
                self.draw_shape(part.Shape, part.Label)

        self.ax.set_xlabel('X')
        self.ax.set_ylabel('Y')
        self.ax.set_zlabel('Z')
        self.ax.set_title('STEP Dosya 3D Görünümü')

        plt.show()

    def draw_shape(self, shape, label):
        """FreeCAD shape'i çiz"""
        if not shape.Faces:
            return

        # Shape'i mesh'e çevir
        mesh = shape.tessellate(0.1)
        vertices = mesh[0]
        triangles = mesh[1]

        # Üçgenleri çiz
        for triangle in triangles:
            tri_points = vertices[triangle]
            xs = [p.x for p in tri_points]
            ys = [p.y for p in tri_points]
            zs = [p.z for p in tri_points]

            # Kaplamak için son noktayı tekrar ekle
            xs.append(xs[0])
            ys.append(ys[0])
            zs.append(zs[0])

            self.ax.plot(xs, ys, zs, alpha=0.7, label=label)
```

### API Entegrasyonu

```python
# api_client.py
import requests
import json

class URTMAPIClient:
    def __init__(self, base_url="http://localhost:3000/api"):
        self.base_url = base_url
        self.headers = {
            'Content-Type': 'application/json'
        }

    def create_parca(self, parca_data):
        """Yeni parça oluştur"""
        url = f"{self.base_url}/parcalar"

        try:
            response = requests.post(url, json=parca_data, headers=self.headers)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            return {'error': str(e)}

    def create_bom(self, bom_data):
        """BOM oluştur"""
        url = f"{self.base_url}/boms"

        try:
            response = requests.post(url, json=bom_data, headers=self.headers)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            return {'error': str(e)}

    def verify_parca(self, parca_adi):
        """Parça varlığını kontrol et"""
        url = f"{self.base_url}/parcalar/verify"
        data = {'parca_adi': parca_adi}

        try:
            response = requests.post(url, json=data, headers=self.headers)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            return {'error': str(e)}
```

## CAD Import Client

### Amaç

CAD Import Client, SolidWorks dosyalarından thumbnail görüntüleri ve metadata çıkaran Windows tabanlı bir uygulamasıdır.

### Teknik Gereksinimler

- Windows 10/11
- SolidWorks 2018+
- Python 3.8+
- pywin32 kütüphanesi

### Proje Yapısı

```
CAD_Import_Client/
├── main.py                    # Ana GUI uygulaması
├── solidworks_automation.py  # SolidWorks COM otomasyonu
├── thumbnail_generator.py    # Thumbnail üreticisi
├── batch_processor.py        # Toplu işlemci
├── websocket_client.py       # WebSocket istemcisi
├── config.py                 # Konfigürasyon
├── requirements.txt          # Python bağımlılıkları
└── README.md                 # Kurulum kılavuzu
```

### SolidWorks Otomasyonu

```python
# solidworks_automation.py
import win32com.client
import pythoncom
import os

class SolidWorksAutomation:
    def __init__(self):
        self.sw_app = None
        self.sw_model = None

    def connect_solidworks(self):
        """SolidWorks uygulamasına bağlan"""
        try:
            pythoncom.CoInitialize()
            self.sw_app = win32com.client.Dispatch("SldWorks.Application")
            self.sw_app.Visible = False  # Arka planda çalış
            return True, "Bağlantı başarılı"
        except Exception as e:
            return False, f"SolidWorks bağlantı hatası: {str(e)}"

    def open_document(self, file_path):
        """SolidWorks dokümanını aç"""
        if not self.sw_app:
            return None, "SolidWorks bağlı değil"

        try:
            errors = win32com.client.VARIANT(pythoncom.VT_BYREF | pythoncom.VT_I4, 0)
            warnings = win32com.client.VARIANT(pythoncom.VT_BYREF | pythoncom.VT_I4, 0)

            self.sw_model = self.sw_app.OpenDoc6(
                file_path,
                1,  # swDocPART
                1,  # swOpenDocOptions_Silent
                "",
                errors,
                warnings
            )

            if self.sw_model:
                return self.sw_model, "Doküman açıldı"
            else:
                return None, f"Doküman açılamadı. Hata: {errors.value}"

        except Exception as e:
            return None, f"Hata: {str(e)}"

    def get_thumbnail(self, width=400, height=400):
        """Thumbnail görüntüsü al"""
        if not self.sw_model:
            return None, "Model açık değil"

        try:
            # Aktif görünümü al
            sw_view = self.sw_model.GetFirstView()

            # Görüntü oluştur
            temp_file = os.path.join(os.environ['TEMP'], 'thumbnail.png')
            success = sw_view.SaveAsBitmap2(
                width, height,
                sw_view.BitmapType_e.swBitmapType_PNG,
                temp_file
            )

            if success:
                # Resmi oku ve base64'e çevir
                with open(temp_file, 'rb') as f:
                    image_data = f.read()

                # Geçici dosyayı sil
                os.remove(temp_file)

                return image_data, "Thumbnail oluşturuldu"
            else:
                return None, "Thumbnail oluşturulamadı"

        except Exception as e:
            return None, f"Thumbnail hatası: {str(e)}"

    def get_properties(self):
        """Model özelliklerini al"""
        if not self.sw_model:
            return None, "Model açık değil"

        try:
            properties = {}

            # Özet bilgileri
            properties['adi'] = self.sw_model.GetTitle()
            properties['path'] = self.sw_model.GetPathName()

            # Özel özellikler
            custom_props = self.sw_model.Extension.get_CustomPropertyManager("")
            prop_names = custom_props.GetNames()

            properties['ozellikler'] = {}
            for prop_name in prop_names:
                val_type, val_res = custom_props.Get5(prop_name, False, "", "")
                properties['ozellikler'][prop_name] = val_res

            # Konfigürasyon bilgileri
            config_names = self.sw_model.GetConfigurationNames()
            properties['konfigurasyonlar'] = config_names

            return properties, "Özellikler alındı"

        except Exception as e:
            return None, f"Özellik hatası: {str(e)}"

    def close_document(self):
        """Dokümanı kapat"""
        if self.sw_model:
            self.sw_app.CloseDoc(self.sw_model.GetTitle())
            self.sw_model = None

    def disconnect(self):
        """Bağlantıyı kes"""
        if self.sw_app:
            self.sw_app.ExitApp()
            self.sw_app = None
        pythoncom.CoUninitialize()
```

### Batch İşlemci

```python
# batch_processor.py
import os
import threading
from queue import Queue
from solidworks_automation import SolidWorksAutomation

class BatchProcessor:
    def __init__(self, websocket_client):
        self.websocket_client = websocket_client
        self.processing = False
        self.queue = Queue()
        self.results = []

    def add_files(self, file_list):
        """İşlem kuyruğuna dosyalar ekle"""
        for file_path in file_list:
            if os.path.exists(file_path) and file_path.lower().endswith(('.sldprt', '.sldasm')):
                self.queue.put(file_path)

    def start_processing(self):
        """Toplu işlemi başlat"""
        if self.processing:
            return False, "İşlem zaten devam ediyor"

        self.processing = True
        self.results = []

        # Ayrı thread'de işlemi başlat
        thread = threading.Thread(target=self.process_files)
        thread.daemon = True
        thread.start()

        return True, "İşlem başlatıldı"

    def process_files(self):
        """Dosyaları işle"""
        sw_automation = SolidWorksAutomation()
        connected, message = sw_automation.connect_solidworks()

        if not connected:
            self.websocket_client.send_error(message)
            self.processing = False
            return

        while not self.queue.empty() and self.processing:
            file_path = self.queue.get()

            try:
                # İlerleme güncelle
                self.websocket_client.send_progress(
                    len(self.results),
                    self.queue.qsize() + len(self.results)
                )

                # Dosyayı işle
                result = self.process_single_file(sw_automation, file_path)
                self.results.append(result)

                # Sunucuya gönder
                self.websocket_client.send_result(result)

            except Exception as e:
                error_result = {
                    'file_path': file_path,
                    'success': False,
                    'error': str(e)
                }
                self.results.append(error_result)
                self.websocket_client.send_result(error_result)

        sw_automation.disconnect()
        self.processing = False

        # Tamamlandı bildirimi
        self.websocket_client.send_complete(self.results)

    def process_single_file(self, sw_automation, file_path):
        """Tek dosyayı işle"""
        # Dokümanı aç
        sw_model, message = sw_automation.open_document(file_path)
        if not sw_model:
            return {
                'file_path': file_path,
                'success': False,
                'error': message
            }

        # Thumbnail al
        thumbnail_data, thumb_message = sw_automation.get_thumbnail()

        # Özellikleri al
        properties, prop_message = sw_automation.get_properties()

        # Dokümanı kapat
        sw_automation.close_document()

        return {
            'file_path': file_path,
            'success': True,
            'thumbnail': thumbnail_data,
            'properties': properties,
            'messages': {
                'thumbnail': thumb_message,
                'properties': prop_message
            }
        }
```

### WebSocket İstemcisi

```python
# websocket_client.py
import websocket
import json
import base64
import threading

class WebSocketClient:
    def __init__(self, server_url="ws://localhost:3000"):
        self.server_url = server_url
        self.ws = None
        self.connected = False

    def connect(self):
        """Sunucuya bağlan"""
        try:
            self.ws = websocket.WebSocketApp(
                self.server_url,
                on_message=self.on_message,
                on_error=self.on_error,
                on_close=self.on_close,
                on_open=self.on_open
            )

            # Ayrı thread'de çalıştır
            wst = threading.Thread(target=self.ws.run_forever)
            wst.daemon = True
            wst.start()

            return True, "Bağlantı başlatıldı"
        except Exception as e:
            return False, f"Bağlantı hatası: {str(e)}"

    def on_open(self, ws):
        """Bağlantı açıldığında"""
        self.connected = True
        print("WebSocket bağlantısı kuruldu")

    def on_message(self, ws, message):
        """Mesaj alındığında"""
        data = json.loads(message)
        print(f"Mesaj alındı: {data}")

    def on_error(self, ws, error):
        """Hata oluştuğunda"""
        print(f"WebSocket hatası: {error}")
        self.connected = False

    def on_close(self, ws, close_status_code, close_msg):
        """Bağlantı kapandığında"""
        print("WebSocket bağlantısı kapandı")
        self.connected = False

    def send_result(self, result):
        """İşlem sonucunu gönder"""
        if self.connected and self.ws:
            # Thumbnail'ı base64'e çevir
            if result.get('thumbnail'):
                result['thumbnail'] = base64.b64encode(result['thumbnail']).decode('utf-8')

            message = {
                'type': 'cad_result',
                'data': result
            }

            self.ws.send(json.dumps(message))

    def send_progress(self, processed, total):
        """İlerleme bilgisini gönder"""
        if self.connected and self.ws:
            message = {
                'type': 'cad_progress',
                'data': {
                    'processed': processed,
                    'total': total,
                    'percentage': (processed / total) * 100 if total > 0 else 0
                }
            }

            self.ws.send(json.dumps(message))

    def send_error(self, error_message):
        """Hata mesajı gönder"""
        if self.connected and self.ws:
            message = {
                'type': 'cad_error',
                'data': {'error': error_message}
            }

            self.ws.send(json.dumps(message))

    def send_complete(self, results):
        """Tamamlanma bildirimi gönder"""
        if self.connected and self.ws:
            success_count = sum(1 for r in results if r.get('success', False))

            message = {
                'type': 'cad_complete',
                'data': {
                    'total': len(results),
                    'success': success_count,
                    'failed': len(results) - success_count,
                    'results': results
                }
            }

            self.ws.send(json.dumps(message))
```

## Kurulum Kılavuzu

### Ön Gereksinimler

**Ortak Gereksinimler:**
- Python 3.8+ (tüm Python araçları için)
- Git
- VS Code (tavsiye edilen)

**CNC Panel için:**
- ESP32 Geliştirme Kartı
- PlatformIO
- USB Programlama Kablosu

**STEP BOM Analyzer için:**
- FreeCAD 0.19+ (www.freecadweb.org)

**CAD Import Client için:**
- Windows 10/11
- SolidWorks 2018+

### Kurulum Adımları

**1. Python Ortamını Hazırlama:**
```bash
# Python 3.8+ kurulumu
# Sanal ortam oluşturma (tavsiye edilir)
python -m venv urtm-tools-env

# Ortamı aktifleştirme
# Windows:
urTM-tools-env\Scripts\activate
# Linux/Mac:
source urtm-tools-env/bin/activate

# Bağımlılıkları yükleme
pip install -r requirements.txt
```

**2. STEP BOM Analyzer Kurulumu:**
```bash
cd STEP_BOM_Analyzer
pip install -r requirements.txt
python main.py
```

**3. CNC Panel Kurulumu:**
```bash
cd CNC_panel
# VS Code'da proje aç
# PlatformIO eklentisini kur
# build ve upload:
pio run
pio run -t upload
```

**4. CAD Import Client Kurulumu:**
```bash
cd CAD_Import_Client
pip install -r requirements.txt
python main.py
```

### Konfigürasyon

**CNC Panel Konfigürasyonu:**
```cpp
// include/config.h
#define WIFI_SSID "Your_WiFi_Network"
#define WIFI_PASSWORD "Your_WiFi_Password"
#define SERVER_HOST "192.168.1.206"  // Backend sunucu IP
#define SERVER_PORT 3000
#define TEZGAH_ID 13  // Her cihaz için benzersiz
```

**Python Araçları Konfigürasyonu:**
```python
# config.py (her araç için)
URT_API_BASE_URL = "http://localhost:3000/api"
WEBSOCKET_URL = "ws://localhost:3000"
EXPORT_DIR = "./exports"
TEMP_DIR = "./temp"
```

## Kullanım Kılavuzu

### CNC Panel Kullanımı

1. **Kurulum:** ESP32 kartını tezgaha yakın bir konuma monte edin
2. **Konfigürasyon:** Wi-Fi ve sunucu ayarlarını yapılandırın
3. **Bağlantı:** Cihazı güçe bağlayın, otomatik olarak sunucuya bağlanacaktır
4. **Durum Göstergeleri:**
   - Yeşil LED: Bağlantı aktif
   - Mavi LED: Tezgah çalışıyor
   - Kırmızı LED: Hata durumu

### STEP BOM Analyzer Kullanımı

1. **Dosya Seçimi:** STEP dosyasını seçin
2. **Analiz:** "Analyze" butonuna tıklayın
3. **BOM Oluşturma:** Malzeme listesi otomatik olarak oluşturulur
4. **Dışa Aktarma:**
   - JSON: API entegrasyonu için
   - Excel: Raporlama için
   - CSV: Diğer sistemlere aktarım için
5. **3D Görüntüleme:** "3D View" butonu ile modeli görüntüleyin

### CAD Import Client Kullanımı

1. **Bağlantı:** Sunucuya WebSocket ile bağlanın
2. **Dosya Seçimi:** SolidWorks dosyalarını seçin (sürükle-bırak destekli)
3. **Batch İşlem:** "Start Processing" ile toplu işlem başlatın
4. **İzleme:** İlerleme çubuğunu izleyin
5. **Sonuçlar:** Thumbnail ve metadata otomatik olarak sunucuya gönderilir

## Troubleshooting

### CNC Panel

**Bağlantı Sorunları:**
- Wi-Fi şifresini kontrol edin
- Sunucu IP adresini doğrulayın
- Firewall ayarlarını kontrol edin

**Güç Sorunları:**
- 5V DC güç kaynağı kullanın
- Kablo bağlantılarını kontrol edin

### STEP BOM Analyzer

**FreeCAD Hataları:**
- FreeCAD kurulumunu doğrulayın
- Python path'i kontrol edin
- STEP dosyasının geçerli olduğundan emin olun

**Memory Sorunları:**
- Büyük dosyaları parçalar halinde işleyin
- RAM miktarını kontrol edin (minimum 8GB tavsiye edilir)

### CAD Import Client

**SolidWorks Bağlantısı:**
- SolidWorks'in çalıştığından emin olun
- pywin32 kurulumunu kontrol edin
- COM izinlerini doğrulayın

**WebSocket Sorunları:**
- Sunucu adresini kontrol edin
- Port accessibility test edin
- Windows Firewall ayarlarını gözden geçirin