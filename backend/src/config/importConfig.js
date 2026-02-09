const path = require('path');

/**
 * Import-Export Modülü Konfigürasyon Ayarları
 */
module.exports = {
  // Desteklenen dosya uzantıları
  allowedExtensions: ['.sldprt', '.sldpart', '.sldasm'],
  
  // Screenshot dizini
  screenshotDir: path.join(__dirname, '../../uploads/solidworks_screenshots'),
  
  // Eşzamanlı işlem sayısı (SolidWorks için genelde 1 olmalı)
  concurrentModels: 1,
  
  // SolidWorks ayarları
  solidworks: {
    // Python script yolu
    pythonScriptPath: path.join(__dirname, '../scripts/solidworks_wrapper.py'),
    
    // Python executable (sistem PATH'inde python varsa 'python', yoksa tam yol)
    pythonExecutable: process.env.PYTHON_PATH || 'python',
    
    // SolidWorks timeout (milisaniye)
    timeout: parseInt(process.env.SOLIDWORKS_TIMEOUT) || 30000,
    
    // Retry ayarları
    retryPolicy: {
      maxRetries: parseInt(process.env.SOLIDWORKS_MAX_RETRIES) || 2,
      retryDelay: parseInt(process.env.SOLIDWORKS_RETRY_DELAY) || 5000, // 5 saniye
      backoffMultiplier: 1.5 // Her deneme arasında bekleme süresini artır
    },
    
    // SolidWorks sürümü (opsiyonel, auto-detect için boş bırak)
    version: process.env.SOLIDWORKS_VERSION || null,
    
    // SolidWorks kurulum yolu (opsiyonel, registry'den otomatik bulur)
    installPath: process.env.SOLIDWORKS_INSTALL_PATH || null
  },
  
  // Toplu import ayarları
  bulkImport: {
    // Bir seferde işlenecek maksimum dosya sayısı
    maxFiles: parseInt(process.env.IMPORT_MAX_FILES) || 1000,
    
    // İşlemler arası bekleme süresi (ms) - sistem yükünü azaltmak için
    processingDelay: parseInt(process.env.IMPORT_PROCESSING_DELAY) || 100,
    
    // Batch boyutu (veritabanı işlemleri için)
    batchSize: parseInt(process.env.IMPORT_BATCH_SIZE) || 50
  },
  
  // Dosya ve dizin ayarları
  file: {
    // Maksimum dosya boyutu (MB)
    maxFileSizeMB: parseInt(process.env.IMPORT_MAX_FILE_SIZE_MB) || 100,
    
    // Hash algoritması (dosya değişiklik kontrolü için)
    hashAlgorithm: 'sha256',
    
    // Dizin tarama derinliği (0 = sınırsız)
    maxScanDepth: parseInt(process.env.IMPORT_MAX_SCAN_DEPTH) || 0,
    
    // Hariç tutulacak dizinler
    excludeDirectories: (process.env.IMPORT_EXCLUDE_DIRS || '').split(',').filter(d => d.trim())
  },
  
  // Log ayarları
  logging: {
    // Log seviyesi (error, warn, info, debug)
    level: process.env.IMPORT_LOG_LEVEL || 'info',
    
    // Detaylı loglama
    verbose: process.env.NODE_ENV === 'development',
    
    // İlerleme raporlama sıklığı (her X dosyada bir)
    progressReportInterval: parseInt(process.env.IMPORT_PROGRESS_INTERVAL) || 10
  },
  
  // Güvenlik ayarları
  security: {
    // İzin verilen dosya yolları (güvenlik için)
    allowedBasePaths: (process.env.IMPORT_ALLOWED_PATHS || '').split(',').filter(p => p.trim()),
    
    // Yetkili roller
    authorizedRoles: ['admin', 'cad_importer', 'production_manager'],
    
    // Sessizce çalışma (kullanıcı etkileşimi olmadan)
    silentMode: process.env.IMPORT_SILENT_MODE === 'true'
  },
  
  // Performans ayarları
  performance: {
    // Memory limit (MB)
    memoryLimitMB: parseInt(process.env.IMPORT_MEMORY_LIMIT_MB) || 512,
    
    // CPU kullanım limiti (0.0 - 1.0)
    cpuLimit: parseFloat(process.env.IMPORT_CPU_LIMIT) || 0.8,
    
    // Önbellek boyutu
    cacheSize: parseInt(process.env.IMPORT_CACHE_SIZE) || 100
  },
  
  // Screenshot ayarları
  screenshot: {
    // Görüntü formatı
    format: process.env.SCREENSHOT_FORMAT || 'png',
    
    // Görüntü kalitesi (1-100, PNG için geçersiz)
    quality: parseInt(process.env.SCREENSHOT_QUALITY) || 90,
    
    // Görüntü boyutu
    width: parseInt(process.env.SCREENSHOT_WIDTH) || 800,
    height: parseInt(process.env.SCREENSHOT_HEIGHT) || 600,
    
    // Zoom seviyesi
    zoomToFit: process.env.SCREENSHOT_ZOOM_TO_FIT !== 'false', // default true
    
    // Arka plan rengi (hex)
    backgroundColor: process.env.SCREENSHOT_BG_COLOR || '#FFFFFF'
  },
  
  // Export ayarları (gelecek sürümler için)
  export: {
    // Desteklenen export formatları
    supportedFormats: ['csv', 'xlsx', 'json', 'zip'],
    
    // Varsayılan export formatı
    defaultFormat: 'xlsx',
    
    // Export dizini
    exportDir: path.join(__dirname, '../../uploads/exports'),
    
    // ZIP dosyası ayarları
    zip: {
      // Compression seviyesi (0-9)
      compressionLevel: parseInt(process.env.EXPORT_ZIP_COMPRESSION) || 6,
      
      // Maksimum arşiv boyutu (MB)
      maxArchiveSizeMB: parseInt(process.env.EXPORT_MAX_ARCHIVE_SIZE_MB) || 500
    }
  },
  
  // Debug ve geliştirme ayarları
  debug: {
    // Test modu (gerçek SolidWorks işlemleri yapmaz)
    testMode: process.env.IMPORT_TEST_MODE === 'true',
    
    // Mock screenshot'lar oluştur
    mockScreenshots: process.env.IMPORT_MOCK_SCREENSHOTS === 'true',
    
    // Timing bilgilerini logla
    logTimings: process.env.IMPORT_LOG_TIMINGS === 'true',
    
    // Temporary dosyaları sakla
    keepTempFiles: process.env.IMPORT_KEEP_TEMP_FILES === 'true'
  }
};

