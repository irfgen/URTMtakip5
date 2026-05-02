# 33. İÇ SEVKİYATLAR (Internal Shipments) Modülü

## Genel Bakış

İç Sevkiyatlar modülü, şirket içi bölümler arası veya kendi kendine yapılan sevkiyatları yönetir.

**Route Dosyası:** `backend/src/routes/icSevkiyatRoutes.js` (mevcuttur, frontend ayrı)
**Frontend Sayfası:** `frontend/src/pages/IcSevkiyatlar.jsx`

---

## Modül Amacı

- İç sevkiyat oluşturma
- Depolar arası transfer
- Bölümler arası hareket
- Transfer takibi

---

## Veritabanı Tablosu

**İç Sevkiyatlar:** `ic_sevkiyatlar`

| Alan | Tip | Açıklama |
|------|-----|----------|
| id | INTEGER | Birincil anahtar |
| sevkiyat_no | STRING | Sevkiyat numarası |
| kaynak_depo | STRING | Kaynak depo |
| hedef_depo | STRING | Hedef depo |
| tarih | DATE | Tarih |
| durum | STRING | hazirlaniyor, yola_cikti, teslim_edildi |
| notlar | TEXT | Notlar |
| created_at | DATETIME | Oluşturulma tarihi |

**İç Sevkiyat Kalemleri:** `ic_sevkiyat_kalemleri`

| Alan | Tip | Açıklama |
|------|-----|----------|
| id | INTEGER | Birincil anahtar |
| sevkiyat_id | INTEGER | Sevkiyat ID |
| parca_kodu | STRING | Parça kodu |
| miktar | DECIMAL | Miktar |
| durum | STRING | beklemede, transfer_edildi |

---

## API Endpointleri

### GET İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `GET /` | Tüm iç sevkiyatları listele |
| `GET /:id` | Sevkiyat detayı |

### POST İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `POST /` | Yeni iç sevkiyat oluştur |

### PUT İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `PUT /:id` | Güncelle |
| `PUT /:id/teslim-et` | Teslim et |

---

## Durumlar

| Durum | Açıklama |
|-------|----------|
| hazirlaniyor | Hazırlanıyor |
| yola_cikti | Transfer aşamasında |
| teslim_edildi | Teslim edildi |

---

## İlişkili Modüller

- **Stok Kartları** - Depo stokları
- **Parçalar** - Parça bilgileri

---

## Versiyon Geçmişi

| Versiyon | Tarih | Değişiklik |
|----------|-------|------------|
| 1.0 | 2024-04 | İlk versiyon |
| 1.1 | 2024-08 | Depo entegrasyonu eklendi |