const express = require('express');
const router = express.Router();
const cncLinkController = require('../controllers/cncLinkController');

/**
 * CNC Link API Routes
 * ESP32 CNC sistemleri ile iletişim için API endpoint'leri
 */

/**
 * @route GET /api/cnc_link/is-emri-id/:tezgah_id
 * @desc Tezgaha atanmış aktif iş emri ID'sini getir
 * @access Public (ESP32 için)
 * @params {number} tezgah_id - Tezgah ID
 */
router.get('/is-emri-id/:tezgah_id', cncLinkController.getIsEmriId);

/**
 * @route POST /api/cnc_link/parca-tamamlandi
 * @desc Parça işleme tamamlandı bildirimi al
 * @access Public (ESP32 için)
 * @body {object} parcaVerisi - Parça işleme bilgileri
 */
router.post('/parca-tamamlandi', cncLinkController.parcaTamamlandi);

/**
 * @route GET /api/cnc_link/health
 * @desc CNC Link sistemi sağlık kontrolü
 * @access Public
 */
router.get('/health', cncLinkController.healthCheck);

/**
 * @route GET /api/cnc_link/queue-status
 * @desc ESP32 veri kuyruğu durumu
 * @access Public
 */
router.get('/queue-status', cncLinkController.queueStatus);

/**
 * @route GET /api/cnc_link/stats/:tezgah_id
 * @desc Tezgah günlük istatistikleri
 * @access Public
 * @params {number} tezgah_id - Tezgah ID
 * @query {string} tarih - Tarih (YYYY-MM-DD formatında, opsiyonel)
 */
router.get('/stats/:tezgah_id', cncLinkController.getTezgahStats);

module.exports = router; 