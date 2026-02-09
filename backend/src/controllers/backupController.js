const fs = require('fs');
const path = require('path');
const { sequelize } = require('../config/database');
const archiver = require('archiver');
const { createReadStream } = require('fs');
const AdmZip = require('adm-zip');

// Yedekleme klasörünün yolu
const BACKUP_DIR = path.join(__dirname, '../../../DB/yedekler');

// Yedekleme klasörünü oluştur ve izinleri kontrol et
try {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true, mode: 0o755 });
  } else {
    // Klasör izinlerini kontrol et
    fs.accessSync(BACKUP_DIR, fs.constants.R_OK | fs.constants.W_OK);
  }
} catch (error) {
  console.error('Yedekleme klasörü oluşturma/erişim hatası:', error);
}

// Veritabanı yedeği alma
const createBackup = async (req, res) => {
  try {
    // Yedekleme klasörüne erişim kontrolü
    await fs.promises.access(BACKUP_DIR, fs.constants.R_OK | fs.constants.W_OK);

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `backup-${timestamp}.zip`;
    const backupPath = path.join(BACKUP_DIR, backupFileName);
    
    // Veritabanı dosyasının varlığını kontrol et
    const dbPath = path.join(__dirname, '../../database.sqlite');
    if (!fs.existsSync(dbPath)) {
      throw new Error('Veritabanı dosyası bulunamadı');
    }

    // Zip dosyası oluştur
    const output = fs.createWriteStream(backupPath);
    const archive = archiver('zip', {
      zlib: { level: 9 }
    });

    // Promise ile işlemi yönet
    const archivePromise = new Promise((resolve, reject) => {
      output.on('close', () => resolve());
      archive.on('error', reject);
      output.on('error', reject);
    });

    archive.pipe(output);
    archive.file(dbPath, { name: 'database.sqlite' });
    
    await archive.finalize();
    await archivePromise;

    // Yedek dosyasının başarıyla oluşturulduğunu kontrol et
    const stats = await fs.promises.stat(backupPath);

    res.json({
      success: true,
      message: 'Yedekleme başarıyla tamamlandı',
      fileName: backupFileName,
      size: stats.size
    });
  } catch (error) {
    console.error('Yedekleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Yedekleme sırasında bir hata oluştu: ' + error.message,
      error: error.message
    });
  }
};

// Yedekleri listeleme
const listBackups = async (req, res) => {
  try {
    // Yedekleme klasörüne erişim kontrolü
    await fs.promises.access(BACKUP_DIR, fs.constants.R_OK);

    const files = await fs.promises.readdir(BACKUP_DIR);
    const backups = await Promise.all(
      files
        .filter(file => file.endsWith('.zip'))
        .map(async file => {
          const stats = await fs.promises.stat(path.join(BACKUP_DIR, file));
          return {
            fileName: file,
            size: stats.size,
            createdAt: stats.birthtime
          };
        })
    );

    backups.sort((a, b) => b.createdAt - a.createdAt);

    res.json({
      success: true,
      backups
    });
  } catch (error) {
    console.error('Yedek listeleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Yedekler listelenirken bir hata oluştu: ' + error.message,
      error: error.message
    });
  }
};

// Yedeği geri yükleme
const restoreBackup = async (req, res) => {
  const { fileName } = req.params;
  const backupPath = path.join(BACKUP_DIR, fileName);
  const dbPath = path.join(__dirname, '../../database.sqlite');

  try {
    // Veritabanı bağlantısını kapat
    await sequelize.close();

    // Zip dosyasını aç ve veritabanını geri yükle
    const zip = new AdmZip(backupPath);
    zip.extractAllTo(path.dirname(dbPath), true);

    // Veritabanını yeniden başlat
    await sequelize.authenticate();
    await sequelize.sync();

    res.json({
      success: true,
      message: 'Yedek başarıyla geri yüklendi'
    });
  } catch (error) {
    console.error('Geri yükleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Yedek geri yüklenirken bir hata oluştu',
      error: error.message
    });
  }
};

// Yedeği silme
const deleteBackup = async (req, res) => {
  const { fileName } = req.params;
  const backupPath = path.join(BACKUP_DIR, fileName);

  try {
    if (fs.existsSync(backupPath)) {
      fs.unlinkSync(backupPath);
      res.json({
        success: true,
        message: 'Yedek başarıyla silindi'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Yedek dosyası bulunamadı'
      });
    }
  } catch (error) {
    console.error('Yedek silme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Yedek silinirken bir hata oluştu',
      error: error.message
    });
  }
};

module.exports = {
  createBackup,
  listBackups,
  restoreBackup,
  deleteBackup
};