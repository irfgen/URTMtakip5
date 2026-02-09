const importService = require('../services/importService');
const ImportIndex = require('../models/ImportIndex');
const ImportJob = require('../models/ImportJob');
const Parca = require('../models/Parca');
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');

/**
 * Import-Export Controller
 * SolidWorks dosyalarının import ve export işlemlerini yönetir
 */

/**
 * Klasör indeksleme işlemi başlat
 * POST /api/import-export/index-folder
 */
exports.indexFolder = async (req, res) => {
    try {
        const { folderPath, options = {} } = req.body;

        if (!folderPath) {
            return res.status(400).json({
                success: false,
                error: 'Klasör yolu gereklidir'
            });
        }

        if (!fs.existsSync(folderPath)) {
            return res.status(400).json({
                success: false,
                error: 'Belirtilen klasör bulunamadı'
            });
        }

        console.log(`[ImportExport] Klasör indeksleme başlatılıyor: ${folderPath}`);

        const result = await importService.indexFolder(folderPath, options);

        res.json({
            success: true,
            message: 'Klasör indeksleme başarıyla tamamlandı',
            data: result
        });

    } catch (error) {
        console.error('[ImportExport] İndeksleme hatası:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * İndekslenen dosyaların listesini getir
 * GET /api/import-export/index-list
 */
exports.getIndexList = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 50,
            status,
            extension,
            search
        } = req.query;

        const where = {};
        
        // Status filtresi
        if (status) {
            where.status = status;
        }

        // Extension filtresi
        if (extension) {
            where.extension = extension;
        }

        // Arama filtresi
        if (search) {
            where[Op.or] = [
                { file_name: { [Op.like]: `%${search}%` } },
                { full_path: { [Op.like]: `%${search}%` } }
            ];
        }

        const offset = (page - 1) * limit;

        const results = await ImportIndex.findAndCountAll({
            where,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['created_at', 'DESC']]
        });

        // Her kayıt için parça varlık durumunu kontrol et
        const indexWithPartStatus = await Promise.all(
            results.rows.map(async (index) => {
                const indexData = index.toJSON();
                
                // Parçanın veritabanında olup olmadığını kontrol et
                const existingPart = await Parca.findOne({
                    where: {
                        [Op.or]: [
                            { parcaKodu: index.file_name },
                            { parcaAdi: index.full_path }
                        ]
                    }
                });

                indexData.part_exists = !!existingPart;
                indexData.part_info = existingPart ? {
                    parcaKodu: existingPart.parcaKodu,
                    parcaAdi: existingPart.parcaAdi,
                    foto_path: existingPart.foto_path
                } : null;

                return indexData;
            })
        );

        res.json({
            success: true,
            data: {
                items: indexWithPartStatus,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: results.count,
                    totalPages: Math.ceil(results.count / limit)
                }
            }
        });

    } catch (error) {
        console.error('[ImportExport] Liste getirme hatası:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * Import durumu özeti
 * GET /api/import-export/status
 */
exports.getImportStatus = async (req, res) => {
    try {
        const status = await importService.getImportStatus();

        res.json({
            success: true,
            data: status
        });

    } catch (error) {
        console.error('[ImportExport] Durum getirme hatası:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * Tekil parça import
 * POST /api/import-export/import-single/:indexId
 */
exports.importSingle = async (req, res) => {
    try {
        const { indexId } = req.params;

        if (!indexId || isNaN(indexId)) {
            return res.status(400).json({
                success: false,
                error: 'Geçerli bir indeks ID\'si gereklidir'
            });
        }

        console.log(`[ImportExport] Tekil import başlatılıyor - ID: ${indexId}`);

        const result = await importService.importSinglePart(parseInt(indexId));

        res.json({
            success: true,
            message: 'Parça başarıyla import edildi',
            data: result
        });

    } catch (error) {
        console.error(`[ImportExport] Tekil import hatası:`, error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * Toplu import başlat
 * POST /api/import-export/bulk-import
 */
exports.startBulkImport = async (req, res) => {
    try {
        const config = req.body || {};

        console.log('[ImportExport] Toplu import başlatılıyor...');

        const job = await importService.startBulkImport(config);

        res.json({
            success: true,
            message: 'Toplu import işi başlatıldı',
            data: {
                job_id: job.id,
                job_summary: job.getSummary()
            }
        });

    } catch (error) {
        console.error('[ImportExport] Toplu import başlatma hatası:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * Toplu import durdur
 * POST /api/import-export/stop-bulk-import
 */
exports.stopBulkImport = async (req, res) => {
    try {
        console.log('[ImportExport] Toplu import durduruluyor...');

        const stopped = await importService.stopBulkImport();

        if (stopped) {
            res.json({
                success: true,
                message: 'Toplu import işi durduruldu'
            });
        } else {
            res.json({
                success: false,
                message: 'Durdurilacak aktif import işi bulunamadı'
            });
        }

    } catch (error) {
        console.error('[ImportExport] Toplu import durdurma hatası:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * Import iş geçmişi
 * GET /api/import-export/job-history
 */
exports.getJobHistory = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        const jobs = await ImportJob.findAndCountAll({
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['started_at', 'DESC']]
        });

        const jobsWithSummary = jobs.rows.map(job => job.getSummary());

        res.json({
            success: true,
            data: {
                items: jobsWithSummary,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: jobs.count,
                    totalPages: Math.ceil(jobs.count / limit)
                }
            }
        });

    } catch (error) {
        console.error('[ImportExport] İş geçmişi hatası:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * Import iş detayı
 * GET /api/import-export/job/:jobId
 */
exports.getJobDetail = async (req, res) => {
    try {
        const { jobId } = req.params;

        const job = await ImportJob.findByPk(jobId);
        if (!job) {
            return res.status(404).json({
                success: false,
                error: 'Import işi bulunamadı'
            });
        }

        res.json({
            success: true,
            data: job.getSummary()
        });

    } catch (error) {
        console.error('[ImportExport] İş detayı hatası:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * İndeks kaydını sil
 * DELETE /api/import-export/index/:indexId
 */
exports.deleteIndexRecord = async (req, res) => {
    try {
        const { indexId } = req.params;

        const indexRecord = await ImportIndex.findByPk(indexId);
        if (!indexRecord) {
            return res.status(404).json({
                success: false,
                error: 'İndeks kaydı bulunamadı'
            });
        }

        await indexRecord.destroy();

        res.json({
            success: true,
            message: 'İndeks kaydı silindi'
        });

    } catch (error) {
        console.error('[ImportExport] İndeks silme hatası:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * İndeks durumunu güncelle
 * PUT /api/import-export/index/:indexId/status
 */
exports.updateIndexStatus = async (req, res) => {
    try {
        const { indexId } = req.params;
        const { status, error_message } = req.body;

        const indexRecord = await ImportIndex.findByPk(indexId);
        if (!indexRecord) {
            return res.status(404).json({
                success: false,
                error: 'İndeks kaydı bulunamadı'
            });
        }

        await indexRecord.updateStatus(status, error_message);

        res.json({
            success: true,
            message: 'İndeks durumu güncellendi',
            data: indexRecord.toJSON()
        });

    } catch (error) {
        console.error('[ImportExport] Durum güncelleme hatası:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * Parça varlık kontrolü yeniden çalıştır
 * POST /api/import-export/refresh-parts-check
 */
exports.refreshPartsCheck = async (req, res) => {
    try {
        console.log('[ImportExport] Parça varlık kontrolü yenileniyor...');

        const result = await importService.checkPartsExistence();

        res.json({
            success: true,
            message: 'Parça varlık kontrolü tamamlandı',
            data: result
        });

    } catch (error) {
        console.error('[ImportExport] Parça kontrolü hatası:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * Import istatistikleri
 * GET /api/import-export/statistics
 */
exports.getStatistics = async (req, res) => {
    try {
        const { period = '30d' } = req.query;
        
        // Tarih aralığı hesapla
        let startDate = new Date();
        switch (period) {
            case '7d':
                startDate.setDate(startDate.getDate() - 7);
                break;
            case '30d':
                startDate.setDate(startDate.getDate() - 30);
                break;
            case '90d':
                startDate.setDate(startDate.getDate() - 90);
                break;
            default:
                startDate.setDate(startDate.getDate() - 30);
        }

        // Temel sayılar
        const [
            totalIndexed,
            totalImported,
            totalFailed,
            recentJobs,
            extensionStats
        ] = await Promise.all([
            ImportIndex.count(),
            ImportIndex.count({ where: { status: 'imported' } }),
            ImportIndex.count({ where: { status: 'failed' } }),
            ImportJob.count({
                where: {
                    started_at: {
                        [Op.gte]: startDate
                    }
                }
            }),
            ImportIndex.findAll({
                attributes: [
                    'extension',
                    [ImportIndex.sequelize.fn('COUNT', ImportIndex.sequelize.col('extension')), 'count']
                ],
                group: 'extension',
                raw: true
            })
        ]);

        // Son işlemler
        const recentActivity = await ImportIndex.findAll({
            where: {
                updated_at: {
                    [Op.gte]: startDate
                }
            },
            limit: 10,
            order: [['updated_at', 'DESC']]
        });

        const statistics = {
            summary: {
                total_indexed: totalIndexed,
                total_imported: totalImported,
                total_failed: totalFailed,
                success_rate: totalIndexed > 0 ? Math.round((totalImported / totalIndexed) * 100) : 0,
                recent_jobs: recentJobs
            },
            by_extension: extensionStats,
            recent_activity: recentActivity.map(item => ({
                id: item.id,
                file_name: item.file_name,
                status: item.status,
                updated_at: item.updated_at
            })),
            period: period
        };

        res.json({
            success: true,
            data: statistics
        });

    } catch (error) {
        console.error('[ImportExport] İstatistik hatası:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * SolidWorks bağlantı testi
 * GET /api/import-export/test-solidworks
 */
exports.testSolidWorksConnection = async (req, res) => {
    try {
        const { spawn } = require('child_process');
        const testScript = path.join(__dirname, '../scripts/test_solidworks.py');

        const python = spawn('python', [testScript], {
            stdio: ['pipe', 'pipe', 'pipe']
        });

        let stdout = '';
        let stderr = '';

        python.stdout.on('data', (data) => {
            stdout += data.toString();
        });

        python.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        python.on('close', (code) => {
            const success = code === 0;
            
            res.json({
                success: success,
                message: success ? 'SolidWorks bağlantısı başarılı' : 'SolidWorks bağlantısı başarısız',
                data: {
                    exit_code: code,
                    stdout: stdout,
                    stderr: stderr
                }
            });
        });

        python.on('error', (error) => {
            console.error('[ImportExport] Python test hatası:', error);
            res.status(500).json({
                success: false,
                error: `Test script hatası: ${error.message}`
            });
        });

    } catch (error) {
        console.error('[ImportExport] SolidWorks test hatası:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};