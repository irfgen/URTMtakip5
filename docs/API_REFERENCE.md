# API Documentation - ÜRTM Takip Sistemi

## Table of Contents
- [Overview](#overview)
- [Authentication](#authentication)
- [Core Endpoints](#core-endpoints)
- [Work Order API](#work-order-api)
- [Workstation API](#workstation-api)
- [Parts API](#parts-api)
- [Production Planning API](#production-planning-api)
- [Inventory API](#inventory-api)
- [Subcontracting API](#subcontracting-api)
- [Shipping API](#shipping-api)
- [Maintenance API](#maintenance-api)
- [Reporting API](#reporting-api)
- [Socket.IO Events](#socketio-events)
- [Error Handling](#error-handling)

---

## Overview

### Base Configuration

- **Base URL**: `http://localhost:3000/api`
- **Backend Port**: 3000
- **Content-Type**: `application/json`
- **Authentication**: JWT Token (optional, not fully implemented)
- **Real-time**: Socket.IO on `/cad-import`, `/fatura-eslestirme` namespaces

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 413 | Payload Too Large (file > 100MB) |
| 500 | Internal Server Error |

### Response Format

Success Response:
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

Error Response:
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

---

## Authentication

> **Note**: Authentication is not fully implemented. JWT structure exists but endpoints are currently open.

### Login (Future)
```http
POST /api/auth/login
```

**Request:**
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
    "id": 1,
    "email": "user@example.com",
    "ad": "Ahmet",
    "soyad": "Yılmaz",
    "rol": "Admin"
  }
}
```

---

## Core Endpoints

### Health Check
```http
GET /api/health
```

**Response:**
```json
{
  "success": true,
  "message": "ÜRTM Takip Server çalışıyor",
  "timestamp": "2025-12-30T10:00:00.000Z",
  "version": "11.3.184"
}
```

### Port Info
```http
GET /api/port-info
```

**Response:**
```json
{
  "status": "ok",
  "port": 3000,
  "timestamp": "2025-12-30T10:00:00.000Z",
  "message": "Backend is running"
}
```

---

## Work Order API

### Base Path: `/api/is-emirleri`

#### Get All Work Orders
```http
GET /api/is-emirleri
```

**Query Parameters:**
- `durum` (optional): Filter by status
- `tezgah_id` (optional): Filter by workstation
- `baslangic_tarihi` (optional): Start date filter
- `bitis_tarihi` (optional): End date filter

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "is_emri_id": 1,
      "is_emri_no": "IE-2024-001",
      "is_adi": "Parça Üretimi",
      "plan_liste_no": "PL-001",
      "adet": 100,
      "malzeme": "ST37",
      "teslim_tarihi": "2025-01-15",
      "oncelik": "yuksek",
      "durum": "uretiliyor",
      "tezgah_id": 5,
      "parca_kodu": "P-001",
      "tahmini_isleme_suresi": 2
    }
  ]
}
```

#### Get Work Order by ID
```http
GET /api/is-emirleri/:id
```

#### Create Work Order
```http
POST /api/is-emirleri
```

**Request:**
```json
{
  "is_emri_no": "IE-2024-002",
  "is_adi": "Yeni Parça Üretimi",
  "plan_liste_no": "PL-002",
  "adet": 50,
  "malzeme": "ST37",
  "teslim_tarihi": "2025-01-20",
  "oncelik": "normal",
  "tezgah_id": 5,
  "parca_kodu": "P-002"
}
```

#### Update Work Order
```http
PUT /api/is-emirleri/:id
```

**Request:**
```json
{
  "durum": "tamamlandi",
  "aciklama": "İş tamamlandı"
}
```

#### Delete Work Order
```http
DELETE /api/is-emirleri/:id
```

#### Update Status
```http
PATCH /api/is-emirleri/:id/durum
```

**Request:**
```json
{
  "durum": "uretiliyor"
}
```

### Related Endpoints

#### Work Order Summary
```http
GET /api/is-emri-ozet/:isEmriId
```

#### Process Logs
```http
GET /api/islem-kayitlari/:isEmriNo
POST /api/islem-kayitlari
```

#### Work Order Templates
```http
GET /api/is-emri-taslaklari/:oturimId
POST /api/is-emri-taslaklari
```

---

## Workstation API

### Base Path: `/api/tezgahlar` (Legacy) & `/api/makinalar` (New)

#### Get All Workstations
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
      "tezgah_adi": "CNC-01",
      "tezgah_kodu": "T-001",
      "makina_id": 1,
      "durum": "calisiyor",
      "kapasite": 8,
      "konum": "Atolye A",
      "aktif_mi": true
    }
  ]
}
```

#### Get Workstation Status
```http
GET /api/tezgah-durum/:tezgahId
```

#### Update Workstation Status
```http
POST /api/tezgah-durum
```

**Request:**
```json
{
  "tezgah_id": 1,
  "yeni_durum": "calisiyor"
}
```

#### Get Status History
```http
GET /api/tezgah-durum/log/:tezgahId
```

### Planning Endpoints

#### Get Planned Jobs
```http
GET /api/tezgah-plan/:tezgahId
```

#### Add Planned Job
```http
POST /api/tezgah-plan
```

**Request:**
```json
{
  "tezgah_id": 1,
  "is_emri_id": 5,
  "sira_no": 1,
  "oncelik": 1,
  "planlanan_tarih": "2025-01-15"
}
```

---

## Parts API

### Base Path: `/api/parcalar`

#### Get All Parts
```http
GET /api/parcalar
```

**Query Parameters:**
- `kategori` (optional): Filter by category
- `stok_alti` (optional): Filter low stock
- `arama` (optional): Search term

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "parcaKodu": "P-001",
      "parcaAdi": "Mil",
      "kategori": "Baglanti Elemanlari",
      "stokAdeti": 150,
      "kritik_stok": 50,
      "tedarikBedeli": 25.50,
      "teknik_resim_path": "/uploads/resimler/P-001.png",
      "imalMi": true
    }
  ]
}
```

#### Get Part by Code
```http
GET /api/parcalar/:parcaKodu
```

#### Create Part
```http
POST /api/parcalar
```

**Request:**
```json
{
  "parcaKodu": "P-002",
  "parcaAdi": "Yeni Parça",
  "kategori": "Mekanik",
  "stokAdeti": 100,
  "tedarikBedeli": 50.00
}
```

#### Update Part
```http
PUT /api/parcalar/:parcaKodu
```

#### Delete Part
```http
DELETE /api/parcalar/:parcaKodu
```

### Related Endpoints

#### Part Records
```http
GET /api/parca-kayitlari/:parcaKodu
POST /api/parca-kayitlari
```

#### Part Tracking Lists
```http
GET /api/parca-takip-listeleri
POST /api/parca-takip-listeleri
```

#### Combined Parts
```http
GET /api/parca-birlesik
POST /api/parca-birlesik
```

---

## Production Planning API

### Main System: `/api/uretim-plani`

#### Get All Plans
```http
GET /api/uretim-plani
```

#### Get Plan by ID
```http
GET /api/uretim-plani/:id
```

#### Create Plan
```http
POST /api/uretim-plani
```

**Request:**
```json
{
  "plan_adi": "Ocak Üretim Planı",
  "plan_tipi": "karma",
  "baslangic_tarihi": "2025-01-01",
  "bitis_tarihi": "2025-01-31",
  "bom_verisi": { ... },
  "is_emirleri": [ ... ]
}
```

#### Create Mixed Plan
```http
POST /api/uretim-plani/karma
```

#### Import from Excel
```http
POST /api/uretim-plani/excel-import
```

**Content-Type:** `multipart/form-data`

### V2 System: `/api/uretim-planlari`

#### Get V2 Plans
```http
GET /api/uretim-planlari
```

#### Create V2 Plan
```http
POST /api/uretim-planlari
```

### BOM Endpoints

#### Base Path: `/api/boms`

```http
GET /api/boms
POST /api/boms
GET /api/boms/:id
PUT /api/boms/:id
DELETE /api/boms/:id
```

#### Analyze BOM
```http
POST /api/boms/analiz
```

#### Get BOM Tree
```http
GET /api/boms/agac/:bomId
```

---

## Inventory API

### Stock Cards: `/api/stok-kartlari`

#### Get All Stock Cards
```http
GET /api/stok-kartlari
```

**Query Parameters:**
- `malzeme_cinsi` (optional)
- `kesit` (optional)
- `kritik_seviye_alti` (optional): Filter critical stock

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "stok_kodu": "ST-001",
      "stok_adi": "Yuvarlak Çelik",
      "malzeme_cinsi": "ST37",
      "kesit": "20mm",
      "boy": 6000,
      "birim": "adet",
      "adet": 150,
      "kritik_seviye": 50
    }
  ]
}
```

#### Stock Card Operations
```http
GET /api/stok-karti/:id
POST /api/stok-karti
PUT /api/stok-karti/:id
```

#### Stock Tracking Lists
```http
GET /api/stok-takip-listeleri
POST /api/stok-takip-listeleri
PUT /api/stok-takip-listeleri/:id
DELETE /api/stok-takip-listeleri/:id
```

---

## Subcontracting API

### Subcontractors: `/api/fason`

#### Get Subcontractors
```http
GET /api/fason
```

#### Create Subcontractor
```http
POST /api/fason
```

**Request:**
```json
{
  "fason_adi": "ABC Dış Ticaret",
  "iletisim": "Ahmet Yılmaz",
  "telefon": "05551234567",
  "eposta": "ahmet@abc.com",
  "adres": "İstanbul",
  "aktif_mi": true
}
```

### Subcontractor Groups: `/api/fason-grup`

#### Get Groups
```http
GET /api/fason-grup
```

#### Create Group
```http
POST /api/fason-grup
```

### Subcontractor Work Orders: `/api/fason-is-emirleri`

#### Get Fason Work Orders
```http
GET /api/fason-is-emirleri
```

#### Create Fason Work Order
```http
POST /api/fason-is-emirleri
```

### Quotes: `/api/fason-teklif`

#### Get Quotes
```http
GET /api/fason-teklif
```

#### Create Quote
```http
POST /api/fason-teklif
```

---

## Shipping API

### Base Path: `/api/sevkiyat`

#### Get Shipments
```http
GET /api/sevkiyat
```

**Query Parameters:**
- `durum` (optional): Filter by status
- `baslangic_tarihi` (optional)
- `bitis_tarihi` (optional)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "sevkiyat_no": "SV-2024-001",
      "musteri_adi": "XYZ Ltd.",
      "teslim_tarihi": "2025-01-15",
      "durum": "hazirlaniyor",
      "aciklama": "Acil sipariş"
    }
  ]
}
```

#### Create Shipment
```http
POST /api/sevkiyat
```

#### Get Shipment Details
```http
GET /api/sevkiyat/:id
```

#### Add Shipment Item
```http
POST /api/sevkiyat-kalemleri
```

#### Upload Shipment Image
```http
POST /api/sevkiyat/resimler
```

**Content-Type:** `multipart/form-data`

### Bulk Shipment: `/api/toplu-sevkiyat`

#### Create Bulk Shipment
```http
POST /api/toplu-sevkiyat
```

---

## Maintenance API

### Base Path: `/api/ariza-bakim`

#### Get Maintenance Records
```http
GET /api/ariza-bakim
```

**Query Parameters:**
- `tezgah_id` (optional)
- `durum` (optional): acik, kapali
- `baslangic_tarihi` (optional)
- `bitis_tarihi` (optional)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "tezgah_id": 5,
      "ariza_turu": "Mekanik Arıza",
      "baslama_zamani": "2025-01-10T08:00:00.000Z",
      "bitis_zamani": "2025-01-10T10:00:00.000Z",
      "aciklama": "Motor arızası",
      "cozum": "Motor değiştirildi",
      "durum": "cozuldu"
    }
  ]
}
```

#### Create Maintenance Record
```http
POST /api/ariza-bakim
```

#### Update Maintenance Record
```http
PUT /api/ariza-bakim/:id
```

#### Close Maintenance Record
```http
PATCH /api/ariza-bakim/:id/kapat
```

---

## Reporting API

### Base Path: `/api/raporlar`

#### Production Report
```http
GET /api/raporlar/uretim?baslangic=2025-01-01&bitis=2025-01-31
```

#### Machine Performance Report
```http
GET /api/raporlar/tezgah-performans/:tezgahId
```

#### Part Performance Report
```http
GET /api/raporlar/parca-performans
```

#### Completed Jobs Report
```http
GET /api/raporlar/tamamlanan-isler
```

#### Export Report
```http
POST /api/raporlar/export
```

**Request:**
```json
{
  "rapor_turu": "uretim",
  "format": "excel",
  "parametreler": { ... }
}
```

### Workstation Reports: `/api/tezgah-raporu`

#### Get Workstation Report
```http
GET /api/tezgah-raporu/:tezgahId
```

**Query Parameters:**
- `baslangic_tarihi` (required)
- `bitis_tarihi` (required)

---

## Notes API

### Base Path: `/api/notlar`

#### Get Notes
```http
GET /api/notlar
```

**Query Parameters:**
- `kategori_id` (optional)
- `kullanici` (optional)
- `etiket` (optional)

#### Create Note
```http
POST /api/notlar
```

**Request:**
```json
{
  "baslik": "Önemli Not",
  "icerik": "Detaylı not içeriği",
  "kategori_id": 1,
  "etiketler": ["acil", "uretim"],
  "oncelik": "yuksek"
}
```

#### Update Note
```http
PUT /api/notlar/:id
```

#### Delete Note
```http
DELETE /api/notlar/:id
```

### Categories: `/api/kategoriler`

#### Get Categories
```http
GET /api/kategoriler
```

#### Create Category
```http
POST /api/kategoriler
```

---

## Shift Management API

### Base Path: `/api/vardiyalar`

#### Get Shifts
```http
GET /api/vardiyalar
```

#### Create Shift
```http
POST /api/vardiyalar
```

**Request:**
```json
{
  "vardiya_adi": "Sabah Vardiyası",
  "baslama_saati": "08:00",
  "bitis_saati": "16:00",
  "gunler": ["Pazartesi", "Sali", "Carsamba", "Persembe", "Cuma"]
}
```

### Personnel: `/api/personel`

#### Get Personnel
```http
GET /api/personel
```

#### Create Personnel
```http
POST /api/personel
```

### Assignments: `/api/vardiya-atama`

#### Get Assignments
```http
GET /api/vardiya-atamalari
```

#### Create Assignment
```http
POST /api/vardiya-atama
```

---

## Invoice & Delivery Note API

### Invoices: `/api/faturalar`

#### Get Invoices
```http
GET /api/faturalar
```

#### Create Invoice
```http
POST /api/faturalar
```

### Delivery Notes: `/api/irsaliyeler`

#### Get Delivery Notes
```http
GET /api/irsaliyeler
```

#### Create Delivery Note
```http
POST /api/irsaliyeler
```

### Matching: `/api/eslestirme`

#### Match Invoice to Delivery Note
```http
POST /api/eslestirme/eslestir
```

---

## File Upload API

### Technical Drawings: `/api/teknik-resim`

#### Upload Drawing
```http
POST /api/teknik-resim/upload
```

**Content-Type:** `multipart/form-data`

**Request:**
```
resim: <file>
parca_kodu: P-001
```

#### Analyze Drawing (OCR)
```http
POST /api/teknik-resim/analiz
```

### General Upload: `/api/upload`

#### Upload File
```http
POST /api/upload
```

**Max file size:** 100MB

---

## CAD Integration API

### Base Path: `/api/cad-import`

#### Get Connected Clients
```http
GET /api/cad-import/clients
```

#### Create Import Job
```http
POST /api/cad-import/jobs
```

#### Get Job Status
```http
GET /api/cad-import/jobs/:jobId
```

### CAD Files: `/api/cad-files`

#### Scan Directory
```http
POST /api/cad-files/scan
```

#### Get File Info
```http
GET /api/cad-files/info
```

---

## CNC Link API

### Base Path: `/api/cnc_link`

#### Update CNC Status
```http
POST /api/cnc-link/status
```

**Request:**
```json
{
  "tezgah_kodu": "CNC-01",
  "durum": 1
}
```

**Status Codes:**
- 0: Idle
- 1: Running
- 2: Error/Maintenance

---

## Timeline API

### Base Path: `/api/timeline`

#### Get Timeline Data
```http
GET /api/timeline/data
```

**Query Parameters:**
- `baslangic_tarihi` (required)
- `bitis_tarihi` (required)
- `tezgah_id` (optional)

#### Create Timeline Event
```http
POST /api/timeline/events
```

---

## Makindex API

### Base Path: `/api/makindex`

#### Get BOMs
```http
GET /api/makindex/boms
```

#### Create BOM
```http
POST /api/makindex/boms
```

#### Update BOM
```http
PUT /api/makindex/boms/:id
```

#### Delete BOM
```http
DELETE /api/makindex/boms/:id
```

#### Get BOM Tree
```http
GET /api/makindex/boms/:id/tree
```

---

## Import/Export API

### Base Path: `/api/import-export`

#### Export Data
```http
POST /api/import-export/export
```

**Request:**
```json
{
  "tur": "parcalar",
  "format": "excel"
}
```

#### Import Data
```http
POST /api/import-export/import
```

**Content-Type:** `multipart/form-data`

---

## Socket.IO Events

### Default Namespace

#### Client Events

**isEmriGuncellendi**
```javascript
socket.emit('isEmriGuncellendi', {
  is_emri_id: 1,
  durum: 'tamamlandi'
});
```

**stok-degisti**
```javascript
socket.emit('stok-degisti', {
  parcaKodu: 'P-001',
  yeniStok: 100,
  oncekiStok: 150
});
```

**bom-guncellendi**
```javascript
socket.emit('bom-guncellendi', {
  bomId: 1,
  makinaId: 5,
  degisiklik: 'eklendi'
});
```

#### Server Events

**isEmriGuncellendi**
```javascript
socket.on('isEmriGuncellendi', (data) => {
  // Handle work order update
});
```

**makindex-stok-guncellemesi**
```javascript
socket.on('makindex-stok-guncellemesi', (data) => {
  // Handle stock update in Makindex
});
```

**makindex-parca-eklendi**
```javascript
socket.on('makindex-parca-eklendi', (data) => {
  // Handle new part in Makindex
});
```

### CAD Import Namespace (`/cad-import`)

#### Client Events

**register-client**
```javascript
socket.emit('register-client', {
  client_id: 'solidworks-01',
  client_name: 'SolidWorks Client'
});
```

**job-progress**
```javascript
socket.emit('job-progress', {
  job_id: 123,
  progress: 50,
  status: 'processing'
});
```

**heartbeat**
```javascript
socket.emit('heartbeat', {});
```

#### Server Events

**registration-success**
```javascript
socket.on('registration-success', (data) => {
  console.log('Registered:', data.client_id);
});
```

**job-progress-{jobId}**
```javascript
socket.on('job-progress-123', (data) => {
  console.log('Progress:', data.progress);
});
```

**start-job-command**
```javascript
socket.on('start-job-command', (jobConfig) => {
  // Execute job
});
```

### Invoice Matching Namespace (`/fatura-eslestirme`)

Real-time invoice and delivery note matching events.

---

## Error Handling

### Error Response Format

```json
{
  "error": "Error message",
  "message": "Detailed description",
  "code": "ERROR_CODE",
  "stack": "..."  // Only in development
}
```

### Common Error Codes

| Code | Description |
|------|-------------|
| `FILE_TOO_LARGE` | Uploaded file exceeds 100MB limit |
| `VALIDATION_ERROR` | Request validation failed |
| `NOT_FOUND` | Resource not found |
| `DUPLICATE_ENTRY` | Unique constraint violation |
| `FOREIGN_KEY_ERROR` | Related record not found |
| `DATABASE_ERROR` | Database operation failed |

---

## Rate Limiting

Most endpoints have rate limiting applied:

- **Default**: 100 requests per 15 minutes
- **Upload endpoints**: 10 requests per 15 minutes
- **Report endpoints**: 20 requests per 15 minutes

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

---

## Pagination

List endpoints support pagination:

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 50, max: 100)

**Response:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 250,
    "totalPages": 5
  }
}
```

---

## CORS Configuration

Allowed origins:
- `http://localhost:5173`
- `http://localhost:5174`
- `http://10.255.255.254:5173`
- `http://10.255.255.254:5174`
- `http://172.22.180.221:5173`
- `http://172.22.180.221:5174`

Allowed methods: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`

Allowed headers: `*`

---

## Related Documentation

- [Database Schema](./DATABASE.md) - Database tables referenced by API
- [Project Overview](./PROJECT_OVERVIEW.md) - System architecture
- [Development Guide](./DEVELOPMENT.md) - API development procedures
