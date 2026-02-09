const Joi = require('joi');

const tezgahSchema = Joi.object({
  tezgah_tanimi: Joi.string().min(3).max(100).required().messages({
    'string.base': 'Tezgah tanımı metin olmalıdır.',
    'string.empty': 'Tezgah tanımı boş olamaz.',
    'string.min': 'Tezgah tanımı en az 3 karakter olmalıdır.',
    'string.max': 'Tezgah tanımı en fazla 100 karakter olabilir.',
    'any.required': 'Tezgah tanımı zorunludur.',
  }),
  calisma_durumu: Joi.string().valid('musait', 'calisiyor', 'bakim').default('musait').messages({
    'any.only': 'Çalışma durumu sadece "müsait", "çalışıyor", veya "bakım" olabilir.',
  }),
  is_emirleri: Joi.array().items(Joi.object()).default([]),
  is_emirleri_gecmisi: Joi.array().items(Joi.object()).default([]),
  pozisyon_x: Joi.number().integer().default(0),
  pozisyon_y: Joi.number().integer().default(0),
  genislik: Joi.number().integer().min(100).default(200),
  yukseklik: Joi.number().integer().min(100).default(120),
  son_bakim_tarihi: Joi.date().allow(null),
  sonraki_bakim_tarihi: Joi.date().allow(null),
});

const validateTezgah = (req, res, next) => {
  const { error } = tezgahSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Doğrulama hatası',
        details: error.details.map((d) => d.message).join(', '),
      },
    });
  }
  next();
};

module.exports = {
  validateTezgah,
};