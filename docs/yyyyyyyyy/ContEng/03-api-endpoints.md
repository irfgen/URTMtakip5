# API Endpoints Documentation - ÜRTM Takip

## API Overview

The ÜRTM Takip backend provides a comprehensive RESTful API built with Express.js and Socket.IO for real-time capabilities. The API supports production tracking, inventory management, subcontracting, maintenance, and reporting functions.

### Base Configuration
- **Server**: Express.js on Node.js
- **Base URL**: `http://localhost:3001` (development)
- **Database**: SQLite with Sequelize ORM
- **Real-time**: Socket.IO WebSocket server
- **File Upload**: Multer with 100MB limit
- **Authentication**: Currently none (can be extended)

### Global Middleware
- **Helmet**: Security headers with CORS policy
- **Compression**: Response compression
- **CORS**: Custom cross-origin resource sharing
- **Body Parser**: JSON/URL-encoded (100MB limit)
- **File Upload**: Multer for multipart/form-data
- **Error Handling**: Global error handler with logging
- **Static Files**: `/uploads/*`, `/importlar/*`

## Core Production APIs

### 1. İş Emirleri (Work Orders) - `/api/is-emirleri`

**Primary production tracking entity**

| Method | Endpoint | Description | Request | Response |
|--------|----------|-------------|---------|----------|
| GET | `/` | List work orders | Query: `durum`, `excludeDurum`, `showCompleted`, `showAssigned` | Array of work orders |
| POST | `/` | Create work order | Body: Work order object | Created work order |
| GET | `/:id` | Get work order by ID | Path: `id` | Work order object |
| PUT | `/:id` | Update work order | Path: `id`, Body: Updates | Updated work order |
| DELETE | `/:id` | Delete work order | Path: `id` | Success message |
| POST | `/sirala` | Reorder work orders | Body: `{kolon, idList}` | Success message |
| POST | `/batch-create` | Create multiple work orders | Body: Array of work orders | Created work orders |
| POST | `/create-from-plan` | Create from production plan | Body: Production plan data | Created work orders |
| GET | `/by-uretim-plani/:id` | Get by production plan | Path: `uretimPlaniId` | Work orders array |
| GET | `/atanabilir-modal` | Get assignable for modal | None | Assignable work orders |

**Work Order Object Example:**
```json
{
  "is_emri_no": "WO-2024-001",
  "is_adi": "Part Manufacturing",
  "adet": 100,
  "malzeme": "Steel",
  "teslim_tarihi": "2024-12-31",
  "oncelik": "normal",
  "durum": "beklemede",
  "parca_kodu": "PART-001",
  "tezgah_id": 1,
  "setup_sayisi": 2,
  "cnc_suresi": 45.5
}
```

### 2. Tezgahlar (Workstations) - `/api/tezgahlar`

**Machine and workstation management**

| Method | Endpoint | Description | Request | Response |
|--------|----------|-------------|---------|----------|
| GET | `/` | List all workstations | None | Array of workstations |
| POST | `/` | Create workstation | Body: Workstation object | Created workstation |
| GET | `/:id` | Get workstation by ID | Path: `id` | Workstation object |
| PUT | `/:id` | Update workstation | Path: `id`, Body: Updates | Updated workstation |
| DELETE | `/:id` | Delete workstation | Path: `id` | Success message |
| POST | `/pozisyonlar` | Update positions | Body: Array of positions | Success message |
| POST | `/:id/is-emri-ata` | Assign work order | Path: `id`, Body: `{is_emri_id}` | Success message |
| POST | `/:id/is-emri-tamamla` | Complete work order | Path: `id`, Body: Completion data | Success message |
| GET | `/:id/is-emirleri-gecmisi` | Get work history | Path: `id` | Work history array |
| POST | `/:id/is-ara-ver` | Pause work | Path: `id`, Body: `{aciklama}` | Success message |
| POST | `/:id/ariza-bakim-sonlandir` | End maintenance | Path: `id`, Body: Maintenance data | Success message |

**Workstation Object:**
```json
{
  "tezgah_tanimi": "CNC Lathe #1",
  "calisma_durumu": "musait",
  "pozisyon_x": 100,
  "pozisyon_y": 200,
  "son_bakim_tarihi": "2024-01-15",
  "sonraki_bakim_tarihi": "2024-04-15"
}
```

