const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database').sequelize;
const { v4: uuidv4 } = require('uuid');

class Makina extends Model {
  static associate(models) {
    // Makina bir makina sınıfına ait olabilir
    Makina.belongsTo(models.MakinaSinifi, {
      foreignKey: 'makina_sinifi_id',
      targetKey: 'id',
      as: 'makinaSinifi'
    });

    // Makina birden çok BOM içerebilir (çok-çok ilişki)
    Makina.belongsToMany(models.Bom, {
      through: 'makina_bom',
      foreignKey: 'makina_id',
      otherKey: 'bom_id',
      as: 'boms'
    });

    // YENİ: Makina birden çok siparişe sahip olabilir
    Makina.hasMany(models.MakinaSiparis, {
      foreignKey: 'makina_id',
      sourceKey: 'makina_id',
      as: 'siparisler'
    });

    // YENİ: Makina birden çok stok girişine sahip olabilir
    Makina.hasMany(models.MakinaStok, {
      foreignKey: 'makina_id',
      sourceKey: 'makina_id',
      as: 'stoklar'
    });
  }

  /**
   * Makina ve ilişkili bilgilerini döndürür
   * @param {string} makinaId - Makina ID
   * @returns {Promise<Object>} Makina detayları
   */
  static async getMakinaWithDetails(makinaId) {
    return Makina.findByPk(makinaId, {
      include: [
        {
          model: require('./MakinaSinifi'),
          as: 'makinaSinifi',
          attributes: ['id', 'ad', 'aciklama']
        },
        {
          model: require('./Bom'),
          as: 'boms',
          attributes: ['id', 'bom_kodu', 'name', 'bom_aciklamasi'],
          through: { attributes: [] }
        }
      ]
    });
  }

  /**
   * Sınıfa ait makinaları döndürür
   * @param {number} sinifId - Makina sınıfı ID
   * @returns {Promise<Array>} Makinalar listesi
   */
  static async getMakinalarBySinifId(sinifId) {
    return Makina.findAll({
      where: { makina_sinifi_id: sinifId },
      include: [
        {
          model: require('./Bom'),
          as: 'boms',
          attributes: ['id', 'bom_kodu', 'name'],
          through: { attributes: [] }
        }
      ],
      order: [['name', 'ASC']]
    });
  }
}

Makina.init({
  makina_id: {
    type: DataTypes.UUID,
    defaultValue: () => uuidv4(),
    primaryKey: true,
    allowNull: false,
    field: 'makina_id'
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'name'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'description'
  },
  model: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'model'
  },
  seri_no: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'seri_no'
  },
  uretim_yili: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'uretim_yili'
  },
  durum: {
    type: DataTypes.ENUM('aktif', 'pasif', 'bakim'),
    allowNull: false,
    defaultValue: 'aktif',
    field: 'durum'
  },
  makina_sinifi_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'makina_sinifi_id',
    comment: 'Makina sınıfı foreign key',
    references: {
      model: 'makina_siniflari',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL'
  },
  items: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
    field: 'items',
    get() {
      const rawValue = this.getDataValue('items');
      if (typeof rawValue === 'string') {
        try { return JSON.parse(rawValue); } catch (e) { return []; }
      }
      return rawValue || [];
    },
    set(value) {
      this.setDataValue('items', JSON.stringify(value || []));
    }
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'created_at'
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'updated_at'
  }
}, {
  sequelize,
  modelName: 'Makina',
  tableName: 'makinalar',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  underscored: true
});

module.exports = Makina;