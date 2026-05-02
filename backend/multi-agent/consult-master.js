/**
 * consult-master.js
 * Modül ajanının master ajana danışması için modül
 *
 * Kullanım:
 * const { consultMaster } = require('./consult-master');
 * const result = await consultMaster({
 *   module: 'stok_kartlari',
 *   action: 'siparis_tetikle',
 *   context: { stok_id: 5, miktar: 100 },
 *   alternatives_requested: true
 * });
 */

const http = require('http');
const { io } = require('socket.io-client');
const { EventEmitter } = require('events');

class ConsultationManager extends EventEmitter {
  constructor() {
    super();
    this.pendingConsultations = new Map();
    this.serverUrl = process.env.MASTER_API_URL || 'http://localhost:3001';
    this.ws = null;
    this.connected = false;
    this.moduleId = null;
  }

  /**
   * REST API'ye istek gönder
   */
  async restRequest(endpoint, method, data) {
    return new Promise((resolve, reject) => {
      const url = new URL(endpoint, this.serverUrl);
      const options = {
        hostname: url.hostname,
        port: url.port || 3001,
        path: url.pathname,
        method: method,
        headers: {
          'Content-Type': 'application/json'
        }
      };

      const req = http.request(options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            resolve({ raw: body });
          }
        });
      });

      req.on('error', reject);
      if (data) {
        req.write(JSON.stringify(data));
      }
      req.end();
    });
  }

  /**
   * WebSocket bağlantısı kur (Socket.IO)
   */
  connect(moduleId) {
    if (this.ws && this.connected) {
      return;
    }

    this.moduleId = moduleId;
    this.ws = io(this.serverUrl, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    this.ws.on('connect', () => {
      console.log(`[ConsultMaster] WebSocket bağlandı: ${this.ws.id}`);
      this.connected = true;

      // Modül olarak kaydet
      this.ws.emit('register', { moduleId: this.moduleId });
    });

    this.ws.on('disconnect', () => {
      console.log('[ConsultMaster] WebSocket bağlantısı kesildi');
      this.connected = false;
    });

    this.ws.on('connect_error', (err) => {
      console.error('[ConsultMaster] WebSocket bağlantı hatası:', err.message);
      this.connected = false;
    });

    // Onay yanıtı dinle
    this.ws.on('approval_request', (data) => {
      console.log(`[ConsultMaster] Onay talebi alındı: ${data.approvalId} - ${data.action}`);
      this.emit('approval_request', data);
    });

    return this.ws;
  }

  /**
   * Onay yanıtı gönder
   */
  sendApprovalResponse(approvalId, approved, alternative = null, message = '') {
    if (!this.ws || !this.connected) {
      console.error('[ConsultMaster] WebSocket bağlı değil');
      return false;
    }

    this.ws.emit('approval_response', {
      approvalId,
      approved,
      alternative,
      message
    });

    console.log(`[ConsultMaster] Onay yanıtı gönderildi: ${approvalId} - approved=${approved}`);
    return true;
  }

  /**
   * Bağlantıyı kapat
   */
  disconnect() {
    if (this.ws) {
      this.ws.disconnect();
      this.ws = null;
      this.connected = false;
    }
  }
}

const consultationManager = new ConsultationManager();

/**
 * Master ajana danış
 * @param {Object} params - Danışma parametreleri
 * @param {string} params.module - Modül ID
 * @param {string} params.action - Aksiyon adı
 * @param {Object} params.context - Aksiyon bağlamı
 * @param {boolean} params.alternatives_requested - Alternatifler isteniyor mu
 * @param {number} params.timeout - Timeout (ms)
 * @returns {Promise<Object>} Danışma sonucu
 */