/**
 * Konfigürasyon doğrulama fonksiyonu
 */
function validateConfig() {
  const config = module.exports;
  const errors = [];
  
  // Kritik dizinleri kontrol et
  const fs = require('fs');
  
  if (!fs.existsSync(path.dirname(config.screenshotDir))) {
    try {
      fs.mkdirSync(path.dirname(config.screenshotDir), { recursive: true });
    } catch (error) {
      errors.push(`Screenshot dizini oluşturulamadı: ${config.screenshotDir}`);
    }
  }
  
  if (!fs.existsSync(path.dirname(config.export.exportDir))) {
    try {
      fs.mkdirSync(path.dirname(config.export.exportDir), { recursive: true });
    } catch (error) {
      errors.push(`Export dizini oluşturulamadı: ${config.export.exportDir}`);
    }
  }
  
  // Sayısal değerleri kontrol et
  if (config.solidworks.timeout < 1000) {
    errors.push('SolidWorks timeout çok düşük (minimum 1000ms)');
  }
  
  if (config.bulkImport.maxFiles < 1) {
    errors.push('Bulk import maxFiles 1\'den küçük olamaz');
  }
  
  if (config.performance.cpuLimit < 0.1 || config.performance.cpuLimit > 1.0) {
    errors.push('CPU limit 0.1 ile 1.0 arasında olmalı');
  }
  
  return errors;
}

// Başlangıçta konfigürasyonu doğrula
if (process.env.NODE_ENV !== 'test') {
  const validationErrors = validateConfig();
  if (validationErrors.length > 0) {
    console.warn('[ImportConfig] Konfigürasyon uyarıları:');
    validationErrors.forEach(error => console.warn(`  - ${error}`));
  }
}

module.exports.validateConfig = validateConfig;