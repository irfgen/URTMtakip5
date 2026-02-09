const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database').sequelize;

class ImportIndex extends Model {
  static associate(models) {
    // İlerleyen versiyonlarda ilişkiler eklenebilir
  }

  /**
   * Duruma göre kayıt sayısını döner
   * @param {string} status 
   * @returns {Promise<number>}
   */
  static async getCountByStatus(status) {
    return await this.count({ where: { status } });
  }

  /**
   * Belirli durumdaki kayıtları getirir
   * @param {string} status 
   * @param {object} options 
   * @returns {Promise<ImportIndex[]>}
   */
  static async findByStatus(status, options = {}) {
    return await this.findAll({
      where: { status },
      ...options
    });
  }

  /**
   * Dosya yoluna göre kayıt bulur
   * @param {string} fullPath 
   * @returns {Promise<ImportIndex|null>}
   */
  static async findByPath(fullPath) {
    return await this.findOne({ where: { full_path: fullPath } });
  }

  /**
   * Veritabanında olmayan (eksik) parçaları getirir
   * @param {object} options 
   * @returns {Promise<ImportIndex[]>}
   */
  static async findMissingParts(options = {}) {
    const { Parca } = require('./index');
    const { Op } = require('sequelize');
    
    return await this.findAll({
      where: {
        status: {
          [Op.in]: ['pending', 'ready_to_import', 'failed']
        }
      },
      include: [{
        model: Parca,
        required: false,
        where: {
          parcaKodu: sequelize.col('ImportIndex.file_name')
        }
      }],
      ...options
    });
  }

  /**
   * Durumu günceller
   * @param {string} newStatus 
   * @param {string} errorMessage 
   */
  async updateStatus(newStatus, errorMessage = null) {
    await this.update({
      status: newStatus,
      error_message: errorMessage,
      updated_at: new Date()
    });
  }
}

ImportIndex.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  full_path: {
    type: DataTypes.TEXT,
    allowNull: false,
    unique: true,
    comment: 'Dosyanın tam yolu (benzersiz anahtar)'
  },
  file_name: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Dosya adı (uzantısız)'
  },
  extension: {
    type: DataTypes.STRING(10),
    allowNull: false,
    comment: 'Dosya uzantısı (.sldprt, .sldpart, .sldasm)'
  },
  status: {
    type: DataTypes.ENUM('pending', 'exists', 'ready_to_import', 'importing', 'imported', 'failed'),
    allowNull: false,
    defaultValue: 'pending',
    comment: 'İşlem durumu'
  },
  hash: {
    type: DataTypes.STRING(64),
    allowNull: true,
    comment: 'Dosya hash\'i (değişiklik tespiti için)'
  },
  error_message: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Hata durumunda hata mesajı'
  },
  client_id: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'İndeksleme yapan client id'
  }
}, {
  sequelize,
  modelName: 'ImportIndex',
  tableName: 'import_index',
  timestamps: true,
  underscored: true
});

module.exports = ImportIndex;