async function consultMaster(params) {
  const {
    module,
    action,
    context = {},
    alternatives_requested = false,
    timeout = 30000
  } = params;

  console.log(`[ConsultMaster] Danışma başlatıldı: ${module}/${action}`);

  try {
    // WebSocket'e bağlı değilse bağlan
    if (!consultationManager.connected) {
      consultationManager.connect(module);
      // Bağlantı bekle
      await new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          reject(new Error('WebSocket bağlantısı zaman aşımına uğradı'));
        }, 5000);
        consultationManager.ws.once('connect', () => {
          clearTimeout(timer);
          resolve();
        });
        consultationManager.ws.once('connect_error', (err) => {
          clearTimeout(timer);
          reject(err);
        });
      });
    }

    // REST API'ye danışma isteği gönder
    const response = await consultationManager.restRequest(
      '/api/master/consult',
      'POST',
      { module, action, context, alternatives_requested }
    );

    if (!response.success) {
      return {
        success: false,
        error: response.error || 'Bilinmeyen hata'
      };
    }

    // Onay gerekmiyorsa direkt sonuç döndür
    if (!response.requires_approval) {
      console.log(`[ConsultMaster] Onay gerekmiyor, direkt sonuç`);
      return {
        success: true,
        approved: true,
        status: response.status,
        message: response.message
      };
    }

    // Onay bekleniyor - API yanıtını kontrol et
    if (response.status === 'approved') {
      console.log(`[ConsultMaster] Onaylandı: ${response.message}`);
      return {
        success: true,
        approved: true,
        status: response.status,
        message: response.message
      };
    }

    if (response.status === 'rejected') {
      console.log(`[ConsultMaster] Reddedildi: ${response.message}`);
      return {
        success: false,
        approved: false,
        status: response.status,
        message: response.message
      };
    }

    if (response.status === 'alternative') {
      console.log(`[ConsultMaster] Alternatif önerildi: ${response.alternative?.action}`);
      return {
        success: true,
        approved: false,
        status: 'alternative',
        alternative: response.alternative,
        message: response.message
      };
    }

    // Timeout durumunda bekleme moduna geç
    if (response.status === 'timeout' || response.requires_wait) {
      console.log(`[ConsultMaster] Timeout! Bekleme moduna geçiliyor...`);
      return {
        success: false,
        status: 'timeout',
        message: 'Master yanıt vermedi, modül bekleme modunda',
        requires_wait: true,
        timeout_ms: response.timeout_ms || timeout
      };
    }

    // Bilinmeyen durum
    return {
      success: false,
      status: response.status,
      message: response.message || 'Bilinmeyen durum'
    };
  } catch (error) {
    console.error(`[ConsultMaster] Hata:`, error.message);
    return {
      success: false,
      error: error.message,
      requires_wait: true
    };
  }
}

/**
 * Master'a alternatif aksiyon önerisi iste
 */
async function requestAlternatives(module, action) {
  return await consultMaster({
    module,
    action,
    alternatives_requested: true
  });
}

/**
 * Onay bekleme durumunu kontrol et
 */
function getPendingConsultations() {
  return Array.from(consultationManager.pendingConsultations.keys());
}

/**
 * Modüle onay yanıtı gönder (master çağırabilir)
 */
function sendApprovalToModule(moduleId, approvalId, approved, alternative = null, message = '') {
  return consultationManager.sendApprovalResponse(approvalId, approved, alternative, message);
}

/**
 * Bağlantıyı başlat
 */
function connect(moduleId) {
  return consultationManager.connect(moduleId);
}

/**
 * Bağlantıyı kapat
 */
function disconnect() {
  return consultationManager.disconnect();
}

/**
 * Bekleme modundaki danışmaları iptal et
 */
function cancelPendingConsultations() {
  for (const [id, consult] of consultationManager.pendingConsultations) {
    clearTimeout(consult.timer);
    consult.resolve({
      success: false,
      status: 'cancelled',
      message: 'Danışma iptal edildi'
    });
  }
  consultationManager.pendingConsultations.clear();
}

module.exports = {
  consultMaster,
  requestAlternatives,
  getPendingConsultations,
  cancelPendingConsultations,
  sendApprovalToModule,
  connect,
  disconnect,
  ConsultationManager
};