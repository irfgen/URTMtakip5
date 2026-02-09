const makinaRepository = require('../repositories/makinaRepository');

/**
 * Tüm makinaları getirir.
 * @param {object} options - Filtreleme ve sıralama seçenekleri
 * @returns {Promise<Array<Makina>>}
 */
const getAllMakinalar = async (options) => {
  return makinaRepository.findAll(options);
};

/**
 * ID'ye göre bir makina getirir.
 * @param {string} id - Makina ID'si
 * @returns {Promise<Makina|null>}
 */
const getMakinaById = async (id) => {
  return makinaRepository.findById(id);
};

/**
 * Yeni bir makina oluşturur.
 * @param {object} makinaData - Yeni makina verileri
 * @returns {Promise<Makina>}
 */
const createMakina = async (makinaData) => {
  // Burada iş mantığı eklenebilir, örneğin validasyon veya zenginleştirme
  const validatedItems = Array.isArray(makinaData.items) ? makinaData.items : [];
  const dataToCreate = {
    ...makinaData,
    items: validatedItems,
    durum: makinaData.durum || 'aktif',
  };
  return makinaRepository.create(dataToCreate);
};

/**
 * Bir makinayı günceller.
 * @param {string} id - Makina ID'si
 * @param {object} makinaData - Güncellenecek makina verileri
 * @returns {Promise<Makina|null>}
 */
const updateMakina = async (id, makinaData) => {
  const makina = await makinaRepository.findById(id);
  if (!makina) {
    return null;
  }

  const validatedItems = Array.isArray(makinaData.items) ? makinaData.items : [];
  const dataToUpdate = {
    ...makinaData,
    items: validatedItems,
  };

  return makinaRepository.update(id, dataToUpdate);
};

/**
 * Bir makinayı siler.
 * @param {string} id - Makina ID'si
 * @returns {Promise<boolean>}
 */
const deleteMakina = async (id) => {
  const result = await makinaRepository.remove(id);
  return result > 0;
};

module.exports = {
  getAllMakinalar,
  getMakinaById,
  createMakina,
  updateMakina,
  deleteMakina,
};