# Makindex API Documentation

## Overview

Makindex API provides hierarchical machine data management with 4-level navigation:
1. **Makina Sınıfları** (Machine Classes)
2. **Makinalar** (Machines)
3. **BOM'lar** (Bill of Materials)
4. **Parçalar** (Parts)

## Base URL

```
http://localhost:3000/api/makindex
```

## Endpoints

### Health Check

**GET** `/api/makindex/health`

Check API health status.

**Response:**
```json
{
  "success": true,
  "message": "Makindex API çalışıyor",
  "timestamp": "2025-01-17T20:47:21.123Z"
}
```

### Machine Classes

**GET** `/api/makindex/siniflar`

Get all machine classes with optional machine count.

**Query Parameters:**
- `includeCount` (boolean): Include machine count per class

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "ad": "CNC Torna",
      "aktif": true,
      "aciklama": "CNC turning machines",
      "makinaSayisi": 15
    }
  ],
  "message": "Makina sınıfları başarıyla listelendi"
}
```

### Machines by Class

**GET** `/api/makindex/makinalar/:sinifId`

Get machines belonging to a specific class.

**Path Parameters:**
- `sinifId` (number): Machine class ID

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "makina_id": 1,
      "name": "CNC Torna 1",
      "makina_sinifi_id": 1,
      "durum": "Aktif"
    }
  ]
}
```

### BOMs by Machine

**GET** `/api/makindex/boms/:makinaId`

Get BOMs associated with a specific machine.

**Path Parameters:**
- `makinaId` (number): Machine ID

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Product A BOM",
      "version": "1.0"
    }
  ]
}
```

### Parts by BOM

**GET** `/api/makindex/parcalar/:bomId`

Get parts belonging to a specific BOM.

**Path Parameters:**
- `bomId` (number): BOM ID

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "parcaKodu": "P001",
      "parcaAdi": "Bearing 608",
      "stokAdeti": 50,
      "kritikStok": false,
      "teknik_resim_path": "/uploads/resimler/P001.jpg"
    }
  ]
}
```

### Global Search

**GET** `/api/makindex/ara`

Search across all levels of the hierarchy.

**Query Parameters:**
- `q` (string, required): Search query (min 2 characters)
- `type` (string, optional): Filter by type (`sinif`, `makina`, `bom`, `parca`)

**Response:**
```json
{
  "data": {
    "sinif": [
      {
        "id": 1,
        "ad": "CNC Torna",
        "type": "sinif"
      }
    ],
    "makina": [
      {
        "makina_id": 1,
        "name": "CNC Torna 1",
        "type": "makina"
      }
    ],
    "bom": [],
    "parca": []
  },
  "query": "cnc"
}
```

### Seed Initial Data

**POST** `/api/makindex/seed`

Populate the database with initial Makindex data.

**Response:**
```json
{
  "success": true,
  "data": {
    "atananMakinaSayisi": 25,
    "toplamMakina": 25,
    "sinifSayisi": 5
  },
  "message": "Başlangıç verileri başarıyla yüklendi"
}
```

### Generate Test Data

**GET** `/api/makindex/test-data`

Generate synthetic test data for performance testing.

**Query Parameters:**
- `count` (number, optional): Number of parçalar to generate (default: 100)

**Response:**
```json
{
  "success": true,
  "data": {
    "generated": {
      "siniflar": 5,
      "makinalar": 50,
      "boms": 100,
      "parcalar": 100
    },
    "testData": {
      "siniflar": [...],
      "makinalar": [...],
      "boms": [...],
      "parcalar": [...]
    }
  },
  "message": "Test verileri başarılu oluşturuldu"
}
```

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information"
}
```

## Performance Features

- **Caching**: 5-minute TTL for API responses
- **Rate Limiting**: Applied to search endpoints
- **Debouncing**: Search queries are debounced to prevent excessive requests
- **Virtual Scrolling**: Frontend can handle 1000+ nodes efficiently

## Real-time Updates

The system supports real-time updates via Socket.IO:
- Stock changes update part information immediately
- New part additions appear in real-time
- BOM changes trigger automatic refreshes

## Data Model

```
MakinaSınıfı
├── Makinalar
    ├── BOM'lar
        ├── Parçalar
            ├── Stock information
            ├── Technical drawings
            └── Critical stock status
```

## Usage Examples

### Basic Navigation Flow

1. Get machine classes: `GET /api/makindex/siniflar`
2. Get machines for a class: `GET /api/makindex/makinalar/1`
3. Get BOMs for a machine: `GET /api/makindex/boms/1`
4. Get parts for a BOM: `GET /api/makindex/parcalar/1`

### Search Example

Search for "bearing" across all levels:
```
GET /api/makindex/ara?q=bearing
```

Search for parts only:
```
GET /api/makindex/ara?q=bearing&type=parca
```