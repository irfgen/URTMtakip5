# 2. TEZGAHLAR (Workstations/Machines) Modülü

## Genel Bakış

Tezgahlar modülü, üretimde kullanılan makinelerin ve iş istasyonlarının yönetimini sağlar. ESP32 tabanlı donanım entegrasyonu ile gerçek zamanlı durum takibi yapılır.

**Route Dosyası:** `backend/src/routes/tezgahRoutes.js`
**Controller Dosyası:** `backend/src/controllers/tezgahController.js`
**Frontend Sayfası:** `frontend/src/pages/Tezgahlar.jsx`

---

## Modül Amacı

- Makinelerin tanımlanması ve yönetimi
- Gerçek zamanlı durum izleme
- kapasite planlaması
- Performans takibi
- Bakım yönetimi
- ESP32 donanım entegrasyonu

---

## Veritabanı Tablosu

**Ana Tablo:** `tezgahlar`

| Alan | Tip | Açıklama |
|------|-----|----------|
| id | INTEGER | Birincil anahtar |
| tezgah_adi | STRING | Tezgah adı |
| tezgah_kodu | STRING | Tezgah kodu |
| sinif | STRING | Sınıf/Kategori |
| marka | STRING | Marka |
| model | STRING | Model |
| durum | INTEGER | 0:Boşta, 1:Çalışıyor, 2:Hata/Bakım |
| aktif | BOOLEAN | Aktif/Pasif |
| lokasyon | STRING | Fiziksel konum |
| kapasite | INTEGER | Saatlik kapasite |
| created_at | DATETIME | Oluşturulma tarihi |
| updated_at | DATETIME | Güncellenme tarihi |

---

## API Endpointleri

### GET İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `GET /` | Tüm tezgahları listele |
| `GET /:id` | Tezgah detayı getir |
| `GET /:tezgahId/planlanan-is-sayisi` | Planlanan iş sayısı |
| `GET /:tezgahId/planlanan-isler` | Planlanan işler |
| `GET /:tezgah_id/aktif` | Tezgah aktif durumu |
| `GET /:tezgahId/kalemler` | Tezgah kalemleri |

### POST İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `POST /` | Yeni tezgah oluştur |
| `POST /:id/resim` | Tezgah resmi yükle |

### PUT İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `PUT /:id` | Tezgah güncelle |
| `PUT /:id/toggle-aktif` | Aktif/Pasif toggle |
| `PUT /:tezgahId/siralari-guncelle` | Sıralamarı güncelle |

### DELETE İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `DELETE /:id` | Tezgah sil |

---

## Temel Fonksiyonlar

### 1. tezgahlariListele()
Tüm tezgahları listeler.
- Aktif ve pasif tezgahları döner
- Durum bilgisini içerir

### 2. tezgahDetayGetir(tezgahId)
Belirli bir tezgahın detaylarını getirir.
- Makine bilgileri
- Anlık durum
- Planlanan işler

### 3. tezgahDurumuGuncelle(tezgahId, yeniDurum)
Tezgah durumunu günceller.
- Boşta (0)
- Çalışıyor (1)
- Hata/Bakım (2)

### 4. tezgahAktifToggle(tezgahId)
Tezgahın aktif/pasif durumunu değiştirir.

### 5. planlananIsleriGetir(tezgahId)
Belirli bir tezgaha atanmış planlanan işleri döner.

### 6. isSiralariniGuncelle(tezgahId, siralamaData)
Tezgahtaki işlerin sıralamasını günceller.

---

## Durum Kodları

| Kod | Durum | Renk | Açıklama |
|-----|-------|------|----------|
| 0 | Boşta | Yeşil | Müsait, iş bekliyor |
| 1 | Çalışıyor | Mavi | İş emri çalışıyor |
| 2 | Hata | Kırmızı | Arıza veya bakımda |

---

## ESP32 Entegrasyonu

### Donanım Özellikleri
- **Mikrodenetleyici:** ESP32
- **İletişim:** Wi-Fi
- **Protokol:** HTTP POST/GET
- **LED Göstergeler:** 3 renkli durum LED'i

### Durum Raporlama
```cpp
// Durum gönderimi
HTTPClient http;
http.begin(serverUrl + "/api/cnc-link/parca-tamamlandi");
http.addHeader("Content-Type", "application/json");
String payload = "{\"tezgah_id\":" + tezgahId + ",\"durum\":" + durum + "}";
http.POST(payload);
```

