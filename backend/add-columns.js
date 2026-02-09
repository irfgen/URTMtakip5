const { sequelize } = require('./src/config/database');

async function addColumns() {
  try {
    console.log('Adding otomatik_sevkiyat column...');
    await sequelize.query(`
      ALTER TABLE tedarik_talepleri
      ADD COLUMN otomatik_sevkiyat BOOLEAN DEFAULT 0
    `);
    console.log('✅ otomatik_sevkiyat column added');

    console.log('Adding son_islem_tarihi column...');
    await sequelize.query(`
      ALTER TABLE tedarik_talepleri
      ADD COLUMN son_islem_tarihi DATETIME
    `);
    console.log('✅ son_islem_tarihi column added');

    console.log('✅ All columns added successfully!');
    process.exit(0);
  } catch (error) {
    if (error.message.includes('duplicate column name')) {
      console.log('⚠️  Columns already exist, skipping...');
      process.exit(0);
    }
    console.error('❌ Error adding columns:', error);
    process.exit(1);
  }
}

addColumns();