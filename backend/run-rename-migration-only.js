const { Sequelize, QueryInterface } = require('sequelize');

// Create Sequelize instance
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: console.log
});

async function runRenameMigration() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    const queryInterface = sequelize.getQueryInterface();

    // Run rename_parca_adi_to_parca_kayit_idleri migration only
    console.log('Running rename_parca_adi_to_parca_kayit_idleri migration...');
    const renameMigration = require('./migrations/20250525_rename_parca_adi_to_parca_kayit_idleri.js');
    await renameMigration.up(queryInterface, Sequelize);
    console.log('✅ parca_adi field renamed to parca_kayit_idleri successfully!');

    console.log('🎉 Column rename migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await sequelize.close();
  }
}

runRenameMigration();
