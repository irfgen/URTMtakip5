const { v4: uuidv4 } = require('uuid');
const MakinaSiparis = require('../models/MakinaSiparis');
const MakinaStok = require('../models/MakinaStok');
const Makina = require('../models/Makina');
const { sequelize } = require('../config/database');

/**
 * Tüm siparişleri listeler
 * @route GET /api/makina-siparisleri
 */
exports.listSiparisler = async (req, res) => {
  try {
    const { durum, makina_id, limit = 50, offset = 0 } = req.query;
    const where = {};

    if (durum) where.durum = durum;
    if (makina_id) where.makina_id = makina_id;

    const siparisler = await MakinaSiparis.findAll({
      where,
      include: [{
        model: Makina,
        as: 'makina',
        attributes: ['makina_id', 'name', 'model']
      }],
      order: [['siparis_tarihi', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.status(200).json({
      success: true,
      data: siparisler,
      count: siparisler.length
    });
  } catch (error) {
    console.error('Siparişler listelenirken hata:', error);
    res.status(500).json({
      success: false,
      message: 'Siparişler listelenirken bir hata oluştu',
      error: error.message
    });
  }
};

/**
 * Sipariş detayını getirir
 * @route GET /api/makina-siparisleri/:id
 */
exports.getSiparisDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const siparis = await MakinaSiparis.findByPk(id, {
      include: [{
        model: Makina,
        as: 'makina',
        attributes: ['makina_id', 'name', 'model', 'items']
      }]
    });

    if (!siparis) {
      return res.status(404).json({
        success: false,
        message: 'Sipariş bulunamadı'
      });
    }

    res.status(200).json({
      success: true,
      data: siparis
    });
  } catch (error) {
    console.error('Sipariş detayı alınırken hata:', error);
    res.status(500).json({
      success: false,
      message: 'Sipariş detayı alınırken bir hata oluştu',
      error: error.message
    });
  }
};

/**
 * Yeni sipariş oluşturur
 * @route POST /api/makina-siparisleri
 */
exports.createSiparis = async (req, res) => {
  try {
    const {
      makina_id,
      musteri,
      adet = 1,
      durum = 'Beklemede',
      siparis_tarihi,
      teslim_tarihi,
      not
    } = req.body;

    // Validasyonlar
    if (!makina_id || !musteri) {
      return res.status(400).json({
        success: false,
        message: 'Makina ID ve müşteri adı zorunludur'
      });
    }

    if (adet < 1) {
      return res.status(400).json({
        success: false,
        message: 'Adet 1 veya daha büyük olmalıdır'
      });
    }

    // Makina varlığını kontrol et
    const makina = await Makina.findByPk(makina_id);
    if (!makina) {
      return res.status(404).json({
        success: false,
        message: 'Makina bulunamadı'
      });
    }

    // Sipariş no oluştur
    const siparis_no = await generateSiparisNo();

    const newSiparis = await MakinaSiparis.create({
      siparis_id: uuidv4(),
      siparis_no,
      makina_id,
      musteri_adi: musteri.trim(),
      adet,
      durum,
      siparis_tarihi: siparis_tarihi ? new Date(siparis_tarihi) : new Date(),
      teslim_tarihi: teslim_tarihi ? new Date(teslim_tarihi) : null,
      notlar: not ? not.trim() : null
    });

    res.status(201).json({
      success: true,
      data: newSiparis,
      message: 'Sipariş başarıyla oluşturuldu'
    });
  } catch (error) {
    console.error('Sipariş oluşturulurken hata:', error);
    res.status(500).json({
      success: false,
      message: 'Sipariş oluşturulurken bir hata oluştu',
      error: error.message
    });
  }
};

/**
 * Siparişi günceller
 * @route PUT /api/makina-siparisleri/:id
 */
exports.updateSiparis = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const siparis = await MakinaSiparis.findByPk(id);
    if (!siparis) {
      return res.status(404).json({
        success: false,
        message: 'Sipariş bulunamadı'
      });
    }

    // Tamamlanmış sipariş güncellemesi kontrolü
    if (siparis.durum === 'Tamamlandı') {
      return res.status(400).json({
        success: false,
        message: 'Tamamlanmış sipariş güncellenemez'
      });
    }

    await siparis.update(updateData);

    res.status(200).json({
      success: true,
      data: siparis,
      message: 'Sipariş başarıyla güncellendi'
    });
  } catch (error) {
    console.error('Sipariş güncellenirken hata:', error);
    res.status(500).json({
      success: false,
      message: 'Sipariş güncellenirken bir hata oluştu',
      error: error.message
    });
  }
};

