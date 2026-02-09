const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database').sequelize;
const { v4: uuidv4 } = require('uuid');

class MakinaStok extends Model {
  static associate(models) {
    // Stok bir makina için
    MakinaStok.belongsTo(models.Makina, {
      foreignKey: 'makina_id',
      targetKey: 'makina_id',
      as: 'makina'
    });

    // Stok bir siparişten gelmiş olabilir (opsiyonel)
    MakinaStok.belongsTo(models.MakinaSiparis, {
      foreignKey: 'siparis_id',
      targetKey: 'siparis_id',
      as: 'siparis'
    });
  }

  /**
   * Depo adını döndürür
   * @returns {string} Depo adı
   */
  getDepoAdi() {
    const depolar = {
      1: 'Ana Depo',
      2: 'Alaaddin Bey Depo'
    };
    return depolar[this.depo_id] || 'Belirtilmemiş';
  }
}

MakinaStok.init({
  stok_id: {
    type: DataTypes.STRING(36),
    defaultValue: () => uuidv4(),
    primaryKey: true,
    allowNull: false,
    field: 'stok_id'
  },
  makina_id: {
    type: DataTypes.STRING(36),
    allowNull: false,
    field: 'makina_id',
    comment: 'Makina UUID',
    references: {
      model: 'makinalar',
      key: 'makina_id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT'
  },
  adet: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    field: 'adet',
    comment: 'Stok adedi',
    validate: {
      min: 0
    }
  },
  depo_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'depo_id',
    comment: 'Depo ID: 1=Ana Depo, 2=Alaaddin Bey Depo'
  },
  giris_kaynagi: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'giris_kaynagi',
    comment: 'Giriş kaynağı: Satın Alma, Üretim, Montaj'
  },
  giris_tarihi: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'giris_tarihi',
    comment: 'Stok giriş tarihi'
  },
  siparis_id: {
    type: DataTypes.STRING(36),
    allowNull: true,
    field: 'siparis_id',
    comment: 'İlgili sipariş ID (üretimden geldiyse)',
    references: {
      model: 'makina_siparisleri',
      key: 'siparis_id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL'
  },
  seri_nolari: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'seri_nolari',
    comment: 'Seri numaraları JSON formatında',
    get() {
      const rawValue = this.getDataValue('seri_nolari');
      if (!rawValue) return null;
      if (typeof rawValue === 'string') {
        try { return JSON.parse(rawValue); } catch (e) { return null; }
      }
      return rawValue;
    },
    set(value) {
      if (value === null || value === undefined || value.length === 0) {
        this.setDataValue('seri_nolari', null);
      } else if (typeof value === 'string') {
        this.setDataValue('seri_nolari', value);
      } else {
        this.setDataValue('seri_nolari', JSON.stringify(value));
      }
    }
  },
  notlar: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'notlar',
    comment: 'Stok notları'
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
  modelName: 'MakinaStok',
  tableName: 'makina_stok',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  underscored: true,
  indexes: [
    {
      fields: ['makina_id']
    },
    {
      fields: ['depo_id']
    },
    {
      fields: ['giris_tarihi']
    },
    {
      fields: ['siparis_id']
    }
  ]
});

module.exports = MakinaStok;
