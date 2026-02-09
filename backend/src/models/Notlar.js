const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database').sequelize;

class Notlar extends Model {
  static associate(models) {
    // Notlar belongs to NotKategorileri
    Notlar.belongsTo(models.NotKategorileri, {
      foreignKey: 'kategori_id',
      as: 'kategori'
    });
  }

  // Instance method - not özeti oluştur
  getOzet(maxLength = 150) {
    if (!this.icerik) return '';
    return this.icerik.length > maxLength 
      ? this.icerik.substring(0, maxLength) + '...'
      : this.icerik;
  }

  // Instance method - resim var mı kontrolü
  hasImage() {
    return !!(this.resim_yolu && this.resim_yolu.trim() !== '');
  }
}

  Notlar.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    baslik: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Başlık boş olamaz'
        },
        len: {
          args: [1, 500],
          msg: 'Başlık 1-500 karakter arasında olmalıdır'
        }
      }
    },
    icerik: {
      type: DataTypes.TEXT,
      validate: {
        len: {
          args: [0, 10000],
          msg: 'İçerik maksimum 10000 karakter olabilir'
        }
      }
    },
    resim_yolu: {
      type: DataTypes.STRING,
      validate: {
        isValidImagePath(value) {
          if (value && value.trim() !== '') {
            const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
            const hasValidExtension = validExtensions.some(ext => 
              value.toLowerCase().endsWith(ext)
            );
            if (!hasValidExtension) {
              throw new Error('Geçerli bir resim dosyası formatı değil');
            }
          }
        }
      }
    },
    kategori_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'not_kategorileri',
        key: 'id'
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
    kullanici_id: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    aktif: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    sequelize,
    modelName: 'Notlar',
    tableName: 'notlar',
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
      },
      withKategori: {
        include: [{
          model: sequelize.models.NotKategorileri,
          as: 'kategori',
          attributes: ['id', 'kategori_adi', 'renk_kodu']
        }]
      },
      resimliNotlar: {
        where: {
          resim_yolu: {
            [sequelize.Sequelize.Op.ne]: null,
            [sequelize.Sequelize.Op.ne]: ''
          }
        }
      },
      resimsizNotlar: {
        where: {
          [sequelize.Sequelize.Op.or]: [
            { resim_yolu: null },
            { resim_yolu: '' }
          ]
        }
      }
    }
  });