### 3. Parçalar (Parts) - `/api/parcalar`

**Parts catalog and management**

| Method | Endpoint | Description | Request | Response |
|--------|----------|-------------|---------|----------|
| GET | `/` | List all parts | Query: Various filters | Array of parts |
| POST | `/` | Create new part | Body: Part object | Created part |
| GET | `/check` | Check part exists | Query: `parcaKodu` | Existence status |
| GET | `/:parcaKodu` | Get part by code | Path: `parcaKodu` | Part object |
| PUT | `/:parcaKodu` | Update part | Path: `parcaKodu`, Body: Updates | Updated part |
| DELETE | `/:parcaKodu` | Delete part | Path: `parcaKodu` | Success message |
| POST | `/check-bulk` | Bulk check parts | Body: Array of part codes | Check results |
| POST | `/batch-check` | Batch check parts | Body: Array of part codes | Check results |
| GET | `/:parcaKodu/suggest-ham-malzeme` | Suggest raw materials | Path: `parcaKodu` | Suggestions |
| GET | `/resim-yolu/:parca_kodu` | Get image path | Path: `parca_kodu` | Image path |
| GET | `/stok-karti/olmayan` | Parts without stock cards | Query: Pagination | Parts array |
| PUT | `/:parcaKodu/stok-karti` | Assign stock card | Path: `parcaKodu`, Body: `{stok_karti_id}` | Success |
| DELETE | `/:parcaKodu/stok-karti` | Remove stock card | Path: `parcaKodu` | Success message |

**Part Object:**
```json
{
  "parca_kodu": "PART-001",
  "parca_adi": "Gear Wheel",
  "kategori": "Transmission",
  "stok_adeti": 50,
  "kritik_stok": 10,
  "imal_mi": true,
  "ham_malzeme_cinsi": "Steel",
  "setup_sayisi": 3,
  "cnc_isleme_suresi": 120,
  "fason_maliyeti": 25.50,
  "sirket_ici_maliyeti": 18.75
}
```

## Inventory Management APIs

### 4. Stok Kartları (Stock Cards) - `/api/stok-kartlari`

**Raw material inventory management**

| Method | Endpoint | Description | Request | Response |
|--------|----------|-------------|---------|----------|
| GET | `/` | List stock cards | Query: Pagination, search, filters | Paginated stock cards |
| GET | `/kritik-stok` | Critical stock items | None | Critical stock array |
| GET | `/istatistikler` | Stock statistics | None | Statistics object |
| GET | `/firmalar` | List companies | None | Companies array |
| GET | `/malzeme-cinsleri` | Material types | None | Material types array |
| GET | `/search` | Advanced search | Query: Search parameters | Search results |
| GET | `/:id` | Get stock card details | Path: `id` | Stock card object |
| POST | `/` | Create stock card | Body: Stock card object | Created stock card |
| PUT | `/:id` | Update stock card | Path: `id`, Body: Updates | Updated stock card |
| DELETE | `/:id` | Delete stock card | Path: `id` | Success message |

**Middleware:**
- Input validation for all POST/PUT requests
- ID validation for path parameters
- Request logging for audit trails

**Stock Card Object:**
```json
{
  "kesit": "40x40",
  "boy": 6000.0,
  "malzeme_adi": "Square Steel Pipe",
  "malzeme_cinsi": "Steel",
  "adet": 25,
  "kritik_stok_miktari": 5,
  "lokasyon": "Warehouse A",
  "adres": "Shelf A-12",
  "firma": "Steel Supplier Ltd",
  "aktif_mi": true
}
```

### 5. BOM Yönetimi (Bill of Materials) - `/api/boms`

**Product structure and BOM management**

| Method | Endpoint | Description | Request | Response |
|--------|----------|-------------|---------|----------|
| GET | `/boms` | List all BOMs | None | BOMs array |
| POST | `/boms` | Create new BOM | Body: BOM object | Created BOM |
| GET | `/boms/:id` | Get BOM details | Path: `id` | BOM object |
| PUT | `/boms/:id` | Update BOM | Path: `id`, Body: Updates | Updated BOM |
| DELETE | `/boms/:id` | Delete BOM | Path: `id` | Success message |
| GET | `/search/parts` | Search parts for BOM | Query: Search terms | Parts search results |
| GET | `/search/boms` | Search other BOMs | Query: Search terms | BOMs search results |

