const { v4: uuidv4 } = require('uuid');
const MakinaStok = require('../models/MakinaStok');
const Makina = require('../models/Makina');

/**
 * Tüm stokları listeler
 * @route GET /api/makina-stok
 */
exports.listStok = async (req, res) => {
  try {
    const { makina_id, depo_id, giris_kaynagi, limit = 50, offset = 0 } = req.query;
    const where = {};

    if (makina_id) where.makina_id = makina_id;
    if (depo_id) where.depo_id = depo_id;
    if (giris_kaynagi) where.giris_kaynagi = giris_kaynagi;

    const stoklar = await MakinaStok.findAll({
      where,
      include: [{
        model: Makina,
        as: 'makina',
        attributes: ['makina_id', 'name', 'model']
      }],
      order: [['giris_tarihi', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.status(200).json({
      success: true,
      data: stoklar,
      count: stoklar.length
    });
  } catch (error) {
    console.error('Stoklar listelenirken hata:', error);
    res.status(500).json({
      success: false,
      message: 'Stoklar listelenirken bir hata oluştu',
      error: error.message
    });
  }
};

/**
 * Stok detayını getirir
 * @route GET /api/makina-stok/:id
 */
exports.getStokDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const stok = await MakinaStok.findByPk(id, {
      include: [{
        model: Makina,
        as: 'makina',
        attributes: ['makina_id', 'name', 'model', 'items']
      }]
    });

    if (!stok) {
      return res.status(404).json({
        success: false,
        message: 'Stok bulunamadı'
      });
    }

    res.status(200).json({
      success: true,
      data: stok
    });
  } catch (error) {
    console.error('Stok detayı alınırken hata:', error);
    res.status(500).json({
      success: false,
      message: 'Stok detayı alınırken bir hata oluştu',
      error: error.message
    });
  }
};

/**
 * Yeni stok girişi oluşturur
 * @route POST /api/makina-stok
 */
exports.createStok = async (req, res) => {
  try {
    const {
      makina_id,
      adet,
      depo_id,
      giris_kaynagi,
      giris_tarihi,
      siparis_id,
      seri_nolari,
      notlar
    } = req.body;

    // Validasyonlar
    if (!makina_id || adet === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Makina ID ve adet zorunludur'
      });
    }

    if (adet < 0) {
      return res.status(400).json({
        success: false,
        message: 'Adet 0 veya pozitif olmalıdır'
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

    const newStok = await MakinaStok.create({
      stok_id: uuidv4(),
      makina_id,
      adet,
      depo_id,
      giris_kaynagi,
      giris_tarihi: giris_tarihi || new Date(),
      siparis_id,
      seri_nolari: seri_nolari ? JSON.stringify(seri_nolari) : null,
      notlar
    });

    res.status(201).json({
      success: true,
      data: newStok,
      message: 'Stok girişi başarıyla oluşturuldu'
    });
  } catch (error) {
    console.error('Stok girişi oluşturulurken hata:', error);
    res.status(500).json({
      success: false,
      message: 'Stok girişi oluşturulurken bir hata oluştu',
      error: error.message
    });
  }
};

/**
 * Stok günceller
 * @route PUT /api/makina-stok/:id
 */
exports.updateStok = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const stok = await MakinaStok.findByPk(id);
    if (!stok) {
      return res.status(404).json({
        success: false,
        message: 'Stok bulunamadı'
      });
    }

    // Seri numaraları JSON convert
    if (updateData.seri_nolari && Array.isArray(updateData.seri_nolari)) {
      updateData.seri_nolari = JSON.stringify(updateData.seri_nolari);
    }

    await stok.update(updateData);

    res.status(200).json({
      success: true,
      data: stok,
      message: 'Stok başarıyla güncellendi'
    });
  } catch (error) {
    console.error('Stok güncellenirken hata:', error);
    res.status(500).json({
      success: false,
      message: 'Stok güncellenirken bir hata oluştu',
      error: error.message
    });
  }
};

/**
 * Stok siler
 * @route DELETE /api/makina-stok/:id
 */
exports.deleteStok = async (req, res) => {
  try {
    const { id } = req.params;

    const stok = await MakinaStok.findByPk(id);
    if (!stok) {
      return res.status(404).json({
        success: false,
        message: 'Stok bulunamadı'
      });
    }

    await stok.destroy();

    res.status(200).json({
      success: true,
      message: 'Stok başarıyla silindi'
    });
  } catch (error) {
    console.error('Stok silinirken hata:', error);
    res.status(500).json({
      success: false,
      message: 'Stok silinirken bir hata oluştu',
      error: error.message
    });
  }
};

/**
 * Stoktan düşme işlemi (satış için)
 * @route POST /api/makina-stok/stoktan-dus
 */
exports.stoktanDus = async (req, res) => {
  try {
    const { makina_id, adet, aciklama } = req.body;

    // Validasyonlar
    if (!makina_id || !adet) {
      return res.status(400).json({
        success: false,
        message: 'Makina ID ve adet zorunludur'
      });
    }

    if (adet < 1) {
      return res.status(400).json({
        success: false,
        message: 'Adet 1 veya daha büyük olmalıdır'
      });
    }

    // Stokları bul (eski tarihten başla, FIFO mantığı)
    const stoklar = await MakinaStok.findAll({
      where: { makina_id },
      order: [['giris_tarihi', 'ASC']]
    });

    let kalanAdet = adet;
    const dusulenStoklar = [];

    for (const stok of stoklar) {
      if (kalanAdet <= 0) break;

      if (stok.adet >= kalanAdet) {
        // Bu stoktan düşülecek
        stok.adet -= kalanAdet;
        await stok.save();
        dusulenStoklar.push({
          stok_id: stok.stok_id,
          dusulen: kalanAdet
        });
        kalanAdet = 0;
      } else {
        // Bu stokun tamamını düş, kalanı diğer stoklardan
        kalanAdet -= stok.adet;
        dusulenStoklar.push({
          stok_id: stok.stok_id,
          dusulen: stok.adet
        });
        stok.adet = 0;
        await stok.save();
      }
    }

    if (kalanAdet > 0) {
      return res.status(400).json({
        success: false,
        message: `Yetersiz stok. ${adet - kalanAdet}/${adet} adet düşülebildi`
      });
    }

    res.status(200).json({
      success: true,
      data: dusulenStoklar,
      message: 'Stoktan başarıyla düşüldü'
    });
  } catch (error) {
    console.error('Stoktan düşülürken hata:', error);
    res.status(500).json({
      success: false,
      message: 'Stoktan düşülürken bir hata oluştu',
      error: error.message
    });
  }
};

module.exports = exports;
