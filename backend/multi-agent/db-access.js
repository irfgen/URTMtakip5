/**
 * db-access.js
 * Modül ajanlar için veritabanı erişim katmanı
 *
 * Kullanım:
 * const { query, insert, update, remove } = require('./db-access');
 * const results = await query('SELECT * FROM is_emirleri WHERE durum = ?', ['aktif']);
 */

const { sequelize, QueryTypes } = require('../src/config/database');

/**
 * SQL sorgusu çalıştır
 * @param {string} sql - SQL sorgusu
 * @param {Array} params - Parametreler (opsiyonel)
 * @param {string} type - QueryTypes.SELECT|INSERT|UPDATE|DELETE
 * @returns {Promise<Array>} Sonuçlar
 */
async function query(sql, params = [], type = QueryTypes.SELECT) {
  try {
    const [results] = await sequelize.query(sql, {
      type,
      replacements: params,
      raw: true
    });
    return results;
  } catch (error) {
    console.error('[DB-Access] Sorgu hatası:', error.message);
    throw error;
  }
}

/**
 * Tablodan kayıtları getir
 * @param {string} table - Tablo adı
 * @param {Object} where - WHERE koşulu { kolon: değer }
 * @param {number} limit - Maksimum kayıt sayısı
 * @returns {Promise<Array>}
 */
async function findAll(table, where = {}, limit = 100) {
  const conditions = Object.entries(where)
    .map(([key, val]) => `${key} = ?`)
    .join(' AND ');
  const params = Object.values(where);

  const sql = `SELECT * FROM ${table}${conditions ? ' WHERE ' + conditions : ''} LIMIT ${limit}`;
  return await query(sql, params, QueryTypes.SELECT);
}

/**
 * Tablodan tek kayıt getir
 * @param {string} table - Tablo adı
 * @param {Object} where - WHERE koşulu
 * @returns {Promise<Object|null>}
 */
async function findOne(table, where = {}) {
  const results = await findAll(table, where, 1);
  return results.length > 0 ? results[0] : null;
}

/**
 * Yeni kayıt ekle
 * @param {string} table - Tablo adı
 * @param {Object} data - Eklenecek veri { kolon: değer }
 * @returns {Promise<Object>} Eklenen kayıt
 */
async function insert(table, data) {
  const columns = Object.keys(data);
  const placeholders = columns.map(() => '?').join(', ');
  const values = Object.values(data);

  const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;
  const [result] = await sequelize.query(sql, {
    type: QueryTypes.INSERT,
    replacements: values
  });

  return { id: result, ...data };
}

/**
 * Kayıt güncelle
 * @param {string} table - Tablo adı
 * @param {Object} data - Güncellenecek veri
 * @param {Object} where - WHERE koşulu
 * @returns {Promise<number>} Etkilenen satır sayısı
 */
async function update(table, data, where) {
  const setClause = Object.keys(data).map(k => `${k} = ?`).join(', ');
  const whereClause = Object.entries(where)
    .map(([key]) => `${key} = ?`)
    .join(' AND ');

  const params = [...Object.values(data), ...Object.values(where)];
  const sql = `UPDATE ${table} SET ${setClause} WHERE ${whereClause}`;

  const [result] = await sequelize.query(sql, {
    type: QueryTypes.UPDATE,
    replacements: params
  });

  return result;
}

/**
 * Kayıt sil
 * @param {string} table - Tablo adı
 * @param {Object} where - WHERE koşulu
 * @returns {Promise<number>} Silinen satır sayısı
 */
async function remove(table, where) {
  const whereClause = Object.entries(where)
    .map(([key]) => `${key} = ?`)
    .join(' AND ');
  const params = Object.values(where);

  const sql = `DELETE FROM ${table} WHERE ${whereClause}`;
  const [result] = await sequelize.query(sql, {
    type: QueryTypes.DELETE,
    replacements: params
  });

  return result;
}

/**
 * İşlem (transaction) başlat
 * @param {Function} callback - İşlem içinde çalışacak fonksiyon
 * @returns {Promise<any>}
 */
async function transaction(callback) {
  const t = await sequelize.transaction();
  try {
    const result = await callback({
      query: (sql, params, type) => sequelize.query(sql, {
        type: type || QueryTypes.SELECT,
        replacements: params,
        transaction: t,
        raw: true
      }),
      commit: () => t.commit(),
      rollback: () => t.rollback()
    });
    return result;
  } catch (error) {
    await t.rollback();
    throw error;
  }
}

module.exports = {
  query,
  findAll,
  findOne,
  insert,
  update,
  remove,
  transaction,
  QueryTypes
};