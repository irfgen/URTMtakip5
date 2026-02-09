const fs = require('fs');
const path = require('path');

// Geliştirme ortamı için yardımcı rotalar
const setupDevHelperRoutes = (app) => {
  // Sadece geliştirme ortamında çalışsın
  if (process.env.NODE_ENV === 'production') {
    return;
  }

  // Sunucu durumunu gösteren endpoint
  app.get('/api/dev/status', (req, res) => {
    const status = {
      uptime: process.uptime(),
      timestamp: Date.now(),
      memoryUsage: process.memoryUsage(),
      nodeVersion: process.version,
      env: process.env.NODE_ENV
    };
    
    res.json(status);
  });

  // Basit bir ping/pong endpoint'i
  app.get('/api/ping', (req, res) => {
    res.json({ message: 'pong', timestamp: new Date().toISOString() });
  });
  
  // Veritabanı durumunu kontrol etmek için endpoint
  app.get('/api/dev/db-status', async (req, res) => {
    try {
      const { sequelize } = require('../config/database');
      const tabloSorgusu = await sequelize.query(
        "SELECT name FROM sqlite_master WHERE type='table';",
        { type: sequelize.QueryTypes.SELECT }
      );
      
      const dbDosyaBilgisi = fs.statSync(path.join(__dirname, '../../../database.sqlite'));
      
      res.json({
        status: 'connected',
        dbSize: `${(dbDosyaBilgisi.size / 1024 / 1024).toFixed(2)} MB`,
        tables: tabloSorgusu.map(t => t.name),
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: error.message,
        timestamp: new Date().toISOString() 
      });
    }
  });
};

module.exports = { setupDevHelperRoutes };
