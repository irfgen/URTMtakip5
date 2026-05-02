# 24. EŞLEŞTİRME (Matching) Modülü

## Genel Bakış

Eşleştirme modülü, fatura kalemlerinin stok kartları veya parçalarla eşleştirilmesini sağlar.

**Route Dosyası:** `backend/src/routes/eslestirme.js`
**Controller Dosyası:** `backend/src/controllers/eslestirmeController.js`
**Frontend Sayfası:** `frontend/src/pages/EslestirmeDesktop.jsx`

---

## Modül Amacı

- Fatura kalem eşleştirme
- Stok kartı eşleştirme
- Otomatik eşleştirme önerileri
- Eşleştirme geçmişi
- Toplu eşleştirme

---

## Veritabanı Tablosu

**Eşleştirmeler:** `eslestirmeler`

| Alan | Tip | Açıklama |
|------|-----|----------|
| id | INTEGER | Birincil anahtar |
| fatura_kalem_id | INTEGER | Fatura kalem ID |
| stok_karti_id | INTEGER | Stok kartı ID (nullable) |
| parca_kodu | STRING | Parça kodu (nullable) |
| eslestirme_turu | STRING | otomatik, manuel |
| eslestirme_tarihi | DATETIME | Eşleştirme tarihi |
| eslestiren | STRING | Eşleştiren kullanıcı |

---

## API Endpointleri

### GET İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `GET /:id/kalemler` | Eşleştirme kalemleri |
| `GET /gecmis` | Eşleştirme geçmişi |
| `GET /oneri/:faturaKalemId` | Eşleştirme önerisi |

### POST İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `POST /:id/kalemler` | Kalem ekle |
| `POST /:id/kalemler/:parca_kodu` | Parça kodu ile ekle |
| `POST /:id/kalemler/:stok_karti_id` | Stok kartı ile ekle |
| `POST /eslestirme-kaldir/:fatura_kalem_id` | Eşleştirme kaldır |
| `POST /otomatik-eslestir` | Otomatik eşleştir |

### PUT İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `PUT /:id/kalemler` | Kalemleri güncelle |

### DELETE İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `DELETE /:id/kalemler/:kalem_id` | Kalem sil |

---

## Eşleştirme Türleri

| Tür | Açıklama |
|-----|----------|
| otomatik | Sistem tarafından önerilen |
| manuel | Kullanıcı tarafından seçilen |

---

## Eşleştirme Kriterleri

1. **Ad Benzerliği** - En az %70 benzerlik
2. **Stok Kodu Eşleşmesi** - Doğrudan kod eşleşmesi
3. **BOM Bağlantısı** - Aynı BOM'da bulunma
4. **Son Kullanım** - En son eşleştirildiği kalem

---

## Temel Fonksiyonlar

### 1. kalemEkle(eslestirmeId, kalemData)
Eşleştirmeye kalem ekler.

### 2. otomatikEslestir(faturaId)
Sistematik olarak otomatik eşleştirme yapar.
- Tüm fatura kalemlerini tarar
- En iyi eşleşmeleri önerir

### 3. eslestirmeKaldir(faturaKalemId)
Eşleştirmeyi kaldırır.

### 4. eslesmeOner(faturaKalemId)
Belirli bir fatura kalemi için eşleştirme önerisi yapar.

---

## Frontend Bileşenleri

| Bileşen | Açıklama |
|---------|----------|
| `EslestirmeDesktop.jsx` | Ana eşleştirme sayfası |
| `EslestirmeListesi.jsx` | Eşleştirme listesi |
| `KalemEslestirme.jsx` | Kalem eşleştirme arayüzü |
| `OneriPaneli.jsx` | Öneri paneli |
| `EslesmeGecmisi.jsx` | Geçmiş eşleştirmeler |

---

## Socket.IO Events

| Olay | Açıklama |
|------|----------|
| `eslestirme:created` | Yeni eşleştirme oluşturuldu |
| `eslestirme:updated` | Eşleştirme güncellendi |
| `eslestirme:removed` | Eşleştirme kaldırıldı |

---

## İlişkili Modüller

- **Faturalar** - Fatura kalemleri
- **Stok Kartları** - Stok kartları
- **Parçalar** - Parça bilgileri

---

## Kullanım Senaryoları

### Senaryo 1: Manuel Eşleştirme
1. Kullanıcı eşleştirme sayfasını açar
2. Fatura seçer
3. Eşleştirilmemiş kalemleri görür
4. Stok kartı veya parça seçer
5. Eşleştirir

### Senaryo 2: Otomatik Eşleştirme
1. Kullanıcı "Otomatik Eşleştir" tıklar
2. Sistem tüm kalemleri tarar
3. Eşleşme önerilerini gösterir
4. Kullanıcı onaylar veya değiştirir
5. Uygula

---

## Versiyon Geçmişi

| Versiyon | Tarih | Değişiklik |
|----------|-------|------------|
| 1.0 | 2024-04 | İlk versiyon |
| 1.1 | 2024-07 | Otomatik eşleştirme eklendi |
| 1.2 | 2024-10 | Öneri sistemi geliştirildi |