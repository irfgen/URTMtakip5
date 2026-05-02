/**
 * URTMtakip5 Master Agent - Client
 * 
 * API server'a kolayca erişim için basit client.
 * 
 * Kullanım:
 *   const client = require('./client');
 *   
 *   // Durum kontrolü
 *   const status = await client.getStatus();
 *   
 *   // Görev gönder
 *   const result = await client.sendTask('sistem analizi yap');
 *   
 *   // Modülara
 *   const modules = await client.findModules('stok');
 */

const http = require('http');

const BASE_URL = process.env.MASTER_API_URL || 'http://localhost:3001';

// Basit HTTP isteği
function request(method, path, data) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
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
          resolve(body);
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

// Client fonksiyonları
const client = {
  // Sistem durumu
  async getStatus() {
    return request('GET', '/api/master/status');
  },

  // Modül listesi
  async getModules() {
    return request('GET', '/api/master/modules');
  },

  // Belirli modül
  async getModule(id) {
    return request('GET', '/api/master/modules/' + id);
  },

  // Master ajana görev gönder
  async sendTask(task, options) {
    return request('POST', '/api/master/task', { task, options });
  },

  // Görevi tüm modüllere dağıt
  async delegate(task, modules) {
    return request('POST', '/api/master/delegate', { task, modules });
  },

  // Modül ara
  async findModules(query) {
    return request('GET', '/api/master/find?q=' + encodeURIComponent(query));
  },

  // Health check
  async ping() {
    return request('GET', '/health');
  }
};

// CLI desteği
if (require.main === module) {
  const args = process.argv.slice(2);
  
  async function main() {
    if (args.length === 0) {
      console.log('Kullanim: node client.js <komut> [argumanlar]');
      console.log('');
      console.log('Komutlar:');
      console.log('  status           - Sistem durumu');
      console.log('  modules          - Modul listesi');
      console.log('  task <gorev>     - Gorev gonder');
      console.log('  delegate <gorev> - Dagit');
      console.log('  find <query>     - Modul ara');
      console.log('  ping             - Health check');
      return;
    }

    const cmd = args[0];
    
    try {
      switch (cmd) {
        case 'status':
          console.log(await client.getStatus());
          break;
        case 'modules':
          console.log(await client.getModules());
          break;
        case 'task':
          if (args.length < 2) {
            console.log('Gorev belirtilmedi');
            return;
          }
          console.log(await client.sendTask(args.slice(1).join(' ')));
          break;
        case 'delegate':
          if (args.length < 2) {
            console.log('Gorev belirtilmedi');
            return;
          }
          console.log(await client.delegate(args.slice(1).join(' ')));
          break;
        case 'find':
          if (args.length < 2) {
            console.log('Arama terimi belirtilmedi');
            return;
          }
          console.log(await client.findModules(args[1]));
          break;
        case 'ping':
          console.log(await client.ping());
          break;
        default:
          console.log('Bilinmeyen komut:', cmd);
      }
    } catch (e) {
      console.error('Hata:', e.message);
    }
  }
  
  main();
}

module.exports = client;