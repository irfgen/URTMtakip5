const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

console.log('Running migration to add uretim_plani_id to is_emirleri table...');

db.serialize(() => {
  // Add the uretim_plani_id column
  db.run(`ALTER TABLE is_emirleri ADD COLUMN uretim_plani_id INTEGER REFERENCES uretim_plani(id) 
         ON DELETE SET NULL ON UPDATE CASCADE`, function(err) {
    if (err) {
      console.error('Migration failed:', err.message);
    } else {
      console.log('Column added successfully!');
    }
  });
  
  // Create an index for better performance
  db.run(`CREATE INDEX idx_is_emirleri_uretim_plani_id ON is_emirleri(uretim_plani_id)`, function(err) {
    if (err) {
      console.error('Index creation failed:', err.message);
    } else {
      console.log('Index created successfully!');
    }
  });
});

// Close the database connection
db.close((err) => {
  if (err) {
    console.error('Error closing database:', err.message);
  } else {
    console.log('Database connection closed.');
  }
});
