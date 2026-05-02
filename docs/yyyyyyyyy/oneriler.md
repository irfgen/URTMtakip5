# ÜRTM Takip Projesi İçin Yeni Nesil Otonom MRP Dönüşüm Önerileri

**Hazırlanma Tarihi:** 14 Aralık 2025
**Referans Rapor:** "Yeni Nesil Otonom MRP Mimarisi: KOBİ'ler İçin IoT, n8n ve Yapay Zeka Tabanlı Dönüşüm Raporu"

---

## 🔍 Mevcut Durum Analizi

### Projenin Güçlü Yönleri

1. **Kapsamlı Üretim Modülleri:**
   - İş emirleri, tezgah yönetimi, parça takibi
   - Üretim planlama (çift sistem: V1 ve V2)
   - BOM yönetimi, stok kartları
   - Arıza-bakım, vardiya yönetimi
   - Sevkiyat ve fason iş yönetimi

2. **Teknolojik Altyapı:**
   - Node.js/Express backend (Port 3000)
   - React/Vite frontend (Port 5173)
   - SQLite + Sequelize ORM
   - Socket.IO gerçek zamanlı iletişim
   - ESP32 tabanlı CNC panel

3. **Entegrasyon Yetenekleri:**
   - CAD entegrasyonu (SolidWorks, FreeCAD)
   - Teknik resim OCR (Tesseract.js)
   - Mobil uyumlu arayüz
   - Dosya yükleme ve yönetimi

### Geliştirme Alanları

1. **Manuel Veri Girişi:**
   - Çok sayıda form tabanlı veri girişi
   - Manuel stok güncellemeleri
   - Operatör bağımlılığı yüksek

2. **Otomasyon Eksiklikleri:**
   - Sensör entegrasyonu sınırlı
   - Yapay zeka destekli karar verme mekanizması yok
   - Süreç otomasyonu (workflow) bulunmuyor

3. **Veri Yaklaşımı:**
   - Pasif veri toplama (olay sonrası raporlama)
   - Gerçek zamanlı veri akışı eksik
   - Kestirimci yetenekler bulunmuyor

---

## 🚀 Stratejik Dönüşüm Önerileri

### 1. Headless MRP Mimarisi Dönüşümü

#### API-First Tasarım
```
Güncel: UI ↔ Backend (tight coupling)
Hedef: IoT/API → Headless Core → Multiple UIs
```

**Uygulama Adımları:**
1. **Mikroservis Mimarisine Geçiş:**
   ```
   - Üretim Servisi (production-service)
   - Envanter Servisi (inventory-service)
   - Çizelgeleme Servisi (scheduling-service)
   - Tedarik Servisi (procurement-service)
   - Kalite Servisi (quality-service)
   ```

2. **API Layer Geliştirme:**
   - GraphQL endpoint for complex queries
   - REST API for CRUD operations
   - WebSocket for real-time updates
   - Webhook support for external integrations

3. **Frontend Decoupling:**
   - Keep current React dashboard
   - Add mobile-first interfaces
   - Develop low-code integration tools (Retool-style)
   - Create voice-controlled interfaces

#### Mevcut Koddan Örnek Dönüşüm:

```javascript
// Mevcut durum - UI bağımlı
app.post('/api/is-emirleri', async (req, res) => {
  // Manuel veri işleme
});

// Headless versiyon
app.post('/api/v2/work-orders', async (req, res) => {
  // API-First tasarım
  // IoT ve otomasyon sistemleri tarafından çağrılabilir
  // Event-driven tetikleme
});
```

### 2. IoT Entegrasyon Katmanı

#### CNC Panel Geliştirme

Mevcut ESP32 CNC panel'i güçlendirme:

1. **Sensör Entegrasyonu:**
   ```cpp
   // Mevcut kodu genişletme
   struct SensorData {
     float vibration;      // Titreşim sensörü
     float temperature;    // Sıcaklık sensörü
     float current;        // Akım çekimi
     int vibration_count;  // Titreşim sayacı
     bool emergency_stop;  // Acil durum butonu
   };
   ```

