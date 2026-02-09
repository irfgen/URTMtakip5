const StokKarti = require('../models/StokKarti');
const { Op, sequelize } = require('sequelize');
const { sequelize: dbSequelize } = require('../config/database');

// Tüm stok kartlarını listele (sayfalama, arama, filtreleme ile)
exports.listStokKartlari = async (req, res) => {
  try {
    const {
      sayfa = 1,
      limit = 20,
      q,
      malzeme_cinsi,
      firma,
      kritik_stok,
      sort_by = 'malzeme_cinsi',
      sort_order = 'ASC',
      stok_takip_listesi_id
    } = req.query;

    // Server-side liste filtresi
    let only_ids;
    if (stok_takip_listesi_id) {
      try {
        const StokTakipListesi = require('../models/StokTakipListesi');
        const listId = parseInt(stok_takip_listesi_id);
        if (Number.isInteger(listId)) {
          const liste = await StokTakipListesi.findByPk(listId);
          const kalemler = Array.isArray(liste?.kalemler) ? liste.kalemler : [];
          only_ids = kalemler.map(k => parseInt(k.stok_karti_id)).filter(Number.isInteger);
          if (!only_ids.length) {
            return res.json({ success: true, data: [], pagination: { total: 0, page: parseInt(sayfa), limit: parseInt(limit), totalPages: 0 }, filters: { q, malzeme_cinsi, firma, kritik_stok, stok_takip_listesi_id } });
          }
        }
      } catch (e) {
        console.error('stok_takip_listesi_id filtresi hatası:', e);
      }
    }

    const result = await StokKarti.searchWithPagination({
      q,
      malzeme_cinsi,
      firma,
      kritik_stok,
      sayfa,
      limit,
      sort_by,
      sort_order,
      only_ids
    });

    // Her kayıt için stok durumu bilgisini ekle
    const dataWithStatus = result.data.map(kart => ({
      ...kart.toJSON(),
      stok_durumu: kart.getStokDurumu(),
      formatted_boyut: kart.getFormattedBoyut(),
      kritik_stok: kart.isKritikStok()
    }));

    res.json({
      success: true,
      data: dataWithStatus,
      pagination: result.pagination,
      filters: {
        q,
        malzeme_cinsi,
        firma,
        kritik_stok,
        stok_takip_listesi_id
      }
    });

  } catch (error) {
    console.error('Stok kartları listesi hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Stok kartları listesi alınırken hata oluştu',
      error: error.message
    });
  }
};

// ID ile stok kartı detayı getir
exports.getStokKartiDetay = async (req, res) => {
  try {
    const { id } = req.params;

    const stokKarti = await StokKarti.findByPk(id);

    if (!stokKarti) {
      return res.status(404).json({
        success: false,
        message: 'Stok kartı bulunamadı'
      });
    }

    if (!stokKarti.aktif_mi) {
      return res.status(404).json({
        success: false,
        message: 'Stok kartı aktif değil'
      });
    }

    res.json({
      success: true,
      data: {
        ...stokKarti.toJSON(),
        stok_durumu: stokKarti.getStokDurumu(),
        formatted_boyut: stokKarti.getFormattedBoyut(),
        kritik_stok: stokKarti.isKritikStok()
      }
    });

  } catch (error) {
    console.error('Stok kartı detay hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Stok kartı detayı alınırken hata oluştu',
      error: error.message
    });
  }
};

// Yeni stok kartı oluştur
exports.createStokKarti = async (req, res) => {
  try {
    const {
      kesit,
      boy,
      malzeme_cinsi,
      malzeme_adi,
      adet = 0,
      kritik_stok_miktari = 0,
      lokasyon,
      adres,
      firma
    } = req.body;

    // Zorunlu alanları kontrol et
    if (!kesit || !malzeme_cinsi) {
      return res.status(400).json({
        success: false,
        message: 'Kesit ve Malzeme Cinsi alanları zorunludur'
      });
    }

    const stokKarti = await StokKarti.create({
      kesit,
      boy,
      malzeme_cinsi,
      malzeme_adi,
      adet,
      kritik_stok_miktari,
      lokasyon,
      adres,
      firma
    });

    res.status(201).json({
      success: true,
      message: 'Stok kartı başarıyla oluşturuldu',
      data: {
        ...stokKarti.toJSON(),
        stok_durumu: stokKarti.getStokDurumu(),
        formatted_boyut: stokKarti.getFormattedBoyut(),
        kritik_stok: stokKarti.isKritikStok()
      }
    });

  } catch (error) {
    console.error('Stok kartı oluşturma hatası:', error);
    
    // Validation hatalarını özel olarak handle et
    if (error.name === 'SequelizeValidationError') {
      const validationErrors = error.errors.map(err => ({
        field: err.path,
        message: err.message
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Validation hatası',
        errors: validationErrors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Stok kartı oluşturulurken hata oluştu',
      error: error.message
    });
  }
};

// Mevcut stok kartını güncelle
exports.updateStokKarti = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      kesit,
      boy,
      malzeme_cinsi,
      malzeme_adi,
      adet,
      kritik_stok_miktari,
      lokasyon,
      adres,
      firma
    } = req.body;

    const stokKarti = await StokKarti.findByPk(id);

    if (!stokKarti) {
      return res.status(404).json({
        success: false,
        message: 'Stok kartı bulunamadı'
      });
    }

    if (!stokKarti.aktif_mi) {
      return res.status(400).json({
        success: false,
        message: 'Pasif stok kartı güncellenemez'
      });
    }

    // Zorunlu alanları kontrol et
    if (!kesit || !malzeme_cinsi) {
      return res.status(400).json({
        success: false,
        message: 'Kesit ve Malzeme Cinsi alanları zorunludur'
      });
    }

    await stokKarti.update({
      kesit,
      boy,
      malzeme_cinsi,
      malzeme_adi,
      adet,
      kritik_stok_miktari,
      lokasyon,
      adres,
      firma
    });

    res.json({
      success: true,
      message: 'Stok kartı başarıyla güncellendi',
      data: {
        ...stokKarti.toJSON(),
        stok_durumu: stokKarti.getStokDurumu(),
        formatted_boyut: stokKarti.getFormattedBoyut(),
        kritik_stok: stokKarti.isKritikStok()
      }
    });

  } catch (error) {
    console.error('Stok kartı güncelleme hatası:', error);
    
    // Validation hatalarını özel olarak handle et
    if (error.name === 'SequelizeValidationError') {
      const validationErrors = error.errors.map(err => ({
        field: err.path,
        message: err.message
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Validation hatası',
        errors: validationErrors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Stok kartı güncellenirken hata oluştu',
      error: error.message
    });
  }
};

// Stok kartını sil (soft delete)
exports.deleteStokKarti = async (req, res) => {
  try {
    const { id } = req.params;

    const stokKarti = await StokKarti.findByPk(id);

    if (!stokKarti) {
      return res.status(404).json({
        success: false,
        message: 'Stok kartı bulunamadı'
      });
    }

    // Soft delete - aktif_mi false yap
    await stokKarti.update({ aktif_mi: false });

    res.json({
      success: true,
      message: 'Stok kartı başarıyla silindi'
    });

  } catch (error) {
    console.error('Stok kartı silme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Stok kartı silinirken hata oluştu',
      error: error.message
    });
  }
};

