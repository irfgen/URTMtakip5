const FasonGrup = require('../models/FasonGrup');
const FasonIsEmri = require('../models/FasonIsEmri');
const Parca = require('../models/Parca');
const { Op } = require('sequelize');

const { sequelize } = require('../config/database');

// Tüm fason gruplarını getir
exports.listFasonGruplar = async (req, res) => {
  try {
    const query = `
      SELECT * FROM fason_gruplar 
      ORDER BY olusturma_tarihi DESC
    `;
    
    const [results] = await sequelize.query(query);
    res.json(results);
  } catch (error) {
    console.error('Fason grupları listelenirken hata:', error);
    res.status(500).json({
      error: 'Fason grupları listelenirken hata oluştu',
      details: error.message
    });
  }
};

// Tek fason grubu getir
exports.getFasonGrup = async (req, res) => {
  try {
    const { id } = req.params;
    
    const grup = await FasonGrup.findByPk(id, {
      include: [
        {
          model: FasonIsEmri,
          as: 'fason_is_emirleri',
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
exports.createFasonGrup = async (req, res) => {
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
          as: 'fason_is_emirleri',
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
exports.updateFasonGrup = async (req, res) => {
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
          as: 'fason_is_emirleri',
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
exports.deleteFasonGrup = async (req, res) => {
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

// Gruba atanmamış fason iş emirlerini getir
exports.getUnassignedFasonIsEmirleri = async (req, res) => {
    try {
        const { search, durum, limit = 100, offset = 0 } = req.query;
        const where = { fason_grup_id: null };
        
        if (search) {
            where[Op.or] = [
                { '$parca.parcaKodu$': { [Op.like]: `%${search}%` } },
                { '$parca.parcaAdi$': { [Op.like]: `%${search}%` } }
            ];
        }
        
        if (durum) {
            where.durum = durum;
        }
        
        const fasonIsEmirleri = await FasonIsEmri.findAll({
            where,
            include: [
                {
                    model: Parca,
                    as: 'parca',
                    attributes: ['parcaKodu', 'parcaAdi']
                }
            ],
            order: [['olusturma_tarihi', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.json(fasonIsEmirleri);
    } catch (error) {
        console.error('Atanmamış fason iş emirleri listesi hatası:', error);
        res.status(500).json({ 
            error: 'Atanmamış fason iş emirleri listelenirken hata oluştu',
            details: error.message 
        });
    }
};