### Socket.IO Events
| Olay | Açıklama |
|------|----------|
| `tezgah:statusChanged` | Tezgah durumu değişti |
| `tezgah:jobStarted` | İş başladı |
| `tezgah:jobCompleted` | İş tamamlandı |
| `tezgah:error` | Tezgah hata durumu |

---

## Alt Modüller

### 1. Tezgah Durum Logları
**Dosya:** `tezgahDurumRoutes.js`

Tezgah durum değişikliklerinin loglanması.

| Endpoint | Açıklama |
|----------|----------|
| `GET /:tezgah_id/log` | Durum geçmişi |
| `POST /` | Log ekle |

### 2. Tezgah Planlama
**Dosya:** `tezgahPlanRoutes.js`

İş emri planlaması ve atama.

| Endpoint | Açıklama |
|----------|----------|
| `GET /` | Planlanan işler |
| `POST /` | Yeni plan ekle |
| `PUT /:id` | Plan güncelle |

### 3. Tezgah Raporları
**Dosya:** `tezgahRaporRoutes.js`

Performans ve verimlilik raporları.

---

## Frontend Bileşenleri

| Bileşen | Açıklama |
|---------|----------|
| `Tezgahlar.jsx` | Ana tezgahlar sayfası |
| `TezgahListesi.jsx` | Tezgah listesi |
| `TezgahKarti.jsx` | Tezgah kartı |
| `TezgahForm.jsx` | Tezgah ekleme/düzenleme formu |
| `TezgahDurumGostergesi.jsx` | Anlık durum göstergesi |
| `TezgahPlanlama.jsx` | Planlama arayüzü |
| `TezgahIsPlani.jsx` | İş planı görünümü |

---

## Performans Metrikleri

| Metrik | Açıklama |
|--------|----------|
| Çalışma Süresi | Toplam çalışma süresi |
| Boşta Kalma Süresi | Müsait kalma süresi |
| Verimlilik | Çalışma / Toplam zaman |
| Tamamlanan İş | Belirli periyotta tamamlanan iş |
| Ortalama İş Süresi | İş başına ortalama süre |

---

## Socket.IO Events

| Olay | Yön | Açıklama |
|------|-----|----------|
| `tezgah:status` | Server→Client | Durum güncelleme |
| `tezgah:job:assigned` | Server→Client | İş atama |
| `tezgah:performance` | Server→Client | Performans verisi |

---

## İlişkili Modüller

- **İş Emirleri** - Tezgaha atanan işler
- **Arıza-Bakım** - Bakım ve arıza kayıtları
- **Vardiya Yönetimi** - Vardiya bazlı takip
- **Raporlar** - Performans raporları
- **CNC Link** - ESP32 donanım entegrasyonu

---

## Kullanım Senaryoları

### Senaryo 1: Yeni Tezgah Ekleme
1. Admin "Yeni Tezgah" seçer
2. Tezgah bilgilerini girer (ad, kod, sınıf, marka, model)
3. Kapasite ve lokasyon bilgilerini girer
4. Kaydet butonuna tıklar

### Senaryo 2: ESP32 Durum Güncelleme
1. ESP32 tezgah durumunu algılar
2. HTTP POST ile sunucuya bildirir
3. Sunucu veritabanını günceller
4. Socket.IO ile tüm istemcilere bildirir

### Senaryo 3: Tezgahı Devre Dışı Bırakma
1. Admin tezgah seçer
2. "Pasif Yap" butonuna tıklar
3. Tezgah pasif olarak işaretlenir
4. Yeni iş atanamaz

---

## Validasyon Kuralları

- `tezgah_kodu` benzersiz olmalı
- `kapasite` pozitif integer olmalı
- `durum` 0, 1 veya 2 olmalı
- `lokasyon` en fazla 100 karakter

---

## Hata Kodları

| Kod | Mesaj | Açıklama |
|-----|-------|----------|
| TZ001 | Tezgah bulunamadı | Geçersiz tezgah ID |
| TZ002 | Geçersiz durum | Durum değeri 0-2 arası değil |
| TZ003 | Aktif iş var | Pasif yapılmak istenen tezgahta aktif iş var |
| TZ004 | ESP32 bağlantı hatası | Donanım erişilemez |

---

## Versiyon Geçmişi

| Versiyon | Tarih | Değişiklik |
|----------|-------|------------|
| 1.0 | 2024-02 | İlk versiyon |
| 1.1 | 2024-05 | ESP32 entegrasyonu eklendi |
| 1.2 | 2024-08 | Real-time durum güncellemeleri |
| 1.3 | 2024-11 | Performans metrikleri eklendi |
| 1.4 | 2025-01 | Mobil uyum iyileştirmesi |