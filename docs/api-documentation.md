# ÜRTM Takip API Dokümantasyonu

## API Genel Bakış

ÜRTM Takip sistemi, RESTful API mimarisi kullanarak üretim yönetimi işlevlerini sunar. API, JSON formatında veri alışverişi yapar ve HTTPS güvenliğini destekler.

### Temel Bilgiler

- **Base URL**: `http://localhost:3000/api`
- **Port**: 3000
- **Content-Type**: `application/json`
- **Authentication**: JWT Token (opsiyonel)
- **Real-time Updates**: Socket.IO

### HTTP Durum Kodları

- `200 OK` - Başarılı işlem
- `201 Created` - Kayıt başarıyla oluşturuldu
- `400 Bad Request` - Geçersiz istek
- `401 Unauthorized` - Yetkilendirme gerekli
- `403 Forbidden` - Erişim reddedildi
- `404 Not Found` - Kaynak bulunamadı
- `500 Internal Server Error` - Sunucu hatası

## Authentication

### Login
```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "ad": "Ahmet",
    "soyad": "Yılmaz",
    "rol": "Admin"
  }
}
```

### Token Kullanımı
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Core API Endpoints

### 1. İş Emirleri (İş Emirleri)

#### İş Emri Listesi
```http
GET /api/is-emirleri
```

**Query Parameters:**
- `page` (number): Sayfa numarası (varsayılan: 1)
- `limit` (number): Sayfa başına kayıt (varsayılan: 20)
- `durum` (number): Durum filtresi (0, 1, 2, 3)
- `tezgahId` (number): Tezgah filtresi
- `baslangicTarihi` (string): Başlangıç tarihi (YYYY-MM-DD)
- `bitisTarihi` (string): Bitiş tarihi (YYYY-MM-DD)
- `siparisNo` (string): Sipariş no araması

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "is-emri-uuid",
      "siparisNo": "SO-2024-001",
      "parcaId": "parca-uuid",
      "tezgahId": 1,
      "miktar": 100,
      "tamamlananMiktar": 25,
      "durum": 1,
      "terminTarihi": "2024-12-30",
      "aciklama": "Acil iş emri",
      "createdAt": "2024-12-15T10:30:00.000Z",
      "updatedAt": "2024-12-15T11:45:00.000Z",
      "parca": {
        "id": "parca-uuid",
        "adi": "Sac Parça",
        "kodu": "P-001"
      },
      "tezgah": {
        "id": 1,
        "adi": "CNC Tezgah 1",
        "durum": 1
      }
    }
  ],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8
  }
}
```

#### İş Emri Detayı
```http
GET /api/is-emirleri/:id
```

**Path Parameters:**
- `id` (string): İş emri UUID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "is-emri-uuid",
    "siparisNo": "SO-2024-001",
    "parcaId": "parca-uuid",
    "tezgahId": 1,
    "miktar": 100,
    "tamamlananMiktar": 25,
    "durum": 1,
    "terminTarihi": "2024-12-30",
    "aciklama": "Acil iş emri",
    "islemKayitlari": [
      {
        "id": "kayit-uuid",
        "islemTipi": "Operasyon",
        "baslangic": "2024-12-15T08:00:00.000Z",
        "bitis": "2024-12-15T10:30:00.000Z",
        "aciklama": "CNC işlemi"
      }
    ]
  }
}
```

#### Yeni İş Emri Oluştur
```http
POST /api/is-emirleri
```

**Request Body:**
```json
{
  "siparisNo": "SO-2024-002",
  "parcaId": "parca-uuid",
  "tezgahId": 2,
  "miktar": 50,
  "terminTarihi": "2024-12-25",
  "aciklama": "Normal öncelikli iş",
  "tahminiIslemeSuresi": 240
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "yeni-is-emri-uuid",
    "siparisNo": "SO-2024-002",
    "durum": 0,
    "createdAt": "2024-12-15T14:20:00.000Z"
  },
  "message": "İş emri başarıyla oluşturuldu"
}
```

#### İş Emri Güncelleme
```http
PUT /api/is-emirleri/:id
```

**Request Body:**
```json
{
  "miktar": 75,
  "terminTarihi": "2024-12-28",
  "aciklama": "Miktar güncellendi"
}
```

