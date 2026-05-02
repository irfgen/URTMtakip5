# 18. İRSALİYELER (Delivery Notes) Modülü

## Genel Bakış

İrsaliyeler modülü, mal teslim belgelerinin oluşturulması ve fatura ile eşleştirilmesini sağlar.

**Route Dosyası:** `backend/src/routes/irsaliyeler.js`
**Controller Dosyası:** `backend/src/controllers/irsaliyeController.js`
**Frontend Sayfası:** `frontend/src/pages/Irsaliyeler.jsx`

---

## Modül Amacı

- İrsaliye oluşturma
- Kalem yönetimi
- Fatura eşleştirme
- Analiz raporları

---

## Veritabanı Tablosu

**İrsaliyeler Tablosu:** `irsaliyeler`

| Alan | Tip | Açıklama |
|------|-----|----------|
| id | INTEGER | Birincil anahtar |
| irsaliye_no | STRING | İrsaliye numarası |
| fatura_id | INTEGER | Fatura ID (nullable) |
| firma_id | INTEGER | Firma ID |
| tarih | DATE | İrsaliye tarihi |
| durum | STRING | taslak, gonderildi, teslim, iptal |
| notlar | TEXT | Notlar |
| created_at | DATETIME | Oluşturulma tarihi |

**İrsaliye Kalemleri:** `irsaliye_kalemleri`

| Alan | Tip | Açıklama |
|------|-----|----------|
| id | INTEGER | Birincil anahtar |
| irsaliye_id | INTEGER | İrsaliye ID |
| stok_karti_id | INTEGER | Stok kartı ID |
| miktar | DECIMAL | Miktar |
| birim | STRING | Birim |

---

## API Endpointleri

### GET İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `GET /` | Tüm irsaliyeleri listele |
| `GET /:id` | İrsaliye detayı |
| `GET /:id/kalemler` | Kalemler |
| `GET /by-firma/:firmaId` | Firmaya ait irsaliyeler |
| `GET /by-durum/:durum` | Duruma göre listele |
| `POST /analiz` | İrsaliye analizi |
| `POST /analiz/v2` | Analiz V2 |

### POST İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `POST /` | Yeni irsaliye oluştur |
| `POST /:id/kalemler` | Kalem ekle |
| `POST /:id/irsaliye-tamamla` | İrsaliyeyi tamamla |

### PUT İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `PUT /:id` | İrsaliyeyi güncelle |
| `PUT /:id/kalemler/:kalemId` | Kalem güncelle |

### DELETE İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `DELETE /:id` | İrsaliyeyi sil |
| `DELETE /:id/kalemler/:kalemId` | Kalem sil |

---

## Durumlar

| Durum | Açıklama |
|-------|----------|
| taslak | Oluşturuldu, gönderilmedi |
| gonderildi | Gönderildi |
| teslim | Teslim edildi |
| iptal | İptal edildi |

---

## Temel Fonksiyonlar

### 1. irsaliyeOlustur(data)
Yeni irsaliye oluşturur.

### 2. tamamla(irsaliyeId)
İrsaliyeyi tamamla ve fatura ile eşleştir.

### 3. analizYap(data)
İrsaliye analizi yapar.

---

## Frontend Bileşenleri

| Bileşen | Açıklama |
|---------|----------|
| `Irsaliyeler.jsx` | Ana irsaliye sayfası |
| `IrsaliyeListesi.jsx` | İrsaliye listesi |
| `IrsaliyeForm.jsx` | İrsaliye formu |

---

## İlişkili Modüller

- **Faturalar** - Fatura eşleştirme
- **Firma Yönetimi** - Firma bilgisi
- **Stok Kartları** - Stok bilgisi

---

## Versiyon Geçmişi

| Versiyon | Tarih | Değişiklik |
|----------|-------|------------|
| 1.0 | 2024-02 | İlk versiyon |
| 1.1 | 2024-07 | Fatura eşleştirme eklendi |
| 1.2 | 2024-11 | Analiz sistemi eklendi |