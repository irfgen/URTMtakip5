const { Op } = require('sequelize');
const Makina = require('../../../models/Makina');

/**
 * Tüm makinaları filtreleme ve sıralama seçenekleriyle getirir.
 * @param {object} options - Filtreleme ve sıralama seçenekleri
 * @returns {Promise<Array<Makina>>}
 */
const findAll = async (options = {}) => {
  const { search, sortBy = 'name', sortDir = 'ASC' } = options;
  const where = {};

  if (search) {
    where[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { description: { [Op.like]: `%${search}%` } },
      { model: { [Op.like]: `%${search}%` } },
      { seri_no: { [Op.like]: `%${search}%` } },
    ];
  }

  const order = [[sortBy, sortDir]];

  return Makina.findAll({ where, order });
};

/**
 * ID'ye göre bir makina bulur.
 * @param {string} id - Makina ID'si
 * @returns {Promise<Makina|null>}
 */
const findById = async (id) => {
  return Makina.findByPk(id);
};

/**
 * Yeni bir makina oluşturur.
 * @param {object} makinaData - Yeni makina verileri
 * @returns {Promise<Makina>}
 */
const create = async (makinaData) => {
  return Makina.create(makinaData);
};

/**
 * Bir makinayı günceller.
 * @param {string} id - Makina ID'si
 * @param {object} makinaData - Güncellenecek makina verileri
 * @returns {Promise<[number, Array<Makina>]>}
 */
const update = async (id, makinaData) => {
    const makina = await Makina.findByPk(id);
    if (!makina) {
        return null;
    }
    return makina.update(makinaData);
};

/**
 * Bir makinayı siler.
 * @param {string} id - Makina ID'si
 * @returns {Promise<number>}
 */
const remove = async (id) => {
    const makina = await Makina.findByPk(id);
    if (!makina) {
        return 0;
    }
    await makina.destroy();
    return 1;
};

module.exports = {
  findAll,
  findById,
  create,
  update,
  remove,
};