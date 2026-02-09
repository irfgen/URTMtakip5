#!/bin/bash

# Database file location
DB_FILE="./database.sqlite"

echo "Checking database file at $DB_FILE"
if [ ! -f "$DB_FILE" ]; then
  echo "Error: Database file not found!"
  exit 1
fi

echo "Database file exists, checking tables..."

# Check tables in the database
sqlite3 "$DB_FILE" ".tables"

echo "Finding the most recent record for tezgah_id 99..."

# Get the most recent record ID for tezgah_id 99
LATEST_ID=$(sqlite3 "$DB_FILE" "SELECT id FROM islem_kayitlari WHERE tezgah_id = 99 ORDER BY islem_tarihi DESC LIMIT 1;")

if [ -z "$LATEST_ID" ]; then
  echo "No records found for tezgah_id 99"
  exit 0
fi

echo "Found record ID: $LATEST_ID"

# Show record details
echo "Record details:"
sqlite3 "$DB_FILE" "SELECT * FROM islem_kayitlari WHERE id = $LATEST_ID;"

# Confirm deletion
read -p "Delete this record? (y/n): " CONFIRM
if [ "$CONFIRM" != "y" ]; then
  echo "Operation cancelled"
  exit 0
fi

# Delete the record
sqlite3 "$DB_FILE" "DELETE FROM islem_kayitlari WHERE id = $LATEST_ID;"
echo "Record deleted successfully"
