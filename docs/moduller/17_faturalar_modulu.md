# 17. FATURALAR (Invoices) Modülü

## Genel Bakış

Faturalar modülü, alış ve satış faturalarının oluşturulması, yönetimi ve takibini sağlar.

**Route Dosyası:** `backend/src/routes/faturalar.js`
**Controller Dosyası:** `backend/src/controllers/faturaController.js`
**Frontend Sayfası:** `frontend/src/pages/Faturalar.jsx`

---

## Modül Amacı

- Fatura oluşturma ve yönetim
- Fatura kalemleri
- Fatura onay süreci
- PDF çıktısı
- Fatura eşleştirme

---

## Veritabanı Tablosu

**Faturalar Tablosu:** `faturalar`

| Alan | Tip | Açıklama |
|------|-----|----------|
| id | INTEGER | Birincil anahtar |
| fatura_no | STRING | Fatura numarası |
| fatura_turu | STRING | alis, satis |
| firma_id | INTEGER | Firma ID |
| tarih | DATE | Fatura tarihi |
| vade_tarihi | DATE | Vade tarihi |
| durum | STRING | taslak, onaylandi, odendi, iptal |
| toplam_tutar | DECIMAL | Toplam tutar |
| kdv | DECIMAL | KDV tutarı |
| genel_toplam | DECIMAL | Genel toplam |
| notlar | TEXT | Notlar |
| created_at | DATETIME | Oluşturulma tarihi |

**Fatura Kalemleri:** `fatura_kalemleri`

| Alan | Tip | Açıklama |
|------|-----|----------|
| id | INTEGER | Birincil anahtar |
| fatura_id | INTEGER | Fatura ID |
| stok_karti_id | INTEGER | Stok kartı ID |
| parca_kodu | STRING | Parça kodu |
| aciklama | STRING | Açıklama |
| miktar | DECIMAL | Miktar |
| birim_fiyat | DECIMAL | Birim fiyat |
| kdv_orani | DECIMAL | KDV oranı (%) |
| toplam | DECIMAL | Toplam |

---

## API Endpointleri

### GET İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `GET /` | Tüm faturaları listele |
| `GET /:id` | Fatura detayı |
| `GET /:id/kalemler` | Fatura kalemleri |
| `GET /:id/durum` | Fatura durumu |
| `GET /by-firma/:firmaId` | Firmaya ait faturalar |
| `GET /by-durum/:durum` | Duruma göre faturalar |
| `GET /ara` | Fatura arama |

### POST İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `POST /` | Yeni fatura oluştur |
| `POST /:id/kalemler` | Kalem ekle |
| `POST /:id/onayla` | Faturayı onayla |

### PUT İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `PUT /:id` | Faturayı güncelle |
| `PUT /:id/kalemler/:kalemId` | Kalem güncelle |
| `PUT /:id/durum` | Durum güncelle |

### DELETE İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `DELETE /:id` | Faturayı sil |
| `DELETE /:id/kalemler/:kalemId` | Kalem sil |

---

## Fatura Türleri

| Tür | Açıklama |
|-----|----------|
| alis | Alış faturası (tedarikçi) |
| satis | Satış faturası (müşteri) |

---

## Fatura Durumları

| Durum | Açıklama |
|-------|----------|
| taslak | Henüz onaylanmadı |
| onaylandi | Onaylandı |
| odendi | Ödendi |
| iptal | İptal edildi |

---

## Temel Fonksiyonlar

### 1. faturaOlustur(faturaData)
Yeni fatura oluşturur.
- Fatura numarası üretir
- Tür ve tarih atar

### 2. kalemEkle(faturaId, kalemData)
Faturaya kalem ekler.
- KDV hesaplaması yapar

### 3. onayla(faturaId)
Faturayı onaylar.
- Durumu günceller
- Stok etkileyebilir

### 4. kdvHesapla(faturaId)
Faturanın KDV tutarını hesaplar.

---

## Frontend Bileşenleri

| Bileşen | Açıklama |
|---------|----------|
| `Faturalar.jsx` | Ana fatura sayfası |
| `FaturaListesi.jsx` | Fatura listesi |
| `FaturaForm.jsx` | Fatura formu |
| `FaturaDetay.jsx` | Fatura detay |
| `FaturaKalemleri.jsx` | Kalem listesi |

---

## İlişkili Modüller

- **Firma Yönetimi** - Firma bilgisi
- **Stok Kartları** - Stok kartı bilgileri
- **Faturalar** - İrsaliye eşleştirme

---

## Versiyon Geçmişi

| Versiyon | Tarih | Değişiklik |
|----------|-------|------------|
| 1.0 | 2024-02 | İlk versiyon |
| 1.1 | 2024-06 | Kalem sistemi eklendi |
| 1.2 | 2024-10 | Onay süreci eklendi |