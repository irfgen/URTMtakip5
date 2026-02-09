const express = require('express');
const router = express.Router();
const importExportController = require('../controllers/importExportController');

/**
 * Import-Export Routes
 * SolidWorks dosyalarının import ve export işlemleri için API endpoints
 */

// =====================
// İNDEKSLEME İŞLEMLERİ
// =====================

/**
 * Klasör indeksleme - SolidWorks dosyalarını tarayarak indeksler
 * POST /api/import-export/index-folder
 * Body: { folderPath: string, options?: object }
 */
router.post('/index-folder', importExportController.indexFolder);

/**
 * İndekslenen dosyalar listesi - sayfalandırma, filtreleme ve arama desteği
 * GET /api/import-export/index-list
 * Query: page, limit, status, extension, search
 */
router.get('/index-list', importExportController.getIndexList);

/**
 * İndeks kaydını sil
 * DELETE /api/import-export/index/:indexId
 */
router.delete('/index/:indexId', importExportController.deleteIndexRecord);

/**
 * İndeks durumunu güncelle
 * PUT /api/import-export/index/:indexId/status
 * Body: { status: string, error_message?: string }
 */
router.put('/index/:indexId/status', importExportController.updateIndexStatus);

/**
 * Parça varlık kontrolünü yenile
 * POST /api/import-export/refresh-parts-check
 */
router.post('/refresh-parts-check', importExportController.refreshPartsCheck);

// ==================
// İMPORT İŞLEMLERİ
// ==================

/**
 * Tekil parça import - belirtilen indeks kaydını import eder
 * POST /api/import-export/import-single/:indexId
 */
router.post('/import-single/:indexId', importExportController.importSingle);

/**
 * Toplu import başlat - tüm hazır dosyaları sırayla import eder
 * POST /api/import-export/bulk-import
 * Body: { job_name?: string, maxFiles?: number, config?: object }
 */
router.post('/bulk-import', importExportController.startBulkImport);

/**
 * Toplu import durdur
 * POST /api/import-export/stop-bulk-import
 */
router.post('/stop-bulk-import', importExportController.stopBulkImport);

// ===================
// DURUM VE İSTATİSTİK
// ===================

/**
 * Import durumu özeti - genel durum bilgileri
 * GET /api/import-export/status
 */
router.get('/status', importExportController.getImportStatus);

/**
 * Import istatistikleri
 * GET /api/import-export/statistics
 * Query: period (7d, 30d, 90d)
 */
router.get('/statistics', importExportController.getStatistics);

// =================
// İŞ YÖNETİMİ
// =================

/**
 * Import iş geçmişi
 * GET /api/import-export/job-history
 * Query: page, limit
 */
router.get('/job-history', importExportController.getJobHistory);

/**
 * Import iş detayı
 * GET /api/import-export/job/:jobId
 */
router.get('/job/:jobId', importExportController.getJobDetail);

// ===================
// TEST VE DOĞRULAMA
// ===================

/**
 * SolidWorks bağlantı testi
 * GET /api/import-export/test-solidworks
 */
router.get('/test-solidworks', importExportController.testSolidWorksConnection);

// ================
// EXPORT İŞLEMLERİ (İleriki sürümlerde geliştirilecek)
// ================

/**
 * Parça listesini export et
 * POST /api/import-export/export-parts
 * Body: { format: 'csv'|'xlsx'|'json', part_ids?: number[], filters?: object }
 */
router.post('/export-parts', (req, res) => {
    res.status(501).json({
        success: false,
        message: 'Export functionality will be implemented in future versions'
    });
});

/**
 * Export arşivi oluştur (görsellerle birlikte)
 * POST /api/import-export/export-archive
 * Body: { part_ids: number[], include_images: boolean }
 */
router.post('/export-archive', (req, res) => {
    res.status(501).json({
        success: false,
        message: 'Export archive functionality will be implemented in future versions'
    });
});

// ================
// ERROR HANDLING
// ================

/**
 * Route bulunamadı hatası
 */
router.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: `Import-Export endpoint bulunamadı: ${req.method} ${req.originalUrl}`
    });
});

/**
 * Genel hata yakalayıcı
 */
router.use((error, req, res, next) => {
    console.error('[ImportExportRoutes] Beklenmeyen hata:', error);
    
    res.status(500).json({
        success: false,
        error: 'İç sunucu hatası',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
});

module.exports = router;