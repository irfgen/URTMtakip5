const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database').sequelize;

class ImportClient extends Model {
  static associate(models) {
    // İlerleyen versiyonlarda ImportIndex ve ImportJob ile ilişki kurulabilir
    this.hasMany(models.ImportIndex, { 
      foreignKey: 'client_id', 
      sourceKey: 'client_id' 
    });
    this.hasMany(models.ImportJob, { 
      foreignKey: 'client_id', 
      sourceKey: 'client_id' 
    });
  }

  /**
   * Aktif client'ları getirir
   * @returns {Promise<ImportClient[]>}
   */
  static async getActiveClients() {
    return await this.findAll({
      where: { status: 'connected' },
      order: [['last_seen', 'DESC']]
    });
  }

  /**
   * Client'ı client_id ile bulur
   * @param {string} clientId 
   * @returns {Promise<ImportClient|null>}
   */
  static async findByClientId(clientId) {
    return await this.findOne({ where: { client_id: clientId } });
  }

  /**
   * Client'ı kaydet veya güncelle
   * @param {object} clientData 
   * @returns {Promise<ImportClient>}
   */
  static async upsertClient(clientData) {
    const [client, created] = await this.findOrCreate({
      where: { client_id: clientData.client_id },
      defaults: {
        client_name: clientData.client_name,
        client_info: clientData.client_info,
        status: 'connected',
        last_seen: new Date()
      }
    });

    if (!created) {
      await client.update({
        client_name: clientData.client_name,
        client_info: clientData.client_info,
        status: 'connected',
        last_seen: new Date()
      });
    }

    return client;
  }

  /**
   * Client durumunu günceller
   * @param {string} newStatus 
   */
  async updateStatus(newStatus) {
    await this.update({
      status: newStatus,
      last_seen: new Date()
    });
  }

  /**
   * Client'ın son etkinlik zamanını günceller
   */
  async updateLastSeen() {
    await this.update({
      last_seen: new Date()
    });
  }

  /**
   * Client'ın çalışma durumunu döner
   * @returns {boolean}
   */
  isActive() {
    if (!this.last_seen) return false;
    
    // Son 5 dakika içinde görülmüş ise aktif
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return this.last_seen > fiveMinutesAgo && this.status !== 'disconnected';
  }

  /**
   * Client özet bilgilerini döner
   * @returns {object}
   */
  getSummary() {
    return {
      id: this.id,
      client_id: this.client_id,
      client_name: this.client_name,
      status: this.status,
      last_seen: this.last_seen,
      is_active: this.isActive(),
      client_info: this.client_info
    };
  }
}

ImportClient.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  client_id: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    comment: 'Client benzersiz kimliği'
  },
  client_name: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Client adı'
  },
  client_info: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Client sistem bilgileri'
  },
  status: {
    type: DataTypes.ENUM('connected', 'disconnected', 'working'),
    allowNull: false,
    defaultValue: 'disconnected',
    comment: 'Client durumu'
  },
  last_seen: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Son görülme zamanı'
  }
}, {
  sequelize,
  modelName: 'ImportClient',
  tableName: 'import_client',
  timestamps: true,
  underscored: true
});

module.exports = ImportClient;