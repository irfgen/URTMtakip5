const { sequelize } = require('./src/config/database');
const migration = require('./src/migrations/20250701000001-create-notlar-tables');

async function runMigration() {
  try {
    console.log('Running migration to create notlar tables...');
    await migration.up(sequelize.getQueryInterface(), sequelize.Sequelize);
    console.log('Migration completed successfully!');
    console.log('Created tables:');
    console.log('- not_kategorileri');
    console.log('- notlar');
    console.log('- Added indexes for performance');
  } catch (error) {
    console.error('Migration failed:', error);
    
    // Eğer tablo zaten varsa hata durumunu yakala
    if (error.message && error.message.includes('already exists')) {
      console.log('Tables already exist. Migration skipped.');
    } else {
      throw error;
    }
  } finally {
    await sequelize.close();
  }
}

runMigration();