2. **MQTT Protokolü Ekleme:**
   ```cpp
   #include <PubSubClient.h>
   #include <ArduinoJson.h>

   void publishSensorData() {
     DynamicJsonDocument doc(1024);
     doc["cnc_id"] = CNC_NO;
     doc["timestamp"] = getTimestamp();
     doc["status"] = readCncState();
     doc["vibration"] = readVibration();
     doc["temperature"] = readTemperature();
     doc["production_count"] = getProductionCount();

     char payload[1024];
     serializeJson(doc, payload);

     mqttClient.publish("cnc/status", payload);
   }
   ```

3. **MQTT Broker Altyapısı:**
   ```
   Backend'e entegre:
   - Mosquitto MQTT broker
   - Telegraf for data collection
   - Redis for message queuing
   ```

#### Yeni Sensör Ekleme Stratejisi:

1. **Üretim Sayımı:**
   - Optik sayaçlar (konveyörler için)
   - Akıllı teraziler (stok takibi)
   - Akım transformatörleri (OEE hesaplama)

2. **Kalite Kontrol:**
   - Sıcaklık ve nem sensörleri
   - Titreşim analizi sensörleri
   - Basınç ve gerilim sensörleri

3. **Konum Takibi:**
   - UWB etiketler (kritik varlıklar)
   - BLE etiketler (personel ve ekipman)
   - RFID takip (WIP envanter)

### 3. n8n Süreç Otomasyonu Entegrasyonu

#### Orkestrasyon Mimarisi

```
IoT Sensörleri → MQTT → Telegraf → Redis Buffer → n8n → MRP Sistemi
```

**n8n Kurulumu:**
1. **Self-Hosted Kurulum:**
   ```bash
   # Docker ile n8n kurulumu
   docker run -d \
     --name n8n \
     -p 5678:5678 \
     -v n8n_data:/home/node/.n8n \
     n8nio/n8n
   ```

2. **Redis Queue Mode:**
   ```javascript
   // n8n configuration.js
   {
     "executions": {
       "mode": "queue",
       "timeout": 3600,
       "maxConcurrency": 10
     },
     "queue": {
       "type": "redis",
       "redis": {
         "host": "localhost",
         "port": 6379,
         "db": 0
       }
     }
   }
   ```

#### Otomasyon Senaryoları:

1. **Kestirimci Bakım:**
   ```
   Tetikleyici: Titreşim sensörü > eşik değer
   Eylem:
     - Bakım iş emri oluştur
     - Bakım ekibine SMS/mail gönder
     - Üretim çizelgesini yeniden optimize et
     - Yönetici onayı bekle
   ```

2. **Otonom Stok Yönetimi:**
   ```
   Tetikleyici: Stok seviyesi < güvenli stok
   Eylem:
     - Tedarikçiye otomatik sipariş
     - Alternatif tedarikçileri kontrol et
     - Maliyet optimizasyonu yap
     - Onaya sun
   ```

3. **Kalite Kontrol Otomasyonu:**
   ```
   Tetikleyici: Sıcaklık dışı tolerans
   Eylem:
     - Üretimi durdur
     - Kalite müdürüne uyarı gönder
     - Hatalı partiyi ayır
     - Rapor oluştur
   ```

#### n8n Workflow Örnekleri:

```json
{
  "name": "Predictive Maintenance",
  "nodes": [
    {
      "parameters": {
        "topic": "cnc/vibration"
      },
      "name": "MQTT Trigger",
      "type": "mqtt"
    },
    {
      "parameters": {
        "conditions": {
          "string": [
            {
              "value1": "={{$json.vibration}}",
              "operation": "larger",
              "value2": "5.0"
            }
          ]
        }
      },
      "name": "Check Threshold",
      "type": "if"
    },
    {
      "parameters": {
        "url": "http://localhost:3000/api/v2/maintenance-orders",
        "method": "POST"
      },
      "name": "Create Maintenance Order",
      "type": "httpRequest"
    }
  ]
}
```

### 4. Yapay Zeka ve Optimizasyon Katmanı

