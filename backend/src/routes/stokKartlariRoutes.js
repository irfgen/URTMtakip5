const express = require('express');
const router = express.Router();
const stokKartlariController = require('../controllers/stokKartlariController');

// Input validation middleware
const validateStokKarti = (req, res, next) => {
  const { kesit, malzeme_cinsi, adet, kritik_stok_miktari } = req.body;
  
  // Zorunlu alanları kontrol et
  if (!kesit || !malzeme_cinsi) {
    return res.status(400).json({
      success: false,
      message: 'Kesit ve Malzeme Cinsi alanları zorunludur'
    });
  }

  // Sayısal alanları kontrol et
  if (adet !== undefined && (isNaN(adet) || adet < 0)) {
    return res.status(400).json({
      success: false,
      message: 'Adet 0 veya pozitif bir sayı olmalı'
    });
  }

  if (kritik_stok_miktari !== undefined && (isNaN(kritik_stok_miktari) || kritik_stok_miktari < 0)) {
    return res.status(400).json({
      success: false,
      message: 'Kritik stok miktarı 0 veya pozitif bir sayı olmalı'
    });
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

// Request logging middleware
const logRequest = (req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`, {
    query: req.query,
    body: req.method !== 'GET' ? req.body : undefined
  });
  next();
};

// Routes

// GET /api/stok-kartlari - Liste (sayfalama, arama, filtreleme)
router.get('/', logRequest, stokKartlariController.listStokKartlari);

// GET /api/stok-kartlari/kritik-stok - Kritik stok listesi
router.get('/kritik-stok', logRequest, stokKartlariController.getKritikStoklar);

// GET /api/stok-kartlari/istatistikler - Stok istatistikleri
router.get('/istatistikler', logRequest, stokKartlariController.getStokIstatistikleri);

// GET /api/stok-kartlari/firmalar - Firma listesi
router.get('/firmalar', logRequest, stokKartlariController.getFirmalar);

// GET /api/stok-kartlari/malzeme-cinsleri - Malzeme cinsi listesi
router.get('/malzeme-cinsleri', logRequest, stokKartlariController.getMalzemeCinsleri);

// GET /api/stok-kartlari/search - Gelişmiş arama
router.get('/search', logRequest, stokKartlariController.searchStokKartlari);

// GET /api/stok-kartlari/:id - Detay
router.get('/:id', logRequest, validateId, stokKartlariController.getStokKartiDetay);

// POST /api/stok-kartlari - Yeni kayıt
router.post('/', logRequest, validateStokKarti, stokKartlariController.createStokKarti);

// PUT /api/stok-kartlari/:id - Güncelleme
router.put('/:id', logRequest, validateId, validateStokKarti, stokKartlariController.updateStokKarti);

// DELETE /api/stok-kartlari/:id - Silme
router.delete('/:id', logRequest, validateId, stokKartlariController.deleteStokKarti);

// Error handling middleware
router.use((error, req, res, next) => {
  console.error('Stok kartları route hatası:', error);
  
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Sunucu hatası oluştu',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

module.exports = router;
