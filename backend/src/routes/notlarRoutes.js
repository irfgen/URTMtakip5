const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
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

// Multer yapılandırması - resim upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../../uploads/notlar');
    // Klasör yoksa oluştur
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Benzersiz dosya adı oluştur
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    cb(null, 'not-' + uniqueSuffix + fileExtension);
  }
});

// Dosya filtreleme - sadece resim dosyaları
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Sadece resim dosyaları yüklenebilir (JPEG, PNG, GIF, WebP)'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file limit
    files: 10 // Maximum 10 files
  }
});

// Çoklu resim upload için
const uploadMultiple = upload.array('resimler', 10);

// Validation şemaları
const notValidationSchema = Joi.object({
  baslik: Joi.string().min(1).max(500).required().messages({
    'string.empty': 'Başlık boş olamaz',
    'string.min': 'Başlık en az 1 karakter olmalıdır',
    'string.max': 'Başlık en fazla 500 karakter olabilir',
    'any.required': 'Başlık zorunludur'
  }),
  icerik: Joi.string().max(10000).allow('').messages({
    'string.max': 'İçerik en fazla 10000 karakter olabilir'
  }),
  kategori_id: Joi.number().integer().positive().allow(null).messages({
    'number.base': 'Kategori ID sayı olmalıdır',
    'number.integer': 'Kategori ID tam sayı olmalıdır',
    'number.positive': 'Kategori ID pozitif olmalıdır'
  }),
  olusturma_tarihi: Joi.date().optional(),
  kullanici_id: Joi.number().integer().positive().default(1)
});

// GET /api/notlar - Tüm notları listele (basit test)
router.get('/', async (req, res) => {
  try {
    // Notları resimlerle birlikte getir
    const [notlar] = await sequelize.query(`
      SELECT 
        n.id,
        n.baslik,
        n.icerik,
        n.resim_yolu,
        n.kategori_id,
        n.olusturma_tarihi,
        n.guncelleme_tarihi,
        nk.kategori_adi,
        nk.renk_kodu
      FROM notlar n
      LEFT JOIN not_kategorileri nk ON n.kategori_id = nk.id AND nk.aktif = 1
      WHERE n.aktif = 1
      ORDER BY n.olusturma_tarihi DESC
      LIMIT 20
    `);

    // Her not için resimlerini getir
    for (let not of notlar) {
      const [resimler] = await sequelize.query(`
        SELECT id, resim_yolu, resim_adi, resim_boyutu, sira_no
        FROM not_resimleri 
        WHERE not_id = ? AND aktif = 1
        ORDER BY sira_no ASC, olusturma_tarihi ASC
      `, {
        replacements: [not.id]
      });
      
      not.resimler = resimler;
    }

    res.json({
      success: true,
      data: {
        notlar: notlar,
        sayfalama: {
          mevcut_sayfa: 1,
          limit: 20,
          toplam_sayfa: 1,
          toplam_kayit: notlar.length
        }
      }
    });

    logger.info(`Notlar listelendi - Toplam: ${notlar.length}`);
  } catch (error) {
    logger.error('Notları listeleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Notlar listelenirken hata oluştu',
      error: error.message
    });
  }
});

