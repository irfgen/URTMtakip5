const winston = require('winston');
const path = require('path');

// Custom log format for technical drawing analysis
const customFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    if (stack) {
      log += `\n${stack}`;
    }
    
    if (Object.keys(meta).length > 0) {
      log += `\n${JSON.stringify(meta, null, 2)}`;
    }
    
    return log;
  })
);

// Create logger for technical drawing analysis
const teknikResimLogger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: customFormat,
  defaultMeta: { service: 'teknik-resim-analiz' },
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        customFormat
      )
    }),
    
    // File transport for all logs
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'teknik-resim.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 5
    }),
    
    // Error file transport
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'teknik-resim-error.log'),
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 5
    })
  ]
});

// OCR processing logger
teknikResimLogger.ocrLogger = {
  start: (filename, fileSize) => {
    teknikResimLogger.info('OCR Processing Started', {
      filename,
      fileSize,
      timestamp: new Date().toISOString()
    });
  },
  
  progress: (filename, progress, status) => {
    teknikResimLogger.debug('OCR Progress', {
      filename,
      progress: `${(progress * 100).toFixed(1)}%`,
      status
    });
  },
  
  complete: (filename, result) => {
    teknikResimLogger.info('OCR Processing Complete', {
      filename,
      confidence: result.confidence,
      wordCount: result.words?.length || 0,
      processingTime: result.processingTime
    });
  },
  
  error: (filename, error) => {
    teknikResimLogger.error('OCR Processing Error', {
      filename,
      error: error.message,
      stack: error.stack
    });
  }
};

// Analysis logger
teknikResimLogger.analysisLogger = {
  result: (filename, analysis) => {
    teknikResimLogger.info('Analysis Complete', {
      filename,
      extractedData: {
        parca_kodu: analysis.partName?.value || null,
        material: analysis.material?.value || null,
        projectName: analysis.projectName?.value || null,
        confidence: analysis.confidence?.overall || 0
      }
    });
  },
  
  lowConfidence: (filename, confidence, threshold) => {
    teknikResimLogger.warn('Low Confidence Result', {
      filename,
      confidence,
      threshold,
      message: 'OCR result has low confidence, may need manual verification'
    });
  }
};

module.exports = teknikResimLogger; 