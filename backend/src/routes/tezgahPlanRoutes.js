const express = require('express');
const router = express.Router();
const { getPlanlanmisIsEmirleri, getPlanlanmisIsSayisi, planlananIsEkle, planlananIsleriSil, siralariGuncelle } = require('../controllers/tezgahPlanController');

// Tezgah için planlanan iş emirlerini getir
router.get('/:tezgahId/planlanan-isler', getPlanlanmisIsEmirleri);

// Tezgah için planlanan işlerin sırasını güncelle
router.put('/:tezgahId/siralari-guncelle', siralariGuncelle);

// Tezgah için planlanan işlerin sayısını getir
router.get('/:tezgahId/planlanan-is-sayisi', getPlanlanmisIsSayisi);

// Planlanan iş ekle
router.post('/:tezgahId/planla', planlananIsEkle);

// Bir iş başlatıldığında, o işin diğer tezgahlardan planlama listesinden kaldırılması
router.delete('/planlanan-isler/:isEmriId', planlananIsleriSil);

module.exports = router;
