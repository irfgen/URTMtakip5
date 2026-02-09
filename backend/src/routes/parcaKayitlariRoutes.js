const express = require('express');
const router = express.Router();
const parcaKayitlariController = require('../controllers/parcaKayitlariController');

// Get all records for a specific part
router.get('/parca/:parcaKodu', parcaKayitlariController.parcaKayitlariniGetir);

// Add new record with file upload
router.post('/parca/:parcaKodu', parcaKayitlariController.kayitEkle);

// Update record notes
router.put('/:id', parcaKayitlariController.kayitGuncelle);

// Delete record
router.delete('/:id', parcaKayitlariController.kayitSil);

// Serve uploaded files
router.get('/dosya/:filename', parcaKayitlariController.dosyaServisEt);

module.exports = router;
