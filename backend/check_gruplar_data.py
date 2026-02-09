#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
gruplar tablosu verisini detaylı incele
"""

import json

json_file_path = '/home/urtmtakip/Belgeler/URTMtakip/backend/export_data.json'

try:
    with open(json_file_path, 'r', encoding='utf-8') as file:
        data = json.load(file)

    if 'tables' in data and 'gruplar' in data['tables']:
        gruplar_data = data['tables']['gruplar']
        print(f"gruplar verisi yapısı:")
        print(f"  Tip: {type(gruplar_data)}")
        print(f"  Anahtarlar: {list(gruplar_data.keys())}")

        if 'rows' in gruplar_data:
            rows = gruplar_data['rows']
            print(f"  Satır sayısı: {len(rows)}")

            if rows:
                print(f"  İlk satır: {rows[0]}")
                print(f"  Alan adları: {list(rows[0].keys()) if isinstance(rows[0], dict) else 'N/A'}")

                # Tüm satırları göster
                print(f"\nTüm gruplar kayıtları:")
                for i, row in enumerate(rows):
                    print(f"  {i+1}. ID: {row.get('grup_id', 'N/A')}, Adı: {row.get('grup_adi', 'N/A')}, Açıklama: {row.get('aciklama', 'N/A')}")

        else:
            print("  'rows' anahtarı bulunamadı")
            print(f"  Mevcut anahtarların içerikleri:")
            for key, value in gruplar_data.items():
                print(f"    {key}: {type(value)} - {str(value)[:100]}...")

except Exception as e:
    print(f"Hata: {e}")