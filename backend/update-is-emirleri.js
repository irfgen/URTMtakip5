const { sequelize } = require('./src/config/database');
const { DataTypes } = require('sequelize');

async function runMigration() {
  try {
    const queryInterface = sequelize.getQueryInterface();
    
    console.log('Checking database structure...');
    
    // Check if the column already exists
    const tableInfo = await sequelize.query(
      "PRAGMA table_info(is_emirleri);",
      { type: sequelize.QueryTypes.SELECT }
    );
    
    const columnExists = tableInfo.some(column => column.name === 'uretim_plani_id');
    
    if (columnExists) {
      console.log('The uretim_plani_id column already exists in the is_emirleri table.');
    } else {
      console.log('Adding uretim_plani_id column to is_emirleri table...');
      
      // Add the column
      await queryInterface.addColumn('is_emirleri', 'uretim_plani_id', {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'uretim_plani',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });
      
      // Add an index
      await queryInterface.addIndex('is_emirleri', ['uretim_plani_id']);
      
      console.log('Migration completed successfully! The uretim_plani_id column has been added.');
    }
  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    await sequelize.close();
  }
}

runMigration();
