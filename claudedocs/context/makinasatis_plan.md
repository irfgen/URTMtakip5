# Makina Satış Modülü - Implementation Planı

**Tarih**: 2025-01-01
**Versiyon**: 2.0 (Basitleştirilmiş)
**Durum**: ✅ ONAYLI - Implementation'a Hazır
**Tahmini Süre**: 3 gün

---

## 📋 GENEL BAKIŞ

### Amaç
Makina satışlarında **tek tıkla** otomatik stok düşme sistemi.

### Basit İş Akışı
```
1. Makina Seç
2. Adet Yaz
3. "Satış Yap" Butonuna Bas
4. ✅ Otomatik: BOM'lar → Parçalar → Stok Düş
```

---

## 🎯 KULLANICI ARAYÜZÜ

```
┌─────────────────────────────────┐
│  Makina Satış                  │
├─────────────────────────────────┤
│                                 │
│  Makina: [Dropdown ▼]          │
│                                 │
│  Adet:    [      ]             │
│                                 │
│  [    SATIŞ YAP    ]           │
│                                 │
│  ────────────────────────────  │
│                                 │
│  Sonuç:                        │
│  ✅ 2 adet makina satıldı      │
│  ✅ 15 parçadan stok düşüldü   │
│  📊 Detaylı Rapor:             │
│     ┌─────────────────────┐    │
│     │ Parça Kodu | Adet   │    │
│     ├─────────────────────┤    │
│     │ P-001     | 10      │    │
│     │ P-002     | 6       │    │
│     │ ...       | ...     │    │
│     └─────────────────────┘    │
└─────────────────────────────────┘
```

---

## ⚙️ OTOMATİK MEKANİZMA

### Algoritma

```
INPUT:
  makina_id = "uuid-123"
  satis_adedi = 2

SİSTEM OTOMATİK:
  1. Makina'nın BOM'larını bul
     → BOM-001, BOM-002, BOM-003 (3 adet)

  2. Her BOM için parçaları bul
     BOM-001 → [PARCA-001: 5 adet, PARCA-002: 3 adet]
     BOM-002 → [PARCA-003: 10 adet]
     BOM-003 → [PARCA-004: 2 adet, PARCA-005: 1 adet]

  3. Her parça için toplam düşülecek miktarı hesapla
     PARCA-001: 5 × 2 = 10 adet
     PARCA-002: 3 × 2 = 6 adet
     PARCA-003: 10 × 2 = 20 adet
     PARCA-004: 2 × 2 = 4 adet
     PARCA-005: 1 × 2 = 2 adet

  4. Stok kontrolü
     Her parça için:
       IF mevcut_stok >= dusulecek_miktar
         THEN continue
         ELSE throw error (stok yetersiz)

  5. Transaction başlat
     Her parça için:
       UPDATE parcalar
       SET stok_adeti = stok_adeti - dusulecek_miktar
       WHERE parca_kodu = 'PARCA-XXX'

     INSERT INTO stok_hareketleri
       (parca_kodu, hareket_tipi, miktar, onceki_stok, sonraki_stok, aciklama)

  6. Satış kaydı oluştur
     INSERT INTO satislar
       (makina_id, satis_adedi, durum, created_at)

  7. Transaction commit

OUTPUT:
  ✅ Başarılı
  - 2 adet makina satıldı
  - 5 farklı parçadan toplam 42 adet stok düşüldü
  - Detaylı rapor göster
```

### Örnek Hesaplama

```
Örnek Senaryo:
  Makina: "Milano CNC-300"
  Adet: 2

Makinanın BOM'ları:
  ├─ BOM-001 (Gövde Grubu)
  │   ├─ PARCA-001: 5 adet/makina
  │   └─ PARCA-002: 3 adet/makina
  ├─ BOM-002 (Kapak Grubu)
  │   └─ PARCA-003: 2 adet/makina
  └─ BOM-003 (Kontrol Grubu)
      └─ PARCA-004: 10 adet/makina

Hesaplama:
  PARCA-001: 5 × 2 = 10 adet düşülecek
  PARCA-002: 3 × 2 = 6 adet düşülecek
  PARCA-003: 2 × 2 = 4 adet düşülecek
  PARCA-004: 10 × 2 = 20 adet düşülecek

Stok Kontrolü:
  PARCA-001: Mevcut 50 ≥ Gerekli 10 ✅
  PARCA-002: Mevcut 20 ≥ Gerekli 6 ✅
  PARCA-003: Mevcut 10 ≥ Gerekli 4 ✅
  PARCA-004: Mevcut 25 ≥ Gerekli 20 ✅
  → Tümü yeterli, devam et

Transaction:
  PARCA-001.stokAdeti = 50 - 10 = 40
  PARCA-002.stokAdeti = 20 - 6 = 14
  PARCA-003.stokAdeti = 10 - 4 = 6
  PARCA-004.stokAdeti = 25 - 20 = 5

Sonuç:
  4 farklı parçadan toplam 40 adet stok düşüldü
  Satış kaydı oluşturuldu
```

