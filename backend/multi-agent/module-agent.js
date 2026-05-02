/**
 * module-agent.js
 * Modül Ajan Temel Sınıfı - Tam Yetki
 *
 * Her modül ajan bu sınıftan türetilir ve:
 * - Veritabanına direkt erişim (REQ-007)
 * - API endpointlerini çağırma (REQ-008)
 * - Master'a danışma ve otonom aksiyon alma
 *
 * Kullanım:
 * const { ModuleAgent } = require('./module-agent');
 *
 * class StokAgent extends ModuleAgent {
 *   async checkAndOrder() {
 *     const lowStock = await this.db.findAll('stok_kartlari', { durum: 'kritik' });
 *     if (lowStock.length > 0) {
 *       const result = await this.consultMaster('siparis_tetikle', { items: lowStock });
 *       if (result.approved) {
 *         // Sipariş tetikle
 *       }
 *     }
 *   }
 * }
 */

const db = require('./db-access');
const api = require('./api-client');
const { consultMaster, connect, disconnect } = require('./consult-master');

class ModuleAgent {
  constructor(moduleId, moduleName) {
    this.moduleId = moduleId;
    this.moduleName = moduleName;
    this.db = db;
    this.api = api;
    this.connected = false;

    console.log(`[ModuleAgent] ${moduleName} (${moduleId}) oluşturuldu`);
  }

  /**
   * Master'a bağlan (WebSocket)
   */
  async connect() {
    if (!this.connected) {
      connect(this.moduleId);
      this.connected = true;
      console.log(`[ModuleAgent] ${this.moduleId} master'a bağlandı`);
    }
  }

  /**
   * Master'a danış
   * @param {string} action - Aksiyon adı
   * @param {Object} context - Bağlam
   * @param {boolean} alternatives - Alternatifler isteniyor mu
   */
  async consultMaster(action, context = {}, alternatives = false) {
    return await consultMaster({
      module: this.moduleId,
      action: action,
      context: context,
      alternatives_requested: alternatives,
      timeout: 30000
    });
  }

  /**
   * Otonom aksiyon çalıştır (master onayı gerekmez)
   * @param {string} action - Aksiyon adı
   * @param {Object} params - Parametreler
   */
  async executeAutonomous(action, params = {}) {
    console.log(`[ModuleAgent] Otonom aksiyon: ${action}`);

    // action-definitions.json'dan aksiyon tanımını al
    const { ActionLoader } = require('./action-loader');
    const loader = new ActionLoader();
    const actionDef = loader.getAction(action);

    if (!actionDef) {
      throw new Error(`Bilinmeyan aksiyon: ${action}`);
    }

    // Onay gerekiyorsa master'a danış
    if (actionDef.requires_approval) {
      const result = await this.consultMaster(action, params, true);

      if (result.status === 'approved') {
        return { success: true, action, result: 'approved' };
      } else if (result.status === 'alternative') {
        console.log(`[ModuleAgent] Alternatif aksiyon önerildi: ${result.alternative?.action}`);
        return { success: true, action, result: 'alternative', alternative: result.alternative };
      } else {
        return { success: false, action, result: result.status, message: result.message };
      }
    }

    // Onay gerekmiyor - direkt çalıştır
    return { success: true, action, result: 'autonomous' };
  }

  /**
   * Veritabanı sorgusu çalıştır
   */
  async dbQuery(sql, params) {
    return await this.db.query(sql, params);
  }

  /**
   * Tablodan kayıt getir
   */
  async findAll(table, where, limit) {
    return await this.db.findAll(table, where, limit);
  }

  /**
   * Tek kayıt getir
   */
  async findOne(table, where) {
    return await this.db.findOne(table, where);
  }

  /**
   * Yeni kayıt ekle
   */
  async insert(table, data) {
    return await this.db.insert(table, data);
  }

  /**
   * Kayıt güncelle
   */
  async update(table, data, where) {
    return await this.db.update(table, data, where);
  }

  /**
   * Kayıt sil
   */
  async remove(table, where) {
    return await this.db.remove(table, where);
  }

  /**
   * API GET isteği
   */
  async apiGet(endpoint, params) {
    return await this.api.get(endpoint, params);
  }

  /**
   * API POST isteği
   */
  async apiPost(endpoint, data) {
    return await this.api.post(endpoint, data);
  }

  /**
   * API PUT isteği
   */
  async apiPut(endpoint, data) {
    return await this.api.put(endpoint, data);
  }

  /**
   * API DELETE isteği
   */
  async apiDelete(endpoint) {
    return await this.api.delete(endpoint);
  }

  /**
   * Bağlantıyı kapat
   */
  disconnect() {
    if (this.connected) {
      disconnect();
      this.connected = false;
    }
  }
}

module.exports = { ModuleAgent };