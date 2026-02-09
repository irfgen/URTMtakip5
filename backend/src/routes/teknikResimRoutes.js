const express = require('express');
const router = express.Router();
const teknikResimController = require('../controllers/teknikResimController');
const teknikResimErrorHandler = require('../middleware/errorHandler');

// Test endpoint - rate limit yok
router.get('/test', teknikResimController.test);

// Health check endpoint
router.get('/health', teknikResimController.healthCheck);

// Ana teknik resim analiz endpoint'i
// Rate limiting, upload ve validation middleware'leri uygula
router.post('/analiz', 
  teknikResimController.applyRateLimit,
  teknikResimController.applyUpload,
  teknikResimController.applyValidation,
  teknikResimController.analyzeDrawing
);

// Interactive teknik resim analiz endpoint'i
router.post('/analiz-interactive', 
  teknikResimController.applyRateLimit,
  teknikResimController.applyUpload,
  teknikResimController.applyValidation,
  teknikResimController.analyzeDrawingInteractive
);

// Error handler middleware'ini en sona ekle
router.use(teknikResimErrorHandler);

module.exports = router; 