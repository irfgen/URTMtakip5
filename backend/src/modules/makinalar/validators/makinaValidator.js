const Joi = require('joi');

const makinaSchema = Joi.object({
  name: Joi.string().min(3).max(100).required().messages({
    'string.base': 'Makina adı metin olmalıdır.',
    'string.empty': 'Makina adı boş olamaz.',
    'string.min': 'Makina adı en az 3 karakter olmalıdır.',
    'string.max': 'Makina adı en fazla 100 karakter olabilir.',
    'any.required': 'Makina adı zorunludur.',
  }),
  description: Joi.string().allow('', null).max(500).messages({
    'string.max': 'Açıklama en fazla 500 karakter olabilir.',
  }),
  model: Joi.string().allow('', null).max(100).messages({
    'string.max': 'Model en fazla 100 karakter olabilir.',
  }),
  seri_no: Joi.string().allow('', null).max(100).messages({
    'string.max': 'Seri numarası en fazla 100 karakter olabilir.',
  }),
  uretim_yili: Joi.alternatives().try(
    Joi.string().allow('', 'null').empty(null),
    Joi.number().integer().min(1900).max(new Date().getFullYear()).allow(null),
    null
  ).allow(null, '').empty(null).default(null),
  durum: Joi.string().valid('aktif', 'pasif', 'bakim').default('aktif').messages({
    'any.only': 'Durum sadece "aktif", "pasif", veya "bakim" olabilir.',
  }),
  makina_sinifi_id: Joi.alternatives().try(
    Joi.number().integer().positive(),
    null
  ).allow(null),
  items: Joi.array().items(
    Joi.object({
      id: Joi.alternatives().try(Joi.string(), Joi.number()).required(),
      name: Joi.string().allow('').required(),
      type: Joi.string().valid('PART', 'BOM').required(),
      quantity: Joi.number().integer().min(1).required(),
    })
  ).default([]).allow(null),
});

const validateMakina = (req, res, next) => {
  const { error, value } = makinaSchema.validate(req.body, { abortEarly: false });
  if (error) {
    console.error('❌ Makina validation error:', {
      url: req.url,
      method: req.method,
      details: error.details,
      body: req.body
    });
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Doğrulama hatası',
        details: error.details.map((d) => d.message).join(', '),
      },
    });
  }
  console.log('✅ Makina validation passed for:', req.url);
  next();
};

module.exports = {
  validateMakina,
};