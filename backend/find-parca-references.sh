#!/bin/bash
# find-parca-references.sh - Find all database references to a part
# Usage: ./find-parca-references.sh <parca_kodu>

# Check if part code is provided
if [ -z "$1" ]; then
  echo "Error: No part code provided"
  echo "Usage: ./find-parca-references.sh <parca_kodu>"
  exit 1
fi

PARCA_KODU="$1"
DB_FILE="database.sqlite"

# Check if database file exists
if [ ! -f "$DB_FILE" ]; then
  echo "Error: Database file not found ($DB_FILE)"
  exit 1
fi

echo "=== Searching references for part: $PARCA_KODU ==="
echo ""

# Check is_emirleri table
echo "=== İş Emirleri ==="
sqlite3 "$DB_FILE" "SELECT is_emri_id, is_emri_no, tezgah_id, durum FROM is_emirleri WHERE parca_kodu = '$PARCA_KODU';"
IS_EMIRLERI_COUNT=$(sqlite3 "$DB_FILE" "SELECT COUNT(*) FROM is_emirleri WHERE parca_kodu = '$PARCA_KODU';")
echo "Toplam: $IS_EMIRLERI_COUNT kayıt"
echo ""

# Check fason_is_emirleri table
echo "=== Fason İş Emirleri ==="
sqlite3 "$DB_FILE" "SELECT fason_is_emri_id, durum, verilis_tarihi FROM fason_is_emirleri WHERE parca_kodu = '$PARCA_KODU';"
FASON_IS_EMIRLERI_COUNT=$(sqlite3 "$DB_FILE" "SELECT COUNT(*) FROM fason_is_emirleri WHERE parca_kodu = '$PARCA_KODU';")
echo "Toplam: $FASON_IS_EMIRLERI_COUNT kayıt"
echo ""

# Check fason_teklifler table
echo "=== Fason Teklifler ==="
sqlite3 "$DB_FILE" "SELECT id, tedarikci, teklif_fiyati FROM fason_teklifler WHERE parca_kodu = '$PARCA_KODU';"
FASON_TEKLIFLER_COUNT=$(sqlite3 "$DB_FILE" "SELECT COUNT(*) FROM fason_teklifler WHERE parca_kodu = '$PARCA_KODU';")
echo "Toplam: $FASON_TEKLIFLER_COUNT kayıt"
echo ""

# Check grup_parcalar table
echo "=== Grup İlişkileri ==="
sqlite3 "$DB_FILE" "SELECT gp.id, g.grup_adi FROM grup_parcalar gp JOIN gruplar g ON gp.grup_id = g.grup_id WHERE gp.parca_kodu = '$PARCA_KODU';"
GRUP_PARCALAR_COUNT=$(sqlite3 "$DB_FILE" "SELECT COUNT(*) FROM grup_parcalar WHERE parca_kodu = '$PARCA_KODU';")
echo "Toplam: $GRUP_PARCALAR_COUNT kayıt"
echo ""

# Calculate total
TOTAL=$((IS_EMIRLERI_COUNT + FASON_IS_EMIRLERI_COUNT + FASON_TEKLIFLER_COUNT + GRUP_PARCALAR_COUNT))
echo "=== Toplam $TOTAL referans bulundu ==="
echo ""

# If there are references, show options
if [ $TOTAL -gt 0 ]; then
  echo "Bu parça diğer tablolarda kullanıldığı için doğrudan silinemez."
  echo "Silmek için iki seçenek var:"
  echo "1) İlişkili kayıtları kaldırın (Önerilen)"
  echo "2) Zorla silme işlemi için: node soft-delete-parca.js $PARCA_KODU --force"
  echo ""
else
  echo "Bu parça diğer tablolarda kullanılmıyor ve güvenle silinebilir."
fi
