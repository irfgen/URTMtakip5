# 12. VARDİYA YÖNETİMİ (Shift Management) Modülü

## Genel Bakış

Vardiya Yönetimi modülü, üretim vardiyalarının planlanması, personel ataması ve performans takibini yönetir.

**Route Dosyası:** `backend/src/routes/vardiyaRoutes.js`
**Controller Dosyası:** `backend/src/controllers/vardiyaController.js`
**Alt Route:** `backend/src/routes/gunlukVardiyaRoutes.js`

---

## Modül Amacı

- Vardiya tanımlama ve yönetimi
- Personel atama
- Vardiya performans takibi
- Günlük vardiya raporu
- Çakışma kontrolü

---

## Veritabanı Tablosu

**Vardiyalar Tablosu:** `vardiyalar`

| Alan | Tip | Açıklama |
|------|-----|----------|
| id | INTEGER | Birincil anahtar |
| vardiya_adi | STRING | Vardiya adı (Sabah, Akşam, Gece) |
| baslangic_saati | TIME | Başlangıç saati |
| bitis_saati | TIME | Bitiş saati |
| sure_saat | DECIMAL | Vardiya süresi (saat) |
| renk | STRING | Takvim rengi |
| aktif | BOOLEAN | Aktif/Pasif |

**Vardiya Atamaları:** `vardiya_atamalari`

| Alan | Tip | Açıklama |
|------|-----|----------|
| id | INTEGER | Birincil anahtar |
| vardiya_id | INTEGER | Vardiya ID |
| personel_id | INTEGER | Personel ID |
| tarih | DATE | Vardiya tarihi |
| tezgah_id | INTEGER | Atanan tezgah (opsiyonel) |
| durum | STRING | planlandi, aktif, tamamlandi |
| notlar | TEXT | Notlar |

**Günlük Vardiya Kayıtları:** `gunluk_vardiya`

| Alan | Tip | Açıklama |
|------|-----|----------|
| id | INTEGER | Birincil anahtar |
| tarih | DATE | Tarih |
| vardiya_id | INTEGER | Vardiya ID |
| toplam_uretim | INTEGER | Toplam üretim adedi |
| tamamlanan_is | INTEGER | Tamamlanan iş sayısı |
| fire_orani | DECIMAL | Fire oranı (%) |
| verimlilik | DECIMAL | Verimlilik (%) |

---

## API Endpointleri

### GET İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `GET /` | Tüm vardiyaları listele |
| `GET /:id` | Vardiya detayı |
| `GET /aktif` | Aktif vardiyalar |
| `GET /aktif-vardiyalar` | Aktif vardiyalar (detaylı) |
| `GET /ozet` | Günlük vardiya özeti |
| `GET /report` | Vardiya raporu |
| `GET /by-tarih/:tarih` | Tarihe göre vardiyalar |
| `GET /vardiya-tezgah` | Vardiya-tezgah raporu |
| `GET /atama/:tarih/:vardiyaId` | Atama bilgisi |

### POST İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `POST /` | Yeni vardiya oluştur |
| `POST /atama` | Personel atama |
| `POST /baslat` | Vardiyayı başlat |
| `POST /bitir` | Vardiyayı bitir |

### PUT İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `PUT /:id` | Vardiya güncelle |
| `PUT /atama/:id` | Atama güncelle |

### DELETE İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `DELETE /:id` | Vardiya sil |
| `DELETE /atama/:id` | Atama sil |

---

## Vardiya Türleri

| Vardiya | Saat Aralığı | Süre |
|---------|--------------|------|
| Sabah | 06:00 - 14:00 | 8 saat |
| Akşam | 14:00 - 22:00 | 8 saat |
| Gece | 22:00 - 06:00 | 8 saat |

---

## Temel Fonksiyonlar

### 1. vardiyaOlustur(vardiyaData)
Yeni vardiya tanımı oluşturur.