---

## 💾 VERİTABANI TASARIMI

### Tablo 1: satislar

```sql
CREATE TABLE satislar (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  makina_id UUID NOT NULL,
  makina_adi VARCHAR(255) NOT NULL,
  satis_adedi INTEGER NOT NULL DEFAULT 1,
  toplam_parca INTEGER NOT NULL DEFAULT 0,
  toplam_stok_dusulen INTEGER NOT NULL DEFAULT 0,
  durum VARCHAR(20) DEFAULT 'tamamlandi',
  aciklama TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (makina_id) REFERENCES makinalar(makina_id)
);

CREATE INDEX idx_satislar_makina_id ON satislar(makina_id);
CREATE INDEX idx_satislar_created_at ON satislar(created_at);
```

**Alan Açıklamaları**:
- `makina_id`: Satılan makina (UUID)
- `makina_adi`: Makina adı (redundant ama hızlı sorgu için)
- `satis_adedi`: Kaç adet makina satıldı
- `toplam_parca`: Kaç farklı parça stoktan düştü
- `toplam_stok_dusulen`: Toplam kaç adet parça düşüldü
- `durum`: 'tamamlandi' (basit)
- `aciklama`: Opsiyonel not

### Tablo 2: stok_hareketleri

```sql
CREATE TABLE IF NOT EXISTS stok_hareketleri (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  satis_id INTEGER NOT NULL,
  parca_kodu VARCHAR(50) NOT NULL,
  parca_adi VARCHAR(255) NOT NULL,
  bom_id INTEGER,
  bom_adi VARCHAR(255),
  birim_miktar INTEGER NOT NULL,
  satis_adedi INTEGER NOT NULL,
  dusulen_miktar INTEGER NOT NULL,
  onceki_stok INTEGER NOT NULL,
  sonraki_stok INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (satis_id) REFERENCES satislar(id) ON DELETE CASCADE,
  FOREIGN KEY (parca_kodu) REFERENCES parcalar(parca_kodu)
);

CREATE INDEX idx_stok_hareketleri_satis_id ON stok_hareketleri(satis_id);
CREATE INDEX idx_stok_hareketleri_parca_kodu ON stok_hareketleri(parca_kodu);
```

**Alan Açıklamaları**:
- `satis_id`: Hangi satıştan kaynaklandığı
- `parca_kodu`: Hangi parça
- `parca_adi`: Parça adı (redundant ama hız)
- `bom_id`: Hangi BOM'dan geldi
- `bom_adi`: BOM adı
- `birim_miktar`: BOM'de tanımlı miktar
- `satis_adedi`: Kaç makina satıldı
- `dusulen_miktar`: Toplam düşülen (birim_miktar × satis_adedi)
- `onceki_stok`: Stok düşmeden önce
- `sonraki_stok`: Stok düştükten sonra

---

## 🔌 BACKEND API

### Endpoint 1: POST /api/satislar/makina-sat

Makina satışı ve otomatik stok düşme.

**Request**:
```json
{
  "makina_id": "uuid-123",
  "satis_adedi": 2,
  "aciklama": "Opsiyonel not"
}
```

