#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
BOM verilerini CSV dosyasından geri yükleme scripti
"""

import csv
import sqlite3
import json
from datetime import datetime
import uuid

def restore_boms_from_csv():
    csv_file_path = '/home/urtmtakip/Belgeler/URTMtakip/backend/boms_export.csv'
    db_path = '/home/urtmtakip/Belgeler/URTMtakip/backend/database.sqlite'

    try:
        # Veritabanı bağlantısı
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        # Önce mevcut boms tablosunu temizle (isteğe bağlı)
        print("Mevcut BOM verileri kontrol ediliyor...")
        cursor.execute("SELECT COUNT(*) FROM boms")
        current_count = cursor.fetchone()[0]
        print(f"Mevcut BOM kayıt sayısı: {current_count}")

        # CSV dosyasını oku
        with open(csv_file_path, 'r', encoding='utf-8') as file:
            csv_reader = csv.DictReader(file)

            for row in csv_reader:
                bom_id = row['bom_id']
                name = row['name']
                description = row['description']
                items_json = row['items']
                created_at = row['created_at']
                updated_at = row['updated_at']

                # BOM tablosuna ekle - mevcut yapıya uyarla
                cursor.execute("""
                    INSERT OR REPLACE INTO boms
                    (bom_kodu, name, bom_aciklamasi, versiyon, aktif, createdAt, updatedAt)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (
                    bom_id[:100],  # bom_kodu (max 100 karakter)
                    name,          # name
                    description,   # bom_aciklamasi
                    "1.0",         # versiyon
                    1,             # aktif
                    created_at,    # createdAt
                    updated_at     # updatedAt
                ))

                print(f"İşlenen BOM: {name}")

        # Değişiklikleri kaydet
        conn.commit()
        print("BOM verileri başarıyla geri yüklendi!")

        # Yeni durum kontrol
        cursor.execute("SELECT COUNT(*) FROM boms")
        new_count = cursor.fetchone()[0]
        print(f"Yeni BOM kayıt sayısı: {new_count}")

        conn.close()

    except Exception as e:
        print(f"Hata oluştu: {e}")
        return False

    return True

def check_gruplar_table():
    """gruplar tablosunun durumunu kontrol et"""
    db_path = '/home/urtmtakip/Belgeler/URTMtakip/backend/database.sqlite'

    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        cursor.execute("SELECT COUNT(*) FROM gruplar")
        count = cursor.fetchone()[0]

        cursor.execute("SELECT * FROM gruplar")
        rows = cursor.fetchall()

        print(f"\ngruplar tablosunda {count} kayıt bulunuyor:")
        for row in rows:
            print(f"  ID: {row[0]}, Adı: {row[1]}, Açıklama: {row[2]}")

        conn.close()

    except Exception as e:
        print(f"gruplar tablosu kontrol edilirken hata: {e}")

if __name__ == "__main__":
    print("BOM geri yükleme işlemi başlıyor...")
    restore_boms_from_csv()

    print("\ngruplar tablosu durumu:")
    check_gruplar_table()