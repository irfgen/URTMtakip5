/**
 * URTMtakip5 Master Agent - REST API Server
 * 
 * Master ajanı HTTP üzerinden erişilebilir hale getirir.
 * 
 * GET  /api/master/status          - Sistem durumu
 * POST /api/master/task           - Görev gönder
 * POST /api/master/delegate        - Modüllere dağıt
 * GET  /api/master/modules         - Modül listesi
 * GET  /api/master/modules/:id     - Belirli modül
 * WS   /                          - WebSocket (opsiyonel)
 */

const express = require('express');
const http = require('http');
const { MasterAgent } = require('./master-agent');
const { setupWebSocket } = require('./websocket-handler');

const app = express();
const server = http.createServer(app);

// Middleware
app.use(express.json());

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Master Agent instance
let master;
let masterReady = false;

// Initialize master agent
async function initMaster() {
  if (!master) {
    master = new MasterAgent();
    await master.initialize();
    masterReady = true;
    console.log('Master Agent initialized and ready');
  }
}

// Routes
app.get('/api/master/status', async (req, res) => {
  try {
    await initMaster();
    res.json({
      success: true,
      status: master.status,
      moduleCount: master.agents.size,
      ready: masterReady
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/master/modules', async (req, res) => {
  try {
    await initMaster();
    const modules = [];
    for (var id in master.agents) {
      var agent = master.agents[id];
      modules.push({ id: id, name: agent.name, status: agent.status });
    }
    res.json({ success: true, modules: modules });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/master/modules/:id', async (req, res) => {
  try {
    await initMaster();
    const id = req.params.id;
    const agent = master.agents.get(id);
    if (!agent) {
      return res.status(404).json({ success: false, error: 'Modul bulunamadi' });
    }
    res.json({ success: true, module: { id: id, name: agent.name, doc: agent.doc } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/master/task', async (req, res) => {
  try {
    await initMaster();
    const { task, options } = req.body;
    if (!task) {
      return res.status(400).json({ success: false, error: 'Gorev belirtilmedi' });
    }
    
    console.log('\nAPI Gorev aldi:', task.substring(0, 100));
    
    const result = await master.masterTask(task, options);
    res.json({ success: true, result: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/master/delegate', async (req, res) => {
  try {
    await initMaster();
    const { task, modules } = req.body;
    if (!task) {
      return res.status(400).json({ success: false, error: 'Gorev belirtilmedi' });
    }
    
    console.log('\nAPI Delegate gorev:', task.substring(0, 100));
    
    const results = await master.delegateTask(task, modules);
    res.json({ success: true, results: results });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/master/find', async (req, res) => {
  try {
    await initMaster();
    const query = req.query.q || '';
    const results = master.findModule(query);
    res.json({ success: true, results: results });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log('========================================');
  console.log('   URTMtakip5 Master Agent API');
  console.log('========================================');
  console.log('Port: ' + PORT);
  console.log('URL: http://localhost:' + PORT);
  console.log('');
  console.log('Endpoints:');
  console.log('  GET  /api/master/status');
  console.log('  GET  /api/master/modules');
  console.log('  GET  /api/master/modules/:id');
  console.log('  POST /api/master/task');
  console.log('  POST /api/master/delegate');
  console.log('  GET  /api/master/find?q=query');
  console.log('');
  
  // Initialize master agent
  initMaster();
});

// WebSocket kurulumu
setupWebSocket(server);

module.exports = { app, server };