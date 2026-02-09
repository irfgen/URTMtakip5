const multer = require('multer');
const path = require('path');
const fs = require('fs');

/**
 * Upload Middleware - Uygunsuzluk Dosyaları için
 * Çoklu resim upload desteği
 */

// Upload klasörleri
const uploadDirs = {
  uygunsuzluk_dosyalari: path.join(__dirname, '../../uploads/uygunsuzluk_dosyalari')
};

// Klasörleri oluştur
Object.values(uploadDirs).forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Multer disk storage yapılandırması
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirs.uygunsuzluk_dosyalari);
  },
  filename: (req, file, cb) => {
    // Benzersiz dosya adı: timestamp + random + original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'uys-' + uniqueSuffix + ext);
  }
});

// Dosya filtresi - sadece resim, PDF ve döküman dosyalarına izin ver
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Dosya türü desteklenmiyor. Sadece resim (JPG, PNG, GIF, WebP), PDF ve Office dosyaları yüklenebilir.'), false);
  }
};

// Upload middleware - tek dosya için
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10 MB maksimum dosya boyutu
  }
});

// Upload middleware - çoklu dosya için
const uploadMultiple = (dir, maxCount = 10) => {
  return multer({
    storage,
    fileFilter,
    limits: {
      fileSize: 10 * 1024 * 1024, // 10 MB per file
      files: maxCount // Maksimum dosya sayısı
    }
  });
};

// Hata yönetimi middleware'i
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'Dosya boyutu çok büyük. Maksimum 10 MB.',
        code: 'FILE_TOO_LARGE'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        error: `Çok fazla dosya. Maksimum ${err.limit} dosya yükleyebilirsiniz.`,
        code: 'TOO_MANY_FILES'
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        error: 'Beklenmeyen dosya alanı.',
        code: 'UNEXPECTED_FILE'
      });
    }
  }

  if (err && err.message) {
    return res.status(400).json({
      error: err.message,
      code: 'UPLOAD_ERROR'
    });
  }

  next(err);
};

module.exports = {
  upload,
  uploadMultiple,
  handleUploadError
};
