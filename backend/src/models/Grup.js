const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database').sequelize;
const { v4: uuidv4 } = require('uuid');

class Grup extends Model {
  static associate(models) {
    Grup.belongsToMany(models.Parca, {
      through: 'grup_parcalar',
      foreignKey: 'grup_id',
      otherKey: 'parca_kodu',
      as: 'parcalar'
    });
    models.Parca.belongsToMany(Grup, {
      through: 'grup_parcalar',
      foreignKey: 'parca_kodu',
      otherKey: 'grup_id',
      as: 'gruplar'
    });
  }
}

Grup.init({
  grup_id: {
    type: DataTypes.UUID,
    defaultValue: () => uuidv4(),
    primaryKey: true,
    allowNull: false,
    field: 'grup_id'
  },
  grup_adi: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'grup_adi'
  },
  aciklama: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'aciklama'
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
  modelName: 'Grup',
  tableName: 'gruplar',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  underscored: true
});

module.exports = Grup;
