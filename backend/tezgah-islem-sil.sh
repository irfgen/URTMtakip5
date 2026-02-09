#!/bin/bash

# Database file location
DB_FILE="./database.sqlite"

echo "Checking database file at $DB_FILE"
if [ ! -f "$DB_FILE" ]; then
  echo "Error: Database file not found!"
  exit 1
fi

echo "--------------------------------"
echo "Listing all CNC machines (tezgahlar):"
echo "--------------------------------"
sqlite3 "$DB_FILE" "SELECT tezgah_id, tezgah_tanimi FROM tezgahlar;"

echo "--------------------------------"
echo "Enter tezgah_id to delete its last process record:"
read TEZGAH_ID

if [ -z "$TEZGAH_ID" ]; then
  echo "Operation cancelled"
  exit 0
fi

# Validate tezgah_id
if ! [[ "$TEZGAH_ID" =~ ^[0-9]+$ ]]; then
  echo "Error: tezgah_id must be a number"
  exit 1
fi

# Check if tezgah exists
TEZGAH_EXISTS=$(sqlite3 "$DB_FILE" "SELECT COUNT(*) FROM tezgahlar WHERE tezgah_id = $TEZGAH_ID;")
if [ "$TEZGAH_EXISTS" -eq 0 ]; then
  echo "Error: No tezgah found with ID $TEZGAH_ID"
  exit 1
fi

echo "--------------------------------"
echo "Getting process records for tezgah_id $TEZGAH_ID..."
echo "--------------------------------"
RECORD_COUNT=$(sqlite3 "$DB_FILE" "SELECT COUNT(*) FROM islem_kayitlari WHERE tezgah_id = $TEZGAH_ID;")
echo "Found $RECORD_COUNT records."

if [ "$RECORD_COUNT" -eq 0 ]; then
  echo "No process records found for this tezgah."
  exit 0
fi

# Get the most recent record ID
LATEST_ID=$(sqlite3 "$DB_FILE" "SELECT id FROM islem_kayitlari WHERE tezgah_id = $TEZGAH_ID ORDER BY islem_tarihi DESC LIMIT 1;")

echo "--------------------------------"
echo "Latest record details (ID: $LATEST_ID):"
echo "--------------------------------"
sqlite3 "$DB_FILE" ".mode column" ".headers on" "SELECT id, is_emri_no, islem_tipi, tezgah_id, islem_tarihi, islenen_adet, aciklama FROM islem_kayitlari WHERE id = $LATEST_ID;"

# Confirm deletion
echo "--------------------------------"
read -p "Delete this record? (y/n): " CONFIRM
if [ "$CONFIRM" != "y" ]; then
  echo "Operation cancelled"
  exit 0
fi

# Delete the record
sqlite3 "$DB_FILE" "DELETE FROM islem_kayitlari WHERE id = $LATEST_ID;"
echo "Record deleted successfully"
