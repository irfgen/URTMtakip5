const express = require('express');
const router = express.Router();
const parcaImportController = require('../controllers/parcaImportController');

// Eski Excel import endpoint'i (frontend hala bunu kullanıyor)
router.post('/import-excel', parcaImportController.importExcel);

// Excel'den içe aktarılan parçaları toplu kaydetme endpoint'i
router.post('/save-excel-parcalar', parcaImportController.saveExcelParcalar);

// Yeni JSON/resim import endpoint'i
router.post('/import', parcaImportController.importParcalar);

module.exports = router;