// POST /api/notlar - Yeni not oluştur
router.post('/', uploadMultiple, async (req, res) => {
  try {
    // Request body'yi validate et
    const { error, value } = notValidationSchema.validate(req.body);
    if (error) {
      // Yüklenen dosyaları sil
      if (req.files && req.files.length > 0) {
        req.files.forEach(file => {
          try {
            fs.unlinkSync(file.path);
          } catch (deleteError) {
            logger.error('Dosya silme hatası:', deleteError);
          }
        });
      }
      return res.status(400).json({
        success: false,
        message: 'Validation hatası',
        error: error.details[0].message
      });
    }

    const { baslik, icerik, kategori_id, olusturma_tarihi } = value;
    
    // Not ekle
    const [result] = await sequelize.query(`
      INSERT INTO notlar (baslik, icerik, kategori_id, olusturma_tarihi, guncelleme_tarihi, kullanici_id, aktif)
      VALUES (?, ?, ?, ?, ?, 1, 1)
    `, {
      replacements: [
        baslik,
        icerik || null,
        kategori_id || null,
        olusturma_tarihi || new Date().toISOString(),
        new Date().toISOString()
      ]
    });

    // SQLite'ta son eklenen ID'yi al
    const [idResult] = await sequelize.query('SELECT last_insert_rowid() as id');
    const notId = idResult[0].id;

    // Resimleri kaydet
    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const resimYolu = `/uploads/notlar/${file.filename}`;
        
        await sequelize.query(`
          INSERT INTO not_resimleri (not_id, resim_yolu, resim_adi, resim_boyutu, sira_no, olusturma_tarihi, aktif)
          VALUES (?, ?, ?, ?, ?, ?, 1)
        `, {
          replacements: [
            notId,
            resimYolu,
            file.originalname,
            file.size,
            i + 1,
            new Date().toISOString()
          ]
        });
      }
    }

    // Oluşturulan notu resimlerle birlikte getir
    const [yeniNot] = await sequelize.query(`
      SELECT 
        n.id,
        n.baslik,
        n.icerik,
        n.kategori_id,
        n.olusturma_tarihi,
        n.guncelleme_tarihi,
        nk.kategori_adi,
        nk.renk_kodu
      FROM notlar n
      LEFT JOIN not_kategorileri nk ON n.kategori_id = nk.id AND nk.aktif = 1
      WHERE n.id = ?
    `, {
      replacements: [notId]
    });

    // Resimlerini getir
    const [resimler] = await sequelize.query(`
      SELECT id, resim_yolu, resim_adi, resim_boyutu, sira_no
      FROM not_resimleri 
      WHERE not_id = ? AND aktif = 1
      ORDER BY sira_no ASC
    `, {
      replacements: [notId]
    });

    const notData = yeniNot[0];
    notData.resimler = resimler;

    res.status(201).json({
      success: true,
      message: 'Not başarıyla oluşturuldu',
      data: notData
    });

    logger.info(`Yeni not oluşturuldu - ID: ${notId}, Başlık: ${baslik}, Resim sayısı: ${req.files ? req.files.length : 0}`);
  } catch (error) {
    // Dosya yükleme hatası durumunda dosyaları sil
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        try {
          fs.unlinkSync(file.path);
        } catch (deleteError) {
          logger.error('Hatalı dosya silinirken hata:', deleteError);
        }
      });
    }

    logger.error('Not oluşturma hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Not oluşturulurken hata oluştu',
      error: error.message
    });
  }
});

