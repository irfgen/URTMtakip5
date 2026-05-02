/**
 * action-loader.js
 * Action definitions yükleyici — action-definitions.json dosyasını okur ve doğrular
 */

const fs = require('fs');
const path = require('path');

class ActionLoader {
  constructor(agentDir) {
    this.agentDir = agentDir || path.join(__dirname);
    this.definitionsPath = path.join(this.agentDir, 'action-definitions.json');
    this.definitions = null;
  }

  /**
   * Action definitions dosyasını yükle
   */
  load() {
    try {
      const content = fs.readFileSync(this.definitionsPath, 'utf8');
      this.definitions = JSON.parse(content);
      return { success: true, data: this.definitions };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Belirli bir aksiyonun tanımını getir
   */
  getAction(actionName) {
    if (!this.definitions) {
      this.load();
    }
    return this.definitions?.actions?.[actionName] || null;
  }

  /**
   * Belirli bir modülün tanımını getir
   */
  getModule(moduleId) {
    if (!this.definitions) {
      this.load();
    }
    return this.definitions?.modules?.[moduleId] || null;
  }

  /**
   * Bir aksiyonun onay gerektirip gerektirmediğini kontrol et
   */
  requiresApproval(actionName) {
    const action = this.getAction(actionName);
    return action?.requires_approval || false;
  }

  /**
   * Bir aksiyonun alternatiflerini getir
   */
  getAlternatives(actionName) {
    const action = this.getAction(actionName);
    return action?.alternatives || [];
  }

  /**
   * Bir modülün kritik aksiyonlarını getir
   */
  getCriticalActions(moduleId) {
    const module = this.getModule(moduleId);
    return module?.critical_actions || [];
  }

  /**
   * Tüm aksiyonları listele
   */
  listActions() {
    if (!this.definitions) {
      this.load();
    }
    return Object.keys(this.definitions?.actions || {});
  }

  /**
   * Tüm modülleri listele
   */
  listModules() {
    if (!this.definitions) {
      this.load();
    }
    return Object.keys(this.definitions?.modules || {});
  }

  /**
   * İletişim ayarlarını getir
   */
  getCommunicationSettings() {
    if (!this.definitions) {
      this.load();
    }
    return {
      module_to_master: this.definitions?.communication?.module_to_master || {
        method: 'REST',
        endpoint: '/api/master/consult',
        timeout_ms: 30000
      },
      master_to_module: this.definitions?.communication?.master_to_module || {
        method: 'WebSocket',
        event: 'approval_response',
        timeout_ms: 30000
      }
    };
  }

  /**
   * Default ayarları getir
   */
  getDefaults() {
    if (!this.definitions) {
      this.load();
    }
    return this.definitions?.defaults || {
      requires_approval: false,
      priority: 'low',
      timeout_ms: 30000
    };
  }

  /**
   * Modül-aksiyon eşleşmesini kontrol et
   */
  validateActionForModule(moduleId, actionName) {
    const action = this.getAction(actionName);
    if (!action) {
      return { valid: false, error: `Action '${actionName}' not found` };
    }
    if (action.module !== moduleId) {
      return { valid: false, error: `Action '${actionName}' belongs to module '${action.module}', not '${moduleId}'` };
    }
    return { valid: true };
  }
}

module.exports = { ActionLoader };