/**
 * Siparişi siler
 * @route DELETE /api/makina-siparisleri/:id
 */
exports.deleteSiparis = async (req, res) => {
  try {
    const { id } = req.params;

    const siparis = await MakinaSiparis.findByPk(id);
    if (!siparis) {
      return res.status(404).json({
        success: false,
        message: 'Sipariş bulunamadı'
      });
    }

    // İlgili stok kontrolü
    const relatedStok = await MakinaStok.findOne({
      where: { siparis_id: id }
    });

    if (relatedStok) {
      return res.status(400).json({
        success: false,
        message: 'Bu siparişe bağlı stok kaydı var. Önce stoku silmelisiniz.'
      });
    }

    await siparis.destroy();

    res.status(200).json({
      success: true,
      message: 'Sipariş başarıyla silindi'
    });
  } catch (error) {
    console.error('Sipariş silinirken hata:', error);
    res.status(500).json({
      success: false,
      message: 'Sipariş silinirken bir hata oluştu',
      error: error.message
    });
  }
};

/**
 * Sipariş durumunu değiştirir
 * @route PATCH /api/makina-siparisleri/:id/durum
 */
exports.updateSiparisDurum = async (req, res) => {
  try {
    const { id } = req.params;
    const { durum } = req.body;

    if (!durum) {
      return res.status(400).json({
        success: false,
        message: 'Durum zorunludur'
      });
    }

    const siparis = await MakinaSiparis.findByPk(id);
    if (!siparis) {
      return res.status(404).json({
        success: false,
        message: 'Sipariş bulunamadı'
      });
    }

    const eski_durum = siparis.durum;
    await siparis.update({ durum });

    // Eğer durum "Tamamlandı" ise otomatik stok girişi yap
    if (durum === 'Tamamlandı' && eski_durum !== 'Tamamlandı') {
      await otomatikStokGirisi(siparis);
      await siparis.update({ tamamlanma_tarihi: new Date() });
    }

    res.status(200).json({
      success: true,
      data: siparis,
      message: `Sipariş durumu "${eski_durum}" → "${durum}" olarak güncellendi`
    });
  } catch (error) {
    console.error('Sipariş durumu güncellenirken hata:', error);
    res.status(500).json({
      success: false,
      message: 'Sipariş durumu güncellenirken bir hata oluştu',
      error: error.message
    });
  }
};

// Yardımcı fonksiyonlar

/**
 * Sipariş numarası üretir
 * Format: SIP-[YYYY]-[Sequence]
 */
async function generateSiparisNo() {
  const year = new Date().getFullYear();

  // Bu yılın son sipariş no'sunu bul
  const lastSiparis = await MakinaSiparis.findOne({
    where: {
      siparis_no: {
        [sequelize.Sequelize.Op.like]: `SIP-${year}-%`
      }
    },
    order: [['siparis_no', 'DESC']]
  });

  let sequence = 1;
  if (lastSiparis) {
    const lastSequence = parseInt(lastSiparis.siparis_no.split('-')[2]);
    sequence = lastSequence + 1;
  }

  return `SIP-${year}-${String(sequence).padStart(4, '0')}`;
}

/**
 * Tamamlanan sipariş için otomatik stok girişi yapar
 */
async function otomatikStokGirisi(siparis) {
  try {
    // Zaten stok girişi yapılmış mı kontrol et
    const existingStok = await MakinaStok.findOne({
      where: { siparis_id: siparis.siparis_id }
    });

    if (existingStok) {
      console.log('Bu sipariş için zaten stok girişi yapılmış');
      return;
    }

    // Stok girişi oluştur
    await MakinaStok.create({
      stok_id: uuidv4(),
      makina_id: siparis.makina_id,
      adet: siparis.adet,
      giris_kaynagi: 'Üretim',
      giris_tarihi: new Date(),
      siparis_id: siparis.siparis_id
    });

    console.log(`Sipariş ${siparis.siparis_no} için otomatik stok girişi yapıldı`);
  } catch (error) {
    console.error('Otomatik stok girişi hatası:', error);
    throw error;
  }
}

module.exports = exports;