// GET /api/notlar - ORIGINAL Complex version (commented out for now)
/*
router.get('/', async (req, res) => {
  try {
    const {
      sayfa = 1,
      limit = 12,
      kategori_id,
      arama,
      baslangic_tarihi,
      bitis_tarihi,
      resimli,
      siralama = 'olusturma_tarihi',
      siralama_yonu = 'DESC'
    } = req.query;

    // Sayfalama
    const offset = (parseInt(sayfa) - 1) * parseInt(limit);

    // Where koşulları
    const whereConditions = { aktif: true };

    // Kategori filtresi
    if (kategori_id) {
      whereConditions.kategori_id = kategori_id;
    }

    // Arama filtresi (başlık ve içerikte)
    if (arama) {
      whereConditions[Op.or] = [
        { baslik: { [Op.like]: `%${arama}%` } },
        { icerik: { [Op.like]: `%${arama}%` } }
      ];
    }

    // Tarih aralığı filtresi
    if (baslangic_tarihi || bitis_tarihi) {
      whereConditions.olusturma_tarihi = {};
      if (baslangic_tarihi) {
        whereConditions.olusturma_tarihi[Op.gte] = new Date(baslangic_tarihi);
      }
      if (bitis_tarihi) {
        const bitisTarihi = new Date(bitis_tarihi);
        bitisTarihi.setHours(23, 59, 59, 999); // Günün sonuna ayarla
        whereConditions.olusturma_tarihi[Op.lte] = bitisTarihi;
      }
    }

    // Resimli/resimsiz filtresi
    if (resimli === 'true') {
      whereConditions.resim_yolu = { [Op.ne]: null, [Op.ne]: '' };
    } else if (resimli === 'false') {
      whereConditions[Op.or] = [
        { resim_yolu: null },
        { resim_yolu: '' }
      ];
    }

    // Sıralama
    const validSiralamalar = ['olusturma_tarihi', 'guncelleme_tarihi', 'baslik'];
    const validYonler = ['ASC', 'DESC'];
    const orderBy = validSiralamalar.includes(siralama) ? siralama : 'olusturma_tarihi';
    const orderDirection = validYonler.includes(siralama_yonu.toUpperCase()) ? siralama_yonu.toUpperCase() : 'DESC';

    // Notları getir
    const { count, rows: notlar } = await Notlar.findAndCountAll({
      where: whereConditions,
      include: [{
        model: NotKategorileri,
        as: 'kategori',
        attributes: ['id', 'kategori_adi', 'renk_kodu']
      }],
      order: [[orderBy, orderDirection]],
      limit: parseInt(limit),
      offset: offset
    });

    // Toplam sayfa sayısını hesapla
    const toplamSayfa = Math.ceil(count / parseInt(limit));

    res.json({
      success: true,
      data: {
        notlar,
        sayfalama: {
          mevcut_sayfa: parseInt(sayfa),
          toplam_sayfa: toplamSayfa,
          toplam_kayit: count,
          limit: parseInt(limit)
        }
      }
    });

    logger.info(`Notlar listelendi - Sayfa: ${sayfa}, Toplam: ${count}`);
  } catch (error) {
    logger.error('Notları listeleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Notlar listelenirken hata oluştu',
      error: error.message
    });
  }
});

// GET /api/notlar/:id - Belirli bir notu getir
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const not = await Notlar.findOne({
      where: { id, aktif: true },
      include: [{
        model: NotKategorileri,
        as: 'kategori',
        attributes: ['id', 'kategori_adi', 'renk_kodu']
      }]
    });

    if (!not) {
      return res.status(404).json({
        success: false,
        message: 'Not bulunamadı'
      });
    }

    res.json({
      success: true,
      data: not
    });

    logger.info(`Not detayı getirildi - ID: ${id}`);
  } catch (error) {
    logger.error('Not detayı getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Not getirilirken hata oluştu',
      error: error.message
    });
  }
});

// POST /api/notlar - Yeni not oluştur
router.post('/', upload.single('resim'), async (req, res) => {
  try {
    // Validation
    const { error, value } = notValidationSchema.validate(req.body);
    if (error) {
      // Eğer dosya yüklendiyse sil
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        success: false,
        message: 'Validation hatası',
        errors: error.details.map(detail => detail.message)
      });
    }

    // Resim yolu ekle
    if (req.file) {
      value.resim_yolu = `/uploads/notlar/${req.file.filename}`;
    }

    // Kategori kontrolü
    if (value.kategori_id) {
      const kategori = await NotKategorileri.findOne({
        where: { id: value.kategori_id, aktif: true }
      });
      if (!kategori) {
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(400).json({
          success: false,
          message: 'Geçersiz kategori seçimi'
        });
      }
    }

    // Not oluştur
    const yeniNot = await Notlar.create(value);

    // Kategori bilgisi ile birlikte getir
    const not = await Notlar.findOne({
      where: { id: yeniNot.id },
      include: [{
        model: NotKategorileri,
        as: 'kategori',
        attributes: ['id', 'kategori_adi', 'renk_kodu']
      }]
    });

    res.status(201).json({
      success: true,
      message: 'Not başarıyla oluşturuldu',
      data: not
    });

    logger.info(`Yeni not oluşturuldu - ID: ${yeniNot.id}, Başlık: ${value.baslik}`);
  } catch (error) {
    // Hata durumunda yüklenen dosyayı sil
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    
    logger.error('Not oluşturma hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Not oluşturulurken hata oluştu',
      error: error.message
    });
  }
});

// PUT /api/notlar/:id - Not güncelle
router.put('/:id', upload.single('resim'), async (req, res) => {
  try {
    const { id } = req.params;

    // Mevcut notu bul
    const mevcutNot = await Notlar.findOne({
      where: { id, aktif: true }
    });

    if (!mevcutNot) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({
        success: false,
        message: 'Not bulunamadı'
      });
    }

    // Validation
    const { error, value } = notValidationSchema.validate(req.body);
    if (error) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        success: false,
        message: 'Validation hatası',
        errors: error.details.map(detail => detail.message)
      });
    }

    // Yeni resim yüklendiyse eski resmi sil
    if (req.file) {
      if (mevcutNot.resim_yolu) {
        const eskiDosyaYolu = path.join(__dirname, '../../', mevcutNot.resim_yolu);
        if (fs.existsSync(eskiDosyaYolu)) {
          fs.unlinkSync(eskiDosyaYolu);
        }
      }
      value.resim_yolu = `/uploads/notlar/${req.file.filename}`;
    }

    // Kategori kontrolü
    if (value.kategori_id) {
      const kategori = await NotKategorileri.findOne({
        where: { id: value.kategori_id, aktif: true }
      });
      if (!kategori) {
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(400).json({
          success: false,
          message: 'Geçersiz kategori seçimi'
        });
      }
    }

    // Notu güncelle
    await mevcutNot.update(value);

    // Güncellenmiş notu kategori ile birlikte getir
    const guncellenmisNot = await Notlar.findOne({
      where: { id },
      include: [{
        model: NotKategorileri,
        as: 'kategori',
        attributes: ['id', 'kategori_adi', 'renk_kodu']
      }]
    });

    res.json({
      success: true,
      message: 'Not başarıyla güncellendi',
      data: guncellenmisNot
    });

    logger.info(`Not güncellendi - ID: ${id}`);
  } catch (error) {
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    
    logger.error('Not güncelleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Not güncellenirken hata oluştu',
      error: error.message
    });
  }
});

// DELETE /api/notlar/:id - Not sil (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const not = await Notlar.findOne({
      where: { id, aktif: true }
    });

    if (!not) {
      return res.status(404).json({
        success: false,
        message: 'Not bulunamadı'
      });
    }

    // Soft delete - aktif durumunu false yap
    await not.update({ aktif: false });

    res.json({
      success: true,
      message: 'Not başarıyla silindi'
    });

    logger.info(`Not silindi - ID: ${id}`);
  } catch (error) {
    logger.error('Not silme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Not silinirken hata oluştu',
      error: error.message
    });
  }
});

// DELETE /api/notlar/:id/resim - Not resmini sil
router.delete('/:id/resim', async (req, res) => {
  try {
    const { id } = req.params;

    const not = await Notlar.findOne({
      where: { id, aktif: true }
    });

    if (!not) {
      return res.status(404).json({
        success: false,
        message: 'Not bulunamadı'
      });
    }

    if (!not.resim_yolu) {
      return res.status(400).json({
        success: false,
        message: 'Bu notun resmi bulunmuyor'
      });
    }

    // Dosyayı sil
    const dosyaYolu = path.join(__dirname, '../../', not.resim_yolu);
    if (fs.existsSync(dosyaYolu)) {
      fs.unlinkSync(dosyaYolu);
    }

    // Resim yolunu temizle
    await not.update({ resim_yolu: null });

    res.json({
      success: true,
      message: 'Not resmi başarıyla silindi'
    });

    logger.info(`Not resmi silindi - ID: ${id}`);
  } catch (error) {
    logger.error('Not resmi silme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Not resmi silinirken hata oluştu',
      error: error.message
    });
  }
});
*/