**BOM Object:**
```json
{
  "bom_id": "uuid-string",
  "name": "Product Assembly BOM",
  "description": "Complete assembly BOM",
  "items": {
    "parts": [
      {
        "part_code": "PART-001",
        "quantity": 2,
        "unit": "pcs",
        "level": 1
      }
    ]
  }
}
```

## Production Planning APIs

### 6. Üretim Planı (Production Planning) - `/api/uretim-plani`

**Production planning and scheduling**

| Method | Endpoint | Description | Request | Response |
|--------|----------|-------------|---------|----------|
| GET | `/` | List production plans | None | Plans array |
| GET | `/:id` | Get plan by ID | Path: `id` | Plan object |
| POST | `/` | Create new plan | Body: Plan object | Created plan |
| POST | `/is-emri-tabanli` | Create work order based plan | Body: Work order data | Created plan |
| POST | `/karma` | Create mixed plan | Body: Mixed plan data | Created plan |
| POST | `/excel-import` | Import from Excel | Form: Excel file | Import results |
| PUT | `/:id` | Update plan | Path: `id`, Body: Updates | Updated plan |
| DELETE | `/:id` | Delete plan | Path: `id` | Success message |
| POST | `/bom-analizi` | BOM analysis | Body: BOM data | Analysis results |
| POST | `/kritik-stok/is-emri` | Create for critical stock | Body: Critical stock data | Created work order |
| POST | `/:id/is-emri` | Add work order to plan | Path: `id`, Body: Work order data | Success |
| DELETE | `/:id/is-emri` | Remove work order from plan | Path: `id`, Body: Work order data | Success |

**Production Plan Object:**
```json
{
  "miktar": 100,
  "teslim_tarihi": "2024-12-31",
  "durum": "Planlandı",
  "aciklama": "Quarterly production batch",
  "makina_id": "machine-uuid",
  "bom_snapshot": {
    "captured_at": "2024-01-01T00:00:00Z",
    "items": []
  },
  "kritik_stok_uyarisi": []
}
```

## Subcontracting APIs

### 7. Fason İşler (Subcontractor Work) - `/api/fason`

**Comprehensive subcontractor management**

#### Work Orders (`/is-emirleri`)

| Method | Endpoint | Description | Request | Response |
|--------|----------|-------------|---------|----------|
| GET | `/is-emirleri` | List subcontractor orders | None | Orders array |
| GET | `/is-emirleri/selectable` | Get selectable orders | None | Selectable orders |
| GET | `/is-emirleri/by-uretim-plani/:id` | Get by production plan | Path: `uretim_plani_id` | Orders array |
| GET | `/is-emirleri/:id` | Get order details | Path: `id` | Order object |
| POST | `/is-emirleri` | Create subcontractor order | Body: Order object | Created order |
| PUT | `/is-emirleri/:id` | Update order | Path: `id`, Body: Updates | Updated order |
| DELETE | `/is-emirleri/:id` | Delete order | Path: `id` | Success message |
| POST | `/is-emirleri/:id/teslim-al` | Receive completed work | Path: `id`, Body: Delivery data | Success |
| PATCH | `/is-emirleri/:id/durum` | Update order status | Path: `id`, Body: Status data | Success |
| POST | `/is-emirleri/:id/ham-malzeme-gonder` | Send raw materials | Path: `id`, Body: Material data | Success |
| PATCH | `/is-emirleri/:id/ham-malzeme-durum` | Update material status | Path: `id`, Body: Status data | Success |
| POST | `/is-emirleri/:id/ham-malzeme-teslim` | Deliver raw materials | Path: `id`, Body: Delivery data | Success |

#### Quotes (`/teklifler`)

| Method | Endpoint | Description | Request | Response |
|--------|----------|-------------|---------|----------|
| GET | `/teklifler` | List all quotes | None | Quotes array |
| GET | `/teklifler/parca/:parca_kodu` | Get quotes by part | Path: `parca_kodu` | Quotes array |
| GET | `/teklifler/is-emri/:id` | Get quotes by order | Path: `fason_is_emri_id` | Quotes array |
| POST | `/teklifler` | Create new quote | Body: Quote object | Created quote |
| PUT | `/teklifler/:id` | Update quote | Path: `id`, Body: Updates | Updated quote |
| DELETE | `/teklifler/:id` | Delete quote | Path: `id` | Success message |
| POST | `/teklifler/:id/kabul-et` | Accept quote | Path: `id`, Body: Acceptance data | Success |
| POST | `/teklifler/upload-excel` | Upload Excel quotes | Form: Excel file | Upload results |
| GET | `/teklifler/check-parca` | Check part code | Query: `parca_kodu` | Check result |
| POST | `/teklifler/bulk-create` | Bulk create quotes | Body: Quotes array | Created quotes |

