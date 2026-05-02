/**
 * URTMtakip5 Master Agent - WebSocket Client
 * 
 * Tarayıcı veya Node.js'ten WebSocket ile bağlan.
 * 
 * Kullanım:
 *   node websocket-client.js
 *   
 * Tarayıcıda:
 *   const ws = new WebSocket('ws://localhost:3001');
 */

const WebSocket = require('ws');

const WS_URL = process.env.WS_URL || 'ws://localhost:3001';

class MasterAgentClient {
  constructor(url) {
    this.url = url;
    this.ws = null;
    this.callbacks = new Map();
    this.messageId = 0;
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.url);
      
      this.ws.on('open', () => {
        console.log('WS Connected to Master Agent');
        resolve();
      });
      
      this.ws.on('message', (data) => {
        try {
          const msg = JSON.parse(data);
          this.handleMessage(msg);
        } catch (e) {
          console.error('Parse error:', e.message);
        }
      });
      
      this.ws.on('error', (err) => {
        console.error('WS Error:', err.message);
        reject(err);
      });
      
      this.ws.on('close', () => {
        console.log('WS Disconnected');
      });
    });
  }

  handleMessage(msg) {
    // Callback varsa çağır
    if (msg.id && this.callbacks.has(msg.id)) {
      const { resolve, reject, timeout } = this.callbacks.get(msg.id);
      clearTimeout(timeout);
      resolve(msg);
      this.callbacks.delete(msg.id);
    }
    
    // Event listeners
    if (msg.type === 'connected') {
      console.log('Master Agent mesaj:', msg.message);
    }
  }

  send(type, data, timeoutMs = 30000) {
    return new Promise((resolve, reject) => {
      const id = ++this.messageId;
      const msg = { type, id, ...data };
      
      const timeout = setTimeout(() => {
        if (this.callbacks.has(id)) {
          this.callbacks.delete(id);
          reject(new Error('Timeout'));
        }
      }, timeoutMs);
      
      this.callbacks.set(id, { resolve, reject, timeout });
      this.ws.send(JSON.stringify(msg));
    });
  }

  // API fonksiyonları
  async ping() {
    return this.send('ping');
  }

  async status() {
    return this.send('status');
  }

  async task(gorev) {
    return this.send('task', { task: gorev });
  }

  async delegate(gorev, modules) {
    return this.send('delegate', { task: gorev, modules });
  }

  async find(query) {
    return this.send('find', { query });
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

// CLI
if (require.main === module) {
  const args = process.argv.slice(2);
  
  async function main() {
    console.log('WebSocket\'e bağlanılıyor...');
    const client = new MasterAgentClient(WS_URL);
    
    try {
      await client.connect();
      console.log('');
      
      // Status sorgula
      console.log('1. Durum sorgulanıyor...');
      const status = await client.status();
      console.log('Status:', status);
      console.log('');
      
      // Ping
      console.log('2. Ping gönderiliyor...');
      const pong = await client.ping();
      console.log('Pong:', pong);
      console.log('');
      
      // Test görev
      if (args.includes('--task') || args.length === 0) {
        console.log('3. Test görevi gönderiliyor...');
        const result = await client.task('Is Emirleri modulu ne ise yariyor? Turkce 2 cumle.');
        console.log('Task Result:', result.result || result.error);
        console.log('');
      }
      
      console.log('Test tamamlandı!');
      client.disconnect();
      process.exit(0);
    } catch (e) {
      console.error('Test hatası:', e.message);
      client.disconnect();
      process.exit(1);
    }
  }
  
  main();
}

module.exports = MasterAgentClient;