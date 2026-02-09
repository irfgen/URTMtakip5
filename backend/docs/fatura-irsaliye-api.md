# Fatura & İrsaliye Matching System - API Documentation

## Overview / Genel Bakış

Bu API, fatura ve irsaliye eşleştirme sistemi için RESTful endpoint'ler sunar. Sistem, tedarikçi faturalarını sevk irsaliyeleri ile eşleştirmek için optimize edilmiştir.

This API provides RESTful endpoints for the invoice and delivery note matching system. The system is optimized for matching supplier invoices with delivery notes.

**Base URL:** `/api`

**Version:** 1.0.0

---

## Table of Contents / İçindekiler

1. [Authentication / Kimlik Doğrulama](#authentication)
2. [Error Handling / Hata Yönetimi](#error-handling)
3. [Faturalar Endpoints](#faturalar-endpoints)
4. [İrsaliyeler Endpoints](#irsaliyeler-endpoints)
5. [Eşleştirme Endpoints](#eşleştirme-endpoints)
6. [Data Models / Veri Modelleri](#data-models)
7. [Socket.IO Events](#socketio-events)

---

## Authentication / Kimlik Doğrulama

All endpoints require authentication unless running in test mode.

### Bearer Token

```
Authorization: Bearer <JWT_TOKEN>
```

### Alternative Methods / Alternatif Yöntemler

```
?token=<JWT_TOKEN>
X-Access-Token: <JWT_TOKEN>
```

### Test Mode / Test Modu

In test mode (`NODE_ENV=test`), authentication is bypassed and a test user is automatically created:

```javascript
req.user = {
  id: 1,
  ad_soyad: 'Test User',
  email: 'test@example.com',
  role: ['admin']
}
```

### Multi-User Testing / Çok Kullanıcılı Test

For multi-user tests, pass the `X-Test-User-Id` header:

```
X-Test-User-Id: 2
```

### Example Request / Örnek İstek

```javascript
// GET /api/faturalar
fetch('http://localhost:3000/api/faturalar', {
  headers: {
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  }
})
```

---

## Error Handling / Hata Yönetimi

### Status Codes / Durum Kodları

| Code | Description | Açıklama |
|------|-------------|----------|
| 200 | Success | Başarılı |
| 201 | Created | Oluşturuldu |
| 400 | Bad Request | Geçersiz istek |
| 401 | Unauthorized | Yetkisiz |
| 403 | Forbidden | Yasaklı |
| 404 | Not Found | Bulunamadı |
| 409 | Conflict | Çakışma (kilitli kayıt) |
| 500 | Internal Server Error | Sunucu hatası |

### Error Response Format / Hata Yanıt Formatı

```json
{
  "success": false,
  "error": "Hata mesajı",
  "errors": [
    {
      "type": "field",
      "value": "",
      "msg": "Validation error message",
      "path": "field_name",
      "location": "body"
    }
  ]
}
```

### Common Error Codes / Yaygın Hata Kodları

| Error | Description | Açıklama |
|-------|-------------|----------|
| `NOT_FOUND` | Resource not found | Kaynak bulunamadı |
| `LOCKED_BY_OTHER` | Record locked by another user | Kayıt başka kullanıcı tarafından kilitli |
| `NOT_LOCK_OWNER` | Only lock owner can release | Sadece lock sahibi bırakabilir |
| `DUPLICATE_ENTRY` | Unique constraint violation | Benzersiz kısıtlama ihlali |
| `HAS_MATCHED_KALEM` | Cannot delete document with matched items | Eşleşmiş kalem olan belge silinemez |
| `ALREADY_MATCHED` | Item already matched | Kalem zaten eşleştirilmiş |
| `NOT_MATCHED` | Item not matched | Kalem eşleştirilmemiş |

---

## Faturalar Endpoints

### GET /api/faturalar

List invoices with filters and pagination.

**Filtreler ile faturaları listeler ve sayfalar.**

#### Query Parameters

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `page` | integer | No | Page number (default: 1, min: 1) |
| `limit` | integer | No | Items per page (default: 20, min: 1, max: 100) |
| `tedarikci_id` | integer | No | Filter by supplier ID |
| `durum` | string | No | Filter by status: `bekliyor`, `kismi_eslesti`, `tam_eslesti` |
| `baslangic_tarih` | date | No | Filter by start date (ISO 8601) |
| `bitis_tarih` | date | No | Filter by end date (ISO 8601) |

#### Response 200

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "fatura_no": "F2024-001",
      "tedarikci_id": 5,
      "belge_tarih": "2024-01-15",
      "vade_tarih": "2024-02-15",
      "belge_tipi": "gelis",
      "durum": "bekliyor",
      "aciklama": "Ocak ayı malzemeleri",
      "ara_toplam": 15000.00,
      "kdv": 3000.00,
      "genel_toplam": 18000.00,
      "toplam_kalem": 5,
      "toplam_miktar": 100.00,
      "locked_by": null,
      "locked_at": null,
      "created_at": "2024-01-15T10:30:00.000Z",
      "tedarikci": {
        "id": 5,
        "firma_adi": "ABC Tedarik Ltd."
      },
      "olusturan": {
        "id": 1,
        "personel_adi": "Ahmet Yılmaz"
      },
      "kilitli_kullanici": null
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

#### Example / Örnek

```bash
# Get all invoices
curl -X GET "http://localhost:3000/api/faturalar" \
  -H "Authorization: Bearer TOKEN"

# Filter by supplier and status
curl -X GET "http://localhost:3000/api/faturalar?tedarikci_id=5&durum=bekliyor&page=1&limit=10" \
  -H "Authorization: Bearer TOKEN"

# Date range filter
curl -X GET "http://localhost:3000/api/faturalar?baslangic_tarih=2024-01-01&bitis_tarih=2024-01-31" \
  -H "Authorization: Bearer TOKEN"
```

---

### GET /api/faturalar/:id

Get invoice details by ID.

**Fatura detaylarını ID ile getirir.**

#### Parameters

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | integer | Yes | Invoice ID |

#### Response 200

```json
{
  "success": true,
  "data": {
    "id": 1,
    "fatura_no": "F2024-001",
    "tedarikci_id": 5,
    "belge_tarih": "2024-01-15",
    "vade_tarih": "2024-02-15",
    "belge_tipi": "gelis",
    "durum": "kismi_eslesti",
    "aciklama": "Ocak ayı malzemeleri",
    "ara_toplam": 15000.00,
    "kdv": 3000.00,
    "genel_toplam": 18000.00,
    "toplam_kalem": 5,
    "locked_by": null,
    "locked_at": null,
    "created_at": "2024-01-15T10:30:00.000Z",
    "tedarikci": {
      "id": 5,
      "adi": "ABC Tedarik Ltd."
    },
    "olusturan": {
      "id": 1,
      "ad_soyad": "Ahmet Yılmaz"
    },
    "kilitli_kullanici": null,
    "kalemler": [
      {
        "id": 1,
        "fatura_id": 1,
        "stok_kodu": "STK-001",
        "parca_adi": "Çelik Konstrüksiyon",
        "miktar": 50.00,
        "birim": "kg",
        "birim_fiyat": 150.00,
        "toplam_tutar": 7500.00,
        "eslesme_durumu": 1,
        "eslesen_irsaliye_kalem": {
          "id": 10,
          "irsaliye_id": 3,
          "stok_kodu": "STK-001",
          "miktar": 50.00
        }
      }
    ],
    "lockState": {
      "state": "UNLOCKED",
      "canEdit": true
    }
  }
}
```

#### Response 404

```json
{
  "success": false,
  "error": "Fatura bulunamadı"
}
```

#### Lock State Values / Lock Durum Değerleri

| State | Description | Açıklama |
|-------|-------------|----------|
| `UNLOCKED` | Not locked, can edit | Kilitli değil, düzenlenebilir |
| `LOCKED_BY_ME` | Locked by current user | Mevcut kullanıcı tarafından kilitli |
| `LOCKED_BY_OTHER` | Locked by another user | Başka kullanıcı tarafından kilitli |
| `LOCK_EXPIRED` | Lock has expired | Lock süresi dolmuş |

---

### POST /api/faturalar

Create a new invoice.

**Yeni fatura oluşturur.**

#### Request Body

```json
{
  "fatura_no": "F2024-002",
  "tedarikci_id": 5,
  "belge_tarih": "2024-01-20",
  "vade_tarih": "2024-02-20",
  "belge_tipi": "gelis",
  "aciklama": "Şubat ayı malzemeleri",
  "kalemler": [
    {
      "stok_kodu": "STK-001",
      "parca_adi": "Çelik Konstrüksiyon",
      "miktar": 100.00,
      "birim": "kg",
      "birim_fiyat": 150.00,
      "toplam_tutar": 15000.00,
      "aciklama": "1. kalite çelik"
    }
  ]
}
```

#### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `fatura_no` | string | Yes | Invoice number (max: 50 chars, unique) |
| `tedarikci_id` | integer | Yes | Supplier ID |
| `belge_tarih` | date | Yes | Document date (ISO 8601) |
| `vade_tarih` | date | No | Due date (ISO 8601) |
| `belge_tipi` | string | No | Document type: `gelis` (default), `cikis` |
| `aciklama` | string | No | Description |
| `kalemler` | array | No | Invoice items (see below) |

#### Kalem Item Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `stok_kodu` | string | Yes | Stock code |
| `parca_adi` | string | Yes | Part name |
| `miktar` | float | Yes | Quantity (min: 0.0001) |
| `birim` | string | No | Unit |
| `birim_fiyat` | float | No | Unit price (min: 0) |
| `aciklama` | string | No | Item description |

#### Response 201

```json
{
  "success": true,
  "message": "Fatura başarıyla oluşturuldu",
  "data": {
    "id": 2,
    "fatura_no": "F2024-002",
    ...
  }
}
```

#### Response 400 (Duplicate)

```json
{
  "success": false,
  "error": "Bu fatura no zaten mevcut"
}
```

---

### PUT /api/faturalar/:id

Update an existing invoice.

**Mevcut faturayı günceller.**

#### Parameters

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | integer | Yes | Invoice ID |

#### Request Body

```json
{
  "fatura_no": "F2024-002-UPDATE",
  "tedarikci_id": 5,
  "belge_tarih": "2024-01-21",
  "aciklama": "Güncellenmiş açıklama",
  "kalemler": [
    {
      "stok_kodu": "STK-002",
      "parca_adi": "Alüminyum Profil",
      "miktar": 25.00,
      "birim": "kg",
      "birim_fiyat": 200.00
    }
  ]
}
```

#### Response 200

```json
{
  "success": true,
  "message": "Fatura başarıyla güncellendi",
  "data": { ... }
}
```

#### Response 409 (Locked)

```json
{
  "success": false,
  "error": "Kayıt başka bir kullanıcı tarafından kilitli"
}
```

---

### DELETE /api/faturalar/:id

Delete an invoice.

**Faturayı siler.**

> **Note:** Cannot delete if any item is matched.
> **Not:** Herhangi bir kalem eşleştirilmişse silinemez.

#### Parameters

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | integer | Yes | Invoice ID |

#### Response 200

```json
{
  "success": true,
  "message": "Fatura başarıyla silindi"
}
```

---

### GET /api/faturalar/:id/kalemler

Get invoice items.

**Fatura kalemlerini getirir.**

#### Parameters

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | integer | Yes | Invoice ID |

#### Response 200

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "fatura_id": 1,
      "stok_kodu": "STK-001",
      "parca_adi": "Çelik Konstrüksiyon",
      "miktar": 50.00,
      "birim": "kg",
      "birim_fiyat": 150.00,
      "toplam_tutar": 7500.00,
      "eslesme_durumu": 1,
      "eslesen_irsaliye_kalem": {
        "id": 10,
        "irsaliye_id": 3,
        "stok_kodu": "STK-001",
        "miktar": 50.00
      }
    }
  ]
}
```

---

### POST /api/faturalar/:id/kalemler

Add an item to invoice.

**Faturaya kalem ekler.**

#### Parameters

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | integer | Yes | Invoice ID |

#### Request Body

```json
{
  "stok_kodu": "STK-003",
  "parca_adi": "Paslanmaz Çelik",
  "miktar": 30.00,
  "birim": "kg",
  "birim_fiyat": 250.00,
  "aciklama": "304 kalite"
}
```

#### Response 201

```json
{
  "success": true,
  "message": "Kalem başarıyla eklendi",
  "data": {
    "id": 15,
    "fatura_id": 1,
    ...
  }
}
```

---

### POST /api/faturalar/:id/lock

Acquire lock on invoice.

**Fatura üzerinde lock edinir.**

> **Lock Timeout:** 30 minutes (auto-releases after timeout)
> **Lock Timeout:** 30 dakika (timeout sonrasında otomatik bırakır)

#### Parameters

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | integer | Yes | Invoice ID |

#### Response 200

```json
{
  "success": true,
  "data": {
    "id": 1,
    "locked_by": 1,
    "locked_at": "2024-01-15T14:30:00.000Z"
  }
}
```

#### Response 409 (Already Locked)

```json
{
  "success": false,
  "error": "Kayıt başka bir kullanıcı tarafından kilitli",
  "lockedBy": 2,
  "lockedAt": "2024-01-15T14:00:00.000Z"
}
```

#### Socket.IO Event

```javascript
// Emitted to all clients in /fatura-eslestirme namespace
socket.on('lock-acquired', (data) => {
  console.log(data);
  // {
  //   belgeTipi: 'fatura',
  //   belgeId: 1,
  //   lockedBy: 1,
  //   lockedAt: '2024-01-15T14:30:00.000Z'
  // }
});
```

---

### DELETE /api/faturalar/:id/lock

Release lock on invoice.

**Fatura üzerindeki lock'u bırakır.**

#### Parameters

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | integer | Yes | Invoice ID |

#### Response 200

```json
{
  "success": true,
  "message": "Lock bırakıldı"
}
```

#### Response 403 (Not Owner)

```json
{
  "success": false,
  "error": "Sadece kendi lockunuzu bırakabilirsiniz"
}
```

#### Socket.IO Event

```javascript
socket.on('lock-released', (data) => {
  console.log(data);
  // { belgeTipi: 'fatura', belgeId: 1 }
});
```

---

## İrsaliyeler Endpoints

> **Note:** İrsaliye endpoints follow the same pattern as Fatura endpoints.
> **Not:** İrsaliye endpoint'leri Fatura endpoint'leri ile aynı deseni izler.

### GET /api/irsaliyeler

List delivery notes with filters.

**Filtreler ile irsaliyeleri listeler.**

#### Query Parameters

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `page` | integer | No | Page number (default: 1) |
| `limit` | integer | No | Items per page (default: 20, max: 100) |
| `tedarikci_id` | integer | No | Filter by supplier ID |
| `durum` | string | No | Filter by status |
| `baslangic_tarih` | date | No | Filter by start date |
| `bitis_tarih` | date | No | Filter by end date |

#### Response 200

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "irsaliye_no": "IRS-2024-001",
      "tedarikci_id": 5,
      "belge_tarih": "2024-01-15",
      "belge_tipi": "gelis",
      "durum": "bekliyor",
      "aciklama": "Sevk irsaliyesi",
      "toplam_kalem": 3,
      "toplam_miktar": 150.00,
      "locked_by": null,
      "locked_at": null,
      "created_at": "2024-01-15T10:30:00.000Z",
      "tedarikci": {
        "id": 5,
        "firma_adi": "ABC Tedarik Ltd."
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 30,
    "totalPages": 2
  }
}
```

---

### GET /api/irsaliyeler/:id

Get delivery note details.

**İrsaliye detaylarını getirir.**

---

### POST /api/irsaliyeler

Create a new delivery note.

**Yeni irsaliye oluşturur.**

#### Request Body

```json
{
  "irsaliye_no": "IRS-2024-002",
  "tedarikci_id": 5,
  "belge_tarih": "2024-01-20",
  "belge_tipi": "gelis",
  "aciklama": "Yeni sevk",
  "kalemler": [
    {
      "stok_kodu": "STK-001",
      "parca_adi": "Çelik Konstrüksiyon",
      "miktar": 50.00,
      "birim": "kg",
      "aciklama": "1. kalite"
    }
  ]
}
```

---

### PUT /api/irsaliyeler/:id

Update delivery note.

**İrsaliyeyi günceller.**

---

### DELETE /api/irsaliyeler/:id

Delete delivery note.

**İrsaliyeyi siler.**

---

### GET /api/irsaliyeler/:id/kalemler

Get delivery note items.

**İrsaliye kalemlerini getirir.**

---

### POST /api/irsaliyeler/:id/kalemler

Add item to delivery note.

**İrsaliyeye kalem ekler.**

#### Request Body

```json
{
  "stok_kodu": "STK-005",
  "parca_adi": "Bakır Profil",
  "miktar": 15.00,
  "birim": "kg",
  "aciklama": "DKP bakır"
}
```

---

### POST /api/irsaliyeler/:id/lock

Acquire lock on delivery note.

**İrsaliye üzerinde lock edinir.**

---

### DELETE /api/irsaliyeler/:id/lock

Release lock on delivery note.

**İrsaliye üzerindeki lock'u bırakır.**

---

### POST /api/irsaliyeler/:id/force-unlock

Force unlock delivery note (Admin only).

**İrsaliye lock'unu zorla bırakır (Sadece admin).**

> **Warning:** This is an admin-only operation that overrides locks.
> **Uyarı:** Bu sadece admin tarafından kullanılabilir ve lock'ları geçersiz kılar.

#### Parameters

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | integer | Yes | Delivery note ID |

#### Request Body

```json
{
  "reason": "Kullanıcı sistemden çıktı, lock bırakılması gerekiyor"
}
```

#### Response 200

```json
{
  "success": true,
  "message": "Lock zorla bırakıldı"
}
```

#### Response 403 (Not Admin)

```json
{
  "success": false,
  "error": "Only admins can force unlock"
}
```

#### Socket.IO Event

```javascript
// Emitted to the previous lock holder
socket.on('lock-force-released', (data) => {
  console.log(data);
  // {
  //   belgeTipi: 'irsaliye',
  //   belgeId: 1,
  //   reason: 'Kullanıcı sistemden çıktı...',
  //   releasedBy: 'Admin User'
  // }
});
```

---

## Eşleştirme Endpoints

### GET /api/eslestirme/oneler/:fatura_id

Get matching suggestions for an invoice.

**Fatura için eşleşme önerilerini getirir.**

This endpoint uses an optimized SQL JOIN algorithm to find potential matches between invoice items and delivery note items.

Bu endpoint, fatura kalemleri ile irsaliye kalemleri arasındaki olası eşleşmeleri bulmak için optimize edilmiş bir SQL JOIN algoritması kullanır.

#### Parameters

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `fatura_id` | integer | Yes | Invoice ID |

#### Matching Algorithm

The system matches items based on:
- Same supplier (`tedarikci_id`)
- Same stock code (`stok_kodu`)
- Unmatched delivery note items (`eslesme_durumu = 0`)

Sistem öğeleri şu kriterlere göre eşleştirir:
- Aynı tedarikçi (`tedarikci_id`)
- Aynı stok kodu (`stok_kodu`)
- Eşleştirilmemiş irsaliye kalemleri (`eslesme_durumu = 0`)

#### Response 200

```json
{
  "success": true,
  "data": [
    {
      "faturaKalem": {
        "id": 1,
        "fatura_id": 1,
        "stok_kodu": "STK-001",
        "parca_adi": "Çelik Konstrüksiyon",
        "miktar": 50.00,
        "birim_fiyat": 150.00,
        "toplam_tutar": 7500.00
      },
      "irsaliyeKalem": {
        "id": 10,
        "irsaliye_id": 3,
        "miktar": 50.00,
        "birim": "kg"
      },
      "irsaliye": {
        "id": 3,
        "irsaliye_no": "IRS-2024-005",
        "belge_tarih": "2024-01-16",
        "tedarikci_id": 5
      },
      "tedarikci": {
        "id": 5,
        "adi": "ABC Tedarik Ltd."
      },
      "eslesmeTipi": "tam",
      "miktarFarki": 0.00,
      "oncelik": 1
    }
  ]
}
```

#### Matching Types / Eşleşme Türleri

| Type | Priority | Description | Açıklama |
|------|----------|-------------|----------|
| `tam` | 1 | Exact match (difference < 0.01) | Tam eşleşme (fark < 0.01) |
| `ksimi` | 2 | Partial match (difference >= 0.01) | Kısmi eşleşme (fark >= 0.01) |

---

### POST /api/eslestirme/onayla

Confirm matching between invoice and delivery note items.

**Fatura ve irsaliye kalemleri arasındaki eşleşmeyi onaylar.**

> **Transaction:** Uses SERIALIZABLE isolation level for data consistency.
> **İşlem:** Veri tutarlılığı için SERIALIZABLE yalıtım seviyesi kullanır.

#### Request Body

```json
{
  "fatura_id": 1,
  "eslestirmeler": [
    {
      "fatura_kalem_id": 1,
      "irsaliye_kalem_id": 10,
      "fatura_miktar": 50.00,
      "irsaliye_miktar": 50.00,
      "neden": null
    },
    {
      "fatura_kalem_id": 2,
      "irsaliye_kalem_id": 11,
      "fatura_miktar": 30.00,
      "irsaliye_miktar": 28.50,
      "neden": "Miktar farkı kabul edildi"
    }
  ]
}
```

#### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `fatura_id` | integer | Yes | Invoice ID |
| `eslestirmeler` | array | Yes | Array of match objects |
| `eslestirmeler[].fatura_kalem_id` | integer | Yes | Invoice item ID |
| `eslestirmeler[].irsaliye_kalem_id` | integer | Yes | Delivery note item ID |
| `eslestirmeler[].fatura_miktar` | float | Yes | Invoice item quantity |
| `eslestirmeler[].irsaliye_miktar` | float | Yes | Delivery note item quantity |
| `eslestirmeler[].neden` | string | Conditional | Required when quantities differ |

#### Validation Rules

1. If `abs(fatura_miktar - irsaliye_miktar) > 0.01`, `neden` is required
2. All matches must reference valid, unmatched items

#### Response 200

```json
{
  "success": true,
  "message": "Eşleşme başarıyla onaylandı",
  "data": {
    "success": true,
    "itemCount": 2
  }
}
```

#### Response 400 (Validation Error)

```json
{
  "success": false,
  "error": "Validasyon hatası",
  "details": [
    {
      "fatura_kalem_id": 2,
      "error": "Miktar farkı için neden belirtilmelidir"
    }
  ]
}
```

#### Socket.IO Event

```javascript
socket.on('eslestirme-tamamlandi', (data) => {
  console.log(data);
  // {
  //   faturaId: 1,
  //   itemCount: 2,
  //   performedBy: 1
  // }
});
```

---

### POST /api/eslestirme/reddet

Reject a matching suggestion.

**Bir eşleşme önerisini reddeder.**

> **Note:** Currently logs rejection for analytics. Can be extended for blacklist functionality.
> **Not:** Şu anda analitik için reddi loglar. Kara liste işlevselliği için genişletilebilir.

#### Request Body

```json
{
  "fatura_kalem_id": 1,
  "irsaliye_kalem_id": 10,
  "neden": "Stok kodu uyuşmazlığı"
}
```

#### Response 200

```json
{
  "success": true,
  "message": "Eşleşme reddedildi"
}
```

---

### POST /api/eslestirme/manuel

Create manual matching between items.

**Öğeler arasında manuel eşleşme oluşturur.**

> **Use Case:** When automatic suggestions don't cover the specific match needed.
> **Kullanım Durumu:** Otomatik öneriler gereken belirli eşleşmeyi kapsamadığında.

#### Request Body

```json
{
  "fatura_kalem_id": 5,
  "irsaliye_kalem_id": 25,
  "neden": "Manuel eşleştirme - stok kodu farklı ama aynı parça"
}
```

#### Response 200

```json
{
  "success": true,
  "message": "Manuel eşleşme başarıyla yapıldı",
  "data": {
    "success": true
  }
}
```

#### Response 400 (Already Matched)

```json
{
  "success": false,
  "error": "Bu kalem zaten eşleştirilmiş"
}
```

#### Socket.IO Event

```javascript
socket.on('eslestirme-tamamlandi', (data) => {
  // Same as onayla endpoint
});
```

---

### POST /api/eslestirme/eslestirme-kaldir/:fatura_kalem_id

Remove matching from an invoice item.

**Fatura kalemindeki eşleşmeyi kaldırır.**

> **Note:** This resets both invoice and delivery note items to unmatched state.
> **Not:** Bu işlem hem fatura hem de irsaliye kalemlerini eşleşmemiş durumuna sıfırlar.

#### Parameters

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `fatura_kalem_id` | integer | Yes | Invoice item ID |

#### Request Body

```json
{
  "neden": "Eşleşme hatası - düzeltilecek"
}
```

#### Response 200

```json
{
  "success": true,
  "message": "Eşleşme kaldırıldı"
}
```

#### Response 400 (Not Matched)

```json
{
  "success": false,
  "error": "Bu kalem eşleştirilmemiş"
}
```

#### Socket.IO Event

```javascript
socket.on('eslestirme-kaldirildi', (data) => {
  console.log(data);
  // {
  //   faturaKalemId: 1,
  //   performedBy: 1
  // }
});
```

---

### GET /api/eslestirme/durum/:fatura_id

Get matching status for an invoice.

**Fatura için eşleşme durumunu getirir.**

#### Parameters

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `fatura_id` | integer | Yes | Invoice ID |

#### Response 200

```json
{
  "success": true,
  "data": {
    "faturaId": 1,
    "durum": "kismi_eslesti",
    "toplam": 5,
    "eslesmis": 3,
    "bekleyen": 2
  }
}
```

#### Status Values / Durum Değerleri

| Status | Description | Condition |
|--------|-------------|-----------|
| `bekliyor` | Waiting | 0 items matched |
| `kismi_eslesti` | Partially matched | Some items matched |
| `tam_eslesti` | Fully matched | All items matched |

---

## Data Models / Veri Modelleri

### Fatura Model

```typescript
interface Fatura {
  id: number;                        // Primary key
  fatura_no: string;                 // Invoice number (unique, max 50)
  tedarikci_id: number;              // Supplier FK
  belge_tarih: Date;                 // Document date
  vade_tarih?: Date;                 // Due date (optional)
  kayit_tarih: Date;                 // Record date (auto)
  toplam_kalem: number;              // Total item count (default: 0)
  toplam_miktar: number;             // Total quantity (default: 0)
  ara_toplam: number;                // Subtotal (default: 0)
  kdv: number;                       // VAT amount (default: 0)
  genel_toplam: number;              // Grand total (default: 0)
  durum: 'bekliyor' | 'kismi_eslesti' | 'tam_eslesti';
  aciklama?: string;                 // Description
  created_by?: number;               // Creator user FK
  locked_by?: number;                // Lock holder FK
  locked_at?: Date;                  // Lock timestamp
  belge_dosya_yolu?: string;         // Document file path
  created_at: Date;                  // Creation timestamp
}
```

### FaturaKalem Model

```typescript
interface FaturaKalem {
  id: number;                        // Primary key
  fatura_id: number;                 // Fatura FK
  tedarikci_id: number;              // Supplier FK
  stok_kodu: string;                 // Stock code
  parca_adi: string;                 // Part name
  miktar: number;                    // Quantity
  birim?: string;                    // Unit
  birim_fiyat?: number;              // Unit price
  toplam_tutar?: number;             // Total amount
  aciklama?: string;                 // Description
  eslesme_durumu: 0 | 1;             // Match status (0=pending, 1=matched)
  eslesen_irsaliye_kalem_id?: number; // Matched item FK
}
```

### İrsaliye Model

```typescript
interface Irsaliye {
  id: number;                        // Primary key
  irsaliye_no: string;               // Delivery note number (unique)
  tedarikci_id: number;              // Supplier FK
  belge_tarih: Date;                 // Document date
  kayit_tarih: Date;                 // Record date (auto)
  belge_tipi: 'gelis' | 'cikis';     // Document type
  toplam_kalem: number;              // Total item count
  toplam_miktar: number;             // Total quantity
  durum: 'bekliyor' | 'kismi_eslesti' | 'tam_eslesti';
  aciklama?: string;                 // Description
  created_by?: number;               // Creator user FK
  locked_by?: number;                // Lock holder FK
  locked_at?: Date;                  // Lock timestamp
  created_at: Date;                  // Creation timestamp
}
```

### İrsaliyeKalem Model

```typescript
interface IrsaliyeKalem {
  id: number;                        // Primary key
  irsaliye_id: number;               // İrsaliye FK
  tedarikci_id: number;              // Supplier FK
  stok_kodu: string;                 // Stock code
  parca_adi: string;                 // Part name
  miktar: number;                    // Quantity
  birim?: string;                    // Unit
  aciklama?: string;                 // Description
  eslesme_durumu: 0 | 1;             // Match status
  eslesen_fatura_kalem_id?: number;   // Matched item FK
}
```

---

## Socket.IO Events

### Namespace

All events are emitted in the `/fatura-eslestirme` namespace.

```javascript
const socket = io('/fatura-eslestirme');
```

### Events

| Event | Description | Payload |
|-------|-------------|---------|
| `lock-acquired` | Document locked | `{belgeTipi, belgeId, lockedBy, lockedAt}` |
| `lock-released` | Document lock released | `{belgeTipi, belgeId}` |
| `lock-force-released` | Admin force unlock | `{belgeTipi, belgeId, reason, releasedBy}` |
| `eslestirme-tamamlandi` | Matching completed | `{faturaId, itemCount, performedBy}` |
| `eslestirme-kaldirildi` | Matching removed | `{faturaKalemId, performedBy}` |

### Example Usage / Örnek Kullanım

```javascript
// Connect to namespace
const socket = io('/fatura-eslestirme', {
  auth: {
    token: 'JWT_TOKEN'
  }
});

// Listen for lock changes
socket.on('lock-acquired', (data) => {
  console.log(`${data.belgeTipi} #${data.belgeId} locked by user #${data.lockedBy}`);
  updateUI(data);
});

socket.on('lock-released', (data) => {
  console.log(`${data.belgeTipi} #${data.belgeId} unlocked`);
  updateUI(data);
});

// Listen for matching updates
socket.on('eslestirme-tamamlandi', (data) => {
  console.log(`Invoice #${data.faturaId}: ${data.itemCount} items matched`);
  refreshInvoiceData(data.faturaId);
});
```

---

## Lock System / Lock Sistemi

### Lock States / Lock Durumları

The lock system uses a 4-state machine:

| State | Can Edit | Description |
|-------|----------|-------------|
| `UNLOCKED` | Yes | No lock exists |
| `LOCKED_BY_ME` | Yes | Locked by current user |
| `LOCKED_BY_OTHER` | No | Locked by another user |
| `LOCK_EXPIRED` | Yes | Lock expired (>30 min) |

### Lock Timeout

- **Default:** 30 minutes
- **Auto-release:** Expired locks are automatically released on next access
- **Force unlock:** Admin can force unlock via `/force-unlock` endpoint

### Lock Behavior

1. **Acquire:** User must hold lock to edit
2. **Auto-release:** Locks expire after 30 minutes of inactivity
3. **Owner release:** Only lock owner can normally release
4. **Admin override:** Admins can force unlock with reason

---

## Complete Examples / Tam Örnekler

### Example 1: Create Invoice and Match / Fatura Oluşturma ve Eşleştirme

```javascript
// 1. Create invoice with items
const createResponse = await fetch('/api/faturalar', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    fatura_no: 'F2024-001',
    tedarikci_id: 5,
    belge_tarih: '2024-01-15',
    kalemler: [
      { stok_kodu: 'STK-001', parca_adi: 'Çelik', miktar: 50, birim_fiyat: 150 },
      { stok_kodu: 'STK-002', parca_adi: 'Alüminyum', miktar: 25, birim_fiyat: 200 }
    ]
  })
});

