const express = require('express');
const Joi = require('joi');
const winston = require('winston');
const { sequelize } = require('../config/database');
const { Op } = require('sequelize');

const router = express.Router();

// Logger yapılandırması
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Validation şemaları
const kategoriValidationSchema = Joi.object({
  kategori_adi: Joi.string().min(1).max(100).required().messages({
    'string.empty': 'Kategori adı boş olamaz',
    'string.min': 'Kategori adı en az 1 karakter olmalıdır',
    'string.max': 'Kategori adı en fazla 100 karakter olabilir',
    'any.required': 'Kategori adı zorunludur'
  }),
  renk_kodu: Joi.string().pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).default('#007bff').messages({
    'string.pattern.base': 'Geçerli bir hex renk kodu giriniz (örn: #007bff)'
  })
});

// GET /api/kategoriler - Tüm kategorileri listele
router.get('/', async (req, res) => {
  try {
    const { 
      aktif_kategoriler = 'true',
      not_sayilari = 'false' 
    } = req.query;

    let query = 'SELECT id, kategori_adi, renk_kodu, olusturma_tarihi FROM not_kategorileri WHERE 1=1';
    
    if (aktif_kategoriler === 'true') {
      query += ' AND aktif = 1';
    }

    if (not_sayilari === 'true') {
      query = `
        SELECT 
          nk.id,
          nk.kategori_adi,
          nk.renk_kodu,
          nk.olusturma_tarihi,
          COUNT(n.id) as not_sayisi
        FROM not_kategorileri nk
        LEFT JOIN notlar n ON nk.id = n.kategori_id AND n.aktif = 1
        WHERE nk.aktif = 1
        GROUP BY nk.id, nk.kategori_adi, nk.renk_kodu, nk.olusturma_tarihi
        ORDER BY nk.kategori_adi ASC
      `;
    } else {
      query += ' ORDER BY kategori_adi ASC';
    }

    const [results] = await sequelize.query(query);

    res.json({
      success: true,
      data: results
    });

    logger.info(`Kategoriler listelendi - Toplam: ${results.length}`);
  } catch (error) {
    logger.error('Kategorileri listeleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Kategoriler listelenirken hata oluştu',
      error: error.message
    });
  }
});

// GET /api/kategoriler/:id - Belirli bir kategoriyi getir
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const kategori = await NotKategorileri.findOne({
      where: { id, aktif: true },
      include: [{
        model: Notlar,
        as: 'notlar',
        attributes: ['id', 'baslik', 'olusturma_tarihi'],
        where: { aktif: true },
        required: false,
        order: [['olusturma_tarihi', 'DESC']],
        limit: 10 // Son 10 notu getir
      }]
    });

    if (!kategori) {
      return res.status(404).json({
        success: false,
        message: 'Kategori bulunamadı'
      });
    }

    res.json({
      success: true,
      data: kategori
    });

    logger.info(`Kategori detayı getirildi - ID: ${id}`);
  } catch (error) {
    logger.error('Kategori detayı getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Kategori getirilirken hata oluştu',
      error: error.message
    });
  }
});

// POST /api/kategoriler - Yeni kategori oluştur
router.post('/', async (req, res) => {
  try {
    // Validation
    const { error, value } = kategoriValidationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation hatası',
        errors: error.details.map(detail => detail.message)
      });
    }

    // Aynı isimde kategori var mı kontrol et
    const [existingResults] = await sequelize.query(
      'SELECT id FROM not_kategorileri WHERE kategori_adi = ? AND aktif = 1',
      { replacements: [value.kategori_adi] }
    );

    if (existingResults.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Bu isimde bir kategori zaten mevcut'
      });
    }

    // Kategori oluştur
    const insertQuery = 'INSERT INTO not_kategorileri (kategori_adi, renk_kodu, olusturma_tarihi, guncelleme_tarihi, aktif) VALUES (?, ?, datetime("now"), datetime("now"), 1)';
    const insertParams = [value.kategori_adi, value.renk_kodu || '#007bff'];
    
    const [insertResult] = await sequelize.query(insertQuery, { 
      replacements: insertParams,
      type: sequelize.QueryTypes.INSERT 
    });

    // Oluşturulan kategoriyi getir - SQLite için lastInsertRowid kullan
    const [newKategoriResults] = await sequelize.query(
      'SELECT * FROM not_kategorileri WHERE rowid = last_insert_rowid()'
    );

    res.status(201).json({
      success: true,
      message: 'Kategori başarıyla oluşturuldu',
      data: newKategoriResults[0]
    });

    logger.info(`Yeni kategori oluşturuldu - Ad: ${value.kategori_adi}`);
  } catch (error) {
    logger.error('Kategori oluşturma hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Kategori oluşturulurken hata oluştu',
      error: error.message
    });
  }
});

// PUT /api/kategoriler/:id - Kategori güncelle
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Mevcut kategoriyi bul
    const mevcutKategori = await NotKategorileri.findOne({
      where: { id, aktif: true }
    });

    if (!mevcutKategori) {
      return res.status(404).json({
        success: false,
        message: 'Kategori bulunamadı'
      });
    }

    // Validation
    const { error, value } = kategoriValidationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation hatası',
        errors: error.details.map(detail => detail.message)
      });
    }

    // Aynı isimde başka kategori var mı kontrol et (kendi hariç)
    if (value.kategori_adi !== mevcutKategori.kategori_adi) {
      const ayniIsimKategori = await NotKategorileri.findOne({
        where: { 
          kategori_adi: value.kategori_adi,
          aktif: true,
          id: { [Op.ne]: id }
        }
      });

      if (ayniIsimKategori) {
        return res.status(400).json({
          success: false,
          message: 'Bu isimde bir kategori zaten mevcut'
        });
      }
    }

    // Kategoriyi güncelle
    await mevcutKategori.update(value);

    res.json({
      success: true,
      message: 'Kategori başarıyla güncellendi',
      data: mevcutKategori
    });

    logger.info(`Kategori güncellendi - ID: ${id}`);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Bu isimde bir kategori zaten mevcut'
      });
    }

    logger.error('Kategori güncelleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Kategori güncellenirken hata oluştu',
      error: error.message
    });
  }
});

