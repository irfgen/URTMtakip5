const ArizaBakim = require('../models/ArizaBakim');
const Tezgah = require('../models/Tezgah');
const { Op, sequelize } = require('sequelize');

// Tüm arıza ve bakımları listele
exports.getAllArizaBakim = async (req, res) => {
  try {
    const { kayit_tipi, tezgah_id, durum, baslangic_tarihi, bitis_tarihi } = req.query;
    const where = {};

    // Filtreleme
    if (kayit_tipi) where.kayit_tipi = kayit_tipi;
    if (tezgah_id) where.tezgah_id = tezgah_id;
    if (durum) where.durum = durum;
    
    // Tarih aralığı filtresi
    if (baslangic_tarihi || bitis_tarihi) {
      where.baslangic_tarihi = {};
      if (baslangic_tarihi) {
        where.baslangic_tarihi[Op.gte] = new Date(baslangic_tarihi);
      }
      if (bitis_tarihi) {
        where.baslangic_tarihi[Op.lte] = new Date(bitis_tarihi);
      }
    }

    const arizaBakimlar = await ArizaBakim.findAll({
      where,
      include: [
        {
          model: Tezgah,
          as: 'tezgah',
          attributes: ['tezgah_id', 'tezgah_tanimi']
        }
      ],
      order: [['baslangic_tarihi', 'DESC']]
    });

    res.json(arizaBakimlar);
  } catch (error) {
    console.error('Arıza/Bakım listeleme hatası:', error);
    res.status(500).json({ error: error.message });
  }
};

// Tek bir arıza/bakım detayını getir
exports.getArizaBakimById = async (req, res) => {
  try {
    const arizaBakim = await ArizaBakim.findByPk(req.params.id, {
      include: [
        {
          model: Tezgah,
          as: 'tezgah',
          attributes: ['tezgah_id', 'tezgah_tanimi']
        }
      ]
    });
    
    if (!arizaBakim) {
      return res.status(404).json({ error: 'Arıza/Bakım kaydı bulunamadı' });
    }
    
    res.json(arizaBakim);
  } catch (error) {
    console.error('Arıza/Bakım detayı alma hatası:', error);
    res.status(500).json({ error: error.message });
  }
};

// Yeni arıza/bakım kaydı oluştur
exports.createArizaBakim = async (req, res) => {
  try {
    const { 
      tezgah_id, 
      kayit_tipi, 
      baslangic_tarihi, 
      aciklama, 
      sorumlu 
    } = req.body;

    // Tezgahı kontrol et
    const tezgah = await Tezgah.findByPk(tezgah_id);
    if (!tezgah) {
      return res.status(404).json({ error: 'Tezgah bulunamadı' });
    }

    // Bakım/arıza kaydı oluştur
    const arizaBakim = await ArizaBakim.create({
      tezgah_id,
      kayit_tipi,
      baslangic_tarihi: baslangic_tarihi || new Date(),
      durum: 'devam_ediyor',
      aciklama,
      sorumlu
    });

    // Tezgahın durumunu güncelle - calisma_durumu alanını güncelliyoruz
    await tezgah.update({
      calisma_durumu: kayit_tipi === 'ariza' ? 'arizada' : 'bakimda'
    });

    res.status(201).json(arizaBakim);
  } catch (error) {
    console.error('Arıza/Bakım oluşturma hatası:', error);
    res.status(400).json({ error: error.message });
  }
};

