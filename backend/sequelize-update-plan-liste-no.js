/**
 * Script to update plan_liste_no in is_emirleri table
 * This script uses Sequelize ORM to ensure proper updating of values
 */

const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');
const fs = require('fs');

// Database path
const dbPath = path.join(__dirname, 'database.sqlite');
console.log('Database path:', dbPath);
console.log('Database exists:', fs.existsSync(dbPath));

// Initialize Sequelize
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: console.log
});

// Define IsEmirleri model
const IsEmirleri = sequelize.define('is_emirleri', {
  is_emri_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  is_emri_no: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  plan_liste_no: {
    type: DataTypes.STRING,
    allowNull: false
  },
  uretim_plani_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  tableName: 'is_emirleri',
  timestamps: false
});

// Define UretimPlani model
const UretimPlani = sequelize.define('uretim_plani', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  }
}, {
  tableName: 'uretim_plani',
  timestamps: false
});

async function updatePlanListeNo() {
  try {
    // Test connection
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
    
    // Start transaction
    const t = await sequelize.transaction();
    
    try {
      // Get all work orders
      const workOrders = await IsEmirleri.findAll({ transaction: t });
      console.log(`Found ${workOrders.length} work orders`);
      
      // Update each work order
      let updated = 0;
      for (const workOrder of workOrders) {
        const currentValue = workOrder.plan_liste_no;
        
        // Skip if already a valid number or '0'
        if (!isNaN(currentValue) && (currentValue === '0' || parseInt(currentValue) > 0)) {
          continue;
        }
        
        // Set to '0' if it's not a valid production plan ID
        workOrder.plan_liste_no = '0';
        
        // Update uretim_plani_id to null
        workOrder.uretim_plani_id = null;
        
        await workOrder.save({ transaction: t });
        updated++;
      }
      
      console.log(`Updated ${updated} work orders`);
      
      // Commit the transaction
      await t.commit();
      console.log('Transaction committed successfully');
    } catch (error) {
      // Rollback transaction in case of error
      await t.rollback();
      console.error('Transaction rolled back due to error:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error updating plan_liste_no:', error);
  } finally {
    // Close the connection
    await sequelize.close();
    console.log('Database connection closed');
  }
}

// Run the update function
updatePlanListeNo();
