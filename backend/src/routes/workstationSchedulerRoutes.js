const express = require('express');
const router = express.Router();
const workstationSchedulerController = require('../controllers/workstationSchedulerController');

/**
 * Workstation Scheduler API Routes
 * 
 * Base URL: /api/scheduler
 * 
 * Bu dosya tezgah iş planı modülünün tüm API endpoint'lerini tanımlar
 */

// ============================================================================
// TIMELINE VERİLERİ - Ana endpoint
// ============================================================================

/**
 * GET /api/scheduler/timeline
 * Timeline verilerini getir
 * 
 * Query Parameters:
 * - startDate (required): Başlangıç tarihi (YYYY-MM-DD)
 * - endDate (required): Bitiş tarihi (YYYY-MM-DD)
 * - workstationIds (optional): Tezgah ID'leri (1,2,3)
 * - statuses (optional): Durum filtreleri (planli,devam_ediyor)
 */
router.get('/timeline', workstationSchedulerController.getSchedulerTimeline);

// ============================================================================
// PLANLAMA YÖNETİMİ
// ============================================================================

/**
 * POST /api/scheduler/tasks
 * Yeni planlama oluştur
 * 
 * Body:
 * {
 *   "tezgah_id": 1,
 *   "is_emri_id": 123,
 *   "baslangic_zamani": "2025-01-09T08:00:00.000Z",
 *   "bitis_zamani": "2025-01-09T16:00:00.000Z",
 *   "oncelik": 2,
 *   "notlar": "Test planlaması"
 * }
 */
router.post('/tasks', workstationSchedulerController.createScheduledTask);

/**
 * PUT /api/scheduler/tasks/:taskId
 * Planlamayı güncelle (drag & drop için)
 * 
 * Body:
 * {
 *   "baslangic_zamani": "2025-01-09T09:00:00.000Z",
 *   "bitis_zamani": "2025-01-09T17:00:00.000Z",
 *   "tezgah_id": 2,
 *   "oncelik": 3,
 *   "notlar": "Güncellenmiş not"
 * }
 */
router.put('/tasks/:taskId', workstationSchedulerController.updateScheduledTask);

/**
 * DELETE /api/scheduler/tasks/:taskId
 * Planlamayı sil
 */
router.delete('/tasks/:taskId', workstationSchedulerController.deleteScheduledTask);

// ============================================================================
// ANALİZ ve İSTATİSTİKLER
// ============================================================================

/**
 * GET /api/scheduler/conflicts
 * Çakışma analizi
 * 
 * Query Parameters:
 * - startDate (required): Başlangıç tarihi
 * - endDate (required): Bitiş tarihi
 * - workstationIds (optional): Analiz edilecek tezgahlar
 */
router.get('/conflicts', workstationSchedulerController.getConflicts);

/**
 * GET /api/scheduler/statistics
 * Dashboard istatistikleri
 * 
 * Query Parameters:
 * - startDate (optional): İstatistik başlangıç tarihi
 * - endDate (optional): İstatistik bitiş tarihi
 */
router.get('/statistics', workstationSchedulerController.getSchedulerStatistics);

// ============================================================================
// MIDDLEWARE - Error Handling
// ============================================================================

// Route bulunamadı hatası
router.use((req, res, next) => {
  res.status(404).json({
    error: 'API endpoint bulunamadı',
    code: 'ENDPOINT_NOT_FOUND',
    available_endpoints: [
      'GET /api/scheduler/timeline',
      'POST /api/scheduler/tasks',
      'PUT /api/scheduler/tasks/:taskId',
      'DELETE /api/scheduler/tasks/:taskId',
      'GET /api/scheduler/conflicts',
      'GET /api/scheduler/statistics'
    ]
  });
});

// Hata yakalama middleware
router.use((error, req, res, next) => {
  console.error('Scheduler API Error:', error);
  
  res.status(500).json({
    error: 'Scheduler API hatası',
    code: 'SCHEDULER_API_ERROR',
    message: error.message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

module.exports = router;