// DELETE /api/notlar/:notId/resim/:resimId - Belirli bir resmi sil
router.delete('/:notId/resim/:resimId', async (req, res) => {
  try {
    const { notId, resimId } = req.params;

    // Resmi bul
    const [resim] = await sequelize.query(`
      SELECT nr.*, n.id as not_id
      FROM not_resimleri nr
      JOIN notlar n ON nr.not_id = n.id
      WHERE nr.id = ? AND nr.not_id = ? AND nr.aktif = 1 AND n.aktif = 1
    `, {
      replacements: [resimId, notId]
    });

    if (!resim.length) {
      return res.status(404).json({
        success: false,
        message: 'Resim bulunamadı'
      });
    }

    const resimData = resim[0];

    // Dosyayı sil
    const dosyaYolu = path.join(__dirname, '../../', resimData.resim_yolu);
    if (fs.existsSync(dosyaYolu)) {
      fs.unlinkSync(dosyaYolu);
    }

    // Veritabanından sil (soft delete)
    await sequelize.query(`
      UPDATE not_resimleri SET aktif = 0 WHERE id = ?
    `, {
      replacements: [resimId]
    });

    res.json({
      success: true,
      message: 'Resim başarıyla silindi'
    });

    logger.info(`Not resmi silindi - Not ID: ${notId}, Resim ID: ${resimId}`);
  } catch (error) {
    logger.error('Not resmi silme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Resim silinirken hata oluştu',
      error: error.message
    });
  }
});