#### İş Emri Durum Güncelleme
```http
PATCH /api/is-emirleri/:id/durum
```

**Request Body:**
```json
{
  "durum": 2,
  "aciklama": "Üretim tamamlandı",
  "tamamlananMiktar": 75
}
```

**Durum Kodları:**
- `0` - Planlandı
- `1` - Üretimde
- `2` - Tamamlandı
- `3` - İptal Edildi

### 2. Parçalar

#### Parça Listesi
```http
GET /api/parcalar
```

**Query Parameters:**
- `page` (number): Sayfa numarası
- `limit` (number): Sayfa başına kayıt
- `arama` (string): Ada göre arama
- `kategori` (string): Kategori filtresi

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "parca-uuid",
      "adi": "Sac Parça",
      "kodu": "P-001",
      "cizimNo": "CZ-001",
      "kategori": "Sac",
      "birim": "Adet",
      "stokMiktari": 500,
      "kritikStok": 100,
      "aciklama": "Ana sac parça",
      "teknikCizim": "/uploads/cizimler/P-001.pdf",
      "foto": "/uploads/fotolar/P-001.jpg"
    }
  ]
}
```

#### Yeni Parça Ekleme
```http
POST /api/parcalar
```

**Request Body:**
```json
{
  "adi": "Yeni Parça",
  "kodu": "P-002",
  "cizimNo": "CZ-002",
  "kategori": "Talaşlı",
  "birim": "Adet",
  "kritikStok": 50,
  "aciklama": "Yeni parça açıklaması"
}
```

#### Parça Güncelleme
```http
PUT /api/parcalar/:id
```

### 3. Tezgahlar

#### Tezgah Listesi
```http
GET /api/tezgahlar
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "adi": "CNC Tezgah 1",
      "tip": "CNC",
      "marka": "DMG",
      "model": "DMU 50",
      "kapasite": "500x400",
      "durum": 1,
      "durumText": "Çalışıyor",
      "sonBakim": "2024-11-01",
      "planliBakim": "2025-02-01",
      "aktif": true
    }
  ]
}
```

#### Tezgah Durum Güncelleme
```http
PUT /api/tezgahlar/:id/durum
```

**Request Body:**
```json
{
  "durum": 1,
  "aciklama": "Operasyon başladı"
}
```

### 4. Üretim Planları (V2 - Basitleştirilmiş)

#### Üretim Planı Listesi
```http
GET /api/uretim-planlari
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "plan-uuid",
      "adi": "Aralık 2024 Planı",
      "tarih": "2024-12-01",
      "durum": 1,
      "isEmirleri": [
        {
          "id": "is-emri-uuid-1",
          "siparisNo": "SO-001",
          "sira": 1,
          "isEmriData": {
            "parcaAdi": "Parça 1",
            "miktar": 100
          }
        }
      ],
      "createdAt": "2024-12-01T08:00:00.000Z"
    }
  ]
}
```

#### Yeni Üretim Planı Oluşturma
```http
POST /api/uretim-planlari
```

**Request Body:**
```json
{
  "adi": "Ocak 2025 Planı",
  "tarih": "2025-01-01",
  "isEmirleri": [
    {
      "isEmriId": "is-emri-uuid-1",
      "sira": 1
    },
    {
      "isEmriId": "is-emri-uuid-2",
      "sira": 2
    }
  ]
}
```

#### İş Emri Sıra Güncelleme
```http
PUT /api/uretim-planlari/:id/sirala
```

**Request Body:**
```json
{
  "isEmirleri": [
    { "isEmriId": "uuid-1", "sira": 2 },
    { "isEmriId": "uuid-2", "sira": 1 }
  ]
}
```

### 5. BOM Yönetimi

#### BOM Listesi
```http
GET /api/boms
```

**Query Parameters:**
- `parcaId` (string): Parça filtresi
- `versiyon` (number): Versiyon filtresi

#### BOM Detayı
```http
GET /api/boms/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "bom-uuid",
    "parcaId": "parca-uuid",
    "versiyon": 1,
    "adi": "Ana Parça BOM",
    "malzemeler": [
      {
        "id": "malzeme-uuid",
        "malzemeId": "malzeme-parca-uuid",
        "miktar": 2.5,
        "birim": "kg",
        "aciklama": "Çelik malzeme",
        "parca": {
          "adi": "ST-37 Sac",
          "kodu": "ST-37-5"
        }
      }
    ],
    "toplamMaliyet": 150.75
  }
}
```

### 6. Stok Kartları

#### Stok Kartı Listesi
```http
GET /api/stok-kartlari
```

#### Stok Hareket Ekleme
```http
POST /api/stok-kartlari/hareket
```

**Request Body:**
```json
{
  "parcaId": "parca-uuid",
  "tip": "Giris",
  "miktar": 100,
  "birimFiyat": 25.50,
  "aciklama": "Satın alma",
  "fisNo": "F-2024-001"
}
```

### 7. Fason İşler

#### Fason Teklifleri
```http
GET /api/fason/teklifler
```

#### Fason Kapama
```http
POST /api/fason/kapama
```

### 8. Sevkiyat

#### Sevkiyat Listesi
```http
GET /api/sevkiyat
```

#### Yeni Sevkiyat
```http
POST /api/sevkiyat
```

**Request Body:**
```json
{
  "musteriAdi": "ABC Ltd. Şti.",
  "isEmirleri": ["is-emri-uuid-1", "is-emri-uuid-2"],
  "teslimatTarihi": "2024-12-20",
  "aciklama": "Acil teslimat",
  "resimler": ["base64-encoded-image"]
}
```

### 9. Arıza-Bakım

#### Bakım Kayıtları
```http
GET /api/ariza-bakim
```

#### Yeni Bakım Kaydı
```http
POST /api/ariza-bakim
```

### 10. Raporlar

#### Üretim Raporu
```http
GET /api/raporlar/uretim?baslangic=2024-12-01&bitis=2024-12-31
```

**Query Parameters:**
- `baslangic` (string): Başlangıç tarihi
- `bitis` (string): Bitiş tarihi
- `format` (string): Çıktı formatı (json, excel, pdf)

**Response:**
```json
{
  "success": true,
  "data": {
    "toplamIsEmri": 125,
    "tamamlanan": 98,
    "devamEden": 27,
    "verimlilik": 78.4,
    "tezgahPerformans": [
      {
        "tezgahAdi": "CNC Tezgah 1",
        "isSayisi": 45,
        "calismaSuresi": 320,
        "verimlilik": 85.2
      }
    ]
  }
}
```

## File Upload API

### Teknik Çizim Yükleme
```http
POST /api/upload/cizim
```

**Content-Type:** multipart/form-data

**Form Data:**
- `file` (file): PDF, DWG, DXF formatında çizim dosyası
- `parcaId` (string): Parça UUID

**Response:**
```json
{
  "success": true,
  "filePath": "/uploads/cizimler/2024-12/cizim-uuid.pdf",
  "originalName": "parca-cizimi.pdf",
  "size": 2048576
}
```

### Fotoğraf Yükleme
```http
POST /api/upload/foto
```

**Form Data:**
- `file` (file): JPG, PNG formatında fotoğraf
- `parcaId` (string): Parça UUID (opsiyonel)
- `isEmriId` (string): İş emri UUID (opsiyonel)

### Excel Import/Export

#### İş Emri Excel Import
```http
POST /api/is-emirleri/import-excel
```

**Form Data:**
- `file` (file): Excel dosyası (.xlsx)

**Response:**
```json
{
  "success": true,
  "imported": 25,
  "errors": [
    {
      "row": 5,
      "message": "Geçersiz tezgah ID"
    }
  ]
}
```

#### Excel Export
```http
GET /api/is-emirleri/export-excel
```

**Query Parameters:**
- `baslangicTarihi` (string)
- `bitisTarihi` (string)
- `durum` (number)

**Response:** Binary Excel file

## WebSocket Events

### Bağlantı
```javascript
const socket = io('http://localhost:3000');

