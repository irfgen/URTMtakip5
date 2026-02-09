const express = require('express');
const router = express.Router();
const islemKaydiController = require('../controllers/islemKaydiController');

// İş emrine ait işlem kayıtlarını getir
router.get('/is-emri/:isEmriId', islemKaydiController.getIslemKayitlariByIsEmri);

// Tezgaha ait işlem kayıtlarını getir
router.get('/tezgah/:tezgahId', islemKaydiController.getIslemKayitlariByTezgah);

// İş emrine ait istatistikleri hesapla
router.get('/is-emri/:isEmriId/istatistikler', islemKaydiController.calculateIsEmriStats);

module.exports = router;