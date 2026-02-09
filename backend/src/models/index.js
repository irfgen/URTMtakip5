const fs = require('fs');
const path = require('path');
const { sequelize } = require('../config/database');
const { Model } = require('sequelize');

const db = {};

// Modelleri yükle
fs.readdirSync(__dirname)
  .filter(file => file !== 'index.js' && file.endsWith('.js'))
  .forEach(file => {
    const fullPath = path.join(__dirname, file);
    // Hem ES6 class hem de sequelize.define ile oluşturulan modelleri destekle
    try {
      // Boş dosyayı atla
      const stat = fs.statSync(fullPath);
      if (stat.size === 0) {
        console.warn(`Boş model dosyası atlandı: ${file}`);
        return;
      }

      let loaded = require(fullPath);

      // ES6 class extends Model ise
      if (loaded && loaded.prototype instanceof Model) {
        db[loaded.name] = loaded;
        return;
      }

      // Factory (sequelize, DataTypes) fonksiyonu ise çağırmayı dene
      if (typeof loaded === 'function') {
        const { DataTypes } = require('sequelize');
        const maybeModel = loaded(sequelize, DataTypes);
        if (maybeModel && maybeModel.prototype instanceof Model) {
          db[maybeModel.name] = maybeModel;
          return;
        }
      }

      // sequelize.define sonucu (Model instance) veya isimli obje ise
      if (loaded && loaded.name && loaded.prototype && loaded.prototype instanceof Model) {
        db[loaded.name] = loaded;
        return;
      }

      console.warn(`Tanınmayan model formatı: ${file}`);
    } catch (e) {
      console.warn(`Model yüklenirken hata (${file}):`, e.message);
    }
  });

// İlişkileri kur
Object.keys(db).forEach(modelName => {
  if (typeof db[modelName].associate === 'function') {
    db[modelName].associate(db);
    console.log(`${modelName} ilişkileri kuruldu.`);
  }
});

db.sequelize = sequelize;
db.Sequelize = require('sequelize');

module.exports = db;