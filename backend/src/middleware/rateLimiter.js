const rateLimit = require('express-rate-limit');

// Rate limiter for technical drawing analysis uploads
const teknikResimUploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Çok fazla teknik resim analiz isteği gönderiyorsunuz. 15 dakika sonra tekrar deneyin.',
      details: 'Her 15 dakikada maksimum 10 teknik resim analiz edebilirsiniz.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Çok fazla API isteği gönderiyorsunuz. Lütfen daha sonra tekrar deneyin.',
      details: 'Her 15 dakikada maksimum 100 istek yapabilirsiniz.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for irsaliye analysis via n8n workflow
const irsaliyeAnalizLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 60, // 60 requests per minute
    message: {
        success: false,
        error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Çok fazla istek. Lütfen daha sonra tekrar deneyin.',
            details: 'Her dakikada maksimum 60 irsaliye analizi isteği yapabilirsiniz.'
        }
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => process.env.NODE_ENV === 'development' // Disable in development
});

module.exports = {
    teknikResimUploadLimiter,
    apiLimiter,
    irsaliyeAnalizLimiter
};
 