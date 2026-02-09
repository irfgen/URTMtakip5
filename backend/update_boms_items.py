#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
BOM kayıtlarındaki items alanlarını CSV verileriyle güncelleme scripti
"""

import csv
import sqlite3
import json

def update_boms_items():
    csv_file_path = '/home/urtmtakip/Belgeler/URTMtakip/backend/boms_export.csv'
    db_path = '/home/urtmtakip/Belgeler/URTMtakip/backend/database.sqlite'

    try:
        # Veritabanı bağlantısı
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        # CSV dosyasını oku
        with open(csv_file_path, 'r', encoding='utf-8') as file:
            csv_reader = csv.DictReader(file)

            updated_count = 0
            for row in csv_reader:
                bom_id = row['bom_id']  # CSV'deki bom_id
                items_json = row['items']

                # bom_kodu'na göre BOM kaydını bul
                cursor.execute("SELECT id FROM boms WHERE bom_kodu = ?", (bom_id,))
                result = cursor.fetchone()

                if result:
                    bom_db_id = result[0]

                    # BOM kaydını güncelle
                    cursor.execute("""
                        UPDATE boms
                        SET items = ?
                        WHERE id = ?
                    """, (items_json, bom_db_id))

                    updated_count += 1
                    print(f"Güncellenen BOM: {row['name']} (ID: {bom_db_id})")
                else:
                    print(f"Bulunamayan BOM: {bom_id} - {row['name']}")

        # Değişiklikleri kaydet
        conn.commit()
        print(f"\nToplam {updated_count} BOM kaydının items alanı güncellendi!")

        conn.close()

    except Exception as e:
        print(f"Hata oluştu: {e}")
        return False

    return True

if __name__ == "__main__":
    print("BOM items alanları güncelleniyor...")
    update_boms_items()