#### Deterministik Optimizasyon (Python + OR-Tools)

1. **Üretim Çizelgeleme Motoru:**
   ```python
   from ortools.constraint_solver import routing_enums_pb2
   from ortools.constraint_solver import pywrapcp

   class ProductionScheduler:
       def __init__(self, jobs, machines, constraints):
           self.jobs = jobs
           self.machines = machines
           self.constraints = constraints

       def optimize_schedule(self):
           # Job Shop Scheduling Problem çözümü
           manager = pywrapcp.RoutingIndexManager(
               len(self.jobs), len(self.machines), 0)
           routing = pywrapcp.RoutingModel(manager)

           # Kısıtları tanımla
           # ... (detaylı implementasyon)

           # Optimize et
           search_parameters = pywrapcp.DefaultRoutingSearchParameters()
           solution = routing.SolveWithParameters(search_parameters)

           return self.extract_schedule(solution)
   ```

2. **Stok Optimizasyonu:**
   ```python
   import numpy as np
   from scipy.optimize import minimize

   def optimize_inventory(demand_history, lead_time, service_level=0.95):
       """
       IoT sensör verilerine göre dinamik stok optimizasyonu
       """
       # Talep tahmini
       avg_demand = np.mean(demand_history)
       std_demand = np.std(demand_history)

       # Optimal sipariş miktarı
       z_score = 1.65  # %95 service level için
       safety_stock = z_score * std_demand * np.sqrt(lead_time)
       reorder_point = avg_demand * lead_time + safety_stock

       # Ekonomik sipariş miktarı (EOQ)
       holding_cost = 0.25  # %25 tutma maliyeti
       ordering_cost = 100  # Sabir sipariş maliyeti
       eoq = np.sqrt(2 * ordering_cost * avg_demand / holding_cost)

       return {
           'reorder_point': reorder_point,
           'safety_stock': safety_stock,
           'economic_order_quantity': eoq
       }
   ```

#### LLM Ajan Tabanlı Karar Verme

1. **Tedarik Zinciri Müzakere Ajanı:**
   ```python
   import openai
   from datetime import datetime

   class ProcurementAgent:
       def __init__(self, api_key, budget_constraints):
           openai.api_key = api_key
           self.budget = budget_constraints

       def negotiate_with_suppliers(self, requirements, suppliers):
           prompt = f"""
           Görev: {requirements['material']} için tedarik müzakeresi yap
           Bütçe: ${self.budget['max_price']}
           Teslim tarihi: {requirements['delivery_date']}

           Tedarikçiler:
           {suppliers}

           Bütçe ve teslimat kısıtları dahilinde en iyi teklifi al.
           """

           response = openai.ChatCompletion.create(
               model="gpt-4",
               messages=[{"role": "user", "content": prompt}]
           )

           return self.parse_negotiation_result(response)
   ```

2. **Anomali Tespiti:**
   ```python
   import tensorflow as tf
   from sklearn.preprocessing import StandardScaler

   class AnomalyDetector:
       def __init__(self):
           self.scaler = StandardScaler()
           self.model = self.build_lstm_model()

       def build_lstm_model(self):
           model = tf.keras.Sequential([
               tf.keras.layers.LSTM(64, input_shape=(10, 6)),
               tf.keras.layers.Dense(1, activation='sigmoid')
           ])
           model.compile(optimizer='adam', loss='binary_crossentropy')
           return model

       def detect_anomalies(self, sensor_data):
           # Sensör verilerinde anomali tespiti
           # Titreşim, sıcaklık, akım verilerini analiz et
           return predictions
   ```

### 5. Veri Altyapısı Dönüşümü (Polyglot Persistence)

#### Veritabanı Stratejisi

```
İş Verileri (PostgreSQL):
- Siparişler, müşteriler, stok seviyeleri
- BOM yapıları, üretim planları
- Finansal veriler, maliyetler

Zaman Serisi (InfluxDB):
- IoT sensör verileri (saniyede 100+ veri)
- Makine performans metrikleri
- Enerji tüketimi, OEE verileri

Cache (Redis):
- Oturum verileri, gerçek zamanlı cache
- n8n kuyruk yönetimi
- API rate limiting
```