// Kritik stok listesi
exports.getKritikStoklar = async (req, res) => {
  try {
    const kritikStoklar = await StokKarti.findKritikStoklar();

    const dataWithStatus = kritikStoklar.map(kart => ({
      ...kart.toJSON(),
      stok_durumu: kart.getStokDurumu(),
      formatted_boyut: kart.getFormattedBoyut(),
      kritik_stok: true,
      eksik_miktar: Math.max(0, kart.kritik_stok_miktari - kart.adet)
    }));

    res.json({
      success: true,
      data: dataWithStatus,
      total: dataWithStatus.length
    });

  } catch (error) {
    console.error('Kritik stok listesi hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Kritik stok listesi alınırken hata oluştu',
      error: error.message
    });
  }
};

// Gelişmiş arama
exports.searchStokKartlari = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Arama terimi en az 2 karakter olmalı'
      });
    }

    const result = await StokKarti.searchWithPagination({
      q,
      limit: 50 // Arama için daha fazla sonuç
    });

    const dataWithStatus = result.data.map(kart => ({
      ...kart.toJSON(),
      stok_durumu: kart.getStokDurumu(),
      formatted_boyut: kart.getFormattedBoyut(),
      kritik_stok: kart.isKritikStok()
    }));

    res.json({
      success: true,
      data: dataWithStatus,
      total: result.pagination.total,
      query: q
    });

  } catch (error) {
    console.error('Stok kartı arama hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Arama işlemi sırasında hata oluştu',
      error: error.message
    });
  }
};

// Firma listesi getir (dropdown için)
exports.getFirmalar = async (req, res) => {
  try {
    const firmalar = await StokKarti.getFirmaList();

    res.json({
      success: true,
      data: firmalar
    });

  } catch (error) {
    console.error('Firma listesi hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Firma listesi alınırken hata oluştu',
      error: error.message
    });
  }
};

// Malzeme cinsi listesi getir (dropdown için)
exports.getMalzemeCinsleri = async (req, res) => {
  try {
    const malzemeler = await StokKarti.getMalzemeCinsiList();

    res.json({
      success: true,
      data: malzemeler
    });

  } catch (error) {
    console.error('Malzeme cinsi listesi hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Malzeme cinsi listesi alınırken hata oluştu',
      error: error.message
    });
  }
};

// Stok istatistikleri
exports.getStokIstatistikleri = async (req, res) => {
  try {
    const [
      toplamKart,
      kritikStok,
      stokYok,
      toplamStokMiktari
    ] = await Promise.all([
      StokKarti.count({ where: { aktif_mi: true } }),
      StokKarti.count({ where: { aktif_mi: true, [Op.and]: dbSequelize.literal('adet <= kritik_stok_miktari') } }),
      StokKarti.count({ where: { aktif_mi: true, adet: 0 } }),
      StokKarti.sum('adet', { where: { aktif_mi: true } })
    ]);

    res.json({
      success: true,
      data: {
        toplam_kart: toplamKart,
        kritik_stok_sayisi: kritikStok,
        stokta_yok_sayisi: stokYok,
        toplam_stok_miktari: toplamStokMiktari || 0,
        kritik_stok_orani: toplamKart > 0 ? Math.round((kritikStok / toplamKart) * 100) : 0
      }
    });

  } catch (error) {
    console.error('Stok istatistikleri hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Stok istatistikleri alınırken hata oluştu',
      error: error.message
    });
  }
};
