const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');

// Database configuration
const dbPath = path.join(__dirname, 'database.sqlite');
console.log(`Database file path: ${dbPath}`);

// Create a new Sequelize instance
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: console.log
});

async function updateUretimPlaniTable() {
  try {
    // Start a transaction
    const transaction = await sequelize.transaction();
    
    try {
      console.log('Starting to update uretim_plani table structure...');
      
      // Step 1: Create a backup of the current table
      await sequelize.query(`
        CREATE TABLE uretim_plani_backup AS
        SELECT * FROM uretim_plani
      `, { transaction });
      console.log('Created backup table: uretim_plani_backup');
      
      // Step 2: Create a new table with the desired structure
      await sequelize.query(`
        CREATE TABLE uretim_plani_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          makina_id CHAR(36) REFERENCES makinalar(makina_id), -- Now nullable
          miktar INTEGER NOT NULL DEFAULT 1,
          teslim_tarihi DATETIME NOT NULL,
          durum VARCHAR(255) NOT NULL DEFAULT 'Planlandı',
          aciklama TEXT,
          bom_snapshot JSON,
          kritik_stok_uyarisi JSON,
          ozel_liste_adi VARCHAR(255),
          olusturma_tarihi DATETIME NOT NULL,
          guncelleme_tarihi DATETIME NOT NULL
        )
      `, { transaction });
      console.log('Created new table with updated schema: uretim_plani_new');
      
      // Step 3: Copy data from the original table to the new one
      await sequelize.query(`
        INSERT INTO uretim_plani_new (
          id, makina_id, miktar, teslim_tarihi, durum, aciklama, 
          bom_snapshot, kritik_stok_uyarisi, ozel_liste_adi, 
          olusturma_tarihi, guncelleme_tarihi
        )
        SELECT 
          id, makina_id, miktar, teslim_tarihi, durum, aciklama, 
          bom_snapshot, kritik_stok_uyarisi, ozel_liste_adi, 
          olusturma_tarihi, guncelleme_tarihi
        FROM uretim_plani
      `, { transaction });
      console.log('Copied all data from uretim_plani to uretim_plani_new');
      
      // Step 4: Drop the original table
      await sequelize.query(`DROP TABLE uretim_plani`, { transaction });
      console.log('Dropped original uretim_plani table');
      
      // Step 5: Rename the new table to the original name
      await sequelize.query(`ALTER TABLE uretim_plani_new RENAME TO uretim_plani`, { transaction });
      console.log('Renamed uretim_plani_new to uretim_plani');
      
      // Commit the transaction
      await transaction.commit();
      console.log('Transaction committed successfully');
      console.log('Schema update completed: makina_id is now nullable in uretim_plani table');
      
    } catch (error) {
      // If there's an error, rollback the transaction
      await transaction.rollback();
      console.error('Transaction rolled back due to error:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error updating schema:', error);
  } finally {
    // Close the database connection
    await sequelize.close();
    console.log('Database connection closed');
  }
}

// Run the update function
updateUretimPlaniTable();
