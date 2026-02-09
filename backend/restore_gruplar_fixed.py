#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
gruplar tablosunu JSON yedeğinden doğru yapıda geri yükleme scripti
"""

import json
import sqlite3
from datetime import datetime

def restore_gruplar_from_json():
    json_file_path = '/home/urtmtakip/Belgeler/URTMtakip/backend/export_data.json'
    db_path = '/home/urtmtakip/Belgeler/URTMtakip/backend/database.sqlite'

    try:
        # JSON dosyasını oku
        with open(json_file_path, 'r', encoding='utf-8') as file:
            data = json.load(file)

        # Veritabanı bağlantısı
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        # Önce mevcut gruplar tablosunu temizle
        print("Mevcut gruplar tablosu temizleniyor...")
        cursor.execute("DELETE FROM gruplar")

        # gruplar verisini doğru yapıdan al
        if 'tables' in data and 'gruplar' in data['tables']:
            gruplar_table = data['tables']['gruplar']

            if 'data' in gruplar_table:
                gruplar_data = gruplar_table['data']

                print(f"Toplam {len(gruplar_data)} grup kaydı bulunuyor...")

                for grup in gruplar_data:
                    grup_id = grup.get('grup_id', '')
                    grup_adi = grup.get('grup_adi', '')
                    aciklama = grup.get('aciklama', '')
                    created_at = grup.get('created_at', datetime.now().isoformat())
                    updated_at = grup.get('updated_at', datetime.now().isoformat())

                    # gruplar tablosuna ekle
                    cursor.execute("""
                        INSERT INTO gruplar
                        (grup_id, grup_adi, aciklama, created_at, updated_at)
                        VALUES (?, ?, ?, ?, ?)
                    """, (
                        grup_id,
                        grup_adi,
                        aciklama,
                        created_at,
                        updated_at
                    ))

                    print(f"İşlenen grup: {grup_adi}")

        # Değişiklikleri kaydet
        conn.commit()
        print("gruplar verileri başarıyla geri yüklendi!")

        # Yeni durum kontrol
        cursor.execute("SELECT COUNT(*) FROM gruplar")
        new_count = cursor.fetchone()[0]
        print(f"Yeni gruplar kayıt sayısı: {new_count}")

        # Tüm kayıtları göster
        cursor.execute("SELECT * FROM gruplar")
        rows = cursor.fetchall()
        print("\nGeri yüklenen tüm gruplar:")
        for i, row in enumerate(rows):
            print(f"  {i+1}. ID: {row[0][:8]}..., Adı: {row[1]}, Açıklama: {row[2]}")

        conn.close()

    except Exception as e:
        print(f"Hata oluştu: {e}")
        return False

    return True

if __name__ == "__main__":
    print("gruplar geri yükleme işlemi başlıyor...")
    restore_gruplar_from_json()