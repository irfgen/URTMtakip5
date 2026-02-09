#!/bin/bash

OLD_DB="/home/irgat12/URTMtakip/backend/database_eski.sqlite"
NEW_DB="/home/irgat12/URTMtakip/backend/database.sqlite"
OUTPUT_SQL="/home/irgat12/URTMtakip/backend/migration_schema.sql"

echo "-- Migration Script: Eski DB'ye yeni yapının uygulanması" > "$OUTPUT_SQL"
echo "-- Oluşturulma: $(date)" >> "$OUTPUT_SQL"
echo "" >> "$OUTPUT_SQL"

# Yeni tablolar için SQL komutları
echo "-- ==============================================" >> "$OUTPUT_SQL"
echo "-- 1. YENİ EKLENEN TABLOLAR" >> "$OUTPUT_SQL"
echo "-- ==============================================" >> "$OUTPUT_SQL"
echo "" >> "$OUTPUT_SQL"

# Tablo isimlerini al
NEW_TABLES=$(sqlite3 "$NEW_DB" ".tables" | tr ' ' '\n' | sort)
OLD_TABLES=$(sqlite3 "$OLD_DB" ".tables" | tr ' ' '\n' | sort)

# Yeni eklenen tablolar
echo "-- Yeni eklenen tablolar:" >> "$OUTPUT_SQL"
comm -13 <(echo "$OLD_TABLES") <(echo "$NEW_TABLES") | while read -r table; do
    if [ -n "$table" ]; then
        echo "" >> "$OUTPUT_SQL"
        echo "-- Tablo: $table" >> "$OUTPUT_SQL"
        sqlite3 "$NEW_DB" ".schema $table" >> "$OUTPUT_SQL" 2>&1
    fi
done

echo "" >> "$OUTPUT_SQL"
echo "" >> "$OUTPUT_SQL"
echo "-- ==============================================" >> "$OUTPUT_SQL"
echo "-- 2. MEVCUT TABLOLARA EKLENEN COLUMNLAR" >> "$OUTPUT_SQL"
echo "-- ==============================================" >> "$OUTPUT_SQL"
echo "" >> "$OUTPUT_SQL"

# Ortak tablolardaki değişiklikler
comm -12 <(echo "$OLD_TABLES") <(echo "$NEW_TABLES") | while read -r table; do
    if [ -n "$table" ]; then
        # Eski ve yeni columnları karşılaştır
        OLD_COLS=$(sqlite3 "$OLD_DB" "PRAGMA table_info($table);" | cut -d'|' -f2 | sort)
        NEW_COLS=$(sqlite3 "$NEW_DB" "PRAGMA table_info($table);" | cut -d'|' -f2 | sort)

        # Yeni columnlar
        ADDED_COLS=$(comm -13 <(echo "$OLD_COLS") <(echo "$NEW_COLS"))

        if [ -n "$ADDED_COLS" ]; then
            echo "" >> "$OUTPUT_SQL"
            echo "-- Tablo: $table" >> "$OUTPUT_SQL"
            echo "$ADDED_COLS" | while read -r col_name; do
                # Column detaylarını al
                COL_INFO=$(sqlite3 "$NEW_DB" "PRAGMA table_info($table);" | grep "^|.*|.*|.*|.*|")
                COL_DETAIL=$(echo "$COL_INFO" | grep "|$col_name|")

                IFS='|' read -r cid name type notnull dflt_value pk <<< "$COL_DETAIL"

                # SQL oluştur
                SQL="ALTER TABLE $table ADD COLUMN $name $type"

                if [ "$notnull" = "1" ]; then
                    SQL="$SQL NOT NULL"
                fi

                if [ -n "$dflt_value" ]; then
                    SQL="$SQL DEFAULT $dflt_value"
                fi

                if [ "$pk" = "1" ]; then
                    # PRIMARY KEY eklenemez, sadece bilgi
                    echo "-- WARNING: $table.$name bir PRIMARY KEY column (eklenemez)" >> "$OUTPUT_SQL"
                else
                    echo "$SQL;" >> "$OUTPUT_SQL"
                fi
            done
        fi
    fi
done

echo "" >> "$OUTPUT_SQL"
echo "" >> "$OUTPUT_SQL"
echo "-- ==============================================" >> "$OUTPUT_SQL"
echo "-- 3. KALDIRILAN COLUMNLAR (Manuel kontrol gerekli)" >> "$OUTPUT_SQL"
echo "-- ==============================================" >> "$OUTPUT_SQL"
echo "" >> "$OUTPUT_SQL"

comm -12 <(echo "$OLD_TABLES") <(echo "$NEW_TABLES") | while read -r table; do
    if [ -n "$table" ]; then
        OLD_COLS=$(sqlite3 "$OLD_DB" "PRAGMA table_info($table);" | cut -d'|' -f2 | sort)
        NEW_COLS=$(sqlite3 "$NEW_DB" "PRAGMA table_info($table);" | cut -d'|' -f2 | sort)

        REMOVED_COLS=$(comm -23 <(echo "$OLD_COLS") <(echo "$NEW_COLS"))

        if [ -n "$REMOVED_COLS" ]; then
            echo "" >> "$OUTPUT_SQL"
            echo "-- Tablo: $table - Kaldırılan columnlar:" >> "$OUTPUT_SQL"
            echo "$REMOVED_COLS" | while read -r col_name; do
                echo "-- - $table.$col_name (VERİ KAYBI RİSKİ!)" >> "$OUTPUT_SQL"
            done
        fi
    fi
done

echo "" >> "$OUTPUT_SQL"
echo "" >> "$OUTPUT_SQL"
echo "-- Migration bitti" >> "$OUTPUT_SQL"

echo "Migration script oluşturuldu: $OUTPUT_SQL"
echo ""
echo "İçeriğin ilk 200 satırı:"
head -200 "$OUTPUT_SQL"
