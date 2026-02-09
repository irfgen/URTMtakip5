const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { Op } = require('sequelize');
const ImportIndex = require('../models/ImportIndex');
const ImportJob = require('../models/ImportJob');
const Parca = require('../models/Parca');

class ImportService {
  constructor() {
    this.supportedExtensions = ['.sldprt', '.sldpart', '.sldasm'];
    this.isRunning = false;
    this.currentJob = null;
  }

  /**
   * Klasör ve alt klasörlerdeki SolidWorks dosyalarını indeksler
   * @param {string} folderPath - Taranacak klasör yolu
   * @param {object} options - Seçenekler
   * @returns {Promise<object>}
   */
  async indexFolder(folderPath, options = {}) {
    const startTime = Date.now();
    console.log(`[ImportService] Klasör indeksleme başlıyor: ${folderPath}`);

    if (!fs.existsSync(folderPath)) {
      throw new Error(`Klasör bulunamadı: ${folderPath}`);
    }

    const stats = {
      total: 0,
      new: 0,
      existing: 0,
      errors: 0
    };

    try {
      const files = await this.scanDirectory(folderPath);
      console.log(`[ImportService] Toplam ${files.length} SolidWorks dosyası bulundu`);

      for (const filePath of files) {
        try {
          const fileName = path.basename(filePath, path.extname(filePath));
          const extension = path.extname(filePath);
          const fileHash = await this.calculateFileHash(filePath);

          // Mevcut kayıt kontrol et
          let indexRecord = await ImportIndex.findByPath(filePath);

          if (indexRecord) {
            // Hash değişmiş mi kontrol et
            if (indexRecord.hash !== fileHash) {
              await indexRecord.update({
                hash: fileHash,
                status: 'pending',
                error_message: null
              });
              console.log(`[ImportService] Dosya güncellendi: ${fileName}`);
            }
            stats.existing++;
          } else {
            // Yeni kayıt oluştur
            indexRecord = await ImportIndex.create({
              full_path: filePath,
              file_name: fileName,
              extension: extension,
              hash: fileHash,
              status: 'pending'
            });
            stats.new++;
            console.log(`[ImportService] Yeni dosya indekslendi: ${fileName}`);
          }

          stats.total++;
        } catch (error) {
          console.error(`[ImportService] Dosya indeksleme hatası (${filePath}):`, error.message);
          stats.errors++;
        }
      }

      // Parça varlık kontrolü yap
      await this.checkPartsExistence();

      const duration = Date.now() - startTime;
      console.log(`[ImportService] İndeksleme tamamlandı - ${duration}ms`);

      return {
        success: true,
        stats,
        duration_ms: duration
      };

    } catch (error) {
      console.error('[ImportService] İndeksleme hatası:', error);
      throw error;
    }
  }

  /**
   * Klasör ve alt klasörlerdeki dosyaları tarar
   * @param {string} dir - Taranacak dizin
   * @returns {Promise<string[]>}
   */
  async scanDirectory(dir) {
    const files = [];
    
    const scanRecursive = async (currentDir) => {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        
        if (entry.isDirectory()) {
          await scanRecursive(fullPath);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          if (this.supportedExtensions.includes(ext)) {
            files.push(fullPath);
          }
        }
      }
    };

