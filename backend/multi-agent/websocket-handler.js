/**
 * URTMtakip5 Master Agent - WebSocket Handler
 *
 * Gerçek zamanlı iletişim için WebSocket desteği.
 * Master ajan mesaj gönderebilir, istemciler anlık yanıt alır.
 * Ayrıca modülden gelen onay taleplerini master'a iletir.
 *
 * Kullanım:
 *   const { setupWebSocket } = require('./websocket-handler');
 *   setupWebSocket(server);
 */

const { WebSocketServer } = require('ws');

let wss;
let clients = new Map(); // clientId -> { ws, moduleId }
let pendingApprovals = new Map(); // approvalId -> { moduleId, action, context, resolve, reject, timeout }
let clientCounter = 0;

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

// Mesaj broadcast et
function broadcast(message, excludeClientId) {
  const data = JSON.stringify(message);
  clients.forEach((client, clientId) => {
    if (clientId !== excludeClientId && client.ws.readyState === 1) {
      client.ws.send(data);
    }
  });
}

// Tüm istemcilere gönder
function sendToAll(message) {
  broadcast(message, null);
}

// Belirli istemciye gönder
function sendTo(clientId, message) {
  const client = clients.get(clientId);
  if (client && client.ws.readyState === 1) {
    client.ws.send(JSON.stringify(message));
  }
}

// Belirli module ID'ye gönder
function sendToModule(moduleId, message) {
  const data = JSON.stringify(message);
  clients.forEach((client, clientId) => {
    if (client.moduleId === moduleId && client.ws.readyState === 1) {
      client.ws.send(data);
    }
  });
}

/**
 * Onay talebini bir modüle gönder ve yanıtı bekle
 * @param {string} moduleId - Hedef modül
 * @param {string} action - Aksiyon adı
 * @param {Object} context - Bağlam
 * @param {number} timeoutMs - Timeout süresi (ms)
 * @returns {Promise<Object>} Onay sonucu
 */
function sendApprovalRequest(moduleId, action, context, timeoutMs) {
  return new Promise((resolve, reject) => {
    const approvalId = generateId();
    const timeout = setTimeout(() => {
      pendingApprovals.delete(approvalId);
      resolve({
        approved: false,
        status: 'timeout',
        message: 'Master yanıt vermedi, modül bekleme modunda'
      });
    }, timeoutMs || 30000);

    pendingApprovals.set(approvalId, {
      moduleId,
      action,
      context,
      resolve,
      reject,
      timeout
    });

    sendToModule(moduleId, {
      type: 'approval_request',
      approvalId,
      action,
      context,
      timeoutMs: timeoutMs || 30000
    });

    console.log(`[WS] Onay talebi gönderildi: ${approvalId} -> ${moduleId}/${action}`);
  });
}

/**
 * Onay yanıtını işle
 */
function handleApprovalResponse(approvalId, response) {
  const pending = pendingApprovals.get(approvalId);
  if (!pending) {
    console.log(`[WS] Onay talebi bulunamadı: ${approvalId}`);
    return false;
  }

  clearTimeout(pending.timeout);
  pendingApprovals.delete(approvalId);
  pending.resolve(response);
  return true;
}

/**
 * Onay talebini iptal et
 */
function cancelApproval(approvalId) {
  const pending = pendingApprovals.get(approvalId);
  if (pending) {
    clearTimeout(pending.timeout);
    pendingApprovals.delete(approvalId);
    pending.resolve({ approved: false, status: 'cancelled', message: 'Talep iptal edildi' });
  }
}

