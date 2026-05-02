# 29. SATIŞLAR (Sales) Modülü

## Genel Bakış

Satışlar modülü, üretilen veya satışa sunulan makinelerin ve ürünlerin satış yönetimini sağlar.

**Route Dosyası:** `backend/src/routes/satisRoutes.js`
**Controller Dosyası:** `backend/src/controllers/satisController.js`

---

## Modül Amacı

- Satış kaydı oluşturma
- Satış takibi
- Müşteri bilgileri
- Fatura bağlantısı

---

## Veritabanı Tablosu

**Satışlar:** `satislar`

| Alan | Tip | Açıklama |
|------|-----|----------|
| id | INTEGER | Birincil anahtar |
| satis_no | STRING | Satış numarası |
| musteri_id | INTEGER | Müşteri firma ID |
| tarih | DATE | Satış tarihi |
| teslim_tarihi | DATE | Teslim tarihi |
| durum | STRING | beklemede, onaylandi, tamamlandi, iptal |
| toplam_tutar | DECIMAL | Toplam tutar |
| notlar | TEXT | Notlar |
| created_at | DATETIME | Oluşturulma tarihi |

**Satış Kalemleri:** `satis_kalemleri`

| Alan | Tip | Açıklama |
|------|-----|----------|
| id | INTEGER | Birincil anahtar |
| satis_id | INTEGER | Satış ID |
| parca_kodu | STRING | Parça/makina kodu |
| adet | INTEGER | Satış adedi |
| birim_fiyat | DECIMAL | Birim fiyat |
| toplam | DECIMAL | Toplam |

---

## API Endpointleri

### GET İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `GET /` | Tüm satışları listele |
| `GET /:id` | Satış detayı |
| `GET /makinalar` | Satılık makineler |

### POST İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `POST /` | Yeni satış oluştur |
| `POST /makina-sat` | Makina satışı |

### PUT İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `PUT /:id` | Satış güncelle |

### DELETE İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `DELETE /:id` | Satış sil |

---

## Durumlar

| Durum | Açıklama |
|-------|----------|
| beklemede | Satış bekliyor |
| onaylandi | Onaylandı |
| tamamlandi | Satış tamamlandı |
| iptal | Satış iptal |

---

## Versiyon Geçmişi

| Versiyon | Tarih | Değişiklik |
|----------|-------|------------|
| 1.0 | 2024-03 | İlk versiyon |
| 1.1 | 2024-07 | Makina satış özelliği |