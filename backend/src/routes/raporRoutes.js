const express = require('express');
const router = express.Router();
const raporController = require('../controllers/raporController');

// İş Emirleri Özeti Raporu
router.get('/is-emri-ozet', raporController.getIsEmriOzetRaporu);
// Tezgah Performans Raporu
router.get('/tezgah-performans', raporController.getTezgahPerformansRaporu);
// Üretim Planlama ve Gerçekleşme Karşılaştırma Raporu
router.get('/planlama-gerceklesme', raporController.getPlanlamaGerceklesmeRaporu);
// Parça Üretim Performans Raporu
router.get('/parca-performans', raporController.getParcaPerformansRaporu);
// Parça Bazlı İş Emirleri Raporu
router.get('/parca-is-emirleri', raporController.getParcaBazliIsEmirleriRaporu);
// Tamamlanan İş Emirleri Raporu
router.get('/tamamlanan-is-emirleri', raporController.getTamamlananIsEmirleriRaporu);
// Üretim İstatistikleri Raporu
router.get('/uretim-istatistikleri', raporController.getUretimIstatistikleriRaporu);

module.exports = router;
