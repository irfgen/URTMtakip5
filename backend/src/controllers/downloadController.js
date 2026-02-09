const path = require('path');
const fs = require('fs').promises;
const { createReadStream, existsSync } = require('fs');
const archiver = require('archiver');

/**
 * STEP BOM Analyzer Windows paketi indirme
 */
const downloadStepBomAnalyzerWindows = async (req, res) => {
  try {
    console.log('STEP BOM Analyzer Windows paketi indirme isteği başladı');
    
    // STEP BOM Analyzer kaynak klasörü
    const sourcePath = path.join(__dirname, '../../../STEP_BOM_Analyzer');
    
    console.log('Kaynak dizin kontrol ediliyor:', sourcePath);
    
    if (!existsSync(sourcePath)) {
      console.error('STEP BOM Analyzer dizini bulunamadı:', sourcePath);
      return res.status(404).json({ 
        error: 'STEP BOM Analyzer dosyaları bulunamadı',
        path: sourcePath
      });
    }

    console.log('Kaynak dizin bulundu, ZIP oluşturma başlatılıyor');

    // ZIP dosyası oluştur
    const archive = archiver('zip', {
      zlib: { level: 6 } // Orta seviye sıkıştırma (daha hızlı)
    });

    // Response headers ayarla
    const filename = `STEP_BOM_Analyzer_Windows_v3.0.zip`;
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Archive error handler
    archive.on('error', (err) => {
      console.error('Archive error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Archive creation failed', details: err.message });
      }
    });

    // Archive warning handler
    archive.on('warning', (err) => {
      console.warn('Archive warning:', err);
    });

    // Archive'i response'a pipe et
    archive.pipe(res);

    console.log('STEP BOM Analyzer dosyaları ekleniyor');
    
    // STEP BOM Analyzer dosyalarını ekle (mevcut dosyaları olduğu gibi)
    archive.directory(sourcePath, 'STEP_BOM_Analyzer');

    console.log('Archive sonlandırılıyor');
    
    // Archive'i sonlandır
    await archive.finalize();

    console.log('STEP BOM Analyzer Windows paketi başarıyla oluşturuldu');

  } catch (error) {
    console.error('STEP BOM Analyzer indirme hatası:', error);
    
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'İndirme sırasında hata oluştu',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
};

module.exports = {
  downloadStepBomAnalyzerWindows
};