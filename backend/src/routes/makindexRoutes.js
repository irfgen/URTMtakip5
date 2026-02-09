const express = require('express');
const router = express.Router();
const makindexController = require('../controllers/makindexController');
const rateLimit = require('express-rate-limit');

// Rate limiting for search endpoints
const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 dakika
  max: 100, // 1 dakikada max 100 arama
  message: {
    success: false,
    message: 'Arama limiti aşıldı. Lütfen biraz bekleyin.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting for data endpoints
const dataLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 dakika
  max: 200, // 1 dakikada max 200 istek
  message: {
    success: false,
    message: 'İstek limiti aşıldı. Lütfen biraz bekleyin.'
  }
});

// Makina Sınıfları Endpoints
router.get('/siniflar', dataLimiter, makindexController.getSiniflar);
router.get('/siniflar/:id', dataLimiter, makindexController.getSinifById);
router.post('/siniflar', dataLimiter, makindexController.createSinif);
router.put('/siniflar/:id', dataLimiter, makindexController.updateSinif);
router.delete('/siniflar/:id', dataLimiter, makindexController.deleteSinif);

// Makinalar Endpoints
router.get('/makinalar/:sinifId', dataLimiter, makindexController.getMakinalarBySinifId);

// BOM'lar Endpoints
router.get('/boms/:makinaId', dataLimiter, makindexController.getBomsByMakinaId);

// Grup Endpoints (BOM'ların grup formatı)
router.get('/ozel-gruplar', dataLimiter, makindexController.getOzelGruplar);
router.get('/grup-ara', searchLimiter, makindexController.grupAra);
router.get('/marka/:marka/gruplar', dataLimiter, makindexController.getGruplarByMarka);

// Parçalar Endpoints
router.get('/parcalar/:bomId', dataLimiter, makindexController.getParcalarByBomId);

// Global Arama Endpoint
router.get('/ara', searchLimiter, makindexController.globalAra);

// Hiyerarşi Detayları Endpoint (tek seferde birden fazla seviye)
router.get('/hierarchy', dataLimiter, makindexController.getHierarchyDetails);

// Seed Data Endpoint (sadece admin için)
router.post('/seed', makindexController.seedData);

// Test Data Endpoint (performans testi için)
router.get('/test-data', makindexController.generateTestData);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Makindex API çalışıyor',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;