// DELETE /api/kategoriler/:id - Kategori sil (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const kategori = await NotKategorileri.findOne({
      where: { id, aktif: true }
    });

    if (!kategori) {
      return res.status(404).json({
        success: false,
        message: 'Kategori bulunamadı'
      });
    }

    // Bu kategoriye ait aktif not var mı kontrol et
    const aktifNotSayisi = await Notlar.count({
      where: { 
        kategori_id: id,
        aktif: true 
      }
    });

    if (aktifNotSayisi > 0) {
      return res.status(400).json({
        success: false,
        message: `Bu kategoriye ait ${aktifNotSayisi} adet not bulunuyor. Önce notları silmeli veya başka kategoriye taşımalısınız.`,
        data: { aktif_not_sayisi: aktifNotSayisi }
      });
    }

    // Soft delete - aktif durumunu false yap
    await kategori.update({ aktif: false });

    res.json({
      success: true,
      message: 'Kategori başarıyla silindi'
    });

    logger.info(`Kategori silindi - ID: ${id}`);
  } catch (error) {
    logger.error('Kategori silme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Kategori silinirken hata oluştu',
      error: error.message
    });
  }
});

// PUT /api/kategoriler/:id/notlari-tasi - Kategorinin notlarını başka kategoriye taşı
router.put('/:id/notlari-tasi', async (req, res) => {
  try {
    const { id } = req.params;
    const { yeni_kategori_id } = req.body;

    // Validation
    if (!yeni_kategori_id) {
      return res.status(400).json({
        success: false,
        message: 'Yeni kategori ID\'si gereklidir'
      });
    }

    // Kaynak kategoriyi kontrol et
    const kaynakKategori = await NotKategorileri.findOne({
      where: { id, aktif: true }
    });

    if (!kaynakKategori) {
      return res.status(404).json({
        success: false,
        message: 'Kaynak kategori bulunamadı'
      });
    }

    // Hedef kategoriyi kontrol et (null ise kategorisiz yapılacak)
    if (yeni_kategori_id !== null) {
      const hedefKategori = await NotKategorileri.findOne({
        where: { id: yeni_kategori_id, aktif: true }
      });

      if (!hedefKategori) {
        return res.status(404).json({
          success: false,
          message: 'Hedef kategori bulunamadı'
        });
      }
    }

    // Notları taşı
    const [etkilenenSatirSayisi] = await Notlar.update(
      { kategori_id: yeni_kategori_id },
      { 
        where: { 
          kategori_id: id,
          aktif: true 
        } 
      }
    );

    res.json({
      success: true,
      message: `${etkilenenSatirSayisi} adet not başarıyla taşındı`,
      data: { 
        tasinan_not_sayisi: etkilenenSatirSayisi,
        kaynak_kategori_id: id,
        hedef_kategori_id: yeni_kategori_id 
      }
    });

    logger.info(`Notlar taşındı - Kaynak: ${id}, Hedef: ${yeni_kategori_id}, Sayı: ${etkilenenSatirSayisi}`);
  } catch (error) {
    logger.error('Not taşıma hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Notlar taşınırken hata oluştu',
      error: error.message
    });
  }
});

// GET /api/kategoriler/istatistikler - Kategori istatistikleri
router.get('/istatistikler', async (req, res) => {
  try {
    const istatistikler = await NotKategorileri.findAll({
      where: { aktif: true },
      attributes: [
        'id',
        'kategori_adi',
        'renk_kodu',
        [
          NotKategorileri.sequelize.fn('COUNT', NotKategorileri.sequelize.col('notlar.id')),
          'toplam_not'
        ],
        [
          NotKategorileri.sequelize.fn(
            'COUNT',
            NotKategorileri.sequelize.case()
              .when(NotKategorileri.sequelize.col('notlar.resim_yolu'), 'IS NOT NULL')
              .then(NotKategorileri.sequelize.col('notlar.id'))
          ),
          'resimli_not'
        ]
      ],
      include: [{
        model: Notlar,
        as: 'notlar',
        attributes: [],
        where: { aktif: true },
        required: false
      }],
      group: ['NotKategorileri.id'],
      order: [['kategori_adi', 'ASC']]
    });

    // Kategorisiz notları da getir
    const kategorisizNotlar = await Notlar.count({
      where: { 
        kategori_id: null,
        aktif: true 
      }
    });

    const kategorisizResimliNotlar = await Notlar.count({
      where: { 
        kategori_id: null,
        aktif: true,
        resim_yolu: { [Op.ne]: null, [Op.ne]: '' }
      }
    });

    res.json({
      success: true,
      data: {
        kategoriler: istatistikler,
        kategorisiz: {
          toplam_not: kategorisizNotlar,
          resimli_not: kategorisizResimliNotlar
        }
      }
    });

    logger.info('Kategori istatistikleri getirildi');
  } catch (error) {
    logger.error('Kategori istatistikleri getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Kategori istatistikleri getirilirken hata oluştu',
      error: error.message
    });
  }
});

module.exports = router;
