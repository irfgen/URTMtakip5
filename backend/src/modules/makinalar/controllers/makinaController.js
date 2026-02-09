const makinaService = require('../services/makinaService');
const MakinaSinifi = require('../../../models/MakinaSinifi'); // Makina sınıfları için

/**
 * Tüm makinaları listeler.
 */
const listMakinalar = async (req, res) => {
  try {
    const makinalar = await makinaService.getAllMakinalar(req.query);
    res.status(200).json({
      success: true,
      data: makinalar,
      message: 'Makinalar başarıyla listelendi.',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Makinalar listelenirken bir hata oluştu.',
        details: error.message,
      },
    });
  }
};

/**
 * ID'ye göre bir makina detayı getirir.
 */
const getMakinaDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const makina = await makinaService.getMakinaById(id);
    if (!makina) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Makina bulunamadı.',
        },
      });
    }
    res.status(200).json({
      success: true,
      data: makina,
      message: 'Makina detayı başarıyla getirildi.',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Makina detayı alınırken bir hata oluştu.',
        details: error.message,
      },
    });
  }
};

/**
 * Yeni bir makina oluşturur.
 */
const createMakina = async (req, res) => {
  try {
    const newMakina = await makinaService.createMakina(req.body);
    res.status(201).json({
      success: true,
      data: newMakina,
      message: 'Makina başarıyla oluşturuldu.',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Makina oluşturulurken bir hata oluştu.',
        details: error.message,
      },
    });
  }
};

/**
 * Bir makinayı günceller.
 */
const updateMakina = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedMakina = await makinaService.updateMakina(id, req.body);
    if (!updatedMakina) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Güncellenecek makina bulunamadı.',
        },
      });
    }
    res.status(200).json({
      success: true,
      data: updatedMakina,
      message: 'Makina başarıyla güncellendi.',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Makina güncellenirken bir hata oluştu.',
        details: error.message,
      },
    });
  }
};

/**
 * Bir makinayı siler.
 */
const deleteMakina = async (req, res) => {
  try {
    const { id } = req.params;
    const isDeleted = await makinaService.deleteMakina(id);
    if (!isDeleted) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Silinecek makina bulunamadı.',
        },
      });
    }
    res.status(200).json({
      success: true,
      message: 'Makina başarıyla silindi.',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Makina silinirken bir hata oluştu.',
        details: error.message,
      },
    });
  }
};

// Makina sınıflarını listele
const getMakinaSiniflari = async (req, res) => {
  try {
    const siniflar = await MakinaSinifi.getActiveSiniflar();
    res.status(200).json({
      success: true,
      data: siniflar,
      message: 'Makina sınıfları başarıyla listelendi'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Makina sınıfları listelenirken bir hata oluştu',
        details: error.message,
      },
    });
  }
};

module.exports = {
  listMakinalar,
  getMakinaDetail,
  createMakina,
  updateMakina,
  deleteMakina,
  getMakinaSiniflari,
};