#!/bin/bash

echo "Starting database schema update for uretim_plani table..."

# Go to the backend directory
cd "$(dirname "$0")"

# Define the database file path
DB_FILE="database.sqlite"

# Check if the database file exists
if [ ! -f "$DB_FILE" ]; then
    echo "Error: Database file $DB_FILE not found!"
    exit 1
fi

# Create SQL commands to update the schema
cat > update_schema.sql << EOF
-- Create a backup of the current table
BEGIN TRANSACTION;

-- Create a new table with the updated schema (makina_id is nullable)
CREATE TABLE uretim_plani_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    makina_id CHAR(36), -- Removed NOT NULL constraint
    miktar INTEGER NOT NULL DEFAULT 1,
    teslim_tarihi DATETIME NOT NULL,
    durum VARCHAR(255) NOT NULL DEFAULT 'Planlandı',
    aciklama TEXT,
    bom_snapshot JSON,
    kritik_stok_uyarisi JSON,
    ozel_liste_adi VARCHAR(255),
    olusturma_tarihi DATETIME NOT NULL,
    guncelleme_tarihi DATETIME NOT NULL
);

-- Copy data from the old table to the new one
INSERT INTO uretim_plani_new 
SELECT id, makina_id, miktar, teslim_tarihi, durum, aciklama, 
       bom_snapshot, kritik_stok_uyarisi, ozel_liste_adi, 
       olusturma_tarihi, guncelleme_tarihi 
FROM uretim_plani;

-- Drop the old table
DROP TABLE uretim_plani;

-- Rename the new table to the original name
ALTER TABLE uretim_plani_new RENAME TO uretim_plani;

COMMIT;
EOF

# Execute the SQL commands
echo "Executing SQL commands to update the schema..."
sqlite3 "$DB_FILE" < update_schema.sql

# Check if the operation was successful
if [ $? -eq 0 ]; then
    echo "Success: Updated uretim_plani table schema - makina_id is now nullable!"
    
    # Verify the change
    echo "Verifying the change:"
    sqlite3 "$DB_FILE" "PRAGMA table_info(uretim_plani);"
else
    echo "Error: Failed to update the schema!"
    exit 1
fi

echo "Schema update completed."
