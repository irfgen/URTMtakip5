#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
gruplar tablosunu JSON yedeğinden geri yükleme scripti
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

        # gruplar verisini al
        if 'gruplar' in data and 'gruplar' in data['gruplar']:
            gruplar_data = data['gruplar']['gruplar']

            print(f"Toplam {len(gruplar_data)} grup kaydı bulunuyor...")

            for grup_id, grup_info in gruplar_data.items():
                grup_adi = grup_info.get('grup_adi', '')
                aciklama = grup_info.get('aciklama', '')
                created_at = grup_info.get('created_at', datetime.now().isoformat())
                updated_at = grup_info.get('updated_at', datetime.now().isoformat())

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

        # İlk birkaç kaydı göster
        cursor.execute("SELECT * FROM gruplar LIMIT 5")
        rows = cursor.fetchall()
        print("\nİlk 5 grup kaydı:")
        for row in rows:
            print(f"  ID: {row[0][:8]}..., Adı: {row[1]}, Açıklama: {row[2]}")

        conn.close()

    except Exception as e:
        print(f"Hata oluştu: {e}")
        return False

    return True

if __name__ == "__main__":
    print("gruplar geri yükleme işlemi başlıyor...")
    restore_gruplar_from_json()