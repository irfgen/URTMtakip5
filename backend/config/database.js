const { Sequelize } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../database.sqlite'),
  logging: false
});

const initializeDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('SQLite veritabanına başarıyla bağlandı.');
  } catch (error) {
    console.error('Veritabanı bağlantı hatası:', error);
  }
};

module.exports = {
  sequelize,
  initializeDatabase
};