// Arıza/Bakım kaydını güncelle
exports.updateArizaBakim = async (req, res) => {
  try {
    const arizaBakim = await ArizaBakim.findByPk(req.params.id);
    
    if (!arizaBakim) {
      return res.status(404).json({ error: 'Arıza/Bakım kaydı bulunamadı' });
    }
    
    const {
      bitis_tarihi, 
      durum, 
      yapilan_islemler, 
      maliyet, 
      sorumlu
    } = req.body;
    
    // Arıza/Bakım kaydını güncelle
    await arizaBakim.update({
      bitis_tarihi: durum === 'tamamlandi' ? (bitis_tarihi || new Date()) : arizaBakim.bitis_tarihi,
      durum: durum || arizaBakim.durum,
      yapilan_islemler: yapilan_islemler || arizaBakim.yapilan_islemler,
      maliyet: maliyet !== undefined ? maliyet : arizaBakim.maliyet,
      sorumlu: sorumlu || arizaBakim.sorumlu
    });
    
    // İşlem tamamlandıysa tezgahın durumunu aktif yap
    if (durum === 'tamamlandi') {
      const tezgah = await Tezgah.findByPk(arizaBakim.tezgah_id);
      if (tezgah) {
        // Tezgahın iş emirleri durumuna göre çalışıyor ya da boşta durumlarını atayalım
        const yeniDurum = tezgah.is_emirleri && tezgah.is_emirleri.length > 0 ? 'calisiyor' : 'bosta';
        await tezgah.update({ calisma_durumu: yeniDurum });
      }
    }
    
    res.json(arizaBakim);
  } catch (error) {
    console.error('Arıza/Bakım güncelleme hatası:', error);
    res.status(400).json({ error: error.message });
  }
};

// Arıza/Bakım kaydını sil
exports.deleteArizaBakim = async (req, res) => {
  try {
    const arizaBakim = await ArizaBakim.findByPk(req.params.id);
    
    if (!arizaBakim) {
      return res.status(404).json({ error: 'Arıza/Bakım kaydı bulunamadı' });
    }
    
    await arizaBakim.destroy();
    res.json({ message: 'Arıza/Bakım kaydı silindi' });
  } catch (error) {
    console.error('Arıza/Bakım silme hatası:', error);
    res.status(500).json({ error: error.message });
  }
};

// İstatistikler
exports.getArizaBakimIstatistikleri = async (req, res) => {
  try {
    const { baslangic, bitis } = req.query;
    
    // Tarih aralığı filtresi
    const where = {};
    if (baslangic || bitis) {
      where.baslangic_tarihi = {};
      if (baslangic) {
        where.baslangic_tarihi[Op.gte] = new Date(baslangic);
      }
      if (bitis) {
        where.baslangic_tarihi[Op.lte] = new Date(bitis);
      }
    }

    // Tezgah bazlı arıza/bakım sayıları
    const tezgahBasedSummary = await ArizaBakim.findAll({
      where,
      attributes: [
        'tezgah_id', 
        'kayit_tipi',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      include: [
        {
          model: Tezgah,
          as: 'tezgah',
          attributes: ['tezgah_tanimi']
        }
      ],
      group: ['tezgah_id', 'kayit_tipi', 'tezgah.tezgah_tanimi'],
      order: [[sequelize.col('count'), 'DESC']]
    });

    // Aylık arıza/bakım sayıları
    const monthlyData = await ArizaBakim.findAll({
      where,
      attributes: [
        [sequelize.fn('date_trunc', 'month', sequelize.col('baslangic_tarihi')), 'ay'],
        'kayit_tipi',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['ay', 'kayit_tipi'],
      order: [sequelize.col('ay')]
    });

    res.json({
      tezgahBazli: tezgahBasedSummary,
      aylikArizaBakim: monthlyData
    });
  } catch (error) {
    console.error('İstatistik alınırken hata:', error);
    res.status(500).json({ error: error.message });
  }
};

// Tezgahın aktif arıza veya bakımlarını getir
exports.getTezgahActiveArizaBakim = async (req, res) => {
  try {
    const { tezgah_id } = req.params;
    
    const activeRecords = await ArizaBakim.findAll({
      where: {
        tezgah_id,
        durum: 'devam_ediyor'
      },
      order: [['baslangic_tarihi', 'DESC']]
    });
    
    res.json(activeRecords);
  } catch (error) {
    console.error('Aktif arıza/bakım sorgusu hatası:', error);
    res.status(500).json({ error: error.message });
  }
};