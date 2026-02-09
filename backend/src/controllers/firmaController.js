const db = require('../models');
const { Op } = require('sequelize');

// Firma listesi (sayfalama, arama, filtreleme ile)
const listFirmalar = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      arama,
      durum,
      sort = 'firma_adi',
      order = 'ASC'
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = {};

    // Arama filtresi
    if (arama) {
      where[Op.or] = [
        { firma_adi: { [Op.iLike]: `%${arama}%` } },
        { firma_kodu: { [Op.iLike]: `%${arama}%` } },
        { vergi_no: { [Op.iLike]: `%${arama}%` } },
        { yetkili_kisi: { [Op.iLike]: `%${arama}%` } },
        { email: { [Op.iLike]: `%${arama}%` } }
      ];
    }

    // Durum filtresi
    if (durum) {
      where.durum = durum;
    }

    // Aktif filtresi (eski versiyon uyumluluğu için)
    if (req.query.aktif) {
      where.durum = req.query.aktif === 'true' ? 'aktif' : 'pasif';
    }

    const validSortFields = ['firma_adi', 'firma_kodu', 'created_at', 'durum'];
    const sortField = validSortFields.includes(sort) ? sort : 'firma_adi';
    const sortOrder = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    const { count, rows: firmalar } = await db.Firma.findAndCountAll({
      where,
      offset,
      limit: parseInt(limit),
      order: [[sortField, sortOrder]]
    });

    res.json({
      success: true,
      data: firmalar,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Firma listesi hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Firmalar listelenirken bir hata oluştu',
      error: error.message
    });
  }
};

// Tekil firma detayı
const getFirma = async (req, res) => {
  try {
    const { id } = req.params;

    const firma = await db.Firma.findByPk(id, {
      include: [
        {
          association: 'tedarikTalepleri',
          attributes: ['id', 'talep_kodu', 'toplam_tutar', 'durum', 'created_at']
        }
      ]
    });

    if (!firma) {
      return res.status(404).json({
        success: false,
        message: 'Firma bulunamadı'
      });
    }

    res.json({
      success: true,
      data: firma
    });
  } catch (error) {
    console.error('Firma detayı hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Firma detayı alınırken bir hata oluştu',
      error: error.message
    });
  }
};

// Yeni firma oluştur
const createFirma = async (req, res) => {
  try {
    const firmaData = req.body;

    // Firma kodu unique kontrolü
    const existingFirma = await db.Firma.findOne({
      where: { firma_kodu: firmaData.firma_kodu }
    });

    if (existingFirma) {
      return res.status(400).json({
        success: false,
        message: 'Bu firma kodu zaten kullanımda'
      });
    }

    const firma = await db.Firma.create(firmaData);

    res.status(201).json({
      success: true,
      message: 'Firma başarıyla oluşturuldu',
      data: firma
    });
  } catch (error) {
    console.error('Firma oluşturma hatası:', error);

    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validasyon hatası',
        errors: error.errors.map(err => ({
          field: err.path,
          message: err.message
        }))
      });
    }

    res.status(500).json({
      success: false,
      message: 'Firma oluşturulurken bir hata oluştu',
      error: error.message
    });
  }
};

// Firma güncelle
const updateFirma = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const firma = await db.Firma.findByPk(id);
    if (!firma) {
      return res.status(404).json({
        success: false,
        message: 'Firma bulunamadı'
      });
    }

    // Firma kodu değiştiriliyorsa unique kontrolü
    if (updateData.firma_kodu && updateData.firma_kodu !== firma.firma_kodu) {
      const existingFirma = await db.Firma.findOne({
        where: {
          firma_kodu: updateData.firma_kodu,
          id: { [Op.ne]: id }
        }
      });

      if (existingFirma) {
        return res.status(400).json({
          success: false,
          message: 'Bu firma kodu zaten kullanımda'
        });
      }
    }

    await firma.update(updateData);

    res.json({
      success: true,
      message: 'Firma başarıyla güncellendi',
      data: firma
    });
  } catch (error) {
    console.error('Firma güncelleme hatası:', error);

    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validasyon hatası',
        errors: error.errors.map(err => ({
          field: err.path,
          message: err.message
        }))
      });
    }

    res.status(500).json({
      success: false,
      message: 'Firma güncellenirken bir hata oluştu',
      error: error.message
    });
  }
};

// Firma sil
const deleteFirma = async (req, res) => {
  try {
    const { id } = req.params;

    const firma = await db.Firma.findByPk(id);
    if (!firma) {
      return res.status(404).json({
        success: false,
        message: 'Firma bulunamadı'
      });
    }

    // İlişkili tedarik talepleri varsa silmeyi engelle
    const tedarikTalepleri = await firma.getTedarikTalepleri();
    if (tedarikTalepleri.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Bu firmaya ait tedarik talepleri olduğu için silinemez',
        data: {
          tedarik_talebi_sayisi: tedarikTalepleri.length
        }
      });
    }

    await firma.destroy();

    res.json({
      success: true,
      message: 'Firma başarıyla silindi'
    });
  } catch (error) {
    console.error('Firma silme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Firma silinirken bir hata oluştu',
      error: error.message
    });
  }
};

// Firma durum değiştir (aktif/pasif)
const changeDurum = async (req, res) => {
  try {
    const { id } = req.params;
    const { durum } = req.body;

    if (!['aktif', 'pasif'].includes(durum)) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz durum. Sadece "aktif" veya "pasif" olabilir'
      });
    }

    const firma = await db.Firma.findByPk(id);
    if (!firma) {
      return res.status(404).json({
        success: false,
        message: 'Firma bulunamadı'
      });
    }

    await firma.update({ durum });

    res.json({
      success: true,
      message: `Firma durumu başarıyla "${durum}" olarak güncellendi`,
      data: firma
    });
  } catch (error) {
    console.error('Firma durum değiştirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Firma durumu güncellenirken bir hata oluştu',
      error: error.message
    });
  }
};

// Firma istatistikleri
const getFirmaIstatistikler = async (req, res) => {
  try {
    const stats = await db.Firma.findAll({
      attributes: [
        'durum',
        [db.Firma.sequelize.fn('COUNT', db.Firma.sequelize.col('id')), 'sayi']
      ],
      group: ['durum']
    });

    const total = await db.Firma.count();
    const aktif = stats.find(s => s.durum === 'aktif')?.sayi || 0;
    const pasif = stats.find(s => s.durum === 'pasif')?.sayi || 0;

    // Son eklenen firmalar
    const sonEklenenler = await db.Firma.findAll({
      limit: 5,
      order: [['created_at', 'DESC']],
      attributes: ['id', 'firma_adi', 'firma_kodu', 'created_at']
    });

    res.json({
      success: true,
      data: {
        toplam: total,
        aktif,
        pasif,
        sonEklenenler
      }
    });
  } catch (error) {
    console.error('Firma istatistikleri hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Firma istatistikleri alınırken bir hata oluştu',
      error: error.message
    });
  }
};

module.exports = {
  listFirmalar,
  getFirma,
  createFirma,
  updateFirma,
  deleteFirma,
  changeDurum,
  getFirmaIstatistikler
};