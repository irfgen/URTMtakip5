const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

console.log('Running migration to rename musteri_adi to plan_liste_no and add planlanan_tezgah...');

db.serialize(() => {
  // First, let's create a backup of the table
  db.run(`BEGIN TRANSACTION`, err => {
    if (err) {
      console.error('Transaction begin failed:', err.message);
      return db.run('ROLLBACK');
    }

    // 1. Create a new table with the desired structure
    db.run(`
      CREATE TABLE is_emirleri_new (
        is_emri_id INTEGER PRIMARY KEY,
        is_emri_no VARCHAR(255) NOT NULL UNIQUE,
        is_adi VARCHAR(255) NOT NULL,
        plan_liste_no VARCHAR(255) NOT NULL, -- Renamed from musteri_adi
        adet INTEGER NOT NULL,
        malzeme VARCHAR(255) NOT NULL,
        teslim_tarihi DATETIME NOT NULL,
        oncelik TEXT DEFAULT 'normal',
        durum VARCHAR(255) NOT NULL DEFAULT 'Beklemede',
        aciklama TEXT,
        hareketler JSON DEFAULT '[]',
        olusturma_tarihi DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        guncelleme_tarihi DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        tezgah_id INTEGER,
        uretim_plani_id INTEGER,
        planlanan_tezgah INTEGER -- Added new field
      )`, err => {
      if (err) {
        console.error('Create new table failed:', err.message);
        return db.run('ROLLBACK');
      }
      
      // 2. Copy data from old table to new table
      db.run(`
        INSERT INTO is_emirleri_new (
          is_emri_id, is_emri_no, is_adi, plan_liste_no, adet, 
          malzeme, teslim_tarihi, oncelik, durum, aciklama, 
          hareketler, olusturma_tarihi, guncelleme_tarihi, 
          tezgah_id, uretim_plani_id
        )
        SELECT 
          is_emri_id, is_emri_no, is_adi, musteri_adi, adet, 
          malzeme, teslim_tarihi, oncelik, durum, aciklama, 
          hareketler, olusturma_tarihi, guncelleme_tarihi, 
          tezgah_id, uretim_plani_id
        FROM is_emirleri
      `, err => {
        if (err) {
          console.error('Data migration failed:', err.message);
          return db.run('ROLLBACK');
        }
        
        // 3. Drop old table
        db.run(`DROP TABLE is_emirleri`, err => {
          if (err) {
            console.error('Drop old table failed:', err.message);
            return db.run('ROLLBACK');
          }
          
          // 4. Rename new table to original name
          db.run(`ALTER TABLE is_emirleri_new RENAME TO is_emirleri`, err => {
            if (err) {
              console.error('Rename table failed:', err.message);
              return db.run('ROLLBACK');
            }
            
            // 5. Recreate indexes
            db.run(`CREATE INDEX is_emirleri_uretim_plani_id ON is_emirleri(uretim_plani_id)`, err => {
              if (err) {
                console.error('Index recreation failed:', err.message);
                return db.run('ROLLBACK');
              }
              
              // Commit the transaction if everything was successful
              db.run('COMMIT', err => {
                if (err) {
                  console.error('Commit failed:', err.message);
                  return db.run('ROLLBACK');
                }
                console.log('Migration completed successfully!');
              });
            });
          });
        });
      });
    });
  });
});

// Close the database connection when done
db.on('close', () => {
  console.log('Database connection closed.');
});

// Handle potential errors
process.on('uncaughtException', err => {
  console.error('Uncaught exception:', err);
  db.run('ROLLBACK');
  db.close();
});

// Set a timeout to ensure db is closed eventually
setTimeout(() => {
  db.close();
}, 5000);
