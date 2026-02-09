# Database Schema Documentation - ÜRTM Takip

## Database Overview

ÜRTM Takip uses **SQLite** with **Sequelize ORM** for a comprehensive manufacturing ERP system. The database supports production tracking, inventory management, subcontracting, maintenance, human resources, and documentation with extensive audit trails.

### Database Configuration
- **Engine**: SQLite 3
- **ORM**: Sequelize
- **Mode**: WAL (Write-Ahead Logging)
- **Location**: `backend/database.sqlite`
- **Backup Strategy**: Automated backups in `backend/DB_YEDEKLER/`

## Core Production Tables

### 1. is_emirleri (Work Orders) 
**Primary production tracking entity**

```sql
CREATE TABLE is_emirleri (
    is_emri_id INTEGER PRIMARY KEY AUTOINCREMENT,
    is_emri_no VARCHAR(255) UNIQUE NOT NULL,
    is_adi VARCHAR(255),
    plan_liste_no VARCHAR(255),
    adet INTEGER,
    malzeme VARCHAR(255),
    teslim_tarihi DATE,
    oncelik ENUM('dusuk', 'normal', 'yuksek', 'acil'),
    durum VARCHAR(255),
    hareketler JSON,
    setup_sayisi INTEGER,
    cnc_suresi FLOAT,
    malzemesi_siparis_edilecekmi BOOLEAN,
    tezgah_id INTEGER REFERENCES tezgahlar(tezgah_id),
    uretim_plani_id INTEGER REFERENCES uretim_plani(id),
    parca_kodu VARCHAR(255) REFERENCES parcalar(parca_kodu),
    olusturma_tarihi DATETIME DEFAULT CURRENT_TIMESTAMP,
    guncelleme_tarihi DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Business Rules:**
- Unique work order numbers
- Priority levels for scheduling
- JSON movement history tracking
- Material order flags for procurement

### 2. parcalar (Parts Catalog)
**Central parts management**

```sql
CREATE TABLE parcalar (
    parca_kodu VARCHAR(255) PRIMARY KEY,
    parca_adi VARCHAR(255),
    kategori VARCHAR(255),
    stok_adeti INTEGER,
    kritik_stok INTEGER,
    teknik_resim_path VARCHAR(255),
    foto_path VARCHAR(255),
    tedarik_bedeli DECIMAL(10,2),
    imal_mi BOOLEAN,
    ham_malzeme_cinsi VARCHAR(255),
    ham_malzeme_olculeri VARCHAR(255),
    fason_maliyeti DECIMAL(10,2),
    sirket_ici_maliyeti DECIMAL(10,2),
    setup_sayisi INTEGER,
    cnc_isleme_suresi INTEGER,
    siyah BOOLEAN,
    stok_karti_id INTEGER REFERENCES stok_kartlari(id),
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Key Features:**
- Manufacturing vs. procurement flags (`imal_mi`)
- Cost tracking (internal/subcontractor)
- Technical documentation links
- Raw material specifications

### 3. tezgahlar (Workstations)
**Machine and workstation management**

```sql
CREATE TABLE tezgahlar (
    tezgah_id INTEGER PRIMARY KEY AUTOINCREMENT,
    tezgah_tanimi VARCHAR(255),
    calisma_durumu ENUM('musait', 'calisiyor', 'bakim'),
    is_emirleri JSON,
    is_emirleri_gecmisi JSON,
    pozisyon_x INTEGER,
    pozisyon_y INTEGER,
    son_bakim_tarihi DATE,
    sonraki_bakim_tarihi DATE,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Features:**
- Real-time status tracking
- Spatial positioning for layout
- Maintenance scheduling
- Work order assignment history

### 4. uretim_plani (Production Plans)
**Production planning and scheduling**

```sql
CREATE TABLE uretim_plani (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    miktar INTEGER,
    teslim_tarihi DATE,
    durum ENUM('Planlandı', 'Üretimde', 'Tamamlandı', 'İptal'),
    aciklama TEXT,
    bom_snapshot JSON,
    kritik_stok_uyarisi JSON,
    ozel_liste_adi VARCHAR(255),
    makina_id VARCHAR(255) REFERENCES makinalar(makina_id),
    olusturma_tarihi DATETIME DEFAULT CURRENT_TIMESTAMP,
    guncelleme_tarihi DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Advanced Features:**
- BOM snapshot preservation
- Critical stock warnings
- Custom list support for special orders

## Inventory Management

### 5. stok_kartlari (Stock Cards)
**Raw material inventory**

```sql
CREATE TABLE stok_kartlari (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kesit VARCHAR(255) NOT NULL,
    boy DECIMAL(10,2),
    malzeme_adi VARCHAR(255),
    malzeme_cinsi VARCHAR(255) NOT NULL,
    adet INTEGER,
    kritik_stok_miktari INTEGER,
    lokasyon VARCHAR(255),
    adres TEXT,
    firma VARCHAR(255),
    aktif_mi BOOLEAN DEFAULT true,
    olusturma_tarihi DATETIME DEFAULT CURRENT_TIMESTAMP,
    guncelleme_tarihi DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Methods:**
- `isCriticalStock()` - Check if below critical level
- Search and pagination methods
- Location tracking for warehouse management

### 6. parca_kayitlari (Part Records)
**File and document tracking for parts**

```sql
CREATE TABLE parca_kayitlari (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    parca_kodu VARCHAR(255) REFERENCES parcalar(parca_kodu) ON DELETE CASCADE ON UPDATE CASCADE,
    dosya_yolu VARCHAR(255),
    kayit_zamani DATE,
    sira_no INTEGER,
    not TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_parca_kayitlari_parca_kodu ON parca_kayitlari(parca_kodu);
CREATE INDEX idx_parca_kayitlari_kayit_zamani ON parca_kayitlari(kayit_zamani);
```

## BOM and Machine Management

### 7. boms (Bill of Materials)
**Product structure definitions**

```sql
CREATE TABLE boms (
    bom_id VARCHAR(255) PRIMARY KEY, -- UUID
    name VARCHAR(255),
    description TEXT,
    items JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**JSON Structure for items:**
```json
{
  "parts": [
    {
      "part_code": "string",
      "quantity": "number",
      "unit": "string",
      "level": "number"
    }
  ]
}
```

### 8. makinalar (Machines)
**Machine catalog and configuration**

```sql
CREATE TABLE makinalar (
    makina_id VARCHAR(255) PRIMARY KEY, -- UUID
    name VARCHAR(255),
    description TEXT,
    model VARCHAR(255),
    seri_no VARCHAR(255),
    uretim_yili INTEGER,
    durum ENUM('aktif', 'pasif', 'bakim'),
    items JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Subcontracting (Fason) System

### 9. fasonlar (Subcontractor Jobs)
**Basic subcontractor work tracking**

```sql
CREATE TABLE fasonlar (
    fason_id VARCHAR(255) PRIMARY KEY, -- UUID
    is_emri_no VARCHAR(255),
    parca_adi VARCHAR(255),
    adet INTEGER,
    tedarikci VARCHAR(255),
    baslangic_tarihi DATE,
    teslim_tarihi DATE,
    durum ENUM('beklemede', 'devam', 'tamamlandi', 'iptal'),
    maliyet DECIMAL(10,2),
    parca_kodu VARCHAR(255) REFERENCES parcalar(parca_kodu),
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 10. fason_gruplar (Subcontractor Groups)
**Grouping subcontractor jobs**

```sql
CREATE TABLE fason_gruplar (
    fason_grup_id VARCHAR(255) PRIMARY KEY, -- UUID
    grup_adi VARCHAR(255) UNIQUE,
    aciklama TEXT,
    renk VARCHAR(255),
    aktif BOOLEAN DEFAULT true,
    toplam_parca_sayisi INTEGER DEFAULT 0,
    olusturan_kisi VARCHAR(255),
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 11. fason_is_emirleri (Advanced Subcontractor Orders)
**Comprehensive subcontractor management**

```sql
CREATE TABLE fason_is_emirleri (
    fason_is_emri_id VARCHAR(255) PRIMARY KEY, -- UUID
    parca_kodu VARCHAR(255) REFERENCES parcalar(parca_kodu),
    fason_grup_id VARCHAR(255) REFERENCES fason_gruplar(fason_grup_id),
    uretim_plani_id INTEGER REFERENCES uretim_plani(id),
    adet INTEGER,
    teslim_tarihi DATE,
    tedarikci VARCHAR(255),
    durum VARCHAR(255),
    maliyet DECIMAL(10,2),
    -- Raw material tracking
    ham_malzeme_gonderim_tarihi DATE,
    ham_malzeme_durumu VARCHAR(255),
    ham_malzeme_miktari DECIMAL(10,3),
    gonderim_irsaliye_no VARCHAR(255),
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 12. fason_teklifler (Subcontractor Quotes)
**Quote management system**

```sql
CREATE TABLE fason_teklifler (
    teklif_id VARCHAR(255) PRIMARY KEY, -- UUID
    fason_is_emri_id VARCHAR(255) REFERENCES fason_is_emirleri(fason_is_emri_id),
    parca_kodu VARCHAR(255) REFERENCES parcalar(parca_kodu),
    teklif_tarihi DATE,
    teklif_fiyati DECIMAL(10,2),
    teslim_suresi INTEGER,
    durumu ENUM('aktif', 'kabul_edildi', 'reddedildi'),
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Process Tracking

### 13. islem_kayitlari (Process Records)
**Detailed production process tracking**

```sql
CREATE TABLE islem_kayitlari (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    is_emri_no VARCHAR(255) REFERENCES is_emirleri(is_emri_no),
    tezgah_id INTEGER REFERENCES tezgahlar(tezgah_id),
    islem_tipi TEXT,
    islem_tarihi DATE,
    islenen_adet INTEGER,
    aciklama TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 14. is_emri_ozetleri (Work Order Summaries)
**Comprehensive work order completion tracking**

```sql
CREATE TABLE is_emri_ozetleri (
    ozet_id INTEGER PRIMARY KEY AUTOINCREMENT,
    is_emri_id INTEGER UNIQUE REFERENCES is_emirleri(is_emri_id),
    baslangic_tarihi DATE,
    bitis_tarihi DATE,
    toplam_calisma_suresi INTEGER, -- minutes
    toplam_uretilen INTEGER,
    hurda_sayisi INTEGER,
    ortalama_parca_suresi DECIMAL(5,2),
    verimlilik DECIMAL(5,2),
    ara_verme_sayisi INTEGER,
    setup_sayisi INTEGER,
    cnc_suresi DECIMAL(8,2),
    uretim_sonucu TEXT,
    operator_notu TEXT,
    durus_detaylari JSON,
    onaylayan_kullanici VARCHAR(255),
    onay_tarihi DATE,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 15. tezgah_durum_logs (Workstation Status Logs)
**Real-time machine status tracking**

```sql
CREATE TABLE tezgah_durum_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tezgah_id INTEGER REFERENCES tezgahlar(tezgah_id),
    is_emri_id INTEGER REFERENCES is_emirleri(is_emri_id),
    durum BOOLEAN, -- true=working, false=stopped
    timestamp DATE,
    durus_nedeni VARCHAR(255),
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Maintenance and Equipment

### 16. ariza_bakim (Breakdown & Maintenance)
**Equipment maintenance tracking**

```sql
CREATE TABLE ariza_bakim (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tezgah_id INTEGER REFERENCES tezgahlar(tezgah_id),
    kayit_tipi ENUM('ariza', 'bakim'),
    baslangic_tarihi DATE,
    bitis_tarihi DATE,
    durum ENUM('devam_ediyor', 'tamamlandi'),
    aciklama TEXT,
    yapilan_islemler TEXT,
    maliyet DECIMAL(10,2),
    sorumlu VARCHAR(255),
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 17. tamamlanan_isler (Completed Jobs)
**Historical job completion records**

```sql
CREATE TABLE tamamlanan_isler (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tezgah_id INTEGER REFERENCES tezgahlar(tezgah_id),
    baslama_tarihi DATE,
    bitis_tarihi DATE,
    toplam_adet INTEGER,
    islenen_adet INTEGER,
    toplam_sure INTEGER,
    notlar TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Human Resources

### 18. personeller (Personnel)
**Employee management**

```sql
CREATE TABLE personeller (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    personel_adi VARCHAR(255),
    sicil_no VARCHAR(255) UNIQUE,
    pozisyon VARCHAR(255),
    telefon VARCHAR(255),
    email VARCHAR(255),
    aktif BOOLEAN DEFAULT true,
    maas DECIMAL(10,2),
    ise_baslama_tarihi DATE,
    notlar TEXT,
    vardiya_id INTEGER REFERENCES vardiyalar(id),
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 19. vardiyalar (Shifts)
**Shift definitions**

```sql
CREATE TABLE vardiyalar (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vardiya_adi VARCHAR(255),
    baslangic_saati TIME,
    bitis_saati TIME,
    haftalik_calisma_gunleri JSON, -- [1,2,3,4,5] for Mon-Fri
    aktif BOOLEAN DEFAULT true,
    renk VARCHAR(255),
    aciklama TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 20. vardiya_atamalari (Shift Assignments)
**Daily shift assignments**

```sql
CREATE TABLE vardiya_atamalari (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    personel_id INTEGER REFERENCES personeller(id),
    vardiya_id INTEGER REFERENCES vardiyalar(id),
    tarih DATE,
    baslangic_saati TIME,
    bitis_saati TIME,
    durum ENUM('planlanan', 'aktif', 'tamamlandi', 'iptal'),
    fiili_baslangic DATETIME,
    fiili_bitis DATETIME,
    notlar TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(personel_id, tarih)
);
```

## Notes and Documentation

### 21. notlar (Notes)
**General notes system**

```sql
CREATE TABLE notlar (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    baslik TEXT NOT NULL,
    icerik TEXT,
    resim_yolu VARCHAR(255),
    kategori_id INTEGER REFERENCES not_kategorileri(id),
    kullanici_id INTEGER,
    aktif BOOLEAN DEFAULT true,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Model Methods:**
- `getOzet()` - Returns content summary
- `hasImage()` - Checks for image attachment

**Scopes:**
- `aktif` - Active notes only
- `withKategori` - Include category data
- `resimliNotlar` - Notes with images
- `resimsizNotlar` - Notes without images

### 22. not_kategorileri (Note Categories)
**Note categorization**

```sql
CREATE TABLE not_kategorileri (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kategori_adi VARCHAR(255) UNIQUE,
    renk_kodu VARCHAR(255), -- Hex color code
    aktif BOOLEAN DEFAULT true,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Configuration and Status

### 23. is_emri_durumlari (Work Order Statuses)
**Configurable status system**

```sql
CREATE TABLE is_emri_durumlari (
    durum_id INTEGER PRIMARY KEY AUTOINCREMENT,
    durum_kodu VARCHAR(255) UNIQUE,
    durum_adi VARCHAR(255),
    durum_aciklamasi TEXT,
    renk_kodu VARCHAR(255),
    sira_no INTEGER,
    aktif BOOLEAN DEFAULT true,
    sistem_durumu BOOLEAN DEFAULT false, -- System statuses cannot be deleted
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Planning and Management

### 24. tezgah_planlanan_isler (Workstation Planned Jobs)
**Job scheduling for workstations**

```sql
CREATE TABLE tezgah_planlanan_isler (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tezgah_id INTEGER REFERENCES tezgahlar(tezgah_id),
    is_emri_id INTEGER REFERENCES is_emirleri(is_emri_id),
    sira_no INTEGER DEFAULT 9999,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 25. is_emri_taslaklari (Work Order Drafts)
**Draft work orders for batch processing**

```sql
CREATE TABLE is_emri_taslaklari (
    taslak_id INTEGER PRIMARY KEY AUTOINCREMENT,
    oturum_id VARCHAR(255),
    -- All work order fields...
    durum ENUM('taslak', 'hazir', 'yayinlandi'),
    kaynak VARCHAR(255), -- 'excel', 'manual', etc.
    excel_satir_no INTEGER,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_is_emri_taslaklari_oturum_id ON is_emri_taslaklari(oturum_id);
CREATE INDEX idx_is_emri_taslaklari_durum ON is_emri_taslaklari(durum);
CREATE INDEX idx_is_emri_taslaklari_kaynak ON is_emri_taslaklari(kaynak);
```

### 26. siparis_dokumanlari (Order Documents)
**Document attachments for orders**

```sql
CREATE TABLE siparis_dokumanlari (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    is_emri_id INTEGER REFERENCES is_emirleri(is_emri_id),
    dosya_yolu VARCHAR(255),
    yuklenme_tarihi DATE,
    siralama INTEGER
    -- No timestamps
);
```

## Audit and Logging

### 27. parca_birlestirme_log (Part Merge Log)
**Audit trail for part consolidation**

```sql
CREATE TABLE parca_birlestirme_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tutulan_parca_kodu VARCHAR(255) REFERENCES parcalar(parca_kodu),
    silinen_parca_kodlari JSON,
    transfer_detaylari JSON,
    onceki_durum JSON, -- For rollback capability
    kullanici_id VARCHAR(255),
    kullanici_ip VARCHAR(255),
    rollback_durumu ENUM('aktif', 'geri_alindi', 'geri_alinamaz'),
    rollback_tarihi DATETIME,
    rollback_kullanici_id VARCHAR(255),
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 28. gruplar (Groups)
**Generic grouping system**

```sql
CREATE TABLE gruplar (
    grup_id VARCHAR(255) PRIMARY KEY, -- UUID
    grup_adi VARCHAR(255),
    aciklama TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Many-to-many with parts
CREATE TABLE grup_parcalar (
    grup_id VARCHAR(255) REFERENCES gruplar(grup_id),
    parca_kodu VARCHAR(255) REFERENCES parcalar(parca_kodu),
    PRIMARY KEY (grup_id, parca_kodu)
);
```

## Key Relationships

### Primary Foreign Key Relationships
```sql
-- Core Production Flow
is_emirleri.tezgah_id → tezgahlar.tezgah_id
is_emirleri.parca_kodu → parcalar.parca_kodu
is_emirleri.uretim_plani_id → uretim_plani.id

-- Inventory Integration
parcalar.stok_karti_id → stok_kartlari.id
uretim_plani.makina_id → makinalar.makina_id

-- Subcontracting System
fason_is_emirleri.fason_grup_id → fason_gruplar.fason_grup_id
fason_is_emirleri.parca_kodu → parcalar.parca_kodu
fason_teklifler.fason_is_emri_id → fason_is_emirleri.fason_is_emri_id

-- Process Tracking
islem_kayitlari.is_emri_no → is_emirleri.is_emri_no
islem_kayitlari.tezgah_id → tezgahlar.tezgah_id
is_emri_ozetleri.is_emri_id → is_emirleri.is_emri_id

-- Human Resources
personeller.vardiya_id → vardiyalar.id
vardiya_atamalari.personel_id → personeller.id
vardiya_atamalari.vardiya_id → vardiyalar.id

-- Documentation
notlar.kategori_id → not_kategorileri.id
parca_kayitlari.parca_kodu → parcalar.parca_kodu
siparis_dokumanlari.is_emri_id → is_emirleri.is_emri_id
```

## Database Performance Features

### Indexes
```sql
-- Performance indexes
CREATE INDEX idx_is_emirleri_durum ON is_emirleri(durum);
CREATE INDEX idx_is_emirleri_tezgah_id ON is_emirleri(tezgah_id);
CREATE INDEX idx_parcalar_kategori ON parcalar(kategori);
CREATE INDEX idx_stok_kartlari_malzeme_cinsi ON stok_kartlari(malzeme_cinsi);
CREATE INDEX idx_tezgah_durum_logs_timestamp ON tezgah_durum_logs(timestamp);
CREATE INDEX idx_vardiya_atamalari_tarih ON vardiya_atamalari(tarih);
```

### Constraints
```sql
-- Unique constraints
ALTER TABLE personeller ADD CONSTRAINT uk_personel_sicil_no UNIQUE(sicil_no);
ALTER TABLE fason_gruplar ADD CONSTRAINT uk_fason_grup_adi UNIQUE(grup_adi);
ALTER TABLE not_kategorileri ADD CONSTRAINT uk_kategori_adi UNIQUE(kategori_adi);

-- Check constraints
ALTER TABLE stok_kartlari ADD CONSTRAINT chk_stok_adet_positive CHECK(adet >= 0);
ALTER TABLE is_emirleri ADD CONSTRAINT chk_adet_positive CHECK(adet > 0);
```

## Business Rules Implementation

### Soft Deletes
- **parcalar**: Paranoid mode for audit trail
- **notlar**: Soft delete with `aktif` flag
- **stok_kartlari**: Soft delete with `aktif_mi` flag

### Timestamps
- Most tables include `createdAt`, `updatedAt`
- Some use Turkish naming: `olusturma_tarihi`, `guncelleme_tarihi`
- Automatic timestamp updates via Sequelize hooks

### JSON Fields Usage
- **is_emirleri.hareketler**: Movement history tracking
- **tezgahlar.is_emirleri**: Current work assignment
- **uretim_plani.bom_snapshot**: BOM preservation
- **boms.items**: Flexible BOM structure
- **vardiyalar.haftalik_calisma_gunleri**: Working days array

### Validation Rules
- Required fields enforced at model level
- Enum constraints for status fields
- Custom validation for business rules
- Email format validation where applicable
- Hex color code validation for UI elements

This comprehensive database schema supports all aspects of manufacturing operations while maintaining data integrity, audit trails, and performance optimization for the ÜRTM Takip system.