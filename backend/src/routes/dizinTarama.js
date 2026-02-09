const express = require('express');
const router = express.Router();
const dizinTaramaController = require('../controllers/dizinTaramaController');

// Dizin analizi yap
router.post('/analiz', dizinTaramaController.analizDizin);

// Dizin varlığını kontrol et
router.post('/kontrol', dizinTaramaController.kontrolDizin);

// Alt dizinleri listele
router.post('/listele', dizinTaramaController.listeDizinler);

// Client tarama sonuçlarını al
router.post('/client-result', dizinTaramaController.clientSonucuAl);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ success: true, message: 'Dizin tarama servisi çalışıyor' });
});

// 🆕 v1.2.0 - Parça bilgisi endpoint'leri
// Tek parça bilgisi getir
router.post('/part-info', dizinTaramaController.getPartInfo);

// Toplu parça bilgisi getir
router.post('/bulk-part-info', dizinTaramaController.getBulkPartInfo);

// Parça adına göre arama
router.post('/search-parts', dizinTaramaController.searchPartByName);

// Parça varlık kontrolü (GET endpoint)
router.get('/part-exists/:name', (req, res) => {
  const { name } = req.params;
  // getPartInfo ile aynı mantık ama sadece varlık kontrolü
  dizinTaramaController.getPartInfo({ body: { partName: name } }, res);
});

// 🆕 v1.2.3 - Parça CAD dosya yolları güncelleme endpoint'leri
// Tek parça CAD dosya yollarını güncelle
router.put('/update-cad-paths/:parcaKodu', dizinTaramaController.updatePartCADPaths);

// Toplu parça CAD dosya yollarını güncelle
router.put('/bulk-update-cad-paths', dizinTaramaController.updateBulkPartCADPaths);

// 🆕 YENİ - Toplu parça kaydetme (dizin tarama sonuçlarını veritabanına aktar)
router.post('/save-parts', dizinTaramaController.savePartsToDatabase);

module.exports = router;