// POST /api/notlar/:notId/resim - Mevcut nota yeni resim ekle
router.post('/:notId/resim', uploadMultiple, async (req, res) => {
  try {
    const { notId } = req.params;

    // Notun varlığını kontrol et
    const [not] = await sequelize.query(`
      SELECT id FROM notlar WHERE id = ? AND aktif = 1
    `, {
      replacements: [notId]
    });

    if (!not.length) {
      // Yüklenen dosyaları sil
      if (req.files && req.files.length > 0) {
        req.files.forEach(file => {
          try {
            fs.unlinkSync(file.path);
          } catch (deleteError) {
            logger.error('Dosya silme hatası:', deleteError);
          }
        });
      }
      return res.status(404).json({
        success: false,
        message: 'Not bulunamadı'
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'En az bir resim dosyası seçiniz'
      });
    }

    // Mevcut resim sayısını al
    const [countResult] = await sequelize.query(`
      SELECT COUNT(*) as count FROM not_resimleri WHERE not_id = ? AND aktif = 1
    `, {
      replacements: [notId]
    });

    const mevcutSayi = countResult[0].count;
    
    // Yeni resimleri kaydet
    const yeniResimler = [];
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const resimYolu = `/uploads/notlar/${file.filename}`;
      
      const [result] = await sequelize.query(`
        INSERT INTO not_resimleri (not_id, resim_yolu, resim_adi, resim_boyutu, sira_no, olusturma_tarihi, aktif)
        VALUES (?, ?, ?, ?, ?, ?, 1)
      `, {
        replacements: [
          notId,
          resimYolu,
          file.originalname,
          file.size,
          mevcutSayi + i + 1,
          new Date().toISOString()
        ]
      });

      // Son eklenen resmin ID'sini al
      const [idResult] = await sequelize.query('SELECT last_insert_rowid() as id');
      
      yeniResimler.push({
        id: idResult[0].id,
        resim_yolu: resimYolu,
        resim_adi: file.originalname,
        resim_boyutu: file.size,
        sira_no: mevcutSayi + i + 1
      });
    }

    res.status(201).json({
      success: true,
      message: `${req.files.length} adet resim başarıyla eklendi`,
      data: yeniResimler
    });

    logger.info(`Nota yeni resimler eklendi - Not ID: ${notId}, Resim sayısı: ${req.files.length}`);
  } catch (error) {
    // Dosya yükleme hatası durumunda dosyaları sil
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        try {
          fs.unlinkSync(file.path);
        } catch (deleteError) {
          logger.error('Hatalı dosya silinirken hata:', deleteError);
        }
      });
    }

    logger.error('Resim ekleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Resimler eklenirken hata oluştu',
      error: error.message
    });
  }
});