**Subcontractor Order Object:**
```json
{
  "parca_kodu": "PART-001",
  "adet": 50,
  "teslim_tarihi": "2024-02-15",
  "tedarikci": "Subcontractor Inc",
  "durum": "beklemede",
  "maliyet": 1250.00,
  "ham_malzeme_miktari": 25.5,
  "gonderim_irsaliye_no": "INV-2024-001"
}
```

## Shipping and Logistics APIs

### 8. Sevkiyat (Shipping) - `/api/sevkiyat`

**Comprehensive shipping management**

| Method | Endpoint | Description | Request | Response |
|--------|----------|-------------|---------|----------|
| GET | `/` | List shipments | Query: Multiple filters | Filtered shipments |
| GET | `/:id` | Get shipment details | Path: `id` | Shipment object |
| POST | `/` | Create new shipment | Body: Shipment object | Created shipment |
| PUT | `/:id` | Update shipment | Path: `id`, Body: Updates | Updated shipment |
| DELETE | `/:id` | Delete shipment | Path: `id` | Success message |

**Query Filters:**
- `tip` - Shipment type
- `firma_id` - Company ID
- `lokasyon_id` - Location ID
- `tarih_baslangic` - Start date
- `tarih_bitis` - End date
- `durum` - Status
- `page`, `limit` - Pagination

**Sub-routes:**
- `/api/sevkiyat/firmalar` - Company management
- `/api/sevkiyat/lokasyonlar` - Location management
- `/api/sevkiyat/raporlar` - Shipping reports
- `/api/sevkiyat/resimler` - Image management
- `/api/sevkiyat-kalemleri` - Shipment items management

## File Upload APIs

### 9. File Upload - `/api/upload`

**Multi-destination file upload system**

| Method | Endpoint | Description | File Fields | Destination | Max Size |
|--------|----------|-------------|-------------|-------------|----------|
| POST | `/parca` | Upload part files | `foto`, `teknik` | `/uploads/fotograflar/`, `/uploads/teknik_resimler/` | 100MB |
| POST | `/siparis-dokumani` | Upload order documents | `siparis_dokumani` | `/uploads/siparis_dokumanlari/` | 100MB |

**File Upload Features:**
- **Supported Types**: JPEG, PNG, GIF, PDF, DOC, DOCX, TXT, XLS, XLSX
- **Turkish Character Handling**: Automatic sanitization
- **Unique Naming**: Timestamp-based file naming
- **Error Handling**: Comprehensive file validation
- **Security**: File type and size validation

**Upload Response:**
```json
{
  "success": true,
  "files": {
    "foto": "/uploads/fotograflar/part_001_1672531200000.jpg",
    "teknik": "/uploads/teknik_resimler/tech_001_1672531200000.pdf"
  }
}
```

## Documentation and Notes APIs

### 10. Notlar (Notes) - `/api/notlar`

**Notes system with image support**

| Method | Endpoint | Description | Request | Response |
|--------|----------|-------------|---------|----------|
| GET | `/` | List all notes | Query: Pagination, filters | Notes array |
| POST | `/` | Create note with images | Form: Note data + images | Created note |
| PUT | `/:id` | Update note | Path: `id`, Body: Updates | Updated note |
| DELETE | `/:id` | Soft delete note | Path: `id` | Success message |
| POST | `/:notId/resim` | Add images to note | Path: `notId`, Form: Images | Success |
| DELETE | `/:notId/resim/:resimId` | Delete specific image | Path: `notId`, `resimId` | Success |

**File Upload Specs:**
- **Max Files**: 10 images per upload
- **File Size**: 10MB per image
- **Types**: JPEG, PNG, GIF, WebP
- **Naming**: Timestamp-based unique names

