const { sequelize } = require('./src/config/database');
const migration = require('./migrations/20250414_create_tamamlanan_isler_table');

async function runMigration() {
  try {
    console.log('Running migration to create tamamlanan_isler table...');
    await migration.up(sequelize.getQueryInterface(), sequelize.Sequelize);
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await sequelize.close();
  }
}

runMigration();
