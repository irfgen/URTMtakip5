const path = require('path');
const { Sequelize } = require('sequelize');
const dbConfig = require('./src/config/database');

// Use existing sequelize instance
const sequelize = dbConfig.sequelize;

async function runMigration(migrationPath) {
  try {
    console.log(`Running migration: ${migrationPath}`);
    
    // Resolve migration path
    const resolvedPath = path.resolve(process.cwd(), migrationPath);
    const migration = require(resolvedPath);
    
    // Run migration
    await migration.up(sequelize.getQueryInterface(), Sequelize);
    
    console.log(`Migration completed successfully: ${migrationPath}`);
  } catch (error) {
    console.error(`Migration failed: ${error.message}`);
    throw error;
  }
}

async function main() {
  try {
    if (process.argv.length < 3) {
      console.error('Please provide a migration file path');
      process.exit(1);
    }
    
    const migrationPath = process.argv[2];
    
    // Connect to the database
    await sequelize.authenticate();
    console.log('Database connection established');
    
    // Run the migration
    await runMigration(migrationPath);
    
    console.log('Migration process completed');
  } catch (error) {
    console.error('Migration process error:', error);
  } finally {
    // Close db connection
    await sequelize.close();
    console.log('Database connection closed');
  }
}

main();
