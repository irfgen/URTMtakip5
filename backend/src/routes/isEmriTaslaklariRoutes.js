const express = require('express');
const router = express.Router();

const {
    createTaslaklarFromExcel,
    getTaslaklarByOturum,
    updateTaslak,
    deleteTaslak,
    publishTaslaklar,
    deleteOturum
} = require('../controllers/isEmriTaslaklariController');

// Excel'den taslak oluştur
router.post('/create-from-excel', createTaslaklarFromExcel);

// Oturuma göre taslakları getir
router.get('/oturum/:oturumId', getTaslaklarByOturum);

// Taslağı güncelle
router.put('/:taslakId', updateTaslak);

// Taslağı sil
router.delete('/:taslakId', deleteTaslak);

// Oturumdaki tüm taslakları yayınla (iş emirlerine dönüştür)
router.post('/oturum/:oturumId/publish', publishTaslaklar);

// Oturumdaki tüm taslakları sil
router.delete('/oturum/:oturumId', deleteOturum);

module.exports = router;
