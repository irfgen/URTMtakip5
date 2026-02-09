const express = require('express');
const makinaController = require('../controllers/makinaController');
const router = express.Router();

// Makina CRUD operasyonları
router.get('/makinalar', makinaController.listMakinalar);
router.post('/makinalar', makinaController.createMakina);
router.get('/makinalar/:id', makinaController.getMakinaDetail);
router.put('/makinalar/:id', makinaController.updateMakina);
router.delete('/makinalar/:id', makinaController.deleteMakina);

// Arama endpoint'leri (Form içinde kullanılacak)
router.get('/search/parts', makinaController.searchParts); // Parça arama
router.get('/search/boms', makinaController.searchBoms);   // BOM (gruplar) arama

// Makina sınıfları endpoint'i
router.get('/makina-siniflari', makinaController.getMakinaSiniflari);

module.exports = router;