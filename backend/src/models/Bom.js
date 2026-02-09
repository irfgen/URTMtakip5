const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database').sequelize;
const { v4: uuidv4 } = require('uuid');

class Bom extends Model {
  static associate(models) {
    // BOM birden çok makina ile ilişkili olabilir (çok-çok ilişki)
    Bom.belongsToMany(models.Makina, {
      through: 'makina_bom',
      foreignKey: 'bom_id',
      otherKey: 'makina_id',
      as: 'makinalar'
    });

    // BOM'un parçaları mevcut bom_parcalar ara tablosu ile ilişkili
    // Not: Bu ilişki doğrudan Sequelize ile değil, custom query ile yönetilir
    // çünkü bom_parcalar tablosu parcaKodu foreign key kullanıyor
  }

  /**
   * BOM ve bağlı makinaları döndürür
   * @param {number} bomId - BOM ID
   * @returns {Promise<Object>} BOM detayları
   */
  static async getBomWithMakinalar(bomId) {
    return Bom.findByPk(bomId, {
      include: [
        {
          model: require('./Makina'),
          as: 'makinalar',
          attributes: ['makina_id', 'name', 'model', 'durum'],
          through: { attributes: [] }
        }
      ]
    });
  }

  /**
   * Makinaya ait BOM'ları döndürür
   * @param {string} makinaId - Makina ID
   * @returns {Promise<Array>} BOM'lar listesi
   */
  static async getBomsByMakinaId(makinaId) {
    console.log('getBomsByMakinaId çağrıldı, makinaId:', makinaId);

    try {
      // Önce makina_bom ara tablosunu kontrol et
      const query1 = `
        SELECT b.*
        FROM boms b
        INNER JOIN makina_bom mb ON b.id = mb.bom_id
        WHERE mb.makina_id = :makinaId
        AND b.aktif = true
        ORDER BY b.name ASC
      `;

      console.log('İlk sorgu çalıştırılıyor...');
      const results1 = await sequelize.query(query1, {
        replacements: { makinaId },
        type: sequelize.QueryTypes.SELECT
      });

      console.log('makina_bom sorgu sonucu:', JSON.stringify(results1, null, 2));

      // Sequelize sorgu sonucunu kontrol et ve formatı düzelt
      let actualResults = results1;
      if (!Array.isArray(results1)) {
        console.log('Sequelize sorgu sonucu array değil, dönüştürülüyor...');
        if (results1 && typeof results1 === 'object') {
          actualResults = [results1];
        } else {
          actualResults = [];
        }
      }

      console.log('İşlenmiş sonuçlar length:', actualResults?.length || 0);

      // Eğer makina_bom'da kayıt varsa, onları döndür
      if (actualResults && actualResults.length > 0) {
        console.log('makina_bom sonuçları bulundu, dönüyor');
        return actualResults;
      }

      console.log('makina_bom boş, makinalar.items JSON alanından denenecek');

      // Yoksa makinalar.items JSON alanından al
      const query2 = `
        SELECT m.items
        FROM makinalar m
        WHERE m.makina_id = :makinaId
        LIMIT 1
      `;

      console.log('İkinci sorgu çalıştırılıyor...');
      const results2 = await sequelize.query(query2, {
        replacements: { makinaId },
        type: sequelize.QueryTypes.SELECT
      });

      console.log('makinalar.items sorgu sonucu:', JSON.stringify(results2, null, 2));

      if (results2.length === 0 || !results2[0] || !results2[0].items) {
        console.log('makinalar.items bulunamadı veya boş, boş dizi dönuyor');
        console.log('results2.length:', results2.length);
        console.log('results2[0]:', results2[0]);
        console.log('results2[0]?.items:', results2[0]?.items);
        console.log('Full results2:', JSON.stringify(results2, null, 2));
        return [];
      }

      let items;
      try {
        // Double-encoded JSON olabilir, iki kez parse dene
        items = JSON.parse(results2[0].items);
        if (typeof items === 'string') {
          console.log('Items string olarak geldi, tekrar parse ediliyor...');
          items = JSON.parse(items);
        }
        console.log('JSON parse başarılı, items length:', items?.length || 0);
        console.log('İlk 3 items:', items?.slice(0, 3));
      } catch (error) {
        console.error('JSON parse hatası:', error);
        console.error('Raw items value:', results2[0].items);
        return [];
      }

      if (!Array.isArray(items)) {
        console.log('items bir dizi değil, boş dizi dönüyor');
        return [];
      }

      // Sistemde ID tutarsızlığı var: Makinalar.items UUID ID'ler içeriyor ama
      // BOM tablosunda integer ID'ler var. Bu yüzden grup isimlerini kullanarak arama yapacağız.
      console.log('Items length:', items.length);
      console.log('Array.isArray(items):', Array.isArray(items));

      // Grup isimlerini al
      const groupNames = items.map(item => item.name).filter(name => name);
      console.log('Aranacak grup isimleri:', groupNames.slice(0, 3));

      if (groupNames.length === 0) {
        console.log('Geçerli grup ismi bulunamadı, boş dizi dönüyor');
        return [];
      }

      const query3 = `
        SELECT b.*
        FROM boms b
        WHERE b.name IN (${groupNames.map(() => '?').join(',')})
        AND b.aktif = true
        ORDER BY b.name ASC
      `;

      console.log('Grup isimlerine göre BOM sorgusu çalıştırılıyor...');
      const results3 = await sequelize.query(query3, {
        replacements: groupNames,
        type: sequelize.QueryTypes.SELECT
      });

      console.log('Sonuç BOM\'lar:', results3?.length || 0);
      return results3;

    } catch (error) {
      console.error('getBomsByMakinaId hatası:', error);
      return [];
    }
  }

