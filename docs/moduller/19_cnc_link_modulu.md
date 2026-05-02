# 19. CNC LİNK (ESP32 Hardware Integration) Modülü

## Genel Bakış

CNC Link modülü, ESP32 tabanlı CNC panel donanımı ile sunucu arasındaki iletişimi yönetir. Gerçek zamanlı makine durumu takibi sağlar.

**Route Dosyası:** `backend/src/routes/cncLinkRoutes.js`
**Controller Dosyası:** `backend/src/controllers/cncLinkController.js`

---

## Modül Amacı

- ESP32 donanım bağlantısı
- Gerçek zamanlı durum raporlama
- İş emri bildirimleri
- Performans verileri
- LED durum kontrolü

---

## Donanım Özellikleri

### ESP32 Paneli

| Özellik | Değer |
|---------|-------|
| Mikroişlemci | ESP32 |
| Wi-Fi | 802.11 b/g/n |
| LED | 3 renkli (Yeşil, Mavi, Kırmızı) |
| Buton | Programlanabilir |
| Baud Rate | 115200 |

### Durum LED'leri

| LED Rengi | Durum | Açıklama |
|-----------|-------|----------|
| Yeşil | Boşta | Tezgah müsait |
| Mavi | Çalışıyor | İş emri aktif |
| Kırmızı | Hata | Arıza veya bakım |

---

## Veritabanı Tablosu

**Tezgah Durum Logları:** `tezgah_durum_log`

| Alan | Tip | Açıklama |
|------|-----|----------|
| id | INTEGER | Birincil anahtar |
| tezgah_id | INTEGER | Tezgah ID |
| durum | INTEGER | Durum kodu (0,1,2) |
| is_emri_id | INTEGER | Aktif iş emri ID |
| bildirim_zamani | DATETIME | Bildirim zamanı |
| veri | TEXT | Ek veri (JSON) |

---

## API Endpointleri

### GET İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `GET /health` | Sağlık kontrolü |
| `GET /queue-status` | Kuyruk durumu |
| `GET /is-emri-id/:tezgah_id` | Tezgahın aktif iş emri ID |
| `GET /stats/:tezgah_id` | Tezgah istatistikleri |

### POST İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `POST /parca-tamamlandi` | Parça tamamlandı bildirimi |
| `POST /start-job` | İş başlat |
| `POST /stop-job` | İş durdur |
| `POST /finish-job` | İş bitir |
| `POST /update-job-progress` | İlerleme güncelle |
| `POST /start` | Tezgah başlat |
| `POST /stop` | Tezgah durdur |
| `POST /error` | Hata bildirimi |
| `POST /status` | Durum güncelle |

---

## ESP32 Firmware Kodu

### Konfigürasyon (config.h)
```cpp
// Wi-Fi Ayarları
const char* WIFI_SSID = "URTM_WiFi";
const char* WIFI_PASSWORD = "password";

// Sunucu Ayarları
const char* SERVER_IP = "192.168.1.100";
const int SERVER_PORT = 3000;
const char* TEZGAH_ID = "TZ001";

// Durum LED Pin'leri
#define LED_GREEN 26
#define LED_BLUE 27
#define LED_RED 25
```

### Durum Gönderimi
```cpp
void sendStatusUpdate(int status) {
  HTTPClient http;
  http.begin(serverUrl + "/api/cnc-link/status");
  
  StaticJsonDocument<200> doc;
  doc["tezgah_id"] = TEZGAH_ID;
  doc["durum"] = status;
  doc["timestamp"] = millis();
  
  String payload;
  serializeJson(doc, payload);
  
  http.addHeader("Content-Type", "application/json");
  int httpCode = http.POST(payload);
  
  http.end();
}
```

---

## Durum Kodları

| Kod | Durum | LED Rengi |
|-----|-------|-----------|
| 0 | Boşta | Yeşil |
| 1 | Çalışıyor | Mavi |
| 2 | Hata/Bakım | Kırmızı |

---

## Socket.IO Events

| Olay | Yön | Açıklama |
|------|-----|----------|
| `cnc:statusChanged` | Server→Client | Durum değişti |
| `cnc:jobStarted` | Server→Client | İş başladı |
| `cnc:jobCompleted` | Server→Client | İş tamamlandı |
| `cnc:error` | Server→Client | Hata oluştu |
| `cnc:progress` | Server→Client | İlerleme güncellendi |

---

## Temel Fonksiyonlar

### 1. durumGuncelle(tezgahId, durum)
ESP32'den gelen durum bilgisini kaydeder.

### 2. isEmriBaslat(tezgahId, isEmriId)
Tezgahtaki iş emrini başlatır.
- LED'i mavi yapar
- Veritabanını günceller

### 3. isEmriBitir(tezgahId, isEmriId)
İş emrini tamamlar.
- LED'i yeşil yapar
- İstatistikleri kaydeder

### 4. hataBildirimi(tezgahId, hataData)
Hata durumunu kaydeder.
- LED'i kırmızı yapar
- Arıza kaydı oluşturabilir

---

## İlişkili Modüller

- **Tezgahlar** - Ana tezgah yönetimi
- **İş Emirleri** - İş emri takibi
- **Arıza-Bakım** - Hata kayıtları

---

## Kurulum

### 1. ESP32 Donanımı
1. ESP32 panosunu monte edin
2. LED'leri bağlayın (GPIO 25, 26, 27)
3. Wi-Fi antenini takın
4. Güç bağlantısını yapın

### 2. Konfigürasyon
1. `include/config.h` dosyasını düzenleyin
2. Wi-Fi SSID ve şifresini girin
3. Sunucu IP adresini girin
4. Tezgah ID'sini ayarlayın

### 3. Firmware Yükleme
```bash
cd CNC_panel
pio run -t upload
pio device monitor
```

---

## Hata Kodları

| Kod | Mesaj | Açıklama |
|-----|-------|----------|
| CNC001 | Bağlantı hatası | ESP32 sunucuya ulaşamıyor |
| CNC002 | Geçersiz durum | Durum kodu 0-2 arası değil |
| CNC003 | Tezgah bulunamadı | Geçersiz tezgah ID |
| CNC004 | İş emri bulunamadı | Geçersiz iş emri ID |

---

## Versiyon Geçmişi

| Versiyon | Tarih | Değişiklik |
|----------|-------|------------|
| 1.0 | 2024-03 | İlk versiyon |
| 1.1 | 2024-06 | LED kontrolü eklendi |
| 1.2 | 2024-09 | İstatistik sistemi |
| 1.3 | 2024-12 | Real-time entegrasyon |