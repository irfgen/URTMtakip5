const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const { FileError } = require('../utils/errors');

// File type validation for technical drawings
const allowedMimeTypes = (process.env.TEKNIK_RESIM_ALLOWED_MIME_TYPES || 'image/png,image/jpeg,image/jpg').split(',');
const maxFileSize = parseInt(process.env.TEKNIK_RESIM_MAX_FILE_SIZE) || 20971520; // 20MB

// Storage configuration for technical drawings analysis - use memory storage for processing
const storage = multer.memoryStorage();

// File filter for technical drawings
const fileFilter = (req, file, cb) => {
  // Check MIME type
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(new FileError(
      `Desteklenmeyen dosya formatı: ${file.mimetype}. Desteklenen formatlar: ${allowedMimeTypes.join(', ')}`,
      'INVALID_FILE_FORMAT'
    ), false);
  }

  // Check file extension
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExtensions = ['.png', '.jpg', '.jpeg'];
  
  if (!allowedExtensions.includes(ext)) {
    return cb(new FileError(
      `Desteklenmeyen dosya uzantısı: ${ext}. Desteklenen uzantılar: ${allowedExtensions.join(', ')}`,
      'INVALID_FILE_EXTENSION'
    ), false);
  }

  cb(null, true);
};

// Multer configuration for technical drawing analysis
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: maxFileSize,
    files: 1 // Only one file at a time
  }
});

// Upload middleware with error handling for technical drawings
const uploadTeknikResim = (fieldName = 'teknik_resim') => {
  return (req, res, next) => {
    const singleUpload = upload.single(fieldName);
    
    singleUpload(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(new FileError(
            `Dosya boyutu çok büyük. Maksimum boyut: ${Math.round(maxFileSize / 1024 / 1024)}MB`,
            'FILE_TOO_LARGE'
          ));
        }
        
        if (err.code === 'LIMIT_FILE_COUNT') {
          return next(new FileError(
            'Aynı anda sadece bir dosya yükleyebilirsiniz',
            'TOO_MANY_FILES'
          ));
        }
        
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return next(new FileError(
            'Beklenmeyen dosya alanı',
            'UNEXPECTED_FILE'
          ));
        }
        
        return next(new FileError(err.message, 'UPLOAD_ERROR'));
      }
      
      if (err) {
        return next(err);
      }
      
      // Check if file was uploaded
      if (!req.file) {
        return next(new FileError(
          'Teknik resim dosyası yüklenmedi. Lütfen bir dosya seçin.',
          'NO_FILE_UPLOADED'
        ));
      }
      
      next();
    });
  };
};

// File validation middleware for technical drawings
const validateTeknikResim = (req, res, next) => {
  if (!req.file) {
    return next(new FileError('Teknik resim dosyası bulunamadı', 'NO_FILE'));
  }

  // Magic number validation for additional security
  const magicNumbers = {
    'image/png': [0x89, 0x50, 0x4E, 0x47],
    'image/jpeg': [0xFF, 0xD8, 0xFF],
    'image/jpg': [0xFF, 0xD8, 0xFF]
  };

  const buffer = req.file.buffer;
  const mimeType = req.file.mimetype;
  
  if (magicNumbers[mimeType]) {
    const expectedMagic = magicNumbers[mimeType];
    const actualMagic = Array.from(buffer.slice(0, expectedMagic.length));
    
    if (!expectedMagic.every((byte, index) => byte === actualMagic[index])) {
      return next(new FileError(
        'Dosya tipi geçersiz. Dosya içeriği uzantısı ile uyuşmuyor.',
        'INVALID_FILE_CONTENT'
      ));
    }
  }

  // Add file metadata to request
  req.fileMetadata = {
    originalName: req.file.originalname,
    mimeType: req.file.mimetype,
    size: req.file.size,
    sizeFormatted: `${(req.file.size / 1024 / 1024).toFixed(2)}MB`,
    uploadedAt: new Date().toISOString()
  };

  next();
};

module.exports = {
  uploadTeknikResim,
  validateTeknikResim
}; 