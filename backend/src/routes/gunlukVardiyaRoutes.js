/**
 * Günlük Vardiya Raporu Routes
 *
 * Bu route modülü, günlük vardiya raporu API endpoint'lerini tanımlar.
 *
 * @author PM Agent
 * @version 1.0.0
 * @since 2026-01-06
 */

const express = require('express');
const router = express.Router();
const {
  getGunlukVardiyaRaporu,
  getGunlukVardiyaOzet
} = require('../controllers/gunlukVardiyaController');

/**
 * GET /api/raporlar/gunluk-vardiya
 *
 * Günlük vardiya raporu endpoint'i
 *
 * Query Parameters:
 * - tarih (required): Rapor tarihi (YYYY-MM-DD format)
 * - tezgah_id (optional): Belirli tezgah filtreleme
 * - vardiya_id (optional): Belirli vardiya filtreleme
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "tarih": "2026-01-05",
 *     "ozet": { ... },
 *     "tezgahlar": [ ... ]
 *   }
 * }
 */
router.get('/', getGunlukVardiyaRaporu);

/**
 * GET /api/raporlar/gunluk-vardiya/ozet
 *
 * Özet istatistikler endpoint'i
 *
 * Query Parameters:
 * - tarih (required): Rapor tarihi (YYYY-MM-DD format)
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "toplam_tezgah": 10,
 *     "toplam_is_emri": 25,
 *     "tamamlanan_is_emri": 15,
 *     "aktif_is_emri": 10
 *   }
 * }
 */
router.get('/ozet', getGunlukVardiyaOzet);

module.exports = router;
