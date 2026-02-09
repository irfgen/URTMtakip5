const fs = require('fs');
const path = require('path');
const { sequelize } = require('../config/database');

// Veritabanı sıfırlama endpoint'i
const setupDatabaseResetRoute = (app) => {
  // Sadece geliştirme ortamında çalışsın
  if (process.env.NODE_ENV === 'production') {
    return;
  }
  
  // Veritabanını sıfırlama endpoint'i
  app.post('/api/dev/reset-database', async (req, res) => {
    try {
      const dbPath = path.join(__dirname, '../../../database.sqlite');
      
      // Veritabanı bağlantısını kapat
      await sequelize.close();
      console.log('Veritabanı bağlantısı kapatıldı');
      
      // Veritabanı dosyasını sil (varsa)
      if (fs.existsSync(dbPath)) {
        fs.unlinkSync(dbPath);
        console.log('Veritabanı dosyası silindi:', dbPath);
      }
      
      res.json({
        success: true,
        message: 'Veritabanı başarıyla sıfırlandı. Uygulamayı yeniden başlatın.',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Veritabanı sıfırlama hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Veritabanı sıfırlama işlemi başarısız oldu: ' + error.message,
        timestamp: new Date().toISOString()
      });
    }
  });
};

module.exports = { setupDatabaseResetRoute };