#### Veri Akış Mimarisi

```javascript
// Sensor Data Pipeline
const sensorPipeline = {
  collection: {
    mqtt: 'mqtt://broker:1883',
    topics: ['cnc/+', 'sensors/+', 'quality/+']
  },
  buffering: {
    redis: {
      host: 'redis-cluster',
      port: 6379
    }
  },
  processing: {
    telegraf: {
      batch_size: 1000,
      flush_interval: '5s'
    }
  },
  storage: {
    raw_data: 'influxdb://influxdb:8086/sensor_data',
    aggregated: 'postgresql://postgres:5432/mrp_db'
  }
};
```

### 6. KOBİ Odaklı Maliyet Etkin Uygulama Yolu

#### Aşama 1: Dijital Sinir Sistemi (0-3 ay)

**Maliyet:** 50-100 TL
- **CT Clamp Sensörler:** 15-20 TL/tezgah
- **ESP32 Geliştirme:** 25-30 TL/cihaz
- **MQTT Broker Kurulumu:** 10 TL (Raspberry Pi)
- **InfluxDB Kurulumu:** 5 TL

**Hedefler:**
- Mevcut CNC tezgahlarına sensör entegrasyonu
- Gerçek zamanlı veri akışının başlatılması
- Temel üretim metriklerinin ölçümü

#### Aşama 2: Headless Çekirdek (3-6 ay)

**Maliyet:** 200-300 TL
- **n8n Kurulum ve Konfigürasyon:** 50 TL
- **Redis Cluster:** 30 TL
- **API Geliştirme:** 150-200 TL (iş gücü)
- **PostgreSQL Migration:** 20-30 TL

**Hedefler:**
- API-First mimariye geçiş
- n8n otomasyon altyapısı kurulumu
- Temel otomasyon senaryoları

#### Aşama 3: Güçlendirme (6-9 ay)

**Maliyet:** 500-750 TL
- **Tablet ve Mobil Cihazlar:** 300-500 TL
- **Barkod/QR Sistemleri:** 100-150 TL
- **Eğitim ve Adaptasyon:** 100 TL

**Hedefler:**
- Manuel veri girişinin ortadan kaldırılması
- Mobil arayüzlerin geliştirilmesi
- Operatör verimliliğinin artırılması

#### Aşama 4: Otonomi (9-12 ay)

**Maliyet:** 750-1500 TL
- **Python Optimizasyon Servisleri:** 300-500 TL
- **LLM API Entegrasyonu:** 200-500 TL
- **Bilgisayarlı Görü Sistemleri:** 250-500 TL

**Hedefler:**
- Otonom çizelgeleme
- Kestirimci bakım
- Yapay zeka destekli karar verme

---

## 📊 Teknoloji Yığını Önerisi

| Katman | Mevcut Teknoloji | Önerilen Teknoloji | Avantaj |
|--------|------------------|-------------------|---------|
| **Frontend** | React + Vite | React + Vite + Low-Code Builder | Hızlı geliştirme |
| **Backend** | Express + SQLite | Express + PostgreSQL + Redis | Ölçeklenebilirlik |
| **IoT** | ESP32 (basic) | ESP32 + MQTT + Sensörler | Gerçek zamanlı veri |
| **Orkestrasyon** | Yok | n8n (Self-hosted) | Görsel otomasyon |
| **AI/ML** | Yok | Python + OR-Tools + LLM API'leri | Akıllı karar verme |
| **Veri** | SQLite | PostgreSQL + InfluxDB | Hibrit depolama |
| **Mobil** | Responsive Web | React Native + Voice UI | El serbest operasyon |

---

## 🎯 Başarı Metrikleri

### Operasyonel KPI'lar
- **OEE Artışı:** %70 → %90
- **Manuel Veri Girişi:** %80 → %10
- **Planlanmamış Duruşlar:** %15 → %5
- **Stok Devir Hızı:** 2x artış
- **Teslimat Termin Süresi:** %50 iyileşme

