const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { ImportIndex, ImportJob, ImportClient, Parca } = require('../models');
const { Op } = require('sequelize');

// Multer konfigürasyonu - thumbnail upload için
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/cad-thumbnails');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const randomId = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(file.originalname);
    cb(null, `thumb_${timestamp}_${randomId}${ext}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Sadece resim dosyaları kabul edilir'), false);
    }
  }
});

/**
 * POST /api/cad-import/register-client
 * Client kayıt endpoint'i
 */
router.post('/register-client', async (req, res) => {
  try {
    const { client_id, client_name, client_info } = req.body;

    if (!client_id || !client_name) {
      return res.status(400).json({ 
        error: 'client_id ve client_name gerekli' 
      });
    }

    const client = await ImportClient.upsertClient({
      client_id,
      client_name,
      client_info: client_info || {}
    });

    res.json({
      success: true,
      client: client.getSummary(),
      message: 'Client başarıyla kaydedildi'
    });

  } catch (error) {
    console.error('Client kayıt hatası:', error);
    res.status(500).json({ 
      error: 'Client kayıt işlemi başarısız',
      details: error.message 
    });
  }
});

/**
 * POST /api/cad-import/index-files
 * Dosya indeksleme endpoint'i
 */
router.post('/index-files', async (req, res) => {
  try {
    const { files, client_id } = req.body;

    if (!files || !Array.isArray(files)) {
      return res.status(400).json({ 
        error: 'files array gerekli' 
      });
    }

    if (!client_id) {
      return res.status(400).json({ 
        error: 'client_id gerekli' 
      });
    }

    // Client'ı kontrol et
    const client = await ImportClient.findByClientId(client_id);
    if (!client) {
      return res.status(404).json({ 
        error: 'Client bulunamadı' 
      });
    }

    // Dosyaları toplu ekle
    const indexResults = [];
    for (const file of files) {
      try {
        const fileName = path.basename(file.full_path, path.extname(file.full_path));
        
        const [indexRecord, created] = await ImportIndex.findOrCreate({
          where: { full_path: file.full_path },
          defaults: {
            file_name: fileName,
            extension: file.extension,
            hash: file.hash || null,
            client_id: client_id,
            status: 'pending'
          }
        });

        if (!created) {
          // Mevcut kayıt varsa hash'i güncelle
          if (file.hash && indexRecord.hash !== file.hash) {
            await indexRecord.update({
              hash: file.hash,
              status: 'pending',
              client_id: client_id
            });
          }
        }

        indexResults.push({
          file_path: file.full_path,
          created: created,
          status: indexRecord.status
        });

      } catch (fileError) {
        console.error(`Dosya indeksleme hatası ${file.full_path}:`, fileError);
        indexResults.push({
          file_path: file.full_path,
          error: fileError.message
        });
      }
    }

    // Client'ın son etkinlik zamanını güncelle
    await client.updateLastSeen();

    res.json({
      success: true,
      indexed_count: indexResults.filter(r => r.created).length,
      updated_count: indexResults.filter(r => !r.created && !r.error).length,
      error_count: indexResults.filter(r => r.error).length,
      results: indexResults
    });

  } catch (error) {
    console.error('Dosya indeksleme hatası:', error);
    res.status(500).json({ 
      error: 'Dosya indeksleme işlemi başarısız',
      details: error.message 
    });
  }
});

/**
 * POST /api/cad-import/check-parts
 * Parça varlık kontrolü endpoint'i
 */
router.post('/check-parts', async (req, res) => {
  try {
    const { part_codes, client_id } = req.body;

    if (!part_codes || !Array.isArray(part_codes)) {
      return res.status(400).json({ 
        error: 'part_codes array gerekli' 
      });
    }

    // Veritabanında mevcut parçaları bul
    const existingParts = await Parca.unscoped().findAll({
      where: { 
        parcaKodu: { [Op.in]: part_codes }
      },
      attributes: ['parcaKodu', 'parcaAdi']
    });

    const existingCodes = existingParts.map(p => p.parcaKodu);
    const missingCodes = part_codes.filter(code => !existingCodes.includes(code));

    // ImportIndex'teki durumları güncelle
    if (client_id) {
      // Mevcut olanları 'exists' olarak işaretle
      await ImportIndex.update(
        { status: 'exists' },
        { 
          where: { 
            file_name: { [Op.in]: existingCodes },
            client_id: client_id 
          } 
        }
      );

      // Eksik olanları 'ready_to_import' olarak işaretle
      await ImportIndex.update(
        { status: 'ready_to_import' },
        { 
          where: { 
            file_name: { [Op.in]: missingCodes },
            client_id: client_id 
          } 
        }
      );
    }

    res.json({
      success: true,
      total_checked: part_codes.length,
      existing_count: existingCodes.length,
      missing_count: missingCodes.length,
      existing_parts: existingCodes,
      missing_parts: missingCodes
    });

  } catch (error) {
    console.error('Parça varlık kontrolü hatası:', error);
    res.status(500).json({ 
      error: 'Parça varlık kontrolü başarısız',
      details: error.message 
    });
  }
});

/**
 * POST /api/cad-import/upload-part
 * Parça upload endpoint'i (thumbnail ile birlikte)
 */
router.post('/upload-part', upload.single('thumbnail'), async (req, res) => {
  try {
    const { part_code, part_name, file_path, client_id, file_hash } = req.body;
    const thumbnail = req.file;

    if (!part_code) {
      return res.status(400).json({ 
        error: 'part_code gerekli' 
      });
    }

    // Parça zaten var mı kontrol et
    const existingPart = await Parca.unscoped().findOne({
      where: { parcaKodu: part_code }
    });

    if (existingPart) {
      return res.status(409).json({ 
        error: 'Bu parça kodu zaten mevcut',
        existing_part: {
          parcaKodu: existingPart.parcaKodu,
          parcaAdi: existingPart.parcaAdi
        }
      });
    }

    // Yeni parça oluştur
    const newPart = await Parca.create({
      parcaKodu: part_code,
      parcaAdi: part_name || part_code,
      stokAdeti: 0,
      tedarikBedeli: 0,
      imalMi: false,
      foto_path: thumbnail ? thumbnail.filename : null
    });

    // ImportIndex'te durumu güncelle
    if (client_id) {
      await ImportIndex.update(
        { 
          status: 'imported',
          error_message: null 
        },
        { 
          where: { 
            file_name: part_code,
            client_id: client_id 
          } 
        }
      );
    }

    res.json({
      success: true,
      part: {
        parcaKodu: newPart.parcaKodu,
        parcaAdi: newPart.parcaAdi,
        foto_path: newPart.foto_path,
        thumbnail_path: thumbnail ? thumbnail.filename : null
      },
      message: 'Parça başarıyla eklendi'
    });

  } catch (error) {
    console.error('Parça upload hatası:', error);
    
    // Hata durumunda upload edilen dosyayı sil
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({ 
      error: 'Parça upload işlemi başarısız',
      details: error.message 
    });
  }
});

/**
 * POST /api/cad-import/start-job
 * İş başlatma endpoint'i
 */
router.post('/start-job', async (req, res) => {
  try {
    const { job_name, client_id, total_files, config } = req.body;

    if (!client_id) {
      return res.status(400).json({ 
        error: 'client_id gerekli' 
      });
    }

    // Çalışan iş var mı kontrol et
    const runningJob = await ImportJob.getRunningJob();
    if (runningJob) {
      return res.status(409).json({ 
        error: 'Zaten çalışan bir import işi var',
        running_job: runningJob.getSummary() 
      });
    }

    // Yeni iş başlat
    const job = await ImportJob.startJob({
      job_name: job_name || 'CAD Import Job',
      total: total_files || 0,
      client_id: client_id,
      config: config || {}
    });

    // Client durumunu güncelle
    const client = await ImportClient.findByClientId(client_id);
    if (client) {
      await client.updateStatus('working');
    }

    res.json({
      success: true,
      job: job.getSummary(),
      message: 'Import işi başlatıldı'
    });

  } catch (error) {
    console.error('İş başlatma hatası:', error);
    res.status(500).json({ 
      error: 'İş başlatma işlemi başarısız',
      details: error.message 
    });
  }
});

/**
 * POST /api/cad-import/update-job-progress
 * İş ilerleme güncelleme endpoint'i
 */
router.post('/update-job-progress', async (req, res) => {
  try {
    const { job_id, success_count, fail_count, client_id } = req.body;

    if (!job_id) {
      return res.status(400).json({ 
        error: 'job_id gerekli' 
      });
    }

    const job = await ImportJob.findByPk(job_id);
    if (!job) {
      return res.status(404).json({ 
        error: 'İş bulunamadı' 
      });
    }

    // İlerleme güncelle
    await job.updateProgress(success_count || 0, fail_count || 0);

    // Client'ın son etkinlik zamanını güncelle
    if (client_id) {
      const client = await ImportClient.findByClientId(client_id);
      if (client) {
        await client.updateLastSeen();
      }
    }

    res.json({
      success: true,
      job: job.getSummary(),
      message: 'İş ilerlemesi güncellendi'
    });

  } catch (error) {
    console.error('İş ilerleme güncelleme hatası:', error);
    res.status(500).json({ 
      error: 'İş ilerleme güncelleme başarısız',
      details: error.message 
    });
  }
});

/**
 * POST /api/cad-import/finish-job
 * İş bitirme endpoint'i
 */
router.post('/finish-job', async (req, res) => {
  try {
    const { job_id, final_state, client_id } = req.body;

    if (!job_id) {
      return res.status(400).json({ 
        error: 'job_id gerekli' 
      });
    }

    const job = await ImportJob.findByPk(job_id);
    if (!job) {
      return res.status(404).json({ 
        error: 'İş bulunamadı' 
      });
    }

    // İşi bitir
    await job.finishJob(final_state || 'completed');

    // Client durumunu güncelle
    if (client_id) {
      const client = await ImportClient.findByClientId(client_id);
      if (client) {
        await client.updateStatus('connected');
      }
    }

    res.json({
      success: true,
      job: job.getSummary(),
      message: 'İş tamamlandı'
    });

  } catch (error) {
    console.error('İş bitirme hatası:', error);
    res.status(500).json({ 
      error: 'İş bitirme işlemi başarısız',
      details: error.message 
    });
  }
});

/**
 * GET /api/cad-import/status
 * Genel durum endpoint'i
 */
router.get('/status', async (req, res) => {
  try {
    const [
      activeClients,
      runningJob,
      indexStats,
      recentJobs
    ] = await Promise.all([
      ImportClient.getActiveClients(),
      ImportJob.getRunningJob(),
      ImportIndex.findAll({
        attributes: [
          'status',
          [require('sequelize').fn('COUNT', '*'), 'count']
        ],
        group: 'status'
      }),
      ImportJob.findAll({
        limit: 10,
        order: [['started_at', 'DESC']]
      })
    ]);

    // İstatistikleri düzenle
    const stats = {};
    indexStats.forEach(stat => {
      stats[stat.status] = parseInt(stat.dataValues.count);
    });

    res.json({
      success: true,
      active_clients: activeClients.map(c => c.getSummary()),
      running_job: runningJob ? runningJob.getSummary() : null,
      index_stats: stats,
      recent_jobs: recentJobs.map(j => j.getSummary())
    });

  } catch (error) {
    console.error('Durum sorgulama hatası:', error);
    res.status(500).json({ 
      error: 'Durum sorgulama başarısız',
      details: error.message 
    });
  }
});

/**
 * GET /api/cad-import/files/:client_id
 * Client'a ait dosyaları listele
 */
router.get('/files/:client_id', async (req, res) => {
  try {
    const { client_id } = req.params;
    const { status, limit = 100, offset = 0 } = req.query;

    const whereClause = { client_id };
    if (status) {
      whereClause.status = status;
    }

    const files = await ImportIndex.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['updated_at', 'DESC']]
    });

    res.json({
      success: true,
      files: files.rows,
      total: files.count,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

  } catch (error) {
    console.error('Dosya listeleme hatası:', error);
    res.status(500).json({ 
      error: 'Dosya listeleme başarısız',
      details: error.message 
    });
  }
});

module.exports = router;