// Tezgah durumu güncellemesi
socket.on('tezgahDurumGuncelle', (data) => {
  console.log('Tezgah durumu:', data);
  // { tezgahId: 1, durum: 1, aciklama: 'Operasyon başladı' }
});

// İş emri durumu güncellemesi
socket.on('isEmriDurumGuncelle', (data) => {
  console.log('İş emri durumu:', data);
  // { isEmriId: 'uuid', durum: 2, userId: 'user-uuid' }
});

// Yeni bildirim
socket.on('bildirim', (data) => {
  console.log('Bildirim:', data);
  // { mesaj: 'İş emri tamamlandı', tip: 'success', userId: 'user-uuid' }
});

// Üretim planı güncellemesi
socket.on('uretimPlaniGuncelle', (data) => {
  console.log('Üretim planı:', data);
  // { planId: 'uuid', tip: 'guncelleme', data: {...} }
});
```

## Error Handling

### Standart Error Format
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Gerekli alanlar eksik",
    "details": [
      {
        "field": "siparisNo",
        "message": "Sipariş no gereklidir"
      },
      {
        "field": "miktar",
        "message": "Miktar 0'dan büyük olmalıdır"
      }
    ]
  }
}
```

### Validation Error (400)
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Geçersiz veri",
    "details": {
      "miktar": "Sayısal değer olmalı",
      "terminTarihi": "Geçerli tarih formatı gerekli"
    }
  }
}
```

### Not Found (404)
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "İş emri bulunamadı"
  }
}
```

