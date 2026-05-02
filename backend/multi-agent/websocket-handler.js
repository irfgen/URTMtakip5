/**
 * URTMtakip5 Master Agent - WebSocket Handler
 * 
 * Gerçek zamanlı iletişim için WebSocket desteği.
 * Master ajan mesaj gönderebilir, istemciler anlık yanıt alır.
 * 
 * Kullanım:
 *   const { setupWebSocket } = require('./websocket-handler');
 *   setupWebSocket(server);
 */

const { WebSocketServer } = require('ws');

let wss;
let clients = new Set();

// Mesaj broadcast et
function broadcast(message, excludeClient) {
  const data = JSON.stringify(message);
  clients.forEach(client => {
    if (client !== excludeClient && client.readyState === 1) {
      client.send(data);
    }
  });
}

// Tüm istemcilere gönder
function sendToAll(message) {
  broadcast(message, null);
}

// Belirli istemciye gönder
function sendTo(client, message) {
  if (client.readyState === 1) {
    client.send(JSON.stringify(message));
  }
}

// WebSocket kurulumu
function setupWebSocket(server) {
  wss = new WebSocketServer({ server });

  wss.on('connection', (ws, req) => {
    console.log('WebSocket client connected');
    clients.add(ws);

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data);
        console.log('WS message received:', message.type);

        // Mesajları işle
        const response = await handleMessage(message);
        if (response) {
          sendTo(ws, response);
        }
      } catch (e) {
        console.error('WS message error:', e.message);
        sendTo(ws, { type: 'error', error: e.message });
      }
    });

    ws.on('close', () => {
      console.log('WebSocket client disconnected');
      clients.delete(ws);
    });

    ws.on('error', (err) => {
      console.error('WebSocket error:', err.message);
      clients.delete(ws);
    });

    // Hoş geldin mesajı
    sendTo(ws, {
      type: 'connected',
      message: 'Master Agent WebSocket\'e bağlandı',
      timestamp: new Date().toISOString()
    });
  });

  console.log('WebSocket server initialized');
  return wss;
}

// Mesaj işleyici
async function handleMessage(message) {
  const { MasterAgent } = require('./master-agent');
  const master = new MasterAgent();
  await master.initialize();

  switch (message.type) {
    case 'ping':
      return { type: 'pong', timestamp: new Date().toISOString() };

    case 'status':
      return {
        type: 'status',
        status: master.status,
        moduleCount: master.agents.size
      };

    case 'task':
      if (!message.task) {
        return { type: 'error', error: 'Gorev belirtilmedi' };
      }
      console.log('WS Task:', message.task.substring(0, 50));
      const result = await master.masterTask(message.task);
      return { type: 'result', result: result };

    case 'delegate':
      if (!message.task) {
        return { type: 'error', error: 'Gorev belirtilmedi' };
      }
      console.log('WS Delegate:', message.task.substring(0, 50));
      const results = await master.delegateTask(message.task, message.modules);
      return { type: 'delegate_result', results: results };

    case 'find':
      const found = master.findModule(message.query || '');
      return { type: 'find_result', results: found };

    default:
      return { type: 'error', error: 'Bilinmeyen mesaj tipi: ' + message.type };
  }
}

module.exports = {
  setupWebSocket,
  broadcast,
  sendToAll,
  sendTo,
  clients: {
    get count() { return clients.size; }
  }
};