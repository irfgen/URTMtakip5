const express = require('express');
const router = express.Router();
const tamamlananIsController = require('../controllers/tamamlananIsController');

// Tezgaha göre tamamlanan işleri getir
router.get('/tezgah/:tezgahId', tamamlananIsController.getTamamlananIslerByTezgah);

// İş emrine göre tamamlanan işleri getir
router.get('/is-emri/:isEmriId', tamamlananIsController.getTamamlananIslerByIsEmri);

// Parça koduna göre tamamlanan işleri getir (Parça üretim geçmişi için)
router.get('/parca/:parcaKodu', tamamlananIsController.getTamamlananIslerByParcaKodu);

// Tarih aralığına göre tamamlanan işleri getir
router.get('/', tamamlananIsController.getTamamlananIslerByDateRange);

module.exports = router;
