const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Firma = sequelize.define('Firma', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    firma_adi: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Firma adı zorunludur'
        },
        len: {
          args: [2, 200],
          msg: 'Firma adı en az 2, en fazla 200 karakter olabilir'
        }
      }
    },
    firma_kodu: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: {
          msg: 'Firma kodu zorunludur'
        },
        len: {
          args: [2, 50],
          msg: 'Firma kodu en az 2, en fazla 50 karakter olabilir'
        }
      }
    },
    vergi_dairesi: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    vergi_no: {
      type: DataTypes.STRING(20),
      allowNull: true,
      validate: {
        is: {
          args: [/^[0-9]{10}$/],
          msg: 'Vergi numarası 10 haneli sayı olmalıdır'
        }
      }
    },
    adres: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    telefon: {
      type: DataTypes.STRING(20),
      allowNull: true,
      validate: {
        is: {
          args: [/^(\+90|0)?[0-9]{10}$/],
          msg: 'Telefon numarası geçerli formatta olmalıdır'
        }
      }
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        isEmailOrNull(value) {
          if (value && value !== '') {
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
              throw new Error('Geçerli bir e-posta adresi giriniz');
            }
          }
        }
      }
    },
    yetkili_kisi: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    yetkili_telefon: {
      type: DataTypes.STRING(20),
      allowNull: true,
      validate: {
        is: {
          args: [/^(\+90|0)?[0-9]{10}$/],
          msg: 'Yetkili telefon numarası geçerli formatta olmalıdır'
        }
      }
    },
    yetkili_email: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        isEmailOrNull(value) {
          if (value && value !== '') {
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
              throw new Error('Yetkili e-posta adresi geçerli formatta olmalıdır');
            }
          }
        }
      }
    },
    tip: {
      type: DataTypes.ENUM('ic', 'dis'),
      allowNull: false,
      defaultValue: 'dis',
      comment: 'Firma tipi: ic = İç firma, dis = Dış firma'
    },
    iban: {
      type: DataTypes.STRING(34),
      allowNull: true,
      validate: {
        is: {
          args: [/^TR[a-zA-Z0-9]{2}\s?([0-9]{4}\s?){3}[0-9]{2}$/],
          msg: 'IBAN geçerli formatta olmalıdır (TR ile başlamalı)'
        }
      }
    },
    web_sitesi: {
      type: DataTypes.STRING(200),
      allowNull: true,
      validate: {
        isUrl: {
          msg: 'Web sitesi adresi geçerli formatta olmalıdır'
        }
      }
    },
    aciklama: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    durum: {
      type: DataTypes.ENUM('aktif', 'pasif'),
      allowNull: false,
      defaultValue: 'aktif'
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'firmalar',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['firma_kodu']
      },
      {
        fields: ['firma_adi']
      },
      {
        fields: ['durum']
      }
    ]
  });

  // İlişkiler
  Firma.associate = (models) => {
    // Tedarik talepleri ile ilişki
    Firma.hasMany(models.TedarikTalebi, {
      foreignKey: 'firma_id',
      as: 'tedarikTalepleri'
    });

    // Sevkiyatlar ile ilişki (eğer varsa)
    if (models.Sevkiyat) {
      Firma.hasMany(models.Sevkiyat, {
        foreignKey: 'firma_id',
        as: 'sevkiyatlar'
      });
    }
  };

  // Instance methods
  Firma.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());

    // Format telefon numbers
    if (values.telefon) {
      values.telefon_formatli = formatTelefon(values.telefon);
    }
    if (values.yetkili_telefon) {
      values.yetkili_telefon_formatli = formatTelefon(values.yetkili_telefon);
    }

    // Format IBAN
    if (values.iban) {
      values.iban_formatli = formatIBAN(values.iban);
    }

    return values;
  };

  // Class methods
  Firma.findByDurum = function(durum) {
    return this.findAll({
      where: { durum },
      order: [['firma_adi', 'ASC']]
    });
  };

  Firma.aktifler = function() {
    return this.findByDurum('aktif');
  };

  Firma.pasifler = function() {
    return this.findByDurum('pasif');
  };

  Firma.search = function(arama) {
    const { Op } = require('sequelize');
    return this.findAll({
      where: {
        [Op.or]: [
          { firma_adi: { [Op.iLike]: `%${arama}%` } },
          { firma_kodu: { [Op.iLike]: `%${arama}%` } },
          { vergi_no: { [Op.iLike]: `%${arama}%` } },
          { yetkili_kisi: { [Op.iLike]: `%${arama}%` } }
        ]
      },
      order: [['firma_adi', 'ASC']]
    });
  };

  return Firma;
};

// Helper functions
function formatTelefon(telefon) {
  if (!telefon) return '';
  const cleaned = telefon.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)} ${cleaned.slice(6, 8)} ${cleaned.slice(8)}`;
  }
  return telefon;
}

function formatIBAN(iban) {
  if (!iban) return '';
  const cleaned = iban.replace(/\s/g, '');
  if (cleaned.length === 26 && cleaned.startsWith('TR')) {
    return cleaned.replace(/(.{4})(?!$)/g, '$1 ');
  }
  return iban;
}