# 28. TEDARİK TALEPLERİ (Supply Requests) Modülü

## Genel Bakış

Tedarik Talepleri modülü, stok kritik seviyeye düştüğünde veya manuel olarak oluşturulan tedarik taleplerinin yönetimini sağlar.

**Route Dosyası:** `backend/src/routes/tedarikRoutes.js`
**Controller Dosyası:** `backend/src/controllers/tedarikTalebiController.js`

---

## Modül Amacı

- Tedarik talebi oluşturma
- Onay süreci
- Siparişe dönüştürme
- Takip ve raporlama

---

## Veritabanı Tablosu

**Tedarik Talepleri:** `tedarik_talepleri`

| Alan | Tip | Açıklama |
|------|-----|----------|
| id | INTEGER | Birincil anahtar |
| talep_no | STRING | Talep numarası |
| stok_karti_id | INTEGER | Stok kartı ID |
| talep_eden | STRING | Talep eden kişi |
| miktar | DECIMAL | Talep miktarı |
| birim | STRING | Birim |
| talep_tarihi | DATE | Talep tarihi |
| hedef_tarih | DATE | Hedef tedarik tarihi |
| durum | STRING | beklemede, onaylandi, sipariste, tedarik_edildi, iptal |
| tedarikci_id | INTEGER | Tedarikçi ID |
| siparis_no | STRING | Oluşan sipariş no |
| notlar | TEXT | Notlar |
| created_at | DATETIME | Oluşturulma tarihi |

---

## API Endpointleri

### GET İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `GET /` | Tüm talepleri listele |
| `GET /:id` | Talep detayı |
| `GET /istatistikler` | İstatistikler |
| `GET /by-durum/:durum` | Duruma göre listele |

### POST İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `POST /` | Yeni talep oluştur |
| `POST /:id/onayla` | Talebi onayla |
| `POST /:id/siparis-olustur` | Sipariş oluştur |

### PUT İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `PUT /:id` | Talebi güncelle |
| `PATCH /:id/durum` | Durumu güncelle |

### DELETE İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `DELETE /:id` | Talebi sil |

---

## Durum Akışı

```
beklemede → onaylandi → sipariste → tedarik_edildi
                ↓
              iptal
```

---

## Otomatik Talep Kriterleri

| Kriter | Açıklama |
|--------|----------|
| Kritik Seviye | Stok <= kritik_seviye |
| Minimum Sipariş | Miktar < minimum sipariş |
| Tedarik Süresi | Talep tarihi + tedarik_suresi |

---

## Temel Fonksiyonlar

### 1. talepOlustur(talepData)
Yeni tedarik talebi oluşturur.

### 2. onayla(talepId)
Talebi onaylar.

### 3. siparisOlustur(talepId)
Talep için sipariş oluşturur.
- Tedarikçi seçimi
- Sipariş numarası üretimi

---

## İlişkili Modüller

- **Stok Kartları** - Stok kartı bilgisi
- **Siparişler** - Oluşan siparişler
- **Firma Yönetimi** - Tedarikçi bilgisi

---

## Versiyon Geçmişi

| Versiyon | Tarih | Değişiklik |
|----------|-------|------------|
| 1.0 | 2024-02 | İlk versiyon |
| 1.1 | 2024-06 | Otomatik talep eklendi |
| 1.2 | 2024-10 | Sipariş entegrasyonu |