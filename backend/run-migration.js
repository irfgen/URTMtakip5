const { sequelize } = require('./src/config/database');
const migration = require('./migrations/20250410_add_uretim_plani_to_is_emirleri');

async function runMigration() {
  try {
    console.log('Running migration to add uretim_plani_id column...');
    await migration.up(sequelize.getQueryInterface(), sequelize.Sequelize);
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await sequelize.close();
  }
}

runMigration();