const fatura = await createResponse.json();
const faturaId = fatura.data.id;

// 2. Get matching suggestions
const onerilerResponse = await fetch(`/api/eslestirme/oneler/${faturaId}`, {
  headers: { 'Authorization': 'Bearer TOKEN' }
});

const oneriler = await onerilerResponse.json();

// 3. Confirm matches
const onayResponse = await fetch('/api/eslestirme/onayla', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    fatura_id: faturaId,
    eslestirmeler: oneriler.data.map(o => ({
      fatura_kalem_id: o.faturaKalem.id,
      irsaliye_kalem_id: o.irsaliyeKalem.id,
      fatura_miktar: o.faturaKalem.miktar,
      irsaliye_miktar: o.irsaliyeKalem.miktar,
      neden: o.eslesmeTipi === 'ksimi' ? 'Miktar farkı kabul edildi' : null
    }))
  })
});

const result = await onayResponse.json();
console.log(result.message); // "Eşleşme başarıyla onaylandı"
```

### Example 2: Lock Workflow / Lock İş Akışı

```javascript
// 1. Acquire lock
const lockResponse = await fetch('/api/faturalar/1/lock', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer TOKEN' }
});

if (lockResponse.status === 409) {
  const error = await lockResponse.json();
  console.log(`Locked by user #${error.lockedBy} since ${error.lockedAt}`);
  return;
}

