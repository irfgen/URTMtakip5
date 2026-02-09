const express = require('express');
const bomController = require('../controllers/bomController');
const router = express.Router();

// BOM CRUD operasyonları
router.get('/boms', bomController.listBoms);
router.post('/boms', bomController.createBom);
router.get('/boms/:id', bomController.getBomDetail);
router.put('/boms/:id', bomController.updateBom);
router.delete('/boms/:id', bomController.deleteBom);

// Arama endpoint'leri (Form içinde kullanılacak)
router.get('/search/parts', bomController.searchParts); // Parça arama
router.get('/search/boms', bomController.searchBoms);   // Diğer BOM'ları arama

// Yeni maliyet endpoint'leri
router.get('/parts/:parcaKodu/unit-cost', bomController.getPartUnitCost); // Parça birim maliyeti

module.exports = router;