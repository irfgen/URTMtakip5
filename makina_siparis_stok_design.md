# Makina Sipariş ve Stok Sistemi - Tasarım Dokümanı

**Proje**: ÜRTM Takip
**Modül**: Makinalar - Sipariş ve Stok Yönetimi
**Versiyon**: 1.0.0
**Tarih**: 2026-01-04
**Durum**: Tasarım Aşaması

---

## 📋 İçindekiler

1. [Sistem Genel Bakış](#sistem-genel-bakış)
2. [Veritabanı Tasarımı](#veritabanı-tasarımı)
3. [Backend API Tasarımı](#backend-api-tasarımı)
4. [Frontend Bileşen Tasarımı](#frontend-bileşen-tasarımı)
5. [İş Mantığı ve Entegrasyon](#iş-mantığı-ve-entegrasyon)
6. [Güvenlik ve Performans](#güvenlik-ve-performans)
7. [Test Stratejisi](#test-stratejisi)

---

## 🎯 Sistem Genel Bakış

### Mevcut Sistem Bağlamı

**Var Olan Tablolar:**
- `makinalar` - Makina ürün tanımları (UUID PK, name, items JSON)
- `makina_siniflari` - Makina kategorileri (INTEGER PK, ad)
- `satislar` - Satış kayıtları (mevcut makina satış özelliği)

**Mevcut API Endpoints:**
- `/api/makinalar` - CRUD operasyonları
- `/api/search/parts` - Parça arama
- `/api/search/boms` - BOM arama
- `/api/makina-siniflari` - Sınıf listesi

**Frontend Yapısı:**
- `/makinalar` - Ana rota
- `MakinaListesi` - Listeleme bileşeni
- `MakinaForm` - Form bileşeni

### Yeni Özellik Entegrasyonu

**2 Yeni Tablo:**
1. `makina_siparisleri` - Müşteri siparişleri
2. `makina_stok` - Stok yönetimi

**Yeni API Endpoints:**
- `/api/makina-siparisleri` - Sipariş yönetimi
- `/api/makina-stok` - Stok yönetimi

**UI Değişiklikleri:**
- Makinalar ana sayfasına 2 buton eklenecek
- Modal tabanlı listeleme ve ekleme

---

## 📊 Veritabanı Tasarımı

### Tablo: `makina_siparisleri`

#### Schema Tanımı

```sql
CREATE TABLE makina_siparisleri (
  siparis_id STRING(36) PRIMARY KEY,
  siparis_no STRING(50) UNIQUE NOT NULL,
  makina_id STRING(36) NOT NULL,
  musteri_adi STRING(255) NOT NULL,
  musteri_telefon STRING(20),
  musteri_email STRING(255),
  adet INTEGER NOT NULL DEFAULT 1,
  durum STRING(50) NOT NULL DEFAULT 'Beklemede',
  siparis_tarihi DATE NOT NULL,
  teslim_tarihi DATE,
  tamamlanma_tarihi DATE,
  notlar TEXT,
  created_at DATE NOT NULL,
  updated_at DATE NOT NULL,

  FOREIGN KEY (makina_id) REFERENCES makinalar(makina_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
);

-- Indexler
CREATE INDEX idx_makina_siparisleri_makina_id ON makina_siparisleri(makina_id);
CREATE INDEX idx_makina_siparisleri_durum ON makina_siparisleri(durum);
CREATE INDEX idx_makina_siparisleri_tarih ON makina_siparisleri(siparis_tarihi);
CREATE INDEX idx_makina_siparisleri_no ON makina_siparisleri(siparis_no);
```

#### Alan Açıklamaları

| Alan | Tip | Zorunlu | Varsayılan | Açıklama |
|------|-----|---------|------------|----------|
| `siparis_id` | UUID | ✅ | auto | Benzersiz sipariş kimliği |
| `siparis_no` | STRING(50) | ✅ | - | Sipariş numarası (örn: SIP-2026-0001) |
| `makina_id` | UUID | ✅ | - | İlgili makina FK |
| `musteri_adi` | STRING(255) | ✅ | - | Müşteri tam adı |
| `musteri_telefon` | STRING(20) | ❌ | NULL | İletişim telefonu |
| `musteri_email` | STRING(255) | ❌ | NULL | İletişim e-posta |
| `adet` | INTEGER | ✅ | 1 | Sipariş adedi |
| `durum` | ENUM | ✅ | Beklemede | Sipariş durumu |
| `siparis_tarihi` | DATE | ✅ | bugün | Sipariş alma tarihi |
| `teslim_tarihi` | DATE | ❌ | NULL | Planlanan teslim tarihi |
| `tamamlanma_tarihi` | DATE | ❌ | NULL | Gerçekleşen teslim tarihi |
| `notlar` | TEXT | ❌ | NULL | Sipariş notları |
| `created_at` | DATE | ✅ | NOW | Kayıt tarihi |
| `updated_at` | DATE | ✅ | NOW | Güncelleme tarihi |

#### Durum ENUM Değerleri
```javascript
['Beklemede', 'Gövde Montaj', 'Boyada', 'Son montajda', 'Üretimde', 'Tamamlandı', 'İptal']
```

#### İş Kuralları (Business Rules)
1. **Sipariş No Formatı**: `SIP-[YYYY]-[Sequence]` (örn: SIP-2026-0001)
2. **Adet Validasyonu**: `adet > 0`
3. **Durum Geçişleri**: Serbest (sıralı akış zorunlu değil)
4. **Tamamlandı Durumu**: Otomatik stok girişi tetikler
5. **Makina Silinmesi**: İlgili sipariş varsa silinemez (RESTRICT)

---

### Tablo: `makina_stok`

#### Schema Tanımı

```sql
CREATE TABLE makina_stok (
  stok_id STRING(36) PRIMARY KEY,
  makina_id STRING(36) NOT NULL,
  adet INTEGER NOT NULL DEFAULT 0,
  depo_id INTEGER,
  giris_kaynagi STRING(50),
  giris_tarihi DATE NOT NULL,
  siparis_id STRING(36),
  seri_nolari TEXT,
  notlar TEXT,
  created_at DATE NOT NULL,
  updated_at DATE NOT NULL,

  FOREIGN KEY (makina_id) REFERENCES makinalar(makina_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,

  FOREIGN KEY (siparis_id) REFERENCES makina_siparisleri(siparis_id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
);

-- Indexler
CREATE INDEX idx_makina_stok_makina_id ON makina_stok(makina_id);
CREATE INDEX idx_makina_stok_depo_id ON makina_stok(depo_id);
CREATE INDEX idx_makina_stok_giris_tarihi ON makina_stok(giris_tarihi);
CREATE INDEX idx_makina_stok_siparis_id ON makina_stok(siparis_id);
```

#### Alan Açıklamaları

| Alan | Tip | Zorunlu | Varsayılan | Açıklama |
|------|-----|---------|------------|----------|
| `stok_id` | UUID | ✅ | auto | Benzersiz stok kimliği |
| `makina_id` | UUID | ✅ | - | İlgili makina FK |
| `adet` | INTEGER | ✅ | 0 | Stok adedi |
| `depo_id` | INTEGER | ❌ | NULL | Depo ID (opsiyonel) |
| `giris_kaynagi` | ENUM | ❌ | NULL | Giriş kaynağı |
| `giris_tarihi` | DATE | ✅ | bugün | Stok giriş tarihi |
| `siparis_id` | UUID | ❌ | NULL | İlgili sipariş (üretimden geldiyse) |
| `seri_nolari` | TEXT (JSON) | ❌ | NULL | Seri numaraları listesi |
| `notlar` | TEXT | ❌ | NULL | Stok notları |
| `created_at` | DATE | ✅ | NOW | Kayıt tarihi |
| `updated_at` | DATE | ✅ | NOW | Güncelleme tarihi |

#### Giriş Kaynağı ENUM Değerleri
```javascript
['Satın Alma', 'Üretim', 'Montaj']
```

#### Depo ID Kodları
```javascript
{
  1: 'Ana Depo',
  2: 'Alaaddin Bey Depo'
}
```

#### Seri Numaraları JSON Formatı
```json
[
  "SN-2026-001",
  "SN-2026-002",
  "SN-2026-003"
]
```

#### İş Kuralları (Business Rules)
1. **Adet Validasyonu**: `adet >= 0`
2. **Depo Opsiyonel**: `depo_id` null olabilir
3. **Seri Numaraları**: Her adet için bir seri no önerilir
4. **Sipariş İlişkisi**: Üretimden gelen stoklar sipariş ile ilişkili olmalı
5. **Makina Silinmesi**: İlgili stok varsa silinemez (RESTRICT)

---

### Entity Relationship Diagram (ERD)

```
┌─────────────────┐
│   makinalar     │
│─────────────────│
│ makina_id (PK)  │
│ name            │
│ items (JSON)    │
│ ...             │
└────────┬────────┘
         │
         ├──┬──────────────────────────────────┐
         │                                  │
         ▼                                  ▼
┌─────────────────────┐          ┌──────────────────┐
│ makina_siparisleri  │          │   makina_stok    │
│─────────────────────│          │──────────────────│
│ siparis_id (PK)     │          │ stok_id (PK)     │
│ siparis_no (UQ)     │          │ makina_id (FK)   │
│ makina_id (FK)      │          │ adet             │
│ musteri_adi         │    ┌─────│ depo_id          │
│ durum               │    │    │ giris_kaynagi    │
│ ...                 │    │    │ siparis_id (FK)◄─┘
└─────────────────────┘    │    │ giris_tarihi     │
                           │    │ ...              │
                           │    └──────────────────┘
                           │
                           └──→ Optional relation
                              (stok siparişten gelebilir)
```

---

### Migration Dosyası

**Dosya**: `backend/src/migrations/20260104000001-create-makina-siparis-stok.js`

```javascript
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. makina_siparisleri tablosunu oluştur
    await queryInterface.createTable('makina_siparisleri', {
      siparis_id: {
        type: Sequelize.STRING(36),
        primaryKey: true,
        allowNull: false
      },
      siparis_no: {
        type: Sequelize.STRING(50),
        unique: true,
        allowNull: false,
        comment: 'Sipariş numarası (örn: SIP-2026-0001)'
      },
      makina_id: {
        type: Sequelize.STRING(36),
        allowNull: false,
        comment: 'Makina UUID',
        references: {
          model: 'makinalar',
          key: 'makina_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      musteri_adi: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Müşteri tam adı'
      },
      musteri_telefon: {
        type: Sequelize.STRING(20),
        allowNull: true,
        comment: 'İletişim telefonu'
      },
      musteri_email: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'İletişim e-posta'
      },
      adet: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
        comment: 'Sipariş adedi'
      },
      durum: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'Beklemede',
        comment: 'Sipariş durumu: Beklemede, Gövde Montaj, Boyada, Son montajda, Üretimde, Tamamlandı, İptal'
      },
      siparis_tarihi: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        comment: 'Sipariş alma tarihi'
      },
      teslim_tarihi: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Planlanan teslim tarihi'
      },
      tamamlanma_tarihi: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Gerçekleşen teslim tarihi'
      },
      notlar: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Sipariş notları'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // makina_siparisleri indexleri
    await queryInterface.addIndex('makina_siparisleri', ['makina_id']);
    await queryInterface.addIndex('makina_siparisleri', ['durum']);
    await queryInterface.addIndex('makina_siparisleri', ['siparis_tarihi']);
    await queryInterface.addIndex('makina_siparisleri', ['siparis_no'], {
      unique: true
    });

    // 2. makina_stok tablosunu oluştur
    await queryInterface.createTable('makina_stok', {
      stok_id: {
        type: Sequelize.STRING(36),
        primaryKey: true,
        allowNull: false
      },
      makina_id: {
        type: Sequelize.STRING(36),
        allowNull: false,
        comment: 'Makina UUID',
        references: {
          model: 'makinalar',
          key: 'makina_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      adet: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Stok adedi'
      },
      depo_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Depo ID (opsiyonel): 1=Ana Depo, 2=Alaaddin Bey Depo'
      },
      giris_kaynagi: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: 'Giriş kaynağı: Satın Alma, Üretim, Montaj'
      },
      giris_tarihi: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        comment: 'Stok giriş tarihi'
      },
      siparis_id: {
        type: Sequelize.STRING(36),
        allowNull: true,
        comment: 'İlgili sipariş ID (eğer üretimden geldiyse)',
        references: {
          model: 'makina_siparisleri',
          key: 'siparis_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      seri_nolari: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Seri numaraları JSON formatında'
      },
      notlar: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Stok notları'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // makina_stok indexleri
    await queryInterface.addIndex('makina_stok', ['makina_id']);
    await queryInterface.addIndex('makina_stok', ['depo_id']);
    await queryInterface.addIndex('makina_stok', ['giris_tarihi']);
    await queryInterface.addIndex('makina_stok', ['siparis_id']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('makina_stok');
    await queryInterface.dropTable('makina_siparisleri');
  }
};
```

---

## 🔌 Backend API Tasarımı

### API Endpoint Yapısı

#### 1. Makina Siparişleri API

**Base Path**: `/api/makina-siparisleri`

| Method | Endpoint | Açıklama | Request | Response |
|--------|----------|----------|---------|----------|
| GET | `/api/makina-siparisleri` | Tüm siparişleri listeler | Query params | Array<Siparis> |
| GET | `/api/makina-siparisleri/:id` | Sipariş detayı | - | Object<Siparis> |
| POST | `/api/makina-siparisleri` | Yeni sipariş oluştur | Body<SiparisCreateDTO> | Object<Siparis> |
| PUT | `/api/makina-siparisleri/:id` | Siparişi güncelle | Body<SiparisUpdateDTO> | Object<Siparis> |
| DELETE | `/api/makina-siparisleri/:id` | Siparişi sil | - | Success message |
| PATCH | `/api/makina-siparisleri/:id/durum` | Durum değiştir | Body<{durum}> | Object<Siparis> |

#### 2. Makina Stok API

**Base Path**: `/api/makina-stok`

| Method | Endpoint | Açıklama | Request | Response |
|--------|----------|----------|---------|----------|
| GET | `/api/makina-stok` | Tüm stokları listeler | Query params | Array<Stok> |
| GET | `/api/makina-stok/:id` | Stok detayı | - | Object<Stok> |
| POST | `/api/makina-stok` | Stok girişi ekle | Body<StokCreateDTO> | Object<Stok> |
| PUT | `/api/makina-stok/:id` | Stok güncelle | Body<StokUpdateDTO> | Object<Stok> |
| DELETE | `/api/makina-stok/:id` | Stok sil | - | Success message |
| POST | `/api/makina-stok/stoktan-dus` | Stoktan düş | Body<StokCikisDTO> | Success message |

---

### Controller Tasarımı

#### `MakinaSiparisController.js`

**Dosya**: `backend/src/controllers/makinaSiparisController.js`

```javascript
const { v4: uuidv4 } = require('uuid');
const MakinaSiparis = require('../models/MakinaSiparis');
const MakinaStok = require('../models/MakinaStok');
const Makina = require('../models/Makina');

/**
 * Tüm siparişleri listeler
 * @route GET /api/makina-siparisleri
 * @query {string} durum - Durum filtresi (opsiyonel)
 * @query {string} makina_id - Makina filtresi (opsiyonel)
 * @query {number} limit - Kayıt limiti (varsayılan: 50)
 * @query {number} offset - Kayıt offseti (varsayılan: 0)
 */
exports.listSiparisler = async (req, res) => {
  try {
    const { durum, makina_id, limit = 50, offset = 0 } = req.query;
    const where = {};

    if (durum) where.durum = durum;
    if (makina_id) where.makina_id = makina_id;

    const siparisler = await MakinaSiparis.findAll({
      where,
      include: [{
        model: Makina,
        as: 'makina',
        attributes: ['makina_id', 'name', 'model']
      }],
      order: [['siparis_tarihi', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.status(200).json({
      success: true,
      data: siparisler,
      count: siparisler.length
    });
  } catch (error) {
    console.error('Siparişler listelenirken hata:', error);
    res.status(500).json({
      success: false,
      message: 'Siparişler listelenirken bir hata oluştu',
      error: error.message
    });
  }
};

/**
 * Sipariş detayını getirir
 * @route GET /api/makina-siparisleri/:id
 */
exports.getSiparisDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const siparis = await MakinaSiparis.findByPk(id, {
      include: [{
        model: Makina,
        as: 'makina',
        attributes: ['makina_id', 'name', 'model', 'items']
      }]
    });

    if (!siparis) {
      return res.status(404).json({
        success: false,
        message: 'Sipariş bulunamadı'
      });
    }

    res.status(200).json({
      success: true,
      data: siparis
    });
  } catch (error) {
    console.error('Sipariş detayı alınırken hata:', error);
    res.status(500).json({
      success: false,
      message: 'Sipariş detayı alınırken bir hata oluştu',
      error: error.message
    });
  }
};

/**
 * Yeni sipariş oluşturur
 * @route POST /api/makina-siparisleri
 * @body {string} makina_id - Makina UUID (zorunlu)
 * @body {string} musteri_adi - Müşteri adı (zorunlu)
 * @body {string} musteri_telefon - Müşteri telefonu (opsiyonel)
 * @body {string} musteri_email - Müşteri e-posta (opsiyonel)
 * @body {number} adet - Sipariş adedi (varsayılan: 1)
 * @body {string} teslim_tarihi - Planlanan teslim tarihi (opsiyonel)
 * @body {string} notlar - Sipariş notları (opsiyonel)
 */
exports.createSiparis = async (req, res) => {
  try {
    const {
      makina_id,
      musteri_adi,
      musteri_telefon,
      musteri_email,
      adet = 1,
      teslim_tarihi,
      notlar
    } = req.body;

    // Validasyonlar
    if (!makina_id || !musteri_adi) {
      return res.status(400).json({
        success: false,
        message: 'Makina ID ve müşteri adı zorunludur'
      });
    }

    if (adet < 1) {
      return res.status(400).json({
        success: false,
        message: 'Adet 1 veya daha büyük olmalıdır'
      });
    }

    // Makina varlığını kontrol et
    const makina = await Makina.findByPk(makina_id);
    if (!makina) {
      return res.status(404).json({
        success: false,
        message: 'Makina bulunamadı'
      });
    }

    // Sipariş no oluştur
    const siparis_no = await generateSiparisNo();

    const newSiparis = await MakinaSiparis.create({
      siparis_id: uuidv4(),
      siparis_no,
      makina_id,
      musteri_adi: musteri_adi.trim(),
      musteri_telefon,
      musteri_email,
      adet,
      durum: 'Beklemede',
      siparis_tarihi: new Date(),
      teslim_tarihi,
      notlar
    });

    res.status(201).json({
      success: true,
      data: newSiparis,
      message: 'Sipariş başarıyla oluşturuldu'
    });
  } catch (error) {
    console.error('Sipariş oluşturulurken hata:', error);
    res.status(500).json({
      success: false,
      message: 'Sipariş oluşturulurken bir hata oluştu',
      error: error.message
    });
  }
};

/**
 * Siparişi günceller
 * @route PUT /api/makina-siparisleri/:id
 */
exports.updateSiparis = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const siparis = await MakinaSiparis.findByPk(id);
    if (!siparis) {
      return res.status(404).json({
        success: false,
        message: 'Sipariş bulunamadı'
      });
    }

    // Tamamlanmış sipariş güncellemesi kontrolü
    if (siparis.durum === 'Tamamlandı') {
      return res.status(400).json({
        success: false,
        message: 'Tamamlanmış sipariş güncellenemez'
      });
    }

    await siparis.update(updateData);

    res.status(200).json({
      success: true,
      data: siparis,
      message: 'Sipariş başarıyla güncellendi'
    });
  } catch (error) {
    console.error('Sipariş güncellenirken hata:', error);
    res.status(500).json({
      success: false,
      message: 'Sipariş güncellenirken bir hata oluştu',
      error: error.message
    });
  }
};

/**
 * Siparişi siler
 * @route DELETE /api/makina-siparisleri/:id
 */
exports.deleteSiparis = async (req, res) => {
  try {
    const { id } = req.params;

    const siparis = await MakinaSiparis.findByPk(id);
    if (!siparis) {
      return res.status(404).json({
        success: false,
        message: 'Sipariş bulunamadı'
      });
    }

    // İlgili stok kontrolü
    const relatedStok = await MakinaStok.findOne({
      where: { siparis_id: id }
    });

    if (relatedStok) {
      return res.status(400).json({
        success: false,
        message: 'Bu siparişe bağlı stok kaydı var. Önce stoku silmelisiniz.'
      });
    }

    await siparis.destroy();

    res.status(200).json({
      success: true,
      message: 'Sipariş başarıyla silindi'
    });
  } catch (error) {
    console.error('Sipariş silinirken hata:', error);
    res.status(500).json({
      success: false,
      message: 'Sipariş silinirken bir hata oluştu',
      error: error.message
    });
  }
};

/**
 * Sipariş durumunu değiştirir
 * @route PATCH /api/makina-siparisleri/:id/durum
 * @body {string} durum - Yeni durum (zorunlu)
 */
exports.updateSiparisDurum = async (req, res) => {
  try {
    const { id } = req.params;
    const { durum } = req.body;

    if (!durum) {
      return res.status(400).json({
        success: false,
        message: 'Durum zorunludur'
      });
    }

    const siparis = await MakinaSiparis.findByPk(id);
    if (!siparis) {
      return res.status(404).json({
        success: false,
        message: 'Sipariş bulunamadı'
      });
    }

    const eski_durum = siparis.durum;
    await siparis.update({ durum });

    // Eğer durum "Tamamlandı" ise otomatik stok girişi yap
    if (durum === 'Tamamlandı' && eski_durum !== 'Tamamlandı') {
      await otomatikStokGirisi(siparis);
      await siparis.update({ tamamlanma_tarihi: new Date() });
    }

    res.status(200).json({
      success: true,
      data: siparis,
      message: `Sipariş durumu "${eski_durum}" → "${durum}" olarak güncellendi`
    });
  } catch (error) {
    console.error('Sipariş durumu güncellenirken hata:', error);
    res.status(500).json({
      success: false,
      message: 'Sipariş durumu güncellenirken bir hata oluştu',
      error: error.message
    });
  }
};

// Yardımcı fonksiyonlar

/**
 * Sipariş numarası üretir
 * Format: SIP-[YYYY]-[Sequence]
 */
async function generateSiparisNo() {
  const year = new Date().getFullYear();

  // Bu yılın son sipariş no'sunu bul
  const lastSiparis = await MakinaSiparis.findOne({
    where: {
      siparis_no: {
        [sequelize.Sequelize.Op.like]: `SIP-${year}-%`
      }
    },
    order: [['siparis_no', 'DESC']]
  });

  let sequence = 1;
  if (lastSiparis) {
    const lastSequence = parseInt(lastSiparis.siparis_no.split('-')[2]);
    sequence = lastSequence + 1;
  }

  return `SIP-${year}-${String(sequence).padStart(4, '0')}`;
}

/**
 * Tamamlanan sipariş için otomatik stok girişi yapar
 */
async function otomatikStokGirisi(siparis) {
  try {
    // Zaten stok girişi yapılmış mı kontrol et
    const existingStok = await MakinaStok.findOne({
      where: { siparis_id: siparis.siparis_id }
    });

    if (existingStok) {
      console.log('Bu sipariş için zaten stok girişi yapılmış');
      return;
    }

    // Stok girişi oluştur
    await MakinaStok.create({
      stok_id: uuidv4(),
      makina_id: siparis.makina_id,
      adet: siparis.adet,
      giris_kaynagi: 'Üretim',
      giris_tarihi: new Date(),
      siparis_id: siparis.siparis_id
    });

    console.log(`Sipariş ${siparis.siparis_no} için otomatik stok girişi yapıldı`);
  } catch (error) {
    console.error('Otomatik stok girişi hatası:', error);
    throw error;
  }
}

module.exports = exports;
```

---

#### `MakinaStokController.js`

**Dosya**: `backend/src/controllers/makinaStokController.js`

```javascript
const { v4: uuidv4 } = require('uuid');
const MakinaStok = require('../models/MakinaStok');
const Makina = require('../models/Makina');

/**
 * Tüm stokları listeler
 * @route GET /api/makina-stok
 * @query {string} makina_id - Makina filtresi (opsiyonel)
 * @query {number} depo_id - Depo filtresi (opsiyonel)
 * @query {string} giris_kaynagi - Giriş kaynağı filtresi (opsiyonel)
 * @query {number} limit - Kayıt limiti (varsayılan: 50)
 * @query {number} offset - Kayıt offseti (varsayılan: 0)
 */
exports.listStok = async (req, res) => {
  try {
    const { makina_id, depo_id, giris_kaynagi, limit = 50, offset = 0 } = req.query;
    const where = {};

    if (makina_id) where.makina_id = makina_id;
    if (depo_id) where.depo_id = depo_id;
    if (giris_kaynagi) where.giris_kaynagi = giris_kaynagi;

    const stoklar = await MakinaStok.findAll({
      where,
      include: [{
        model: Makina,
        as: 'makina',
        attributes: ['makina_id', 'name', 'model']
      }],
      order: [['giris_tarihi', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.status(200).json({
      success: true,
      data: stoklar,
      count: stoklar.length
    });
  } catch (error) {
    console.error('Stoklar listelenirken hata:', error);
    res.status(500).json({
      success: false,
      message: 'Stoklar listelenirken bir hata oluştu',
      error: error.message
    });
  }
};

/**
 * Stok detayını getirir
 * @route GET /api/makina-stok/:id
 */
exports.getStokDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const stok = await MakinaStok.findByPk(id, {
      include: [{
        model: Makina,
        as: 'makina',
        attributes: ['makina_id', 'name', 'model', 'items']
      }]
    });

    if (!stok) {
      return res.status(404).json({
        success: false,
        message: 'Stok bulunamadı'
      });
    }

    res.status(200).json({
      success: true,
      data: stok
    });
  } catch (error) {
    console.error('Stok detayı alınırken hata:', error);
    res.status(500).json({
      success: false,
      message: 'Stok detayı alınırken bir hata oluştu',
      error: error.message
    });
  }
};

/**
 * Yeni stok girişi oluşturur
 * @route POST /api/makina-stok
 * @body {string} makina_id - Makina UUID (zorunlu)
 * @body {number} adet - Stok adedi (zorunlu)
 * @body {number} depo_id - Depo ID (opsiyonel)
 * @body {string} giris_kaynagi - Giriş kaynağı (opsiyonel)
 * @body {string} giris_tarihi - Giriş tarihi (varsayılan: bugün)
 * @body {string} siparis_id - İlgili sipariş ID (opsiyonel)
 * @body {array} seri_nolari - Seri numaraları (opsiyonel)
 * @body {string} notlar - Stok notları (opsiyonel)
 */
exports.createStok = async (req, res) => {
  try {
    const {
      makina_id,
      adet,
      depo_id,
      giris_kaynagi,
      giris_tarihi,
      siparis_id,
      seri_nolari,
      notlar
    } = req.body;

    // Validasyonlar
    if (!makina_id || !adet) {
      return res.status(400).json({
        success: false,
        message: 'Makina ID ve adet zorunludur'
      });
    }

    if (adet < 0) {
      return res.status(400).json({
        success: false,
        message: 'Adet 0 veya pozitif olmalıdır'
      });
    }

    // Makina varlığını kontrol et
    const makina = await Makina.findByPk(makina_id);
    if (!makina) {
      return res.status(404).json({
        success: false,
        message: 'Makina bulunamadı'
      });
    }

    const newStok = await MakinaStok.create({
      stok_id: uuidv4(),
      makina_id,
      adet,
      depo_id,
      giris_kaynagi,
      giris_tarihi: giris_tarihi || new Date(),
      siparis_id,
      seri_nolari: seri_nolari ? JSON.stringify(seri_nolari) : null,
      notlar
    });

    res.status(201).json({
      success: true,
      data: newStok,
      message: 'Stok girişi başarıyla oluşturuldu'
    });
  } catch (error) {
    console.error('Stok girişi oluşturulurken hata:', error);
    res.status(500).json({
      success: false,
      message: 'Stok girişi oluşturulurken bir hata oluştu',
      error: error.message
    });
  }
};

/**
 * Stok günceller
 * @route PUT /api/makina-stok/:id
 */
exports.updateStok = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const stok = await MakinaStok.findByPk(id);
    if (!stok) {
      return res.status(404).json({
        success: false,
        message: 'Stok bulunamadı'
      });
    }

    // Seri numaraları JSON convert
    if (updateData.seri_nolari) {
      updateData.seri_nolari = JSON.stringify(updateData.seri_nolari);
    }

    await stok.update(updateData);

    res.status(200).json({
      success: true,
      data: stok,
      message: 'Stok başarıyla güncellendi'
    });
  } catch (error) {
    console.error('Stok güncellenirken hata:', error);
    res.status(500).json({
      success: false,
      message: 'Stok güncellenirken bir hata oluştu',
      error: error.message
    });
  }
};

/**
 * Stok siler
 * @route DELETE /api/makina-stok/:id
 */
exports.deleteStok = async (req, res) => {
  try {
    const { id } = req.params;

    const stok = await MakinaStok.findByPk(id);
    if (!stok) {
      return res.status(404).json({
        success: false,
        message: 'Stok bulunamadı'
      });
    }

    await stok.destroy();

    res.status(200).json({
      success: true,
      message: 'Stok başarıyla silindi'
    });
  } catch (error) {
    console.error('Stok silinirken hata:', error);
    res.status(500).json({
      success: false,
      message: 'Stok silinirken bir hata oluştu',
      error: error.message
    });
  }
};

/**
 * Stoktan düşme işlemi (satış için)
 * @route POST /api/makina-stok/stoktan-dus
 * @body {string} makina_id - Makina UUID (zorunlu)
 * @body {number} adet - Düşülecek adet (zorunlu)
 * @body {string} aciklama - Düşme nedeni (opsiyonel)
 */
exports.stoktanDus = async (req, res) => {
  try {
    const { makina_id, adet, aciklama } = req.body;

    // Validasyonlar
    if (!makina_id || !adet) {
      return res.status(400).json({
        success: false,
        message: 'Makina ID ve adet zorunludur'
      });
    }

    if (adet < 1) {
      return res.status(400).json({
        success: false,
        message: 'Adet 1 veya daha büyük olmalıdır'
      });
    }

    // Stokları bul (eski tarihten başla, FIFO mantığı)
    const stoklar = await MakinaStok.findAll({
      where: { makina_id },
      order: [['giris_tarihi', 'ASC']]
    });

    let kalanAdet = adet;
    const dusulenStoklar = [];

    for (const stok of stoklar) {
      if (kalanAdet <= 0) break;

      if (stok.adet >= kalanAdet) {
        // Bu stoktan düşülecek
        stok.adet -= kalanAdet;
        await stok.save();
        dusulenStoklar.push({
          stok_id: stok.stok_id,
          dusulen: kalanAdet
        });
        kalanAdet = 0;
      } else {
        // Bu stokun tamamını düş, kalanı diğer stoklardan
        kalanAdet -= stok.adet;
        dusulenStoklar.push({
          stok_id: stok.stok_id,
          dusulen: stok.adet
        });
        stok.adet = 0;
        await stok.save();
      }
    }

    if (kalanAdet > 0) {
      return res.status(400).json({
        success: false,
        message: `Yetersiz stok. ${adet - kalanAdet}/${adet} adet düşülebildi`
      });
    }

    res.status(200).json({
      success: true,
      data: dusulenStoklar,
      message: 'Stoktan başarıyla düşüldü'
    });
  } catch (error) {
    console.error('Stoktan düşülürken hata:', error);
    res.status(500).json({
      success: false,
      message: 'Stoktan düşülürken bir hata oluştu',
      error: error.message
    });
  }
};

module.exports = exports;
```

---

### Model Tasarımı

#### `MakinaSiparis.js` Model

**Dosya**: `backend/src/models/MakinaSiparis.js`

```javascript
const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database').sequelize;
const { v4: uuidv4 } = require('uuid');

class MakinaSiparis extends Model {
  static associate(models) {
    // Sipariş bir makina için
    MakinaSiparis.belongsTo(models.Makina, {
      foreignKey: 'makina_id',
      targetKey: 'makina_id',
      as: 'makina'
    });

    // Sipariş birden çok stok girişi oluşturabilir
    MakinaSiparis.hasMany(models.MakinaStok, {
      foreignKey: 'siparis_id',
      sourceKey: 'siparis_id',
      as: 'stoklar'
    });
  }

  /**
   * Durum geçişini kontrol eder
   * @param {string} yeniDurum - Yeni durum
   * @returns {boolean} Geçiş geçerli mi?
   */
  static isValidDurumGecis(eskiDurum, yeniDurum) {
    // Tüm durumlar serbestçe değişebilir (sıralı akış zorunlu değil)
    const gecerliDurumlar = ['Beklemede', 'Gövde Montaj', 'Boyada', 'Son montajda', 'Üretimde', 'Tamamlandı', 'İptal'];
    return gecerliDurumlar.includes(yeniDurum);
  }

  /**
   * Sipariş durumuna göre renk kodu döndürür
   * @returns {string} Hex renk kodu
   */
  getDurumRengi() {
    const renkler = {
      'Beklemede': '#9E9E9E',
      'Gövde Montaj': '#2196F3',
      'Boyada': '#FF9800',
      'Son montajda': '#9C27B0',
      'Üretimde': '#FFC107',
      'Tamamlandı': '#4CAF50',
      'İptal': '#F44336'
    };
    return renkler[this.durum] || '#9E9E9E';
  }
}

MakinaSiparis.init({
  siparis_id: {
    type: DataTypes.STRING(36),
    defaultValue: () => uuidv4(),
    primaryKey: true,
    allowNull: false,
    field: 'siparis_id'
  },
  siparis_no: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: false,
    field: 'siparis_no',
    comment: 'Sipariş numarası (örn: SIP-2026-0001)'
  },
  makina_id: {
    type: DataTypes.STRING(36),
    allowNull: false,
    field: 'makina_id',
    comment: 'Makina UUID',
    references: {
      model: 'makinalar',
      key: 'makina_id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT'
  },
  musteri_adi: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'musteri_adi',
    comment: 'Müşteri tam adı'
  },
  musteri_telefon: {
    type: DataTypes.STRING(20),
    allowNull: true,
    field: 'musteri_telefon',
    comment: 'İletişim telefonu'
  },
  musteri_email: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'musteri_email',
    comment: 'İletişim e-posta'
  },
  adet: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    field: 'adet',
    comment: 'Sipariş adedi',
    validate: {
      min: 1
    }
  },
  durum: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'Beklemede',
    field: 'durum',
    comment: 'Sipariş durumu'
  },
  siparis_tarihi: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'siparis_tarihi',
    comment: 'Sipariş alma tarihi'
  },
  teslim_tarihi: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'teslim_tarihi',
    comment: 'Planlanan teslim tarihi'
  },
  tamamlanma_tarihi: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'tamamlanma_tarihi',
    comment: 'Gerçekleşen teslim tarihi'
  },
  notlar: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'notlar',
    comment: 'Sipariş notları'
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'created_at'
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'updated_at'
  }
}, {
  sequelize,
  modelName: 'MakinaSiparis',
  tableName: 'makina_siparisleri',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['siparis_no']
    },
    {
      fields: ['makina_id']
    },
    {
      fields: ['durum']
    },
    {
      fields: ['siparis_tarihi']
    }
  ]
});

module.exports = MakinaSiparis;
```

---

#### `MakinaStok.js` Model

**Dosya**: `backend/src/models/MakinaStok.js`

```javascript
const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database').sequelize;
const { v4: uuidv4 } = require('uuid');

class MakinaStok extends Model {
  static associate(models) {
    // Stok bir makina için
    MakinaStok.belongsTo(models.Makina, {
      foreignKey: 'makina_id',
      targetKey: 'makina_id',
      as: 'makina'
    });

    // Stok bir siparişten gelmiş olabilir (opsiyonel)
    MakinaStok.belongsTo(models.MakinaSiparis, {
      foreignKey: 'siparis_id',
      targetKey: 'siparis_id',
      as: 'siparis'
    });
  }

  /**
   * Seri numaralarını dizi olarak döndürür
   * @returns {Array<string>} Seri numaraları
   */
  getSeriNolari() {
    const rawValue = this.getDataValue('seri_nolari');
    if (!rawValue) return [];

    if (typeof rawValue === 'string') {
      try {
        return JSON.parse(rawValue);
      } catch (e) {
        console.error('Seri numaraları parse hatası:', e);
        return [];
      }
    }
    return rawValue || [];
  }

  /**
   * Seri numaralarını ayarlar
   * @param {Array<string>} seriNolari - Seri numaraları
   */
  setSeriNolari(seriNolari) {
    if (!seriNolari || seriNolari.length === 0) {
      this.setDataValue('seri_nolari', null);
    } else {
      this.setDataValue('seri_nolari', JSON.stringify(seriNolari));
    }
  }

  /**
   * Depo adını döndürür
   * @returns {string} Depo adı
   */
  getDepoAdi() {
    const depolar = {
      1: 'Ana Depo',
      2: 'Alaaddin Bey Depo'
    };
    return depolar[this.depo_id] || 'Belirtilmemiş';
  }
}

MakinaStok.init({
  stok_id: {
    type: DataTypes.STRING(36),
    defaultValue: () => uuidv4(),
    primaryKey: true,
    allowNull: false,
    field: 'stok_id'
  },
  makina_id: {
    type: DataTypes.STRING(36),
    allowNull: false,
    field: 'makina_id',
    comment: 'Makina UUID',
    references: {
      model: 'makinalar',
      key: 'makina_id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT'
  },
  adet: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    field: 'adet',
    comment: 'Stok adedi',
    validate: {
      min: 0
    }
  },
  depo_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'depo_id',
    comment: 'Depo ID: 1=Ana Depo, 2=Alaaddin Bey Depo'
  },
  giris_kaynagi: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'giris_kaynagi',
    comment: 'Giriş kaynağı: Satın Alma, Üretim, Montaj'
  },
  giris_tarihi: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'giris_tarihi',
    comment: 'Stok giriş tarihi'
  },
  siparis_id: {
    type: DataTypes.STRING(36),
    allowNull: true,
    field: 'siparis_id',
    comment: 'İlgili sipariş ID (üretimden geldiyse)',
    references: {
      model: 'makina_siparisleri',
      key: 'siparis_id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL'
  },
  seri_nolari: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'seri_nolari',
    comment: 'Seri numaraları JSON formatında',
    get() {
      const rawValue = this.getDataValue('seri_nolari');
      if (!rawValue) return null;
      if (typeof rawValue === 'string') {
        try { return JSON.parse(rawValue); } catch (e) { return null; }
      }
      return rawValue;
    },
    set(value) {
      if (value === null || value === undefined || value.length === 0) {
        this.setDataValue('seri_nolari', null);
      } else if (typeof value === 'string') {
        this.setDataValue('seri_nolari', value);
      } else {
        this.setDataValue('seri_nolari', JSON.stringify(value));
      }
    }
  },
  notlar: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'notlar',
    comment: 'Stok notları'
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'created_at'
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'updated_at'
  }
}, {
  sequelize,
  modelName: 'MakinaStok',
  tableName: 'makina_stok',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  underscored: true,
  indexes: [
    {
      fields: ['makina_id']
    },
    {
      fields: ['depo_id']
    },
    {
      fields: ['giris_tarihi']
    },
    {
      fields: ['siparis_id']
    }
  ]
});

module.exports = MakinaStok;
```

---

### Route Yapılandırması

#### `makinaSiparisRoutes.js`

**Dosya**: `backend/src/routes/makinaSiparisRoutes.js`

```javascript
const express = require('express');
const makinaSiparisController = require('../controllers/makinaSiparisController');
const router = express.Router();

// Sipariş CRUD operasyonları
router.get('/makina-siparisleri', makinaSiparisController.listSiparisler);
router.post('/makina-siparisleri', makinaSiparisController.createSiparis);
router.get('/makina-siparisleri/:id', makinaSiparisController.getSiparisDetail);
router.put('/makina-siparisleri/:id', makinaSiparisController.updateSiparis);
router.delete('/makina-siparisleri/:id', makinaSiparisController.deleteSiparis);

// Durum güncelleme
router.patch('/makina-siparisleri/:id/durum', makinaSiparisController.updateSiparisDurum);

module.exports = router;
```

---

#### `makinaStokRoutes.js`

**Dosya**: `backend/src/routes/makinaStokRoutes.js`

```javascript
const express = require('express');
const makinaStokController = require('../controllers/makinaStokController');
const router = express.Router();

// Stok CRUD operasyonları
router.get('/makina-stok', makinaStokController.listStok);
router.post('/makina-stok', makinaStokController.createStok);
router.get('/makina-stok/:id', makinaStokController.getStokDetail);
router.put('/makina-stok/:id', makinaStokController.updateStok);
router.delete('/makina-stok/:id', makinaStokController.deleteStok);

// Stoktan düşme
router.post('/makina-stok/stoktan-dus', makinaStokController.stoktanDus);

module.exports = router;
```

---

### `index.js` Route Kayıtları

**Dosya**: `backend/src/index.js` (Değişiklikler)

```javascript
// Mevcut route'lar
const makinaRoutes = require('./routes/makinaRoutes');

// Yeni route'lar
const makinaSiparisRoutes = require('./routes/makinaSiparisRoutes');
const makinaStokRoutes = require('./routes/makinaStokRoutes');

// Route kayıtları
app.use('/api', makinaRoutes);
app.use('/api', makinaSiparisRoutes);  // Yeni
app.use('/api', makinaStokRoutes);     // Yeni
```

---

## 🎨 Frontend Bileşen Tasarımı

### Bileşen Hiyerarşisi

```
Makinalar (Ana Sayfa)
├── MakinaListesi (Mevcut)
├── MakinaForm (Mevcut)
├── MakinaSiparislerModal (Yeni)
│   ├── SiparislerListesi
│   └── SiparisFormModal
└── MakinaStoklariModal (Yeni)
    ├── StokListesi
    └── StokFormModal
```

---

### API Servis Tasarımı

#### `makinaSiparisAPI.js`

**Dosya**: `frontend/src/api/makinaSiparisAPI.js`

```javascript
import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`API Response [${response.config.url}]:`, response.status);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.status);
    return Promise.reject(error);
  }
);

/**
 * Tüm siparişleri getirir
 * @param {Object} params - Query parametreleri
 * @returns {Promise<Object>} - Sipariş listesi
 */
const getAllSiparisler = async (params = {}) => {
  try {
    const response = await api.get('/makina-siparisleri', { params });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Siparişler getirilirken hata oluştu');
  }
};

/**
 * Sipariş detayını getirir
 * @param {string} id - Sipariş ID
 * @returns {Promise<Object>} - Sipariş detayı
 */
const getSiparisById = async (id) => {
  try {
    const response = await api.get(`/makina-siparisleri/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Sipariş detayı getirilirken hata oluştu');
  }
};

/**
 * Yeni sipariş oluşturur
 * @param {Object} siparisData - Sipariş verileri
 * @returns {Promise<Object>} - Oluşturulan sipariş
 */
const createSiparis = async (siparisData) => {
  try {
    const response = await api.post('/makina-siparisleri', siparisData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Sipariş oluşturulurken hata oluştu');
  }
};

/**
 * Siparişi günceller
 * @param {string} id - Sipariş ID
 * @param {Object} siparisData - Güncellenecek veriler
 * @returns {Promise<Object>} - Güncellenen sipariş
 */
const updateSiparis = async (id, siparisData) => {
  try {
    const response = await api.put(`/makina-siparisleri/${id}`, siparisData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Sipariş güncellenirken hata oluştu');
  }
};

/**
 * Siparişi siler
 * @param {string} id - Sipariş ID
 * @returns {Promise<Object>} - Silme sonucu
 */
const deleteSiparis = async (id) => {
  try {
    const response = await api.delete(`/makina-siparisleri/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Sipariş silinirken hata oluştu');
  }
};

/**
 * Sipariş durumunu günceller
 * @param {string} id - Sipariş ID
 * @param {string} durum - Yeni durum
 * @returns {Promise<Object>} - Güncellenen sipariş
 */
const updateSiparisDurum = async (id, durum) => {
  try {
    const response = await api.patch(`/makina-siparisleri/${id}/durum`, { durum });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Sipariş durumu güncellenirken hata oluştu');
  }
};

const makinaSiparisAPI = {
  getAllSiparisler,
  getSiparisById,
  createSiparis,
  updateSiparis,
  deleteSiparis,
  updateSiparisDurum,
};

export default makinaSiparisAPI;
```

---

#### `makinaStokAPI.js`

**Dosya**: `frontend/src/api/makinaStokAPI.js`

```javascript
import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Tüm stokları getirir
 * @param {Object} params - Query parametreleri
 * @returns {Promise<Object>} - Stok listesi
 */
const getAllStok = async (params = {}) => {
  try {
    const response = await api.get('/makina-stok', { params });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Stoklar getirilirken hata oluştu');
  }
};

/**
 * Stok detayını getirir
 * @param {string} id - Stok ID
 * @returns {Promise<Object>} - Stok detayı
 */
const getStokById = async (id) => {
  try {
    const response = await api.get(`/makina-stok/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Stok detayı getirilirken hata oluştu');
  }
};

/**
 * Yeni stok girişi oluşturur
 * @param {Object} stokData - Stok verileri
 * @returns {Promise<Object>} - Oluşturulan stok
 */
const createStok = async (stokData) => {
  try {
    const response = await api.post('/makina-stok', stokData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Stok girişi oluşturulurken hata oluştu');
  }
};

/**
 * Stok günceller
 * @param {string} id - Stok ID
 * @param {Object} stokData - Güncellenecek veriler
 * @returns {Promise<Object>} - Güncellenen stok
 */
const updateStok = async (id, stokData) => {
  try {
    const response = await api.put(`/makina-stok/${id}`, stokData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Stok güncellenirken hata oluştu');
  }
};

/**
 * Stok siler
 * @param {string} id - Stok ID
 * @returns {Promise<Object>} - Silme sonucu
 */
const deleteStok = async (id) => {
  try {
    const response = await api.delete(`/makina-stok/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Stok silinirken hata oluştu');
  }
};

/**
 * Stoktan düşme işlemi
 * @param {Object} data - { makina_id, adet, aciklama }
 * @returns {Promise<Object>} - Düşme sonucu
 */
const stoktanDus = async (data) => {
  try {
    const response = await api.post('/makina-stok/stoktan-dus', data);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Stoktan düşülürken hata oluştu');
  }
};

const makinaStokAPI = {
  getAllStok,
  getStokById,
  createStok,
  updateStok,
  deleteStok,
  stoktanDus,
};

export default makinaStokAPI;
```

---

### Modal Bileşen Tasarımları

#### `MakinaSiparislerModal.jsx`

**Dosya**: `frontend/src/components/modals/MakinaSiparislerModal.jsx`

```jsx
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Box,
  Typography,
  Alert
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon
} from '@mui/icons-material';
import makinaSiparisAPI from '@/api/makinaSiparisAPI';
import SiparisFormModal from './SiparisFormModal';

const DURUM_RENKLERI = {
  'Beklemede': '#9E9E9E',
  'Gövde Montaj': '#2196F3',
  'Boyada': '#FF9800',
  'Son montajda': '#9C27B0',
  'Üretimde': '#FFC107',
  'Tamamlandı': '#4CAF50',
  'İptal': '#F44336'
};

const MakinaSiparislerModal = ({ open, onClose }) => {
  const [siparisler, setSiparisler] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingSiparis, setEditingSiparis] = useState(null);

  const fetchSiparisler = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await makinaSiparisAPI.getAllSiparisler();
      setSiparisler(response.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchSiparisler();
    }
  }, [open]);

  const handleDelete = async (siparisId) => {
    if (!window.confirm('Bu siparişi silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      await makinaSiparisAPI.deleteSiparis(siparisId);
      fetchSiparisler();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (siparis) => {
    setEditingSiparis(siparis);
    setFormModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingSiparis(null);
    setFormModalOpen(true);
  };

  const handleFormClose = () => {
    setFormModalOpen(false);
    setEditingSiparis(null);
    fetchSiparisler();
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="xl"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Makina Siparişleri</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddNew}
            >
              Yeni Sipariş
            </Button>
          </Box>
        </DialogTitle>

        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {loading ? (
            <Typography>Yükleniyor...</Typography>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Sipariş No</TableCell>
                    <TableCell>Makina</TableCell>
                    <TableCell>Müşteri</TableCell>
                    <TableCell>Adet</TableCell>
                    <TableCell>Durum</TableCell>
                    <TableCell>Sipariş Tarihi</TableCell>
                    <TableCell>Teslim Tarihi</TableCell>
                    <TableCell>İşlemler</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {siparisler.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        <Typography variant="body2" color="textSecondary">
                          Henüz sipariş yok
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    siparisler.map((siparis) => (
                      <TableRow key={siparis.siparis_id}>
                        <TableCell>{siparis.siparis_no}</TableCell>
                        <TableCell>
                          {siparis.makina?.name || '-'}
                        </TableCell>
                        <TableCell>{siparis.musteri_adi}</TableCell>
                        <TableCell>{siparis.adet}</TableCell>
                        <TableCell>
                          <Chip
                            label={siparis.durum}
                            size="small"
                            sx={{
                              backgroundColor: DURUM_RENKLERI[siparis.durum],
                              color: 'white'
                            }}
                          />
                        </TableCell>
                        <TableCell>{formatDate(siparis.siparis_tarihi)}</TableCell>
                        <TableCell>{formatDate(siparis.teslim_tarihi)}</TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => handleEdit(siparis)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(siparis.siparis_id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose}>Kapat</Button>
        </DialogActions>
      </Dialog>

      {/* Form Modal */}
      <SiparisFormModal
        open={formModalOpen}
        onClose={handleFormClose}
        siparis={editingSiparis}
      />
    </>
  );
};

export default MakinaSiparislerModal;
```

---

#### `MakinaStoklariModal.jsx`

**Dosya**: `frontend/src/components/modals/MakinaStoklariModal.jsx`

```jsx
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Box,
  Typography,
  Alert
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon
} from '@mui/icons-material';
import makinaStokAPI from '@/api/makinaStokAPI';
import StokFormModal from './StokFormModal';

const MakinaStoklariModal = ({ open, onClose }) => {
  const [stoklar, setStoklar] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingStok, setEditingStok] = useState(null);

  const fetchStoklar = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await makinaStokAPI.getAllStok();
      setStoklar(response.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchStoklar();
    }
  }, [open]);

  const handleDelete = async (stokId) => {
    if (!window.confirm('Bu stok kaydını silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      await makinaStokAPI.deleteStok(stokId);
      fetchStoklar();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (stok) => {
    setEditingStok(stok);
    setFormModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingStok(null);
    setFormModalOpen(true);
  };

  const handleFormClose = () => {
    setFormModalOpen(false);
    setEditingStok(null);
    fetchStoklar();
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  const getDepoAdi = (depoId) => {
    const depolar = {
      1: 'Ana Depo',
      2: 'Alaaddin Bey Depo'
    };
    return depolar[depoId] || 'Belirtilmemiş';
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="xl"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Makina Stokları</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddNew}
            >
              Stok Girişi Ekle
            </Button>
          </Box>
        </DialogTitle>

        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {loading ? (
            <Typography>Yükleniyor...</Typography>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Makina</TableCell>
                    <TableCell>Stok Adedi</TableCell>
                    <TableCell>Depo</TableCell>
                    <TableCell>Giriş Kaynağı</TableCell>
                    <TableCell>Giriş Tarihi</TableCell>
                    <TableCell>İşlemler</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stoklar.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Typography variant="body2" color="textSecondary">
                          Henüz stok yok
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    stoklar.map((stok) => (
                      <TableRow key={stok.stok_id}>
                        <TableCell>
                          {stok.makina?.name || '-'}
                        </TableCell>
                        <TableCell>{stok.adet}</TableCell>
                        <TableCell>{getDepoAdi(stok.depo_id)}</TableCell>
                        <TableCell>{stok.giris_kaynagi || '-'}</TableCell>
                        <TableCell>{formatDate(stok.giris_tarihi)}</TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => handleEdit(stok)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(stok.stok_id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose}>Kapat</Button>
        </DialogActions>
      </Dialog>

      {/* Form Modal */}
      <StokFormModal
        open={formModalOpen}
        onClose={handleFormClose}
        stok={editingStok}
      />
    </>
  );
};

export default MakinaStoklariModal;
```

---

### Makinalar Ana Sayfa Güncellemesi

**Dosya**: `frontend/src/pages/Makinalar.jsx` (Güncellenmiş)

```jsx
import React, { useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { Box, Button, ButtonGroup } from '@mui/material';
import {
  ListAlt as SiparisIcon,
  Inventory as StokIcon
} from '@mui/icons-material';
import MakinaListesi from '../components/MakinaListesi';
import MakinaForm from '../components/MakinaForm';
import MakinaSiparislerModal from '../components/modals/MakinaSiparislerModal';
import MakinaStoklariModal from '../components/modals/MakinaStoklariModal';

const Makinalar = () => {
    const location = useLocation();
    const { id } = useParams();

    // URL'ye göre hangi bileşenin gösterileceğini belirle
    const isListPage = location.pathname === '/makinalar';
    const isAddPage = location.pathname === '/makinalar/ekle';
    const isEditPage = location.pathname.startsWith('/makinalar/duzenle/') && id;

    // Yeni state'ler
    const [siparisModalOpen, setSiparisModalOpen] = useState(false);
    const [stokModalOpen, setStokModalOpen] = useState(false);

    return (
        <Box sx={{ width: '100%' }}>
            {/* Ana sayfa ise butonları göster */}
            {isListPage && (
                <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
                    <Button
                        variant="outlined"
                        startIcon={<SiparisIcon />}
                        onClick={() => setSiparisModalOpen(true)}
                        size="large"
                    >
                        Makina Siparişleri
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<StokIcon />}
                        onClick={() => setStokModalOpen(true)}
                        size="large"
                    >
                        Makina Stokları
                    </Button>
                </Box>
            )}

            {isListPage && <MakinaListesi />}
            {(isAddPage || isEditPage) && <MakinaForm />}

            {/* Modallar */}
            <MakinaSiparislerModal
                open={siparisModalOpen}
                onClose={() => setSiparisModalOpen(false)}
            />
            <MakinaStoklariModal
                open={stokModalOpen}
                onClose={() => setStokModalOpen(false)}
            />
        </Box>
    );
};

export default Makinalar;
```

---

## ⚙️ İş Mantığı ve Entegrasyon

### Sipariş Yaşam Döngüsü

```
1. SIPARIŞ OLUŞTURMA
   ├─ Kullanıcı formu doldurur
   ├─ Backend validasyon yapar
   ├─ Sipariş no otomatik üretilir (SIP-2026-0001)
   └─ Varsayılan durum: "Beklemede"

2. ÜRETİM SÜRECİ
   ├─ Durum değişiklikleri:
   │  ├─ "Gövde Montaj"
   │  ├─ "Boyada"
   │  ├─ "Son montajda"
   │  └─ "Üretimde"
   └─ Her durum değişikliği loglanır

3. TAMAMLANMA
   ├─ Durum "Tamamlandı" olur
   ├─ Otomatik stok girişi tetiklenir:
   │  └─ MakinaStok.create({
   │       makina_id: siparis.makina_id,
   │       adet: siparis.adet,
   │       giris_kaynagi: 'Üretim',
   │       siparis_id: siparis.siparis_id
   │     })
   └─ tamamlanma_tarihi = NOW()

4. İPTAL
   └─ Durum "İptal" olur
   └─ Stok girişi yapılmaz
```

---

### Stok Yönetimi Akışı

```
1. STOK GİRİŞİ
   ├─ Manuel giriş: Kullanıcı formu doldurur
   ├─ Otomatik giriş: Sipariş tamamlanır
   └─ Seri numaraları opsionel

2. STOKTAN DÜŞME (Satış)
   ├─ Mevcut satış özelliğine entegrasyon
   ├─ FIFO mantığı (eski stoktan başla)
   ├─ Parça stoklarından düşme işlevi KORUNUR
   └─ Yeni: Makina stoğundan da düşülür

3. DEPO YÖNETİMİ
   ├─ Depo opsiyonel
   ├─ 1: Ana Depo
   └─ 2: Alaaddin Bey Depo
```

---

### Satış Entegrasyonu

**Mevcut Satış Koduna Entegrasyon:**

Mevcut satış controller'ına stoktan düşme işlemi eklenmeli:

```javascript
// Mevcut satisController.js'e eklenecek
const MakinaStok = require('../models/MakinaStok');

// Satış oluşturma fonksiyonuna eklemeler:
exports.createSatis = async (req, res) => {
  // ... mevcut kodlar ...

  // Mevcut: Parça stoklarından düşme
  // (Bu kısım aynen korunmalı)

  // YENİ: Makina stoğundan düşme
  try {
    await axios.post(`${API_BASE_URL}/makina-stok/stoktan-dus`, {
      makina_id: makina_id,
      adet: satis_adedi,
      aciklama: `Satış: ${satis_id}`
    });
  } catch (error) {
    console.error('Makina stoğundan düşülürken hata:', error);
    // Stok hatası satışı engellememeli
    // Log tutmaya devam et
  }

  // ... mevcut kodlar ...
};
```

---

## 🔒 Güvenlik ve Performans

### Güvenlik Önlemleri

1. **Input Validasyonu**
   - Tüm girdiler Joi ile validasyon
   - SQL injection koruması (Sequelize ORM)
   - XSS koruması (frontend)

2. **Yetkilendirme**
   - MVP'de yetkilendirme yok
   - İleri versiyonda JWT token kontrolü

3. **Veri Bütünlüğü**
   - Foreign key constraints
   - Transaction kullanımı (kritik işlemlerde)
   - Soft delete yerine hard delete

---

### Performans Optimizasyonları

1. **Database Indexleri**
   - Tüm FK alanlarında index
   - Sık aranan alanlarda index (durum, tarih)
   - Composite indexler (gerektiğinde)

2. **Query Optimizasyonu**
   - Include kullanımı ( Sequelize eager loading)
   - Limit/offset pagination
   - Sadece gerekli alanları seç (attributes)

3. **Frontend Optimizasyonu**
   - React memoization (useMemo, useCallback)
   - Lazy loading (React.lazy)
   - Virtual scrolling (büyük listeler için)

---

## 🧪 Test Stratejisi

### Backend Testleri

**Dosya**: `backend/tests/makinaSiparis.test.js`

```javascript
const request = require('supertest');
const app = require('../src/index');
const MakinaSiparis = require('../src/models/MakinaSiparis');
const Makina = require('../src/models/Makina');

describe('Makina Sipariş API', () => {
  let testMakina;

  beforeAll(async () => {
    // Test makinası oluştur
    testMakina = await Makina.create({
      name: 'Test Makina',
      model: 'TM-001',
      durum: 'aktif'
    });
  });

  afterAll(async () => {
    await Makina.destroy({ where: {} });
    await MakinaSiparis.destroy({ where: {} });
  });

  describe('POST /api/makina-siparisleri', () => {
    it('yeni sipariş oluşturmalı', async () => {
      const response = await request(app)
        .post('/api/makina-siparisleri')
        .send({
          makina_id: testMakina.makina_id,
          musteri_adi: 'Test Müşteri',
          adet: 2
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.siparis_no).toMatch(/^SIP-\d{4}-\d{4}$/);
    });

    it('geçersiz veri ile hata dönmeli', async () => {
      const response = await request(app)
        .post('/api/makina-siparisleri')
        .send({
          musteri_adi: 'Test Müşteri'
          // makina_id eksik
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PATCH /api/makina-siparisleri/:id/durum', () => {
    it('durumu güncellemeli ve tamamlanırsa stok girişi yapmalı', async () => {
      const siparis = await MakinaSiparis.create({
        makina_id: testMakina.makina_id,
        musteri_adi: 'Test Müşteri',
        adet: 1,
        durum: 'Beklemede'
      });

      const response = await request(app)
        .patch(`/api/makina-siparisleri/${siparis.siparis_id}/durum`)
        .send({ durum: 'Tamamlandı' });

      expect(response.status).toBe(200);

      // Stok girişi kontrolü
      const stoklar = await MakinaStok.findAll({
        where: { siparis_id: siparis.siparis_id }
      });
      expect(stoklar.length).toBe(1);
      expect(stoklar[0].adet).toBe(1);
    });
  });
});
```

---

### Frontend Testleri

**Dosya**: `frontend/tests/components/MakinaSiparislerModal.test.jsx`

```jsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MakinaSiparislerModal from '@/components/modals/MakinaSiparislerModal';
import makinaSiparisAPI from '@/api/makinaSiparisAPI';

jest.mock('@/api/makinaSiparisAPI');

describe('MakinaSiparislerModal', () => {
  it('siparişleri listelemeli', async () => {
    const mockSiparisler = [
      {
        siparis_id: '1',
        siparis_no: 'SIP-2026-0001',
        musteri_adi: 'Test Müşteri',
        durum: 'Beklemede',
        adet: 1
      }
    ];

    makinaSiparisAPI.getAllSiparisler.mockResolvedValue({
      data: mockSiparisler
    });

    render(<MakinaSiparislerModal open={true} onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('SIP-2026-0001')).toBeInTheDocument();
      expect(screen.getByText('Test Müşteri')).toBeInTheDocument();
    });
  });

  it('yeni sipariş butonu form modalını açmalı', async () => {
    render(<MakinaSiparislerModal open={true} onClose={() => {}} />);

    const addButton = screen.getByText('Yeni Sipariş');
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('Sipariş Formu')).toBeInTheDocument();
    });
  });
});
```

---

## 📝 Geliştirme Kontrol Listesi

### Backend
- [ ] Migration dosyası oluştur ve çalıştır
- [ ] `MakinaSiparis` modelini oluştur
- [ ] `MakinaStok` modelini oluştur
- [ ] Model associations tanımla
- [ ] `MakinaSiparisController` oluştur
- [ ] `MakinaStokController` oluştur
- [ ] Route dosyalarını oluştur
- [ ] `index.js`'e route'ları kaydet
- [ ] Testleri yaz ve çalıştır

### Frontend
- [ ] `makinaSiparisAPI.js` oluştur
- [ ] `makinaStokAPI.js` oluştur
- [ ] `MakinaSiparislerModal` bileşeni
- [ ] `MakinaStoklariModal` bileşeni
- [ ] `SiparisFormModal` bileşeni
- [ ] `StokFormModal` bileşeni
- [ ] `Makinalar.jsx`'i güncelle
- [ ] Testleri yaz ve çalıştır

### Entegrasyon
- [ ] Sipariş → Stok otomatik girişi test et
- [ ] Satış → Stok düşme entegrasyonu
- [ ] Parça stok düşme işlevini koruma testi
- [ ] UI entegrasyon testi

---

## ✅ Tasarım Doğrulama

### Fonksiyonel Gereksinimler
- [x] Sipariş oluşturulabilmeli
- [x] Sipariş durumları yönetilebilmeli
- [x] Tamamlanan sipariş otomatik stoka girebilmeli
- [x] Manuel stok girişi yapılabilmeli
- [x] Stok listelenebilmeli
- [x] Satış ile stoktan düşme entegrasyonu

### UI Gereksinimleri
- [x] 2 yeni buton ana sayfada
- [x] Modal tabanlı listeleme
- [x] Renkli durum badge'leri
- [x] Form validasyonları

### Teknik Gereksinimler
- [x] Veritabanı ilişkileri doğru
- [x] API endpoint'leri tanımlı
- [x] Migration formatı uygun
- [x] Mevcut parça stok işlevi korunacak

---

**Tasarım Dokümanı Versiyon**: 1.0.0
**Son Güncelleme**: 2026-01-04
**Durum**: Implementasyona Hazır