// DELETE /api/notlar/:id - Not sil (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Notun varlığını kontrol et
    const [not] = await sequelize.query(`
      SELECT id FROM notlar WHERE id = ? AND aktif = 1
    `, {
      replacements: [id]
    });

    if (!not.length) {
      return res.status(404).json({
        success: false,
        message: 'Not bulunamadı'
      });
    }

    // Nota ait resimleri al
    const [resimler] = await sequelize.query(`
      SELECT resim_yolu FROM not_resimleri WHERE not_id = ? AND aktif = 1
    `, {
      replacements: [id]
    });

    // Resim dosyalarını sil
    resimler.forEach(resim => {
      const dosyaYolu = path.join(__dirname, '../../', resim.resim_yolu);
      if (fs.existsSync(dosyaYolu)) {
        try {
          fs.unlinkSync(dosyaYolu);
        } catch (deleteError) {
          logger.error('Resim dosyası silme hatası:', deleteError);
        }
      }
    });

    // Nota ait resimleri soft delete
    await sequelize.query(`
      UPDATE not_resimleri SET aktif = 0 WHERE not_id = ?
    `, {
      replacements: [id]
    });

    // Notu soft delete
    await sequelize.query(`
      UPDATE notlar SET aktif = 0 WHERE id = ?
    `, {
      replacements: [id]
    });

    res.json({
      success: true,
      message: 'Not başarıyla silindi'
    });

    logger.info(`Not silindi - ID: ${id}`);
  } catch (error) {
    logger.error('Not silme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Not silinirken hata oluştu',
      error: error.message
    });
  }
});

// PUT /api/notlar/:id - Not güncelle (sadece bu implementasyon için)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Validation
    const { error, value } = notValidationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation hatası',
        error: error.details[0].message
      });
    }

    const { baslik, icerik, kategori_id, olusturma_tarihi } = value;

    // Notu güncelle
    const [result] = await sequelize.query(`
      UPDATE notlar 
      SET baslik = ?, icerik = ?, kategori_id = ?, olusturma_tarihi = ?, guncelleme_tarihi = ?
      WHERE id = ? AND aktif = 1
    `, {
      replacements: [
        baslik,
        icerik || null,
        kategori_id || null,
        olusturma_tarihi || new Date().toISOString(),
        new Date().toISOString(),
        id
      ]
    });

    // Güncellenmiş notu resimlerle birlikte getir
    const [guncellenmisNot] = await sequelize.query(`
      SELECT 
        n.id,
        n.baslik,
        n.icerik,
        n.kategori_id,
        n.olusturma_tarihi,
        n.guncelleme_tarihi,
        nk.kategori_adi,
        nk.renk_kodu
      FROM notlar n
      LEFT JOIN not_kategorileri nk ON n.kategori_id = nk.id AND nk.aktif = 1
      WHERE n.id = ? AND n.aktif = 1
    `, {
      replacements: [id]
    });

    if (!guncellenmisNot.length) {
      return res.status(404).json({
        success: false,
        message: 'Not bulunamadı'
      });
    }

    // Resimlerini getir
    const [resimler] = await sequelize.query(`
      SELECT id, resim_yolu, resim_adi, resim_boyutu, sira_no
      FROM not_resimleri 
      WHERE not_id = ? AND aktif = 1
      ORDER BY sira_no ASC
    `, {
      replacements: [id]
    });

    const notData = guncellenmisNot[0];
    notData.resimler = resimler;

    res.json({
      success: true,
      message: 'Not başarıyla güncellendi',
      data: notData
    });

    logger.info(`Not güncellendi - ID: ${id}`);
  } catch (error) {
    logger.error('Not güncelleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Not güncellenirken hata oluştu',
      error: error.message
    });
  }
});

module.exports = router;
