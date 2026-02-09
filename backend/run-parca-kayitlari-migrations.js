const { Sequelize, QueryInterface } = require('sequelize');
const path = require('path');

// Create Sequelize instance
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: console.log
});

async function runMigrations() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    const queryInterface = sequelize.getQueryInterface();

    // Run create_parca_kayitlari_table migration
    console.log('Running create_parca_kayitlari_table migration...');
    const createTableMigration = require('./migrations/20250525_create_parca_kayitlari_table.js');
    await createTableMigration.up(queryInterface, Sequelize);
    console.log('✅ parca_kayitlari table created successfully!');

    // Run rename_parca_adi_to_parca_kayit_idleri migration
    console.log('Running rename_parca_adi_to_parca_kayit_idleri migration...');
    const renameMigration = require('./migrations/20250525_rename_parca_adi_to_parca_kayit_idleri.js');
    await renameMigration.up(queryInterface, Sequelize);
    console.log('✅ parca_adi field renamed to parca_kayit_idleri successfully!');

    console.log('🎉 All migrations completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await sequelize.close();
  }
}

runMigrations();
