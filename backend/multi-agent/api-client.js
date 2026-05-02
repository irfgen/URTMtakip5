/**
 * api-client.js
 * Modül ajanlar için internal API istemcisi
 *
 * Kullanım:
 * const api = require('./api-client');
 * const result = await api.get('/api/is-emirleri');
 * await api.post('/api/stok-kartlari', { stok_adi: 'Yeni Stok' });
 */

const http = require('http');

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

/**
 * HTTP isteği gönder
 * @param {string} method - GET|POST|PUT|DELETE
 * @param {string} endpoint - API endpoint
 * @param {Object} data - Body data (opsiyonel)
 * @param {Object} headers - Ek headerlar (opsiyonel)
 * @returns {Promise<Object>} Yanıt
 */
async function request(method, endpoint, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || 3000,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'X-Module-Agent': 'true',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve({
            status: res.statusCode,
            data: json,
            ok: res.statusCode >= 200 && res.statusCode < 300
          });
        } catch (e) {
          resolve({ status: res.statusCode, data: body, ok: res.statusCode >= 200 && res.statusCode < 300 });
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('API isteği zaman aşımına uğradı'));
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

/**
 * GET isteği
 * @param {string} endpoint - API endpoint
 * @param {Object} params - Query params (opsiyonel)
 * @returns {Promise<Object>}
 */
async function get(endpoint, params = {}) {
  const url = new URL(endpoint, BASE_URL);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });
  return await request('GET', url.pathname + url.search);
}

/**
 * POST isteği
 * @param {string} endpoint - API endpoint
 * @param {Object} data - Body data
 * @returns {Promise<Object>}
 */
async function post(endpoint, data) {
  return await request('POST', endpoint, data);
}

/**
 * PUT isteği
 * @param {string} endpoint - API endpoint
 * @param {Object} data - Body data
 * @returns {Promise<Object>}
 */
async function put(endpoint, data) {
  return await request('PUT', endpoint, data);
}

/**
 * DELETE isteği
 * @param {string} endpoint - API endpoint
 * @returns {Promise<Object>}
 */
async function del(endpoint) {
  return await request('DELETE', endpoint);
}

module.exports = {
  request,
  get,
  post,
  put,
  delete: del,
  BASE_URL
};