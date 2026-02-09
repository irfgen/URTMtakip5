const tezgahRepository = require('../repositories/tezgahRepository');
const IsEmri = require('../../../models/IsEmri');
const ArizaBakim = require('../../../models/ArizaBakim');
const { Op } = require('sequelize');

/**
 * Tüm tezgahları ve arıza/bakım durumlarını getirir.
 * @returns {Promise<Array<object>>}
 */
const getAllTezgahlar = async () => {
  const tezgahlar = await tezgahRepository.findAll();
  const tezgahIds = tezgahlar.map((tezgah) => tezgah.tezgah_id);

  const aktifArizaBakimlar = await ArizaBakim.findAll({
    where: {
      tezgah_id: { [Op.in]: tezgahIds },
      durum: 'devam_ediyor',
    },
  });

  const arizaBakimMap = {};
  aktifArizaBakimlar.forEach((kayit) => {
    arizaBakimMap[kayit.tezgah_id] = kayit;
  });

  return tezgahlar.map((tezgah) => {
    const tezgahData = tezgah.toJSON();
    const arizaBakim = arizaBakimMap[tezgah.tezgah_id];

    if (arizaBakim) {
      tezgahData.ariza_bakim_durumu = {
        durum: arizaBakim.durum,
        tipi: arizaBakim.kayit_tipi,
        baslangic_tarihi: arizaBakim.baslangic_tarihi,
        id: arizaBakim.id,
      };
      tezgahData.calisma_durumu = arizaBakim.kayit_tipi === 'ariza' ? 'arizada' : 'bakimda';
    }

    return tezgahData;
  });
};

/**
 * ID'ye göre bir tezgah getirir.
 * @param {number} id - Tezgah ID'si
 * @returns {Promise<Tezgah|null>}
 */
const getTezgahById = async (id) => {
  return tezgahRepository.findById(id);
};

/**
 * Yeni bir tezgah oluşturur.
 * @param {object} tezgahData - Yeni tezgah verileri
 * @returns {Promise<Tezgah>}
 */
const createTezgah = async (tezgahData) => {
  return tezgahRepository.create(tezgahData);
};

/**
 * Bir tezgahı günceller.
 * @param {number} id - Tezgah ID'si
 * @param {object} tezgahData - Güncellenecek tezgah verileri
 * @returns {Promise<Tezgah|null>}
 */
const updateTezgah = async (id, tezgahData) => {
  return tezgahRepository.update(id, tezgahData);
};

/**
 * Bir tezgahı siler.
 * @param {number} id - Tezgah ID'si
 * @returns {Promise<boolean>}
 */
const deleteTezgah = async (id) => {
  const tezgah = await tezgahRepository.findById(id);
  if (!tezgah) {
    throw new Error('Tezgah bulunamadı');
  }

  if (tezgah.is_emirleri && tezgah.is_emirleri.length > 0) {
    throw new Error('Bu tezgah silinemez. Tezgaha atanmış aktif iş emirleri bulunmaktadır.');
  }

  const result = await tezgahRepository.remove(id);
  return result > 0;
};

/**
 * Tezgah pozisyonlarını toplu olarak günceller.
 * @param {Array<object>} pozisyonlar - Pozisyon verileri
 * @returns {Promise<void>}
 */
const updateTezgahPositions = async (pozisyonlar) => {
  return tezgahRepository.updatePositions(pozisyonlar);
};

module.exports = {
  getAllTezgahlar,
  getTezgahById,
  createTezgah,
  updateTezgah,
  deleteTezgah,
  updateTezgahPositions,
};