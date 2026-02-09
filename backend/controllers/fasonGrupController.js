const { FasonGrup, FasonIsEmri, Parca } = require('../models');
const { Op, Sequelize } = require('sequelize');

// Tüm fason gruplarını getir
const getAllFasonGruplar = async (req, res) => {
  try {
    const { search } = req.query;
    
    const whereCondition = {};
    if (search) {
      whereCondition[Op.or] = [
        { grup_adi: { [Op.like]: `%${search}%` } },
        { aciklama: { [Op.like]: `%${search}%` } }
      ];
    }

    const gruplar = await FasonGrup.findAll({
      where: whereCondition,
      include: [
        {
          model: FasonIsEmri,
          as: 'fasonIsEmirleri',
          include: [
            {
              model: Parca,
              as: 'parca',
              attributes: ['parcaKodu', 'parcaAdi']
            }
          ]
        }
      ],
      order: [['olusturma_tarihi', 'DESC']]
    });

    // Grup istatistiklerini hesapla
    const gruplarWithStats = gruplar.map(grup => ({
      ...grup.toJSON(),
      fason_is_emri_sayisi: grup.fasonIsEmirleri?.length || 0,
      aktif_parca_sayisi: new Set(grup.fasonIsEmirleri?.map(fe => fe.parca_kodu)).size || 0
    }));

    res.json(gruplarWithStats);
  } catch (error) {
    console.error('Fason grupları listelenirken hata:', error);
    res.status(500).json({
      error: 'Fason grupları listelenirken hata oluştu',
      details: error.message
    });
  }
};

// Tek fason grubu getir
const getFasonGrupById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const grup = await FasonGrup.findByPk(id, {
      include: [
        {
          model: FasonIsEmri,
          as: 'fasonIsEmirleri',
          include: [
            {
              model: Parca,
              as: 'parca',
              attributes: ['parcaKodu', 'parcaAdi']
            }
          ]
        }
      ]
    });

    if (!grup) {
      return res.status(404).json({ error: 'Fason grubu bulunamadı' });
    }

    res.json(grup);
  } catch (error) {
    console.error('Fason grubu detayı getirilirken hata:', error);
    res.status(500).json({
      error: 'Fason grubu detayı getirilirken hata oluştu',
      details: error.message
    });
  }
};

// Yeni fason grubu oluştur
const createFasonGrup = async (req, res) => {
  try {
    const { grup_adi, aciklama, renk, olusturan_kisi, fason_is_emirleri } = req.body;

    // Grup oluştur
    const yeniGrup = await FasonGrup.create({
      grup_adi,
      aciklama,
      renk: renk || '#1976d2',
      olusturan_kisi: olusturan_kisi || 'Sistem',
      aktif: true
    });

    // Seçilen fason iş emirlerini gruba ata
    if (fason_is_emirleri && fason_is_emirleri.length > 0) {
      await FasonIsEmri.update(
        { fason_grup_id: yeniGrup.fason_grup_id },
        { 
          where: { 
            fason_is_emri_id: { [Op.in]: fason_is_emirleri } 
          } 
        }
      );
    }

    // Oluşturulan grubu detaylarıyla birlikte getir
    const grup = await FasonGrup.findByPk(yeniGrup.fason_grup_id, {
      include: [
        {
          model: FasonIsEmri,
          as: 'fasonIsEmirleri',
          include: [
            {
              model: Parca,
              as: 'parca',
              attributes: ['parcaKodu', 'parcaAdi']
            }
          ]
        }
      ]
    });

    res.status(201).json(grup);
  } catch (error) {
    console.error('Fason grubu oluşturulurken hata:', error);
    res.status(500).json({
      error: 'Fason grubu oluşturulurken hata oluştu',
      details: error.message
    });
  }
};

// Fason grubu güncelle
const updateFasonGrup = async (req, res) => {
  try {
    const { id } = req.params;
    const { grup_adi, aciklama, renk, fason_is_emirleri } = req.body;

    const grup = await FasonGrup.findByPk(id);
    if (!grup) {
      return res.status(404).json({ error: 'Fason grubu bulunamadı' });
    }

    // Grup bilgilerini güncelle
    await grup.update({
      grup_adi,
      aciklama,
      renk,
      guncelleme_tarihi: new Date()
    });

    // Önce bu grubun mevcut iş emirlerini temizle
    await FasonIsEmri.update(
      { fason_grup_id: null },
      { where: { fason_grup_id: id } }
    );

    // Yeni seçilen fason iş emirlerini gruba ata
    if (fason_is_emirleri && fason_is_emirleri.length > 0) {
      await FasonIsEmri.update(
        { fason_grup_id: id },
        { 
          where: { 
            fason_is_emri_id: { [Op.in]: fason_is_emirleri } 
          } 
        }
      );
    }

    // Güncellenmiş grubu detaylarıyla birlikte getir
    const updatedGrup = await FasonGrup.findByPk(id, {
      include: [
        {
          model: FasonIsEmri,
          as: 'fasonIsEmirleri',
          include: [
            {
              model: Parca,
              as: 'parca',
              attributes: ['parcaKodu', 'parcaAdi']
            }
          ]
        }
      ]
    });

    res.json(updatedGrup);
  } catch (error) {
    console.error('Fason grubu güncellenirken hata:', error);
    res.status(500).json({
      error: 'Fason grubu güncellenirken hata oluştu',
      details: error.message
    });
  }
};

// Fason grubu sil
const deleteFasonGrup = async (req, res) => {
  try {
    const { id } = req.params;

    const grup = await FasonGrup.findByPk(id);
    if (!grup) {
      return res.status(404).json({ error: 'Fason grubu bulunamadı' });
    }

    // Önce grubun fason iş emirlerini temizle
    await FasonIsEmri.update(
      { fason_grup_id: null },
      { where: { fason_grup_id: id } }
    );

    // Grubu sil
    await grup.destroy();

    res.json({ message: 'Fason grubu başarıyla silindi' });
  } catch (error) {
    console.error('Fason grubu silinirken hata:', error);
    res.status(500).json({
      error: 'Fason grubu silinirken hata oluştu',
      details: error.message
    });
  }
};

// Atanmamış fason iş emirlerini getir
const getUnassignedFasonIsEmirleri = async (req, res) => {
  try {
    const fasonIsEmirleri = await FasonIsEmri.findAll({
      where: {
        fason_grup_id: null
      },
      include: [
        {
          model: Parca,
          as: 'parca',
          attributes: ['parcaKodu', 'parcaAdi']
        }
      ],
      order: [['olusturma_tarihi', 'DESC']]
    });

    res.json(fasonIsEmirleri);
  } catch (error) {
    console.error('Atanmamış fason iş emirleri listelenirken hata:', error);
    res.status(500).json({
      error: 'Atanmamış fason iş emirleri listelenirken hata oluştu',
      details: error.message
    });
  }
};

module.exports = {
  getAllFasonGruplar,
  getFasonGrupById,
  createFasonGrup,
  updateFasonGrup,
  deleteFasonGrup,
  getUnassignedFasonIsEmirleri
};
