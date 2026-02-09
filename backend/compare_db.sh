#!/bin/bash

OLD_DB="/home/irgat12/URTMtakip/backend/database_eski.sqlite"
NEW_DB="/home/irgat12/URTMtakip/backend/database.sqlite"

echo "====================================="
echo "VERİTABANI KARŞILAŞTIRMA RAPORU"
echo "====================================="
echo ""

# Tabloları al
OLD_TABLES=$(sqlite3 "$OLD_DB" ".tables" | tr ' ' '\n' | sort)
NEW_TABLES=$(sqlite3 "$NEW_DB" ".tables" | tr ' ' '\n' | sort)

# Yeni eklenen tablolar
echo "====================================="
echo "YENİ EKLENEN TABLOLAR:"
echo "====================================="
comm -13 <(echo "$OLD_TABLES") <(echo "$NEW_TABLES") | while read table; do
    echo ""
    echo "+ $table"
    sqlite3 "$NEW_DB" "PRAGMA table_info($table);" | while IFS='|' read -r cid name type notnull dflt_value pk; do
        pk_str=""
        [ "$pk" = "1" ] && pk_str=" [PK]"
        null_str=""
        [ "$notnull" = "1" ] && null_str=" NOT NULL"
        default_str=""
        [ -n "$dflt_value" ] && default_str=" DEFAULT $dflt_value"
        echo "  - $name: $type$null_str$default_str$pk_str"
    done
done

echo ""
echo "====================================="
echo "KALDIRILAN TABLOLAR:"
echo "====================================="
comm -23 <(echo "$OLD_TABLES") <(echo "$NEW_TABLES") | while read table; do
    echo "- $table"
done

echo ""
echo "====================================="
echo "ORTAK TABLOLARDAKİ DEĞİŞİKLİKLER:"
echo "====================================="

comm -12 <(echo "$OLD_TABLES") <(echo "$NEW_TABLES") | while read table; do
    # Eski tablo şeması
    OLD_SCHEMA=$(sqlite3 "$OLD_DB" "PRAGMA table_info($table);" | sort)
    # Yeni tablo şeması
    NEW_SCHEMA=$(sqlite3 "$NEW_DB" "PRAGMA table_info($table);" | sort)

    if [ "$OLD_SCHEMA" != "$NEW_SCHEMA" ]; then
        echo ""
        echo "* $table"

        # Eklenen columnlar
        echo "  Eklenen Columnlar:"
        comm -13 <(echo "$OLD_SCHEMA") <(echo "$NEW_SCHEMA") | while IFS='|' read -r cid name type notnull dflt_value pk; do
            null_str=""
            [ "$notnull" = "1" ] && null_str=" NOT NULL"
            default_str=""
            [ -n "$dflt_value" ] && default_str=" DEFAULT $dflt_value"
            echo "    + $name: $type$null_str$default_str"
        done

        # Kaldırılan columnlar
        REMOVED=$(comm -23 <(echo "$OLD_SCHEMA") <(echo "$NEW_SCHEMA"))
        if [ -n "$REMOVED" ]; then
            echo "  Kaldırılan Columnlar:"
            echo "$REMOVED" | while IFS='|' read -r cid name type notnull dflt_value pk; do
                echo "    - $name: $type"
            done
        fi

        # Değişen columnlar
        echo "  Değişen Columnlar:"
        sqlite3 "$OLD_DB" "PRAGMA table_info($table);" | sort > /tmp/old_cols.txt
        sqlite3 "$NEW_DB" "PRAGMA table_info($table);" | sort > /tmp/new_cols.txt

        join -t'|' /tmp/old_cols.txt /tmp/new_cols.txt | while IFS='|' read -r ocid name otype onotnull odflt opk ncid ntype nnotnull ndflt npk; do
            if [ "$otype" != "$ntype" ] || [ "$onotnull" != "$nnotnull" ] || [ "$odflt" != "$ndflt" ]; then
                echo "    ~ $name:"
                [ "$otype" != "$ntype" ] && echo "        type: $otype -> $ntype"
                [ "$onotnull" != "$nnotnull" ] && echo "        notNull: $onotnull -> $nnotnull"
                [ "$odflt" != "$ndflt" ] && echo "        defaultValue: $odflt -> $ndflt"
            fi
        done
    fi
done

# Yeni eklenen tablolar için SQL CREATE komutları
echo ""
echo "====================================="
echo "SQL MIGRATION SCRIPT:"
echo "====================================="
echo ""
echo "-- Yeni eklenen tabloları oluştur"
comm -13 <(echo "$OLD_TABLES") <(echo "$NEW_TABLES") | while read table; do
    echo ""
    echo "-- Tablo: $table"
    sqlite3 "$NEW_DB" ".schema $table" | sed 's/^/-- /'
done

# Ortak tablolardaki yeni columnlar için SQL
echo ""
echo ""
echo "-- Mevcut tablolara yeni columnlar ekle"
comm -12 <(echo "$OLD_TABLES") <(echo "$NEW_TABLES") | while read table; do
    OLD_SCHEMA=$(sqlite3 "$OLD_DB" "PRAGMA table_info($table);" | sort)
    NEW_SCHEMA=$(sqlite3 "$NEW_DB" "PRAGMA table_info($table);" | sort)

    comm -13 <(echo "$OLD_SCHEMA") <(echo "$NEW_SCHEMA") | while IFS='|' read -r cid name type notnull dflt_value pk; do
        null_str=""
        [ "$notnull" = "1" ] && null_str=" NOT NULL"
        default_str=""
        [ -n "$dflt_value" ] && default_str=" DEFAULT $dflt_value"
        echo "ALTER TABLE $table ADD COLUMN $name $type$null_str$default_str;"
    done
done

rm -f /tmp/old_cols.txt /tmp/new_cols.txt
