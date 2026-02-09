const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

/**
 * CAD dosyasını sunan endpoint
 * GET /api/cad-files/:filename
 */
router.get('/:filename', (req, res) => {
  try {
    const { filename } = req.params;

    // Güvenlik kontrolü: dosya adında path traversal olup olmadığını kontrol et
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz dosya adı'
      });
    }

    // Sadece .sldprt, .slddrw ve .sldpart dosyalarına izin ver
    if (!filename.endsWith('.sldprt') && !filename.endsWith('.slddrw') && !filename.endsWith('.sldpart')) {
      return res.status(400).json({
        success: false,
        message: 'Sadece CAD dosyalarına (.sldprt, .slddrw, .sldpart) izin verilir'
      });
    }

    // CAD dosyalarının bulunduğu dizinler (ayarlanabilir)
    const cadDirectories = [
      'C:/Mzk Makineler',
      'D:/Mzk Makineler',
      'E:/Mzk Makineler',
      'F:/Mzk Makineler',
      'G:/Mzk Makineler',
      'H:/Mzk Makineler',
      'I:/Mzk Makineler',
      'J:/Mzk Makineler',
      'K:/Mzk Makineler',
      'L:/Mzk Makineler',
      'M:/Mzk Makineler',
      'N:/Mzk Makineler',
      'O:/Mzk Makineler',
      'P:/Mzk Makineler',
      'Q:/Mzk Makineler',
      'R:/Mzk Makineler',
      'S:/Mzk Makineler',
      'T:/Mzk Makineler',
      'U:/Mzk Makineler',
      'V:/Mzk Makineler',
      'W:/Mzk Makineler',
      'X:/Mzk Makineler',
      'Y:/Mzk Makineler',
      'Z:/Mzk Makineler',
      '//mzrktasarim/Mzk Makineler',
      '//MZRKTASARIM/Mzk Makineler',
      '\\\\MZRKTASARIM\\Mzk Makineler',
      '\\\\mzrktasarim\\Mzk Makineler',
      '/tmp/cad_test'
    ];

    let filePath = null;
    let foundDirectory = null;

    // Tüm dizinlerde dosyayı ara
    for (const directory of cadDirectories) {
      const testPath = path.join(directory, filename);
      if (fs.existsSync(testPath)) {
        filePath = testPath;
        foundDirectory = directory;
        break;
      }
    }

    if (!filePath) {
      return res.status(404).json({
        success: false,
        message: 'CAD dosyası bulunamadı',
        filename: filename
      });
    }

    // Dosyanın var olduğunu kontrol et
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'CAD dosyası bulunamadı',
        filename: filename
      });
    }

    // Dosya bilgilerini al
    const stats = fs.statSync(filePath);

    // Content-Type header'ını ayarla
    const ext = path.extname(filename).toLowerCase();
    let contentType = 'application/octet-stream';

    if (ext === '.sldprt' || ext === '.sldpart') {
      contentType = 'application/octet-stream'; // SolidWorks part file
    } else if (ext === '.slddrw') {
      contentType = 'application/octet-stream'; // SolidWorks drawing file
    }

    // Dosyayı sun
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.setHeader('Content-Length', stats.size);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Origin,X-Requested-With,Content-Type,Accept');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 saat cache

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    fileStream.on('error', (error) => {
      console.error('CAD dosyası okuma hatası:', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Dosya okunurken hata oluştu'
        });
      }
    });

    console.log(`CAD dosyası servis edildi: ${filename} (${foundDirectory})`);

  } catch (error) {
    console.error('CAD dosyası servis hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası oluştu'
    });
  }
});

/**
 * CAD dosyası yolunu çözümleyen endpoint
 * POST /api/cad-files/resolve
 */
router.post('/resolve', (req, res) => {
  try {
    const { filePath } = req.body;

    if (!filePath) {
      return res.status(400).json({
        success: false,
        message: 'Dosya yolu gerekli'
      });
    }

    // Güvenlik kontrolü
    if (filePath.includes('..') || filePath.includes('~')) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz dosya yolu'
      });
    }

    // Dosyanın var olduğunu kontrol et
    const fileExists = fs.existsSync(filePath);

    // Dosya adını çıkar
    const filename = path.basename(filePath);

    // HTTP URL oluştur
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const httpUrl = `${baseUrl}/api/cad-files/${filename}`;

    res.json({
      success: true,
      data: {
        originalPath: filePath,
        filename: filename,
        httpUrl: httpUrl,
        exists: fileExists,
        accessible: fileExists,
        message: fileExists ? 'Dosya erişilebilir' : 'Dosya belirtilen yolda bulunamadı. Dosyayı sunucunun erişebileceği bir konuma kopyalamanız gerekebilir.'
      }
    });

  } catch (error) {
    console.error('CAD dosyası çözümleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası oluştu'
    });
  }
});

/**
 * CAD dosyası bilgilerini getiren endpoint
 * GET /api/cad-files/info/:filename
 */
router.get('/info/:filename', (req, res) => {
  try {
    const { filename } = req.params;

    // Güvenlik kontrolü
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz dosya adı'
      });
    }

    const cadDirectories = [
      'C:/Mzk Makineler',
      'D:/Mzk Makineler',
      'E:/Mzk Makineler',
      'F:/Mzk Makineler',
      'G:/Mzk Makineler',
      'H:/Mzk Makineler',
      'I:/Mzk Makineler',
      'J:/Mzk Makineler',
      'K:/Mzk Makineler',
      'L:/Mzk Makineler',
      'M:/Mzk Makineler',
      'N:/Mzk Makineler',
      'O:/Mzk Makineler',
      'P:/Mzk Makineler',
      'Q:/Mzk Makineler',
      'R:/Mzk Makineler',
      'S:/Mzk Makineler',
      'T:/Mzk Makineler',
      'U:/Mzk Makineler',
      'V:/Mzk Makineler',
      'W:/Mzk Makineler',
      'X:/Mzk Makineler',
      'Y:/Mzk Makineler',
      'Z:/Mzk Makineler',
      '//mzrktasarim/Mzk Makineler',
      '//MZRKTASARIM/Mzk Makineler',
      '\\\\MZRKTASARIM\\Mzk Makineler',
      '\\\\mzrktasarim\\Mzk Makineler',
      '/tmp/cad_test'
    ];

    let filePath = null;
    let foundDirectory = null;

    for (const directory of cadDirectories) {
      const testPath = path.join(directory, filename);
      if (fs.existsSync(testPath)) {
        filePath = testPath;
        foundDirectory = directory;
        break;
      }
    }

    if (!filePath) {
      return res.status(404).json({
        success: false,
        message: 'CAD dosyası bulunamadı',
        filename: filename
      });
    }

    const stats = fs.statSync(filePath);
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const httpUrl = `${baseUrl}/api/cad-files/${filename}`;

    res.json({
      success: true,
      data: {
        filename: filename,
        filePath: filePath,
        directory: foundDirectory,
        httpUrl: httpUrl,
        size: stats.size,
        modified: stats.mtime,
        created: stats.birthtime,
        isFile: stats.isFile(),
        extension: path.extname(filename).toLowerCase()
      }
    });

  } catch (error) {
    console.error('CAD dosyası bilgisi hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası oluştu'
    });
  }
});

module.exports = router;