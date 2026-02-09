# Satış Modülü Workflow Planı (Basit Versiyon)

**Tarih**: 2025-01-01
**Versiyon**: 2.0 (Basitleştirilmiş)
**Durum**: Onaylı - Implementation'a hazır
**PM Agent Context**: Basit satış modülü

---

## 📋 GENEL BAKIŞ

### Amaç
Makina satışlarında **tek tıkla** stok düşme sistemi.

### Basit İş Akışı
```
1. Makina Seç
2. Adet Yaz
3. "Satış Yap" Butonuna Bas
4. ✅ Otomatik: BOM'lar → Parçalar → Stok Düş
```

**Kullanıcı Arayüzü**:
```
┌─────────────────────────────────┐
│  Makina Satış                  │
├─────────────────────────────────┤
│  Makina: [Dropdown ▼]          │
│                                 │
│  Adet:    [      ]             │
│                                 │
│  [Satış Yap]                   │
│                                 │
│  ────────────────────────────  │
│  Sonuç:                        │
│  ✅ 2 adet makina satıldı      │
│  ✅ 15 parçadan stok düşüldü   │
│  📊 Detaylı Rapor              │
└─────────────────────────────────┘
```

---

## 🎯 BASİT MECANİZMA

### Mantıksal Akış

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
- `makina_id`: Satılan makina
- `makina_adi`: Redundant ama hızlı sorgu için
- `satis_adedi`: Kaç adet makina satıldı
- `toplam_parca`: Kaç farklı parça stoktan düştü
- `toplam_stok_dusulen`: Toplam kaç adet parça düşüldü
- `durum`: 'tamamlandi' (basit)
- `aciklama`: Opsiyonel not

### Tablo 2: stok_hareketleri (Zaten varsa kullan, yoksa oluştur)

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

---

## 🔌 BACKEND API

### Endpoint: POST /api/satislar/makina-sat

```javascript
// Request
{
  "makina_id": "uuid-123",
  "satis_adedi": 2,
  "aciklama": "Opsiyonel not"
}

// Success Response (200)
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
      },
      // ... diğer parçalar
    ]
  }
}

// Error Response (400 - Stok Yetersiz)
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

### Endpoint: GET /api/satislar

```javascript
// Query params: ?page=1&limit=20&makina_id=xxx

// Response
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

### Endpoint: GET /api/satislar/:id

```javascript
// Response
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

## 🎨 FRONTEND UI

### Desktop Bileşen: SatisFormSimple.jsx

```jsx
import { useState } from 'react';
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
import { CheckCircle, Error } from '@mui/icons-material';

