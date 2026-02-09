const express = require('express');
const router = express.Router();
const {
  getVardiyaTezgahRaporu,
  getAktifVardiyalar,
  prepareExportData,
  getTezgahUretimZamanCizelgesi
} = require('../controllers/raporlarController');

/**
 * @route GET /api/raporlar/vardiya-tezgah
 * @desc Günlük tezgah çalışma raporu - Tek tarih için tüm vardiyalar
 * @access Public
 * @query {string} tarih - Rapor tarihi (YYYY-MM-DD, varsayılan: bugün)
 * @description Her tezgah için tüm vardiyalardaki (gündüz, gece) çalışma bilgileri ayrı ayrı gösterilir
 */
router.get('/vardiya-tezgah', getVardiyaTezgahRaporu);

/**
 * @route GET /api/raporlar/aktif-vardiyalar
 * @desc Aktif vardiyaları getir
 * @access Public
 */
router.get('/aktif-vardiyalar', getAktifVardiyalar);

/**
 * @route GET /api/raporlar/export-data
 * @desc Export için veri hazırla
 * @access Public
 * @query {number} vardiya_id - Vardiya ID (zorunlu)
 * @query {string} baslangic_tarihi - Başlangıç tarihi (YYYY-MM-DD)
 * @query {string} bitis_tarihi - Bitiş tarihi (YYYY-MM-DD)
 * @query {string} format - Export formatı (excel|pdf)
 */
router.get('/export-data', prepareExportData);

/**
 * @route GET /api/raporlar/tezgah-uretim-zaman-cizelgesi
 * @desc Tezgah bazlı üretim zaman çizelgesi (Gantt)
 * @access Public
 * @query {string} baslangic - Başlangıç tarihi (YYYY-MM-DD)
 * @query {string} bitis - Bitiş tarihi (YYYY-MM-DD)
 */
router.get('/tezgah-uretim-zaman-cizelgesi', getTezgahUretimZamanCizelgesi);

/**
 * @route GET /api/raporlar/test
 * @desc Test endpoint
 * @access Public
 */
router.get('/test', (req, res) => {
  res.json({ 
    message: 'Raporlar API çalışıyor',
    timestamp: new Date().toISOString(),
    endpoints: [
      'GET /api/raporlar/vardiya-tezgah',
      'GET /api/raporlar/aktif-vardiyalar',
      'GET /api/raporlar/export-data'
    ]
  });
});

module.exports = router;