### 2. personelAtama(vardiyaId, personelId, tarih)
Personeli vardiyaya atar.
- Çakışma kontrolü yapar

### 3. vardiyayiBaslat(vardiyaId, tarih)
Vardiyayı aktif olarak başlatır.

### 4. vardiyayiBitir(vardiyaId, tarih)
Vardiyayı tamamlar ve istatistikleri kaydeder.

### 5. vardiyaOzetiGetir(tarih)
Belirli tarihte vardiya özetini döner.

### 6. performansHesapla(vardiyaId, tarih)
Vardiya performansını hesaplar.

---

## Vardiya Durumları

| Durum | Açıklama |
|-------|----------|
| planlandi | Atama yapıldı, henüz başlamadı |
| aktif | Vardiya devam ediyor |
| tamamlandi | Vardiya sona erdi |
| iptal | Vardiya iptal edildi |

---

## Performans Metrikleri

| Metrik | Açıklama |
|--------|----------|
| Toplam Üretim | Vardiyada üretilen toplam adet |
| Verimlilik | (Gerçek / Hedef) × 100 |
| Fire Oranı | Fire / Toplam × 100 |
| Çalışma Süresi | Net çalışma süresi |

---

## Günlük Vardiya Raporu

Tarih bazlı vardiya özeti:
- Vardiyaların performansı
- Toplam üretim
- Karşılaştırmalı analiz

---

## Frontend Bileşenleri

| Bileşen | Açıklama |
|---------|----------|
| `Vardiyalar.jsx` | Ana vardiya sayfası |
| `VardiyaListesi.jsx` | Vardiya listesi |
| `VardiyaForm.jsx` | Vardiya formu |
| `VardiyaAtama.jsx` | Personel atama |
| `GunlukVardiyaRaporu.jsx` | Günlük rapor |
| `VardiyaTakvim.jsx` | Takvim görünümü |

---

## Socket.IO Events

| Olay | Açıklama |
|------|----------|
| `vardiya:created` | Yeni vardiya oluşturuldu |
| `vardiya:started` | Vardiya başladı |
| `vardiya:ended` | Vardiya sona erdi |
| `vardiya:atama` | Personel atandı |

---

## İlişkili Modüller

- **İş Emirleri** - Vardiya bazlı iş takibi
- **Tezgahlar** - Tezgah ataması
- **Personel** - Personel bilgileri
- **Raporlar** - Vardiya raporları

---

## Kullanım Senaryoları

### Senaryo 1: Vardiya Planla
1. Yönetici vardiya planlamasını açar
2. Tarih seçer
3. Personelleri vardiyalara atar
4. Tezgah bağlantılarını yapar
5. Kaydeder

### Senaryo 2: Vardiya Başlatma
1. Vardiya başladığında operatör "Başlat" tıklar
2. Sistem aktif duruma geçer
3. İş emirleri bu vardiyaya atanır

### Senaryo 3: Vardiya Raporu
1. Vardiya sonunda "Bitir" tıklar
2. Sistem performans verilerini hesaplar
3. Rapor oluşturulur

---

## Validasyon Kuralları

- `vardiya_adi` zorunlu
- `baslangic_saati` < `bitis_saati`
- Aynı personelin aynı tarihte iki vardiyası olamaz
- `sure_saat` > 0

---

## Hata Kodları

| Kod | Mesaj | Açıklama |
|-----|-------|----------|
| VD001 | Vardiya bulunamadı | Geçersiz ID |
| VD002 | Çakışma var | Personel zaten atanmış |
| VD003 | Geçersiz saat | Başlangıç > Bitiş |

---

## Versiyon Geçmişi

| Versiyon | Tarih | Değişiklik |
|----------|-------|------------|
| 1.0 | 2024-02 | İlk versiyon |
| 1.1 | 2024-06 | Personel atama eklendi |
| 1.2 | 2024-09 | Performans takibi |
| 1.3 | 2024-12 | Günlük rapor sistemi |