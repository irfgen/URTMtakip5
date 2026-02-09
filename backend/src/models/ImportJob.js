const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database').sequelize;

class ImportJob extends Model {
  static associate(models) {
    // İlerleyen versiyonlarda ImportIndex ile ilişki kurulabilir
  }

  /**
   * Çalışan iş var mı kontrol eder
   * @returns {Promise<ImportJob|null>}
   */
  static async getRunningJob() {
    return await this.findOne({
      where: { state: 'running' },
      order: [['started_at', 'DESC']]
    });
  }

  /**
   * Yeni bir import işi başlatır
   * @param {object} jobData 
   * @returns {Promise<ImportJob>}
   */
  static async startJob(jobData) {
    return await this.create({
      job_name: jobData.job_name || 'SolidWorks Import',
      started_at: new Date(),
      total: jobData.total || 0,
      state: 'running',
      config: jobData.config || {}
    });
  }

  /**
   * İşi tamamlar
   * @param {string} finalState 
   */
  async finishJob(finalState = 'completed') {
    await this.update({
      finished_at: new Date(),
      state: finalState
    });
  }

  /**
   * İlerleme günceller
   * @param {number} successCount 
   * @param {number} failCount 
   */
  async updateProgress(successCount, failCount) {
    await this.update({
      success_count: successCount,
      fail_count: failCount,
      updated_at: new Date()
    });
  }

  /**
   * İşi iptal eder
   */
  async cancelJob() {
    await this.update({
      finished_at: new Date(),
      state: 'canceled'
    });
  }

  /**
   * İş süresini hesaplar (milisaniye)
   * @returns {number|null}
   */
  getDuration() {
    if (!this.finished_at) return null;
    return this.finished_at.getTime() - this.started_at.getTime();
  }

  /**
   * İş durumu özetini döner
   * @returns {object}
   */
  getSummary() {
    return {
      id: this.id,
      job_name: this.job_name,
      state: this.state,
      total: this.total,
      success_count: this.success_count,
      fail_count: this.fail_count,
      progress_percent: this.total > 0 ? 
        Math.round(((this.success_count + this.fail_count) / this.total) * 100) : 0,
      started_at: this.started_at,
      finished_at: this.finished_at,
      duration_ms: this.getDuration(),
      config: this.config
    };
  }
}

ImportJob.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  job_name: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'İş adı (opsiyonel)'
  },
  started_at: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: 'İş başlangıç zamanı'
  },
  finished_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'İş bitiş zamanı'
  },
  total: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Toplam işlenecek dosya sayısı'
  },
  success_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Başarılı import sayısı'
  },
  fail_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Başarısız import sayısı'
  },
  state: {
    type: DataTypes.ENUM('running', 'completed', 'canceled', 'failed'),
    allowNull: false,
    defaultValue: 'running',
    comment: 'İş durumu'
  },
  config: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'İş konfigürasyon ayarları'
  },
  client_id: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'İşi yapan client id'
  }
}, {
  sequelize,
  modelName: 'ImportJob',
  tableName: 'import_job',
  timestamps: true,
  underscored: true
});

module.exports = ImportJob;