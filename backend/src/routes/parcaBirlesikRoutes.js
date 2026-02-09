const express = require('express');
const router = express.Router();
const ParcaBirlesikController = require('../controllers/parcaBirlesikController');

// Tekrarlanan parçaları listele
router.get('/tekrarli-parcalar', ParcaBirlesikController.getTekrarliParcalar);

// Birleştirme önizlemesi
router.post('/birlestirme-onizleme', ParcaBirlesikController.birlestirmeOnizlemesi);

// Parça birleştirme işlemi
router.post('/birlestir', ParcaBirlesikController.birlestirParcalar);

// Birleştirme geçmişi
router.get('/gecmis', ParcaBirlesikController.getBirlestirmeGecmisi);

// Birleştirme geri alma
router.post('/rollback/:log_id', ParcaBirlesikController.rollbackBirlestirme);

module.exports = router;