**Success Response (200)**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "satis_no": "SLS-20250101-001",
    "makina_adi": "Milano CNC-300",
    "satis_adedi": 2,
    "toplam_parca": 15,
    "toplam_stok_dusulen": 150,
    "durum": "tamamlandi",
    "created_at": "2025-01-01T10:30:00Z",
    "stok_hareketleri": [
      {
        "parca_kodu": "PARCA-001",
        "parca_adi": "Milano Gövde",
        "bom_adi": "Gövde Grubu",
        "birim_miktar": 5,
        "satis_adedi": 2,
        "dusulen_miktar": 10,
        "onceki_stok": 100,
        "sonraki_stok": 90
      }
    ]
  }
}
```

**Error Response (400 - Stok Yetersiz)**:
```json
{
  "success": false,
  "error": {
    "code": "STOK_YETERSIZ",
    "message": "Bazı parçaların stoğu yetersiz",
    "details": [
      {
        "parca_kodu": "PARCA-005",
        "parca_adi": "Milano Kapak",
        "gerekli": 4,
        "mevcut": 2,
        "eksik": 2
      }
    ]
  }
}
```

### Endpoint 2: GET /api/satislar

Satış listesi (paginate).

**Query Params**:
- `page`: Sayfa numarası (default: 1)
- `limit`: Sayfa başı kayıt (default: 20)
- `makina_id`: Filtre (opsiyonel)

**Response**:
```json
{
  "success": true,
  "data": {
    "satislar": [
      {
        "id": 1,
        "satis_no": "SLS-20250101-001",
        "makina_adi": "Milano CNC-300",
        "satis_adedi": 2,
        "toplam_stok_dusulen": 150,
        "created_at": "2025-01-01T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50
    }
  }
}
```

### Endpoint 3: GET /api/satislar/:id

Satış detayı.

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "satis_no": "SLS-20250101-001",
    "makina_adi": "Milano CNC-300",
    "satis_adedi": 2,
    "toplam_parca": 15,
    "toplam_stok_dusulen": 150,
    "aciklama": "Test satışı",
    "created_at": "2025-01-01T10:30:00Z",
    "stok_hareketleri": [...]
  }
}
```

---

## 🔧 BACKEND IMPLEMENTATION

### File: backend/src/models/Satis.js

```javascript
const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database').sequelize;

class Satis extends Model {
  static associate(models) {
    Satis.hasMany(models.StokHareket, {
      foreignKey: 'satis_id',
      as: 'hareketler'
    });
    Satis.belongsTo(models.Makina, {
      foreignKey: 'makina_id',
      targetKey: 'makina_id',
      as: 'makina'
    });
  }
}

Satis.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  makina_id: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'makina_id'
  },
  makina_adi: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'makina_adi'
  },
  satis_adedi: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    field: 'satis_adedi'
  },
  toplam_parca: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    field: 'toplam_parca'
  },
  toplam_stok_dusulen: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    field: 'toplam_stok_dusulen'
  },
  durum: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'tamamlandi',
    field: 'durum'
  },
  aciklama: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'aciklama'
  }
}, {
  sequelize,
  modelName: 'Satis',
  tableName: 'satislar',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  underscored: true
});

module.exports = Satis;
```

### File: backend/src/models/StokHareket.js

```javascript
const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database').sequelize;

class StokHareket extends Model {
  static associate(models) {
    StokHareket.belongsTo(models.Satis, {
      foreignKey: 'satis_id',
      as: 'satis'
    });
    StokHareket.belongsTo(models.Parca, {
      foreignKey: 'parca_kodu',
      targetKey: 'parcaKodu',
      as: 'parca'
    });
  }
}

StokHareket.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  satis_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'satis_id'
  },
  parca_kodu: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'parca_kodu'
  },
  parca_adi: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'parca_adi'
  },
  bom_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'bom_id'
  },
  bom_adi: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'bom_adi'
  },
  birim_miktar: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'birim_miktar'
  },
  satis_adedi: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'satis_adedi'
  },
  dusulen_miktar: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'dusulen_miktar'
  },
  onceki_stok: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'onceki_stok'
  },
  sonraki_stok: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'sonraki_stok'
  }
}, {
  sequelize,
  modelName: 'StokHareket',
  tableName: 'stok_hareketleri',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  underscored: true
});

module.exports = StokHareket;
```

### File: backend/src/controllers/satisController.js

```javascript
const { Satis, StokHareket, Makina, Bom, Parca } = require('../models');
const { sequelize } = require('../config/database');
const { Op } = require('sequelize');

/**
 * POST /api/satislar/makina-sat
 * Makina satışı ve otomatik stok düşme
 */
async function makinaSat(req, res) {
  const { makina_id, satis_adedi = 1, aciklama } = req.body;

  // Validasyon
  if (!makina_id) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Makina ID zorunlu' }
    });
  }

  if (satis_adedi < 1) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Satış adedi en az 1 olmalı' }
    });
  }

  const transaction = await sequelize.transaction();

  try {
    // 1. Makina ve BOM'larını getir
    const makina = await Makina.findByPk(makina_id, {
      include: [{
        model: Bom,
        as: 'boms',
        attributes: ['id', 'bom_kodu', 'name'],
        through: { attributes: [] },
        include: [{
          model: require('./BomParca'),
          attributes: ['id', 'bomId', 'parcaKodu', 'miktar'],
          include: [{
            model: Parca,
            attributes: ['parcaKodu', 'parcaAdi', 'stokAdeti']
          }]
        }]
      }],
      transaction
    });

    if (!makina) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        error: { code: 'MAKINA_BULUNAMADI', message: 'Makina bulunamadı' }
      });
    }

    // 2. Tüm parçaları topla ve stok kontrolü yap
    const parcaListesi = [];
    const yetersizParcalar = [];

    for (const bom of makina.boms) {
      if (!bom.BomParcas) continue;

      for (const bomParca of bom.BomParcas) {
        const parca = bomParca.Parca;
        if (!parca) continue;

        const dusulecekMiktar = bomParca.miktar * satis_adedi;

        // Stok kontrolü
        if (parca.stokAdeti < dusulecekMiktar) {
          yetersizParcalar.push({
            parca_kodu: parca.parcaKodu,
            parca_adi: parca.parcaAdi,
            gerekli: dusulecekMiktar,
            mevcut: parca.stokAdeti,
            eksik: dusulecekMiktar - parca.stokAdeti
          });
        }

        parcaListesi.push({
          parca: parca,
          bom: bom,
          bomParca: bomParca,
          dusulecek_miktar: dusulecekMiktar
        });
      }
    }

    // Stok yetersizse hata döndür
    if (yetersizParcalar.length > 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        error: {
          code: 'STOK_YETERSIZ',
          message: 'Bazı parçaların stoğu yetersiz',
          details: yetersizParcalar
        }
      });
    }

    // 3. Stok düş ve hareket kaydet
    const stokHareketleriData = [];
    let toplamStokDusulen = 0;

    for (const item of parcaListesi) {
      const { parca, bom, bomParca, dusulecek_miktar } = item;
      const oncekiStok = parca.stokAdeti;
      const sonrakiStok = oncekiStok - dusulecek_miktar;

      // Stok düş
      await parca.update({ stokAdeti: sonrakiStok }, { transaction });

      // Hareket kaydet
      const hareket = await StokHareket.create({
        parca_kodu: parca.parcaKodu,
        parca_adi: parca.parcaAdi,
        bom_id: bom.id,
        bom_adi: bom.name,
        birim_miktar: bomParca.miktar,
        satis_adedi: satis_adedi,
        dusulen_miktar: dusulecek_miktar,
        onceki_stok: oncekiStok,
        sonraki_stok: sonrakiStok
      }, { transaction });

      stokHareketleriData.push({
        parca_kodu: parca.parcaKodu,
        parca_adi: parca.parcaAdi,
        bom_adi: bom.name,
        birim_miktar: bomParca.miktar,
        satis_adedi: satis_adedi,
        dusulen_miktar: dusulecek_miktar,
        onceki_stok: oncekiStok,
        sonraki_stok: sonrakiStok
      });

      toplamStokDusulen += dusulecek_miktar;
    }

    // 4. Satış kaydı oluştur
    const satis = await Satis.create({
      makina_id: makina.makina_id,
      makina_adi: makina.name,
      satis_adedi: satis_adedi,
      toplam_parca: parcaListesi.length,
      toplam_stok_dusulen: toplamStokDusulen,
      durum: 'tamamlandi',
      aciklama: aciklama || null
    }, { transaction });

    // 5. Hareketleri satışa bağla
    await StokHareket.update(
      { satis_id: satis.id },
      { where: { id: { [Op.in]: stokHareketleriData.map(h => h.id) } } },
      { transaction }
    );

    await transaction.commit();

    // 6. Başarılı response
    res.json({
      success: true,
      data: {
        id: satis.id,
        satis_no: `SLS-${new Date().toISOString().slice(0,10).replace(/-/g, '')}-${String(satis.id).padStart(3, '0')}`,
        makina_adi: makina.name,
        satis_adedi: satis_adedi,
        toplam_parca: parcaListesi.length,
        toplam_stok_dusulen: toplamStokDusulen,
        durum: 'tamamlandi',
        created_at: satis.created_at,
        stok_hareketleri: stokHareketleriData
      }
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Satış hatası:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'Satis_HATASI',
        message: error.message
      }
    });
  }
}

/**
 * GET /api/satislar
 * Satış listesi
 */
async function getSatislar(req, res) {
  try {
    const { page = 1, limit = 20, makina_id } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (makina_id) {
      where.makina_id = makina_id;
    }

    const { count, rows } = await Satis.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        satislar: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Satış listesi hatası:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
}

/**
 * GET /api/satislar/:id
 * Satış detayı
 */
async function getSatisById(req, res) {
  try {
    const { id } = req.params;

    const satis = await Satis.findByPk(id, {
      include: [{
        model: StokHareket,
        as: 'hareketler'
      }]
    });

    if (!satis) {
      return res.status(404).json({
        success: false,
        error: { code: 'SATIS_BULUNAMADI', message: 'Satış bulunamadı' }
      });
    }

    res.json({
      success: true,
      data: satis
    });
  } catch (error) {
    console.error('Satış detay hatası:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
}

module.exports = {
  makinaSat,
  getSatislar,
  getSatisById
};
```

### File: backend/src/routes/satisRoutes.js

```javascript
const router = require('express').Router();
const { makinaSat, getSatislar, getSatisById } = require('../controllers/satisController');

// POST /api/satislar/makina-sat - Makina sat
router.post('/makina-sat', makinaSat);

// GET /api/satislar - Satış listesi
router.get('/', getSatislar);

// GET /api/satislar/:id - Satış detayı
router.get('/:id', getSatisById);

module.exports = router;
```

---

## 🎨 FRONTEND IMPLEMENTATION

### File: frontend/src/components/satislar/SatisFormSimple.jsx

```jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress
} from '@mui/material';
import { CheckCircle, Error as ErrorIcon } from '@mui/icons-material';
import axios from 'axios';

export default function SatisFormSimple() {
  const [makinalar, setMakinalar] = useState([]);
  const [makinaId, setMakinaId] = useState('');
  const [satisAdedi, setSatisAdedi] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMakinalar, setLoadingMakinalar] = useState(true);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Makinaları yükle
  useEffect(() => {
    const fetchMakinalar = async () => {
      try {
        const response = await axios.get('/api/makinalar');
        setMakinalar(response.data.data || response.data);
      } catch (err) {
        console.error('Makinalar yüklenemedi:', err);
      } finally {
        setLoadingMakinalar(false);
      }
    };

    fetchMakinalar();
  }, []);

  const handleSubmit = async () => {
    if (!makinaId) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await axios.post('/api/satislar/makina-sat', {
        makina_id: makinaId,
        satis_adedi: satisAdedi
      });

      setResult(response.data.data);

      // Formu sıfırla
      setMakinaId('');
      setSatisAdedi(1);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loadingMakinalar) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Makina Satış
        </Typography>

        {/* Makina Seçimi */}
        <TextField
          select
          fullWidth
          label="Makina"
          value={makinaId}
          onChange={(e) => setMakinaId(e.target.value)}
          sx={{ mb: 2 }}
          SelectProps={{ native: true }}
          disabled={loading}
        >
          <option value="">Seçiniz...</option>
          {makinalar.map((m) => (
            <option key={m.makina_id} value={m.makina_id}>
              {m.name}
            </option>
          ))}
        </TextField>

        {/* Adet Input */}
        <TextField
          fullWidth
          type="number"
          label="Adet"
          value={satisAdedi}
          onChange={(e) => setSatisAdedi(parseInt(e.target.value) || 1)}
          inputProps={{ min: 1 }}
          sx={{ mb: 2 }}
          disabled={loading}
        />

        {/* Satış Butonu */}
        <Button
          fullWidth
          variant="contained"
          size="large"
          onClick={handleSubmit}
          disabled={!makinaId || loading}
          sx={{ mb: 2 }}
        >
          {loading ? <CircularProgress size={24} /> : 'Satış Yap'}
        </Button>

        {/* Hata Mesajı */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <ErrorIcon fontSize="small" /> {error.message}
            {error.details && (
              <TableContainer sx={{ mt: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Parça</TableCell>
                      <TableCell>Gerekli</TableCell>
                      <TableCell>Mevcut</TableCell>
                      <TableCell>Eksik</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {error.details.map((d, i) => (
                      <TableRow key={i}>
                        <TableCell>{d.parca_adi}</TableCell>
                        <TableCell>{d.gerekli}</TableCell>
                        <TableCell>{d.mevcut}</TableCell>
                        <TableCell>{d.eksik}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Alert>
        )}

        {/* Başarılı Sonuç */}
        {result && (
          <Alert severity="success">
            <CheckCircle fontSize="small" />
            <Typography variant="body1" sx={{ mt: 1, fontWeight: 'bold' }}>
              {result.satis_adedi} adet {result.makina_adi} satıldı!
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              {result.toplam_parca} parçadan toplam {result.toplam_stok_dusulen} adet stok düşüldü
            </Typography>

            {/* Detaylı Rapor */}
            {result.stok_hareketleri && (
              <TableContainer sx={{ mt: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Stok Hareketleri:
                </Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Parça Kodu</TableCell>
                      <TableCell>Parça Adı</TableCell>
                      <TableCell>BOM</TableCell>
                      <TableCell align="right">Birim</TableCell>
                      <TableCell align="right">Satış</TableCell>
                      <TableCell align="right">Düşülen</TableCell>
                      <TableCell align="right">Önceki</TableCell>
                      <TableCell align="right">Sonraki</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {result.stok_hareketleri.map((h, i) => (
                      <TableRow key={i}>
                        <TableCell>{h.parca_kodu}</TableCell>
                        <TableCell>{h.parca_adi}</TableCell>
                        <TableCell>{h.bom_adi}</TableCell>
                        <TableCell align="right">{h.birim_miktar}</TableCell>
                        <TableCell align="right">{h.satis_adedi}</TableCell>
                        <TableCell align="right"><strong>{h.dusulen_miktar}</strong></TableCell>
                        <TableCell align="right">{h.onceki_stok}</TableCell>
                        <TableCell align="right"><strong>{h.sonraki_stok}</strong></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Alert>
        )}
      </Paper>
    </Box>
  );
}
```

---

## 📋 IMPLEMENTATION PHASES

### Phase 1: Database & Models (0.5 gün)

**Task List**:
- [ ] Migration dosyası oluştur
  - `backend/src/migrations/20250101-create-satislar-table.js`
  - `backend/src/migrations/20250101-create-stok-hareketleri-table.js`
- [ ] Sequelize modelleri oluştur
  - `backend/src/models/Satis.js`
  - `backend/src/models/StokHareket.js`
- [ ] Model relations tanımla
- [ ] Migration çalıştır
- [ ] Tabloları kontrol et

**Çıkış**: Veritabanı tabloları hazır

### Phase 2: Backend (1 gün)

**Task List**:
- [ ] Controller oluştur
  - `backend/src/controllers/satisController.js`
  - `makinaSat()` fonksiyonu
  - `getSatislar()` fonksiyonu
  - `getSatisById()` fonksiyonu
- [ ] Route oluştur
  - `backend/src/routes/satisRoutes.js`
- [ ] Ana route'a ekle
  - `backend/src/index.js` içinde satış routes'u kaydet
- [ ] API testleri (Postman/manuel)

**Çıkış**: Backend API çalışır

### Phase 3: Frontend (1 gün)

**Task List**:
- [ ] Komponent oluştur
  - `frontend/src/components/satislar/SatisFormSimple.jsx`
- [ ] Route ekle
  - `frontend/src/App.jsx` içinde `/satislar/yeni` route'u ekle
- [ ] Menüye ekle
  - Sol menüye "Makina Satış" linki ekle
- [ ] Manual test

**Çıkış**: Frontend çalışır

### Phase 4: Integration & Test (0.5 gün)

**Task List**:
- [ ] End-to-end test
  - Makina seç
  - Adet gir
  - Satış yap
  - Sonucu kontrol et
- [ ] Stok verification
  - Parça stokları düştü mü?
  - Stok hareketleri kaydedildi mi?
- [ ] Hata senaryoları test et
  - Stok yetersiz
  - Geçersiz makina_id
- [ ] Bug fix

**Çıkış**: Tam entegre sistem

---

## 🧪 TEST SENARYOLARI

### Senaryo 1: Başarılı Satış

```
Input:
  makina_id = "uuid-makina-1"
  satis_adedi = 2

Makina BOM'ları:
  BOM-001 → [PARCA-001: 5 adet, PARCA-002: 3 adet]

Mevcut Stok:
  PARCA-001: 50 adet
  PARCA-002: 30 adet

Beklenen:
  PARCA-001: 50 - (5 × 2) = 40
  PARCA-002: 30 - (3 × 2) = 24
  Satis kaydı oluşturulur
  2 adet StokHareket oluşturulur
  Response: success: true
```

### Senaryo 2: Stok Yetersiz

```
Input:
  makina_id = "uuid-makina-1"
  satis_adedi = 10

Makina BOM'ları:
  BOM-001 → [PARCA-001: 5 adet]

Mevcut Stok:
  PARCA-001: 20 adet

Gerekli:
  PARCA-001: 5 × 10 = 50 adet

Beklenen:
  ❌ STOK_YETERSIZ hatası
  Detay: { gerekli: 50, mevcut: 20, eksik: 30 }
  Hiçbir stok düşülmez
  Response: success: false
```

### Senaryo 3: Çoklu BOM

```
Input:
  makina_id = "uuid-makina-2"
  satis_adedi = 1

Makina BOM'ları:
  BOM-001 → [PARCA-001: 2 adet, PARCA-002: 1 adet]
  BOM-002 → [PARCA-003: 5 adet]
  BOM-003 → [PARCA-004: 1 adet, PARCA-005: 3 adet]

Beklenen:
  6 farklı parçadan stok düşer
  3 BOM için hareket kaydedilir
  toplam_parca = 6
  toplam_stok_dusulen = 12
```

---

## ✅ KABUL KRİTERLERİ

- [x] Kullanıcı makina seçebilir (dropdown)
- [x] Kullanıcı adet girebilir (min: 1)
- [x] "Satış Yap" butonu çalışır
- [x] Sistem otomatik BOM'ları bulur
- [x] Sistem otomatik parçaları bulur
- [x] Sistem stok kontrolü yapar
- [x] Stok yetersizse hata verir (detay ile)
- [x] Stok yeterliyse stok düşer
- [x] Her parça için hareket kaydeder
- [x] Satış kaydı oluşturur
- [x] Kullanıcıya sonuç gösterir
- [x] İşlem < 5 saniye sürer
- [x] Hata mesajları kullanıcı dostudur
- [x] Başarılı mesajı detaylı rapor içerir

---

## 📁 DOSYA YAPISI

```
backend/src/
├── migrations/
│   └── 20250101-create-satislar-tables.js
├── models/
│   ├── Satis.js
│   └── StokHareket.js
├── controllers/
│   └── satisController.js
├── routes/
│   └── satisRoutes.js
└── index.js (güncellenecek)

frontend/src/
├── components/
│   └── satislar/
│       └── SatisFormSimple.jsx
├── App.jsx (güncellenecek)
└── main.jsx
```

---

## 🚀 SONRAKİ ADIMLAR

### Immediate (Şimdi Başla)
1. ✅ Phase 1: Migration + Models
2. ✅ Phase 2: Backend API
3. ✅ Phase 3: Frontend UI
4. ✅ Phase 4: Integration & Test

### Future Enhancements (Phase 2+)
1. Müşteri bilgileri
2. Fiyatlandırma
3. İptal mekanizması
4. Raporlama (Excel export)
5. Satış geçmişi listesi
6. Filtreleme ve arama

---

## 📝 NOTLAR

**Önemli Noktalar**:
- Transaction kullanımı ZORUNLU (stok tutarlılığı için)
- Stok kontrolü işlem ÖNCESİ yapılmalı
- Hata durumunda ROLLBACK yapılmalı
- Her işlem loglanmalı
- UI basit ve anlaşılır olmalı

**Güvenlik**:
- SQL injection koruması (Sequelize otomatik)
- XSS koruması (React otomatik)
- Input validasyonu zorunlu
- Transaction güvenliği kritik

**Performans**:
- Makina başına ortalama 10-15 BOM
- Her BOM'da ortalama 5-10 parça
- Toplam 50-150 parça stok düşmesi
- İşlem < 5 saniye olmalı

---

**Durum**: ✅ READY FOR IMPLEMENTATION
**Tahmini Süre**: 3 gün
**Karmaşıklık**: Düşük (Basit mekanizma)

---

*Basitlik güçtür!*