**Note Object:**
```json
{
  "baslik": "Production Issue Note",
  "icerik": "Detailed description of the issue",
  "kategori_id": 1,
  "kullanici_id": 123,
  "aktif": true,
  "resimler": [
    "/uploads/notlar/note_1_1672531200000_1.jpg"
  ]
}
```

## Reporting APIs

### 11. Raporlar (Reports) - `/api/raporlar`

**Comprehensive reporting system**

| Method | Endpoint | Description | Parameters | Response |
|--------|----------|-------------|------------|----------|
| GET | `/is-emri-ozet` | Work order summary | Date range | Summary report |
| GET | `/tezgah-performans` | Workstation performance | Date range | Performance metrics |
| GET | `/planlama-gerceklesme` | Planning vs realization | Date range | Comparison report |
| GET | `/parca-performans` | Part performance | Date range | Part metrics |
| GET | `/parca-is-emirleri` | Part-based work orders | Date range | Part work order report |
| GET | `/tamamlanan-is-emirleri` | Completed work orders | Date range | Completion report |

**Common Parameters:**
- `baslangic_tarihi` - Start date (YYYY-MM-DD)
- `bitis_tarihi` - End date (YYYY-MM-DD)
- Additional filters specific to each report

## Additional APIs

### 12. Configuration APIs

| API | Endpoint | Description |
|-----|----------|-------------|
| **Work Order Drafts** | `/api/is-emri-taslaklari` | Draft work order management |
| **Maintenance** | `/api/ariza-bakim` | Breakdown and maintenance tracking |
| **Completed Work** | `/api/tamamlanan-isler` | Historical completed work |
| **Workstation Planning** | `/api/tezgah-plan` | Workstation job scheduling |
| **Subcontractor Groups** | `/api/fason-grup` | Subcontractor group management |
| **Work Order Summary** | `/api/is-emri-ozeti` | Work order completion summaries |
| **Workstation Status** | `/api/tezgah-durum` | Real-time workstation status |
| **Order Documents** | `/api/siparis-dokumanlari` | Order document management |
| **Orders** | `/api/siparisler` | Order management |
| **Part Records** | `/api/parca-kayitlari` | Part file and record tracking |
| **Machine Groups** | `/api/makina-group-parts` | Machine group parts management |
| **Categories** | `/api/kategoriler` | Note categories management |
| **Shifts** | `/api/vardiyalar` | Shift definitions |
| **Personnel** | `/api/personel` | Personnel management |
| **Shift Assignment** | `/api/vardiya-atama` | Daily shift assignments |
| **Parts Combined** | `/api/parca-birlesik` | Part consolidation management |
| **Technical Drawings** | `/api/teknik-resim` | Technical drawing management |
| **CNC Link** | `/api/cnc_link` | CNC machine integration |
| **Work Order Status** | `/api/is-emri-durumlari` | Configurable work order statuses |

## Real-time WebSocket API

### Socket.IO Events

**Connection Management:**
```javascript
// Server-side event handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});
```

**Real-time Updates:**
```javascript
// Work order update broadcast
socket.broadcast.emit('isEmriGuncellendi', {
  is_emri_id: 123,
  durum: 'tamamlandi',
  timestamp: new Date()
});

// Client-side listening
socket.on('isEmriGuncellendi', (data) => {
  // Update UI with new work order data
  updateWorkOrderInUI(data);
});
```

## Error Handling

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `404` - Not Found
- `413` - Payload Too Large (file uploads)
- `500` - Internal Server Error

### Error Response Format
```json
{
  "success": false,
  "error": "Error message",
  "details": "Detailed error information",
  "timestamp": "2024-01-01T12:00:00Z"
}
```

### File Upload Errors
- File size exceeded (413)
- Invalid file type (400)
- Upload destination error (500)
- Validation errors (400)

## Security Features

### Input Validation
- Joi schema validation for all POST/PUT endpoints
- File type and size validation
- SQL injection prevention via Sequelize ORM
- Turkish character sanitization for filenames

### CORS Configuration
- Custom CORS middleware
- Configurable allowed origins
- Credential support for authenticated requests

### File Security
- Restricted file type whitelist
- Size limitations per endpoint
- Organized storage structure
- Secure file naming conventions

This comprehensive API documentation covers all endpoints and features of the ÜRTM Takip production tracking system, providing developers with the complete reference needed for integration and development.