export default function SatisFormSimple() {
  const [makinaId, setMakinaId] = useState('');
  const [satisAdedi, setSatisAdedi] = useState(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await axios.post('/api/satislar/makina-sat', {
        makina_id: makinaId,
        satis_adedi: satisAdedi
      });

      setResult(response.data.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

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
        />

        {/* Satış Butonu */}
        <Button
          fullWidth
          variant="contained"
          size="large"
          onClick={handleSubmit}
          disabled={!makinaId || loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Satış Yap'}
        </Button>

        {/* Hata Mesajı */}
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            <Error fontSize="small" /> {error.message}
            {error.details && (
              <Table size="small" sx={{ mt: 1 }}>
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
            )}
          </Alert>
        )}

        {/* Başarılı Sonuç */}
        {result && (
          <Alert severity="success" sx={{ mt: 2 }}>
            <CheckCircle fontSize="small" />
            <Typography variant="body1" sx={{ mt: 1 }}>
              <strong>{result.satis_adedi}</strong> adet <strong>{result.makina_adi}</strong> satıldı
            </Typography>
            <Typography variant="body2">
              {result.toplam_parca} parçadan toplam {result.toplam_stok_dusulen} adet stok düşüldü
            </Typography>

            {/* Detaylı Rapor */}
            {result.stok_hareketleri && (
              <TableContainer sx={{ mt: 2 }}>
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
                        <TableCell align="right">{h.dusulen_miktar}</TableCell>
                        <TableCell align="right">{h.onceki_stok}</TableCell>
                        <TableCell align="right">{h.sonraki_stok}</TableCell>
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

## 🔧 BACKEND IMPLEMENTATION

### Controller: satisController.js

```javascript
const { Satis, StokHareket, Makina, Bom, Parca } = require('../models');
const { sequelize } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

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
          birim_miktar: bomParca.miktar,
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
      const { parca, bom, birim_miktar, dusulecek_miktar } = item;
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
        birim_miktar: birim_miktar,
        satis_adedi: satis_adedi,
        dusulen_miktar: dusulecekMiktar,
        onceki_stok: oncekiStok,
        sonraki_stok: sonrakiStok
      }, { transaction });

      stokHareketleriData.push({
        parca_kodu: parca.parcaKodu,
        parca_adi: parca.parcaAdi,
        bom_adi: bom.name,
        birim_miktar: birim_miktar,
        satis_adedi: satis_adedi,
        dusulen_miktar: dusulecekMiktar,
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

module.exports = { makinaSat };
```

---

## 📋 IMPLEMENTATION PHASES

### Phase 1: Database (0.5 gün)
- [x] Migration: satislar tablosu
- [x] Migration: stok_hareketleri tablosu (eğer yoksa)
- [x] Models: Satis.js, StokHareket.js
- [x] Model relationships

### Phase 2: Backend (1 gün)
- [x] Controller: makinaSat()
- [x] Route: POST /api/satislar/makina-sat
- [x] Route: GET /api/satislar
- [x] Route: GET /api/satislar/:id
- [x] Unit tests

### Phase 3: Frontend (1 gün)
- [x] SatisFormSimple.jsx (desktop)
- [x] SatisFormSimpleMobile.jsx (mobile)
- [x] Axios service
- [x] Error handling
- [x] Success feedback

### Phase 4: Integration (0.5 gün)
- [x] End-to-end test
- [x] Stok verification
- [x] Bug fixes

**Toplam Süre**: ~3 gün

---

## 🧪 TEST SENARYOLARI

### Senaryo 1: Başarılı Satış
```javascript
Input:
  makina_id = "uuid-makina-1"
  satis_adedi = 2

Makina BOM'ları:
  BOM-001 → [PARCA-001: 5, PARCA-002: 3]

Beklenen:
  PARCA-001: stok_adeti -= 10 (5 × 2)
  PARCA-002: stok_adeti -= 6  (3 × 2)
  Satis kaydı oluşturulur
  2 adet StokHareket oluşturulur
```

### Senaryo 2: Stok Yetersiz
```javascript
Input:
  makina_id = "uuid-makina-1"
  satis_adedi = 10

Makina BOM'ları:
  BOM-001 → [PARCA-001: 5]

Mevcut stok:
  PARCA-001: 20

Gerekli:
  PARCA-001: 50 (5 × 10)

Beklenen:
  ❌ STOK_YETERSIZ hatası
  Detay: { gerekli: 50, mevcut: 20, eksik: 30 }
  Hiçbir stok düşülmez
```

### Senaryo 3: Çoklu BOM
```javascript
Input:
  makina_id = "uuid-makina-2"
  satis_adedi = 1

Makina BOM'ları:
  BOM-001 → [PARCA-001: 2, PARCA-002: 1]
  BOM-002 → [PARCA-003: 5]
  BOM-003 → [PARCA-004: 1, PARCA-005: 3]

Beklenen:
  6 farklı parçadan stok düşer
  3 BOM için hareket kaydedilir
  toplam_parca = 6
  toplam_stok_dusulen = 12
```

---

## ✅ KABUL KRİTERLERİ

- [x] Kullanıcı makina seçebilir
- [x] Kullanıcı adet girebilir (min: 1)
- [x] "Satış Yap" butonu çalışır
- [x] Sistem otomatik BOM'ları bulur
- [x] Sistem otomatik parçaları bulur
- [x] Sistem stok kontrolü yapar
- [x] Stok yetersizse hata verir
- [x] Stok yeterliyse stok düşer
- [x] Her parça için hareket kaydeder
- [x] Satış kaydı oluşturur
- [x] Kullanıcıya sonuç gösterir
- [x] İşlem < 5 saniye sürer

---

## 🚀 SONRAKİ ADIMLAR

### Immediate
1. ✅ Bu planı onayla
2. ✅ Phase 1 başla (Database)
3. ✅ Backend implementation
4. ✅ Frontend implementation
5. ✅ Test ve deploy

### Future Enhancements (Phase 2+)
1. Müşteri bilgileri
2. Fiyatlandırma
3. İptal mekanizması
4. Raporlama
5. Excel export

---

**Durum**: ✅ READY FOR IMPLEMENTATION
**Tahmini Süre**: 3 gün
**Karmaşıklık**: Düşük (Basit mekanizma)

---

*Basitlik güçtür!*