### Teknik Metrikler
- **Veri Gecikmesi:** Dakikalar → Saniyeler
- **Sistem Kullanılabilirliği:** %95 → %99.5
- **API Response Time:** <500ms
- **IoT Veri Aktarım Hızı:** 1000+ msg/saniye

---

## ⚠️ Riskler ve Azaltma Stratejileri

### Teknolojik Riskler
1. **IoT Sensör Güvenilirliği:**
   - Risk: Sensör arızaları, veri kaybı
   - Azaltma: Redundant sensörler, local buffering

2. **n8n Ölçeklenebilirliği:**
   - Risk: Yüksek veri hacminde performans sorunları
   - Azaltma: Redis queue mode, clustering

3. **AI Model Doğruluğu:**
   - Risk: Yanlış tahminler, sahte pozitifler
   - Azaltma: İnsan onayı mekanizmaları, gradual adoption

### İş Süreci Riskleri
1. **Personel Direnç:**
   - Risk: Yeni teknolojiye adaptasyon zorluğu
   - Azaltma: Fazla eğitim, phased deployment

2. **Maliyet Aşımı:**
   - Risk: Beklenenden yüksek TCO
   - Azaltma: Open source kullanımı, self-hosting

---

## 🔄 Uygulama Öncelikleri

### Phase 1 (Critical - First 3 Months)
1. ✅ **MQTT Broker Kurulumu**
2. ✅ **Mevcut ESP32 Panel Geliştirme**
3. ✅ **InfluxDB Entegrasyonu**
4. ✅ **Basic n8n Workflow'ları**

### Phase 2 (Important - 3-6 Months)
1. 🔄 **Headless API Development**
2. 🔄 **Redis Cache Layer**
3. 🔄 **Production Scheduling Service**
4. 🔄 **Mobile Interface Development**

### Phase 3 (Enhancement - 6-12 Months)
1. 🔜 **AI Optimization Engine**
2. 🔜 **Computer Vision Integration**
3. 🔜 **Voice-Controlled Interfaces**
4. 🔜 **Predictive Analytics**

---

## 💰 Yatırım Getirisi (ROI) Analizi

### İlk Yıl Maliyetleri
- **Donanım:** 1,000-2,000 TL
- **Yazılım Geliştirme:** 3,000-5,000 TL
- **Eğitim:** 1,000 TL
- **Total:** 5,000-8,000 TL

### Yıllık Tasarruflar
- **Manuel Veri Girişi:** 4,800 TL (2 personel x 2000 TL/ay)
- **Planlanmamış Duruşlar:** 12,000 TL (%10 verimlilik artışı)
- **Stok Maliyetleri:** 6,000 TL (%20 iyileşme)
- **Toplam Yıllık Tasarruf:** 22,800 TL

### ROI Süresi: 3-4 Ay

---

## 📝 Sonuç ve Sonraki Adımlar

ÜRTM Takip projesi, mevcut güçlü altyapısıyla bu dönüşüm için ideal bir başlangıç noktasına sahip. Önerilen Headless MRP mimarisi, projenizi sadece modern bir üretim takip sistemine değil, aynı zamanda akıllı ve otonom bir üretim yönetim platformuna dönüştürecektir.

**Acil Eylem Planı:**
1. **Bu hafta:** MQTT broker kurulumu
2. **Bu ay:** Mevcut ESP32 panel'ine sensör ekleme
3. **3 ay içinde:** n8n kurulumu ve basic otomasyon senaryoları
4. **6 ay içinde:** Headless API ve mobil arayüzler

Bu dönüşüm, KOBİ ölçeğinde rekabet avantajı sağlayacak, operasyonel verimliliği artıracak ve geleceğin akıllı fabrika konseptine erken adaptasyon sağlayacaktır.

---

**Not:** Bu öneriler raporu, ÜRTM Takip projesinin mevcut kod yapısı analiz edilerek hazırlanmıştır. Uygulama öncelikleri ve maliyet analizleri KOBİ'ler için optimize edilmiştir.