// WebSocket kurulumu
function setupWebSocket(server) {
  wss = new WebSocketServer({ server });

  wss.on('connection', (ws, req) => {
    const clientId = 'client-' + (++clientCounter);
    const remoteIp = req.socket.remoteAddress;
    console.log(`[WS] İstemci bağlandı: ${clientId} (${remoteIp})`);
    clients.set(clientId, { ws, moduleId: null });

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data);
        console.log(`[WS] Mesaj alındı [${clientId}]: ${message.type}`);

        // Modül kimliğini kaydet
        if (message.type === 'register' && message.moduleId) {
          const client = clients.get(clientId);
          if (client) {
            client.moduleId = message.moduleId;
            console.log(`[WS] ${clientId} -> modül olarak kaydedildi: ${message.moduleId}`);
          }
        }

        // Onay yanıtını işle
        if (message.type === 'approval_response') {
          handleApprovalResponse(message.approvalId, {
            approved: message.approved,
            alternative: message.alternative,
            message: message.message
          });
        }

        // Diğer mesajları işle
        const response = await handleMessage(message);
        if (response) {
          sendTo(clientId, response);
        }
      } catch (e) {
        console.error(`[WS] Mesaj hatası: ${e.message}`);
        sendTo(clientId, { type: 'error', error: e.message });
      }
    });

    ws.on('close', () => {
      console.log(`[WS] İstemci ayrıldı: ${clientId}`);
      // Bu istemcinin bekleyen onay taleplerini iptal et
      pendingApprovals.forEach((pending, approvalId) => {
        const client = clients.get(clientId);
        if (client && client.moduleId === pending.moduleId) {
          cancelApproval(approvalId);
        }
      });
      clients.delete(clientId);
    });

    ws.on('error', (err) => {
      console.error(`[WS] Hata [${clientId}]: ${err.message}`);
      clients.delete(clientId);
    });

    // Hoş geldin mesajı
    sendTo(clientId, {
      type: 'connected',
      clientId,
      message: 'Master Agent WebSocket\'e bağlandı',
      timestamp: new Date().toISOString()
    });
  });

  console.log('[WS] WebSocket sunucusu başlatıldı');
  return wss;
}

// Mesaj işleyici
async function handleMessage(message) {
  // Lazy load to avoid circular deps
  let MasterAgent;
  try {
    ({ MasterAgent } = require('./master-agent'));
  } catch (e) {
    return { type: 'error', error: 'Master agent yüklenemedi: ' + e.message };
  }

  const master = new MasterAgent();
  await master.initialize();

  switch (message.type) {
    case 'ping':
      return { type: 'pong', timestamp: new Date().toISOString() };

    case 'status':
      return {
        type: 'status',
        status: master.status,
        moduleCount: master.agents.size,
        pendingApprovals: pendingApprovals.size
      };

    case 'task':
      if (!message.task) {
        return { type: 'error', error: 'Gorev belirtilmedi' };
      }
      console.log(`[WS] Görev: ${message.task.substring(0, 50)}...`);
      const result = await master.masterTask(message.task);
      return { type: 'result', result };

    case 'delegate':
      if (!message.task) {
        return { type: 'error', error: 'Gorev belirtilmedi' };
      }
      console.log(`[WS] Delegasyon: ${message.task.substring(0, 50)}...`);
      const results = await master.delegateTask(message.task, message.modules);
      return { type: 'delegate_result', results };

    case 'find':
      const found = master.findModule(message.query || '');
      return { type: 'find_result', results: found };

    // Onay talebi master'dan geldi (API üzerinden)
    case 'master_approval_request':
      // Bu mesaj tipi api-server.js'den gelir
      // Onayı moduleId'ye gönder ve yanıtı döndür
      return null; // Asenkron işlem, handleApprovalResponse ile yanıtlanacak

    default:
      return { type: 'error', error: 'Bilinmeyen mesaj tipi: ' + message.type };
  }
}

module.exports = {
  setupWebSocket,
  broadcast,
  sendToAll,
  sendTo,
  sendToModule,
  sendApprovalRequest,
  handleApprovalResponse,
  cancelApproval,
  clients: {
    get count() { return clients.size; }
  },
  pendingApprovals: {
    get size() { return pendingApprovals.size; }
  }
};