### Unauthorized (401)
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Yetkilendirme gerekli"
  }
}
```

## API Rate Limiting

### Limitler
- Genel API: 100 istek/dakika/IP
- Upload API: 10 istek/dakika/IP
- Login API: 5 istek/dakika/IP

### Rate Limit Headers
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640860800
```

### Rate Limit Exceeded (429)
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "İstek limiti aşıldı. Lütfen 1 dakika sonra tekrar deneyin."
  }
}
```

## API Versiyonlama

### Versiyon Headers
```http
Accept: application/vnd.urtm.v1+json
API-Version: 1
```

### Versiyon URL'leri
```http
/api/v1/is-emirleri  # Versiyon 1
/api/v2/is-emirleri  # Versiyon 2 (gelecekte)
```

## Caching

### ETag Support
```http
GET /api/parcalar/123
```

**Response Headers:**
```http
ETag: "abc123"
Cache-Control: max-age=3600
```

**Conditional Request:**
```http
GET /api/parcalar/123
If-None-Match: "abc123"
```

**Response:** 304 Not Modified (etkisiz)

## API Testing

### cURL Examples

**Login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'
```

**Get İş Emirleri:**
```bash
curl -X GET http://localhost:3000/api/is-emirleri \
  -H "Authorization: Bearer JWT_TOKEN" \
  -G -d "durum=1" -d "limit=10"
```

**Create İş Emri:**
```bash
curl -X POST http://localhost:3000/api/is-emirleri \
  -H "Authorization: Bearer JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"siparisNo":"SO-003","parcaId":"uuid","tezgahId":1,"miktar":50}'
```

### Postman Collection
Postman collection dosyası `docs/api/postman/URTMApi.postman_collection.json`

## Best Practices

1. **Pagination:** Büyük veri setleri için pagination kullanın
2. **Filtering:** Mümkün olan her yerde filtreleme yapın
3. **Error Handling:** Tüm API çağrılarında error handling implement edin
4. **Timeouts:** Uz süren işlemler için timeout'lar belirleyin
5. **Retry Logic:** Geçici hatalar için retry logic kullanın
6. **Validation:** Client-side validation kullanın
7. **Rate Limiting:** API limitlerini takip edin
8. **HTTPS:** Production'da mutlaka HTTPS kullanın

## Advanced Features

### Bulk Operations
```http
POST /api/is-emirleri/bulk-update
```

**Request Body:**
```json
{
  "isEmirleri": [
    { "id": "uuid-1", "durum": 2 },
    { "id": "uuid-2", "tezgahId": 3 }
  ]
}
```

### Search API
```http
GET /api/search?q=query&type=parcalar
```

**Query Parameters:**
- `q` (string): Arama terimi
- `type` (string): Arama tipi (parcalar, is-emirleri, etc.)
- `limit` (number): Sonuç limiti

### Analytics API
```http
GET /api/analytics/uretim-performansi?period=ay
```

**Response:**
```json
{
  "success": true,
  "data": {
    "verimlilikOrani": 85.2,
    "isEmriOrtalamasi": 45,
    "tezgahKullanimi": 78.5,
    "trend": "artan"
  }
}
```