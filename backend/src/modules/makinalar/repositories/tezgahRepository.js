const Tezgah = require('../../../models/Tezgah');

/**
 * Tüm tezgahları getirir.
 * @returns {Promise<Array<Tezgah>>}
 */
const findAll = async () => {
  return Tezgah.findAll({
    order: [['tezgah_tanimi', 'ASC']],
  });
};

/**
 * ID'ye göre bir tezgah bulur.
 * @param {number} id - Tezgah ID'si
 * @returns {Promise<Tezgah|null>}
 */
const findById = async (id) => {
  return Tezgah.findByPk(id);
};

/**
 * Yeni bir tezgah oluşturur.
 * @param {object} tezgahData - Yeni tezgah verileri
 * @returns {Promise<Tezgah>}
 */
const create = async (tezgahData) => {
  return Tezgah.create(tezgahData);
};

/**
 * Bir tezgahı günceller.
 * @param {number} id - Tezgah ID'si
 * @param {object} tezgahData - Güncellenecek tezgah verileri
 * @returns {Promise<[number, Array<Tezgah>]>}
 */
const update = async (id, tezgahData) => {
    const tezgah = await Tezgah.findByPk(id);
    if (!tezgah) {
        return null;
    }
    return tezgah.update(tezgahData);
};

/**
 * Bir tezgahı siler.
 * @param {number} id - Tezgah ID'si
 * @returns {Promise<number>}
 */
const remove = async (id) => {
    const tezgah = await Tezgah.findByPk(id);
    if (!tezgah) {
        return 0;
    }
    await tezgah.destroy();
    return 1;
};

/**
 * Tezgah pozisyonlarını toplu olarak günceller.
 * @param {Array<object>} pozisyonlar - Pozisyon verileri
 * @returns {Promise<void>}
 */
const updatePositions = async (pozisyonlar) => {
  for (const pozisyon of pozisyonlar) {
    await Tezgah.update(
      {
        pozisyon_x: pozisyon.x,
        pozisyon_y: pozisyon.y,
      },
      {
        where: { tezgah_id: pozisyon.tezgah_id },
      }
    );
  }
};

module.exports = {
  findAll,
  findById,
  create,
  update,
  remove,
  updatePositions,
};