    await scanRecursive(dir);
    return files;
  }

  /**
   * Dosya hash'ini hesaplar
   * @param {string} filePath 
   * @returns {Promise<string>}
   */
  async calculateFileHash(filePath) {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      const stream = fs.createReadStream(filePath);
      
      stream.on('data', (data) => {
        hash.update(data);
      });
      
      stream.on('end', () => {
        resolve(hash.digest('hex'));
      });
      
      stream.on('error', reject);
    });
  }

  /**
   * İndekslenen dosyalar için parça varlık kontrolü yapar
   * @returns {Promise<object>}
   */
  async checkPartsExistence() {
    console.log('[ImportService] Parça varlık kontrolü başlıyor...');
    
    const indexRecords = await ImportIndex.findAll({
      where: {
        status: 'pending'
      }
    });

    let existsCount = 0;
    let readyCount = 0;

    for (const record of indexRecords) {
      try {
        // Parçanın veritabanında olup olmadığını kontrol et
        const existingPart = await Parca.findOne({
          where: {
            [Op.or]: [
              { parcaKodu: record.file_name },
              { parcaAdi: record.full_path }
            ]
          }
        });

        if (existingPart) {
          await record.updateStatus('exists');
          existsCount++;
        } else {
          await record.updateStatus('ready_to_import');
          readyCount++;
        }
      } catch (error) {
        console.error(`[ImportService] Parça kontrol hatası (${record.file_name}):`, error.message);
        await record.updateStatus('failed', error.message);
      }
    }

    console.log(`[ImportService] Parça varlık kontrolü tamamlandı - Mevcut: ${existsCount}, İmport edilecek: ${readyCount}`);
    
    return {
      exists_count: existsCount,
      ready_to_import_count: readyCount
    };
  }

  /**
   * İmport için hazır dosyaları getirir
   * @param {object} filters 
   * @returns {Promise<ImportIndex[]>}
   */
  async getReadyToImportFiles(filters = {}) {
    const where = {
      status: 'ready_to_import'
    };

    if (filters.extension) {
      where.extension = filters.extension;
    }

    return await ImportIndex.findAll({
      where,
      order: [['created_at', 'ASC']],
      limit: filters.limit || 1000
    });
  }

  /**
   * Tekil parça import'u
   * @param {number} indexId 
   * @returns {Promise<object>}
   */
  async importSinglePart(indexId) {
    const indexRecord = await ImportIndex.findByPk(indexId);
    if (!indexRecord) {
      throw new Error('İndeks kaydı bulunamadı');
    }

    if (indexRecord.status !== 'ready_to_import') {
      throw new Error(`Dosya import edilmeye hazır değil. Mevcut durum: ${indexRecord.status}`);
    }

    try {
      await indexRecord.updateStatus('importing');
      
      // SolidWorks Python servisi ile PNG üret
      const screenshotPath = await this.generateScreenshot(indexRecord.full_path, indexRecord.file_name);
      
      // Yeni parça kaydı oluştur
      const parcaData = {
        parcaKodu: indexRecord.file_name,
        parcaAdi: indexRecord.full_path,
        dosya_yolu: indexRecord.full_path,
        foto_path: screenshotPath,
        kaynak: 'solidworks_import',
        stokAdeti: 0,
        tedarikBedeli: 0,
        imalMi: true, // SolidWorks dosyaları genelde imal edilir
        created_at: new Date(),
        updated_at: new Date()
      };

      const parca = await Parca.create(parcaData);
      await indexRecord.updateStatus('imported');

      console.log(`[ImportService] Parça başarıyla import edildi: ${indexRecord.file_name}`);

      return {
        success: true,
        parca: parca,
        screenshot_path: screenshotPath
      };

    } catch (error) {
      console.error(`[ImportService] Parça import hatası (${indexRecord.file_name}):`, error.message);
      await indexRecord.updateStatus('failed', error.message);
      throw error;
    }
  }

  /**
   * SolidWorks dosyasından screenshot oluşturur
   * @param {string} filePath 
   * @param {string} fileName 
   * @returns {Promise<string>}
   */
  async generateScreenshot(filePath, fileName) {
    // Python SolidWorks wrapper'ı çağır
    const { spawn } = require('child_process');
    const screenshotDir = path.join(__dirname, '../../uploads/solidworks_screenshots');
    
    // Klasör yoksa oluştur
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }

    const outputPath = path.join(screenshotDir, `${fileName}.png`);
    const pythonScript = path.join(__dirname, '../scripts/solidworks_wrapper.py');

    return new Promise((resolve, reject) => {
      const python = spawn('python', [pythonScript, filePath, outputPath], {
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
        if (code === 0 && fs.existsSync(outputPath)) {
          // Relative path döndür
          const relativePath = `/uploads/solidworks_screenshots/${fileName}.png`;
          console.log(`[ImportService] Screenshot oluşturuldu: ${relativePath}`);
          resolve(relativePath);
        } else {
          const error = `Python script failed (code ${code}): ${stderr || stdout}`;
          console.error(`[ImportService] Screenshot hatası:`, error);
          reject(new Error(error));
        }
      });

      python.on('error', (error) => {
        console.error(`[ImportService] Python process hatası:`, error);
        reject(error);
      });
    });
  }

  /**
   * Toplu otomatik import işini başlatır
   * @param {object} config 
   * @returns {Promise<ImportJob>}
   */
  async startBulkImport(config = {}) {
    if (this.isRunning) {
      throw new Error('Zaten çalışan bir import işi var');
    }

    // Mevcut çalışan iş kontrolü
    const runningJob = await ImportJob.getRunningJob();
    if (runningJob) {
      throw new Error(`Zaten çalışan bir import işi var (ID: ${runningJob.id})`);
    }

    // Import edilecek dosyaları getir
    const readyFiles = await this.getReadyToImportFiles({
      limit: config.maxFiles || 1000
    });

    if (readyFiles.length === 0) {
      throw new Error('Import edilecek dosya bulunamadı');
    }

    // İş kaydı oluştur
    const job = await ImportJob.startJob({
      job_name: config.job_name || `Bulk Import - ${new Date().toISOString()}`,
      total: readyFiles.length,
      config: config
    });

    this.isRunning = true;
    this.currentJob = job;

    // Asenkron olarak işle
    this.processBulkImport(job, readyFiles).catch(error => {
      console.error('[ImportService] Bulk import process error:', error);
    });

    return job;
  }

  /**
   * Toplu import işlemini gerçekleştirir
   * @param {ImportJob} job 
   * @param {ImportIndex[]} files 
   */
  async processBulkImport(job, files) {
    let successCount = 0;
    let failCount = 0;

    try {
      console.log(`[ImportService] Toplu import başlıyor - ${files.length} dosya`);

      for (let i = 0; i < files.length && this.isRunning; i++) {
        const file = files[i];
        
        try {
          await this.importSinglePart(file.id);
          successCount++;
          console.log(`[ImportService] İlerleme: ${i + 1}/${files.length} - ${file.file_name} ✓`);
        } catch (error) {
          failCount++;
          console.log(`[ImportService] İlerleme: ${i + 1}/${files.length} - ${file.file_name} ✗ (${error.message})`);
        }

        // İlerleme güncelle
        await job.updateProgress(successCount, failCount);

        // Kısa bekleme (sistem yükünü azaltmak için)
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // İşi tamamla
      const finalState = this.isRunning ? 'completed' : 'canceled';
      await job.finishJob(finalState);
      
      console.log(`[ImportService] Toplu import ${finalState} - Başarılı: ${successCount}, Başarısız: ${failCount}`);

    } catch (error) {
      console.error('[ImportService] Toplu import hatası:', error);
      await job.finishJob('failed');
    } finally {
      this.isRunning = false;
      this.currentJob = null;
    }
  }

  /**
   * Çalışan import işini durdurur
   * @returns {Promise<boolean>}
   */
  async stopBulkImport() {
    if (!this.isRunning || !this.currentJob) {
      return false;
    }

    console.log('[ImportService] Import işi durduruluyor...');
    this.isRunning = false;
    
    if (this.currentJob) {
      await this.currentJob.cancelJob();
    }

    return true;
  }

  /**
   * İmport durumu özetini getirir
   * @returns {Promise<object>}
   */
  async getImportStatus() {
    const [
      pendingCount,
      existsCount,
      readyCount,
      importingCount,
      importedCount,
      failedCount,
      runningJob
    ] = await Promise.all([
      ImportIndex.getCountByStatus('pending'),
      ImportIndex.getCountByStatus('exists'),
      ImportIndex.getCountByStatus('ready_to_import'),
      ImportIndex.getCountByStatus('importing'),
      ImportIndex.getCountByStatus('imported'),
      ImportIndex.getCountByStatus('failed'),
      ImportJob.getRunningJob()
    ]);

    return {
      counts: {
        pending: pendingCount,
        exists: existsCount,
        ready_to_import: readyCount,
        importing: importingCount,
        imported: importedCount,
        failed: failedCount,
        total: pendingCount + existsCount + readyCount + importingCount + importedCount + failedCount
      },
      running_job: runningJob ? runningJob.getSummary() : null,
      is_running: this.isRunning
    };
  }
}

module.exports = new ImportService();