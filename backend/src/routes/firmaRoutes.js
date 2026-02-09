const express = require('express');
const router = express.Router();
const firmaController = require('../controllers/firmaController');

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

// Request logging middleware
const logRequest = (req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`, {
    query: req.query,
    body: req.method !== 'GET' ? req.body : undefined
  });
  next();
};

// Routes

// GET /api/firmalar - Firma listesi (sayfalama, arama, filtreleme)
router.get('/', logRequest, firmaController.listFirmalar);

// GET /api/firmalar/istatistikler - Firma istatistikleri
router.get('/istatistikler', logRequest, firmaController.getFirmaIstatistikler);

// GET /api/firmalar/aktif - Aktif firmalar
router.get('/aktif', logRequest, (req, res) => {
  req.query.durum = 'aktif';
  return firmaController.listFirmalar(req, res);
});

// GET /api/firmalar/pasif - Pasif firmalar
router.get('/pasif', logRequest, (req, res) => {
  req.query.durum = 'pasif';
  return firmaController.listFirmalar(req, res);
});

// GET /api/firmalar/search/:arama - Firma arama
router.get('/search/:arama', logRequest, (req, res) => {
  req.query.arama = req.params.arama;
  return firmaController.listFirmalar(req, res);
});

// GET /api/firmalar/:id - Firma detayı
router.get('/:id', logRequest, validateId, firmaController.getFirma);

// POST /api/firmalar - Yeni firma oluştur
router.post('/', logRequest, firmaController.createFirma);

// PUT /api/firmalar/:id - Firma güncelle
router.put('/:id', logRequest, validateId, firmaController.updateFirma);

// DELETE /api/firmalar/:id - Firma sil
router.delete('/:id', logRequest, validateId, firmaController.deleteFirma);

// PATCH /api/firmalar/:id/durum - Firma durum değiştir
router.patch('/:id/durum', logRequest, validateId, firmaController.changeDurum);

// Error handling middleware
router.use((error, req, res, next) => {
  console.error('Firma route hatası:', error);

  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Sunucu hatası oluştu',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

module.exports = router;