  /**
   * BOM'un parçalarını döndürür (bom_parcalar ara tablosu üzerinden)
   * @param {number} bomId - BOM ID
   * @returns {Promise<Array>} Parçalar listesi
   */
  static async getParcalarByBomId(bomId) {
    const { sequelize } = require('../config/database');

    const query = `
      SELECT
        bp.id,
        bp.bomId,
        bp.parcaKodu,
        bp.miktar,
        bp.birim,
        bp.pozisyon,
        p.parca_adi as parcaAdi,
        p.stok_adeti as stokAdeti,
        p.kritik_stok,
        p.teknik_resim_path,
        p.foto_path,
        sk.adet as stok_karti_adet,
        sk.kesit,
        sk.boy,
        sk.malzeme_cinsi
      FROM bom_parcalar bp
      LEFT JOIN parcalar p ON bp.parcaKodu = p.parca_kodu
      LEFT JOIN stok_kartlari sk ON p.stok_karti_id = sk.id
      WHERE bp.bomId = ?
      ORDER BY bp.id
    `;

    return sequelize.query(query, {
      replacements: [bomId],
      type: sequelize.QueryTypes.SELECT
    });
  }

  /**
   * BOM verisini grup formatına dönüştürür
   * @param {Object} bom - BOM nesnesi
   * @returns {Object} Grup formatında veri
   */
  static transformToGroupFormat(bom) {
    return {
      grup_id: bom.id,
      grup_kodu: bom.bom_kodu,
      ad: bom.name,
      aciklama: bom.bom_aciklamasi,
      versiyon: bom.versiyon,
      grup_tipi: bom.grup_tipi,
      marka: bom.marka,
      ozel_etiket: bom.ozel_etiket,
      gorsel_ikon: bom.gorsel_ikon,
      aktif: bom.aktif,
      createdAt: bom.createdAt,
      updatedAt: bom.updatedAt
    };
  }

  /**
   * Özellikle Avantaj makinaları için marka bazlı gruplar döndürür
   * @param {string} marka - Marka adı (örn: "ADVANTAGE")
   * @returns {Promise<Array>} Marka bazlı gruplar
   */
  static async getGroupsByMarka(marka) {
    return Bom.findAll({
      where: {
        marka: marka,
        aktif: true
      },
      order: [['name', 'ASC']]
    });
  }

  /**
   * Özel grup kategorilerini döndürür
   * @returns {Promise<Array>} Özel gruplar
   */
  static async getOzelGruplar() {
    return Bom.findAll({
      where: {
        grup_tipi: {
          [sequelize.Sequelize.Op.in]: ['marka', 'ozel']
        },
        aktif: true
      },
      order: [['grup_tipi', 'ASC'], ['name', 'ASC']]
    });
  }

  /**
   * Grup bazında arama yapar
   * @param {string} query - Arama metni
   * @param {string} makinaId - İsteğe bağlı makina ID
   * @returns {Promise<Array>} Arama sonuçları
   */
  static async grupAra(query, makinaId = null) {
    const whereClause = {
      aktif: true,
      [sequelize.Sequelize.Op.or]: [
        {
          name: {
            [sequelize.Sequelize.Op.like]: `%${query}%`
          }
        },
        {
          bom_aciklamasi: {
            [sequelize.Sequelize.Op.like]: `%${query}%`
          }
        },
        {
          ozel_etiket: {
            [sequelize.Sequelize.Op.like]: `%${query}%`
          }
        }
      ]
    };

    const includeClause = [];
    if (makinaId) {
      includeClause.push({
        model: require('./Makina'),
        as: 'makinalar',
        where: { makina_id: makinaId },
        attributes: [],
        through: { attributes: [] }
      });
    }

    return Bom.findAll({
      where: whereClause,
      include: includeClause,
      order: [['name', 'ASC']]
    });
  }
}

Bom.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
    field: 'id'
  },
  bom_kodu: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'bom_kodu'
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'name'
  },
  bom_aciklamasi: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'bom_aciklamasi'
  },
  versiyon: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: '1.0',
    field: 'versiyon'
  },
  aktif: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: 'aktif'
  },
  grup_tipi: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'standard',
    field: 'grup_tipi',
    validate: {
      isIn: [['standard', 'marka', 'ozel']]
    }
  },
  marka: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'marka'
  },
  ozel_etiket: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'ozel_etiket'
  },
  gorsel_ikon: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'gorsel_ikon'
  }
}, {
  sequelize,
  modelName: 'Bom',
  tableName: 'boms',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  underscored: false
});

// Force restart
module.exports = Bom;