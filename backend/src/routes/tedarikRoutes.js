const express = require('express');
const router = express.Router();
const tedarikTalebiController = require('../controllers/tedarikTalebiController');

// Input validation middleware
const validateTedarikTalebi = (req, res, next) => {
  const { kaynak_tipi, parca_kodu, stok_karti_id, detaylar } = req.body;

  // Kaynak tipi zorunlu
  if (!kaynak_tipi) {
    return res.status(400).json({
      success: false,
      message: 'Kaynak tipi alanı zorunludur'
    });
  }

  // Geçerli kaynak tipi kontrolü
  const gecerliKaynakTipleri = ['is_emri', 'parca', 'stok_karti', 'manuel'];
  if (!gecerliKaynakTipleri.includes(kaynak_tipi)) {
    return res.status(400).json({
      success: false,
      message: 'Geçersiz kaynak tipi. Geçerli değerler: ' + gecerliKaynakTipleri.join(', ')
    });
  }

  // En azından parça kodu veya stok kartı belirtilmeli ( Manuel hariç)
  if (kaynak_tipi !== 'manuel' && !parca_kodu && !stok_karti_id) {
    return res.status(400).json({
      success: false,
      message: 'Parça kodu veya stok kartı belirtilmelidir'
    });
  }

  // Detay validasyonu
  if (detaylar && Array.isArray(detaylar)) {
    for (let i = 0; i < detaylar.length; i++) {
      const detay = detaylar[i];

      if (!detay.malzeme_adi || detay.malzeme_adi.trim() === '') {
        return res.status(400).json({
          success: false,
          message: `Detay ${i + 1}: Malzeme adı zorunludur`
        });
      }

      if (!detay.miktar || parseFloat(detay.miktar) <= 0) {
        return res.status(400).json({
          success: false,
          message: `Detay ${i + 1}: Miktar 0\'dan büyük olmalıdır`
        });
      }

      if (detay.birim_fiyat && parseFloat(detay.birim_fiyat) < 0) {
        return res.status(400).json({
          success: false,
          message: `Detay ${i + 1}: Birim fiyat 0 veya pozitif olmalıdır`
        });
      }
    }
  }

  next();
};

// ID validation middleware
const validateId = (req, res, next) => {
  const { id } = req.params;

  if (!id || isNaN(id) || parseInt(id) <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Geçersiz ID parametresi'
    });
  }

  next();
};

// Kaynak validation middleware
const validateKaynak = (req, res, next) => {
  const { kaynak_tipi } = req.params;

  const gecerliKaynakTipleri = ['is_emri', 'parca', 'stok_karti', 'manuel'];
  if (!gecerliKaynakTipleri.includes(kaynak_tipi)) {
    return res.status(400).json({
      success: false,
      message: 'Geçersiz kaynak tipi. Geçerli değerler: ' + gecerliKaynakTipleri.join(', ')
    });
  }

  req.kaynak_tipi = kaynak_tipi;
  next();
};

// Request logging middleware
const logRequest = (req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`, {
    query: req.query,
    body: req.method !== 'GET' ? req.body : undefined
  });
  next();
};

// Routes

// GET /api/tedarik - Liste (sayfalama, arama, filtreleme)
router.get('/', logRequest, tedarikTalebiController.listTedarikTalepleri);

// GET /api/tedarik/istatistikler - İstatistikler
router.get('/istatistikler', logRequest, tedarikTalebiController.getIstatistikler);

// GET /api/tedarik/kaynak/:kaynak_tipi/:kaynak_id - Kaynağa göre talepler
router.get('/kaynak/:kaynak_tipi/:kaynak_id',
  logRequest,
  validateKaynak,
  tedarikTalebiController.getByKaynak
);

// GET /api/tedarik/:id - Detay
router.get('/:id', logRequest, validateId, tedarikTalebiController.getTedarikTalebiDetay);

// POST /api/tedarik - Yeni talep
router.post('/', logRequest, validateTedarikTalebi, tedarikTalebiController.createTedarikTalebi);

// PUT /api/tedarik/:id - Güncelleme
router.put('/:id', logRequest, validateId, tedarikTalebiController.updateTedarikTalebi);

// DELETE /api/tedarik/:id - Silme
router.delete('/:id', logRequest, validateId, tedarikTalebiController.deleteTedarikTalebi);

// POST /api/tedarik/:id/onayla - Talep onayla
router.post('/:id/onayla', logRequest, validateId, tedarikTalebiController.onaylaTedarikTalebi);

// POST /api/tedarik/:id/reddet - Talep reddet
router.post('/:id/reddet', logRequest, validateId, tedarikTalebiController.reddetTedarikTalebi);

// POST /api/tedarik/:id/sipariste - Siparişte güncelle
router.post('/:id/sipariste', logRequest, validateId, tedarikTalebiController.siparisteGuncelle);

// POST /api/tedarik/:id/irsaliye-tamamla - İrsaliye ekle ve tamamla
router.post('/:id/irsaliye-tamamla',
  logRequest,
  validateId,
  tedarikTalebiController.irsaliyeEkleVeTamamla
);

// Error handling middleware
router.use((error, req, res, next) => {
  console.error('Tedarik route hatası:', error);

  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Sunucu hatası oluştu',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

module.exports = router;