// 2. Edit invoice (while holding lock)
await fetch('/api/faturalar/1', {
  method: 'PUT',
  headers: {
    'Authorization': 'Bearer TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ aciklama: 'Güncellenmiş açıklama' })
});

// 3. Release lock
await fetch('/api/faturalar/1/lock', {
  method: 'DELETE',
  headers: { 'Authorization': 'Bearer TOKEN' }
});
```

### Example 3: Admin Force Unlock / Admin Zorla Bırakma

```javascript
// Admin force unlock (only if user has admin role)
await fetch('/api/irsaliyeler/5/force-unlock', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ADMIN_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    reason: 'Kullanıcı sistemden çıktı, lock bırakılması gerekiyor'
  })
});
```

### Example 4: Socket.IO Integration / Socket.IO Entegrasyonu

```javascript
const socket = io('/fatura-eslestirme', {
  auth: { token: 'JWT_TOKEN' }
});

// Handle lock changes
socket.on('lock-acquired', (data) => {
  const { belgeTipi, belgeId, lockedBy, lockedAt } = data;

  if (lockedBy !== currentUserId) {
    showNotification(`${belgeTipi.toUpperCase()} #${belgeId} başka kullanıcı tarafından kilitlendi!`);
    disableEditing(belgeId);
  }
});

socket.on('lock-released', (data) => {
  enableEditing(data.belgeId);
});

// Handle matching updates
socket.on('eslestirme-tamamlandi', async (data) => {
  const { faturaId } = data;

  // Refresh invoice data
  const freshData = await fetch(`/api/faturalar/${faturaId}`, {
    headers: { 'Authorization': 'Bearer TOKEN' }
  });

  updateInvoiceDisplay(await freshData.json());
});
```

---

## Changelog / Değişiklik Günlüğü

### Version 1.0.0 (2024-01-24)

- Initial release
- CRUD operations for Fatura and İrsaliye
- Lock mechanism with 30-minute timeout
- Matching algorithm with SQL JOIN optimization
- Socket.IO real-time events
- Multi-user support with authentication
- Admin force unlock functionality

---

## Support / Destek

For issues or questions, please contact the development team.

Sorunlar veya sorular için lütfen geliştirme ekibiyle iletişime geçin.
