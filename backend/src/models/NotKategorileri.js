const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database').sequelize;

class NotKategorileri extends Model {
  static associate(models) {
    // NotKategorileri has many Notlar
    NotKategorileri.hasMany(models.Notlar, {
      foreignKey: 'kategori_id',
      as: 'notlar'
    });
  }
}

NotKategorileri.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    kategori_adi: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: {
          msg: 'Kategori adı boş olamaz'
        },
        len: {
          args: [1, 100],
          msg: 'Kategori adı 1-100 karakter arasında olmalıdır'
        }
      }
    },
    renk_kodu: {
      type: DataTypes.STRING,
      defaultValue: '#007bff',
      validate: {
        is: {
          args: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
          msg: 'Geçerli bir hex renk kodu giriniz (örn: #007bff)'
        }
      }
    },
    olusturma_tarihi: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    guncelleme_tarihi: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    aktif: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    sequelize,
    modelName: 'NotKategorileri',
    tableName: 'not_kategorileri',
    timestamps: true,
    createdAt: 'olusturma_tarihi',
    updatedAt: 'guncelleme_tarihi',
    hooks: {
      beforeUpdate: (instance) => {
        instance.guncelleme_tarihi = new Date();
      }
    },
    scopes: {
      aktif: {
        where: {
          aktif: true
        }
      }
    }
  });
