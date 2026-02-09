/**
 * Script to update plan_liste_no in is_emirleri table
 * Sets plan_liste_no to contain the production plan ID.
 * A value of 0 indicates the work order isn't part of any production plan.
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, 'database.sqlite');

// Open database connection
console.log('Opening database at:', dbPath);
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
  console.log('Connected to the database.');
});

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON', (err) => {
  if (err) {
    console.error('Error enabling foreign keys:', err.message);
    process.exit(1);
  }
});

// Start transaction
db.serialize(() => {
  db.run('BEGIN TRANSACTION', (err) => {
    if (err) {
      console.error('Error starting transaction:', err.message);
      return db.run('ROLLBACK');
    }
    
    console.log('Starting update of plan_liste_no field...');

    // Step 1: Update any null, empty or 'null' values to '0'
    db.run(`
      UPDATE is_emirleri 
      SET plan_liste_no = '0' 
      WHERE plan_liste_no IS NULL OR plan_liste_no = '' OR plan_liste_no = 'null'
    `, function(err) {
      if (err) {
        console.error('Error updating null values:', err.message);
        return db.run('ROLLBACK');
      }
      console.log(`Updated ${this.changes} records with null/empty values.`);

      // Step 2: Update non-numeric values to '0'
      db.run(`
        UPDATE is_emirleri
        SET plan_liste_no = '0'
        WHERE typeof(plan_liste_no) != 'integer' AND plan_liste_no != '0'
      `, function(err) {
        if (err) {
          console.error('Error updating non-numeric values:', err.message);
          return db.run('ROLLBACK');
        }
        console.log(`Updated ${this.changes} records with non-numeric values.`);

        // Step 3: Update uretim_plani_id with values from plan_liste_no
        db.run(`
          UPDATE is_emirleri
          SET uretim_plani_id = CAST(plan_liste_no AS INTEGER)
          WHERE plan_liste_no != '0'
        `, function(err) {
          if (err) {
            console.error('Error updating uretim_plani_id:', err.message);
            return db.run('ROLLBACK');
          }
          console.log(`Updated ${this.changes} records with valid production plan IDs.`);

          // Step 4: Set uretim_plani_id to NULL where plan_liste_no is '0'
          db.run(`
            UPDATE is_emirleri
            SET uretim_plani_id = NULL
            WHERE plan_liste_no = '0'
          `, function(err) {
            if (err) {
              console.error('Error setting null uretim_plani_id:', err.message);
              return db.run('ROLLBACK');
            }
            console.log(`Updated ${this.changes} records to have NULL uretim_plani_id.`);

            // Step 5: Commit transaction
            db.run('COMMIT', function(err) {
              if (err) {
                console.error('Error committing transaction:', err.message);
                return db.run('ROLLBACK');
              }
              console.log('All updates completed successfully.');
              
              // Close the database connection
              db.close((err) => {
                if (err) {
                  console.error('Error closing database:', err.message);
                } else {
                  console.log('Database connection closed.');
                }
              });
            });
          });
        });
      });
    });
  });
});
