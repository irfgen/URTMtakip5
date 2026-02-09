#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
JSON dosyasının tables bölümünü kontrol et
"""

import json

json_file_path = '/home/urtmtakip/Belgeler/URTMtakip/backend/export_data.json'

try:
    with open(json_file_path, 'r', encoding='utf-8') as file:
        data = json.load(file)

    print("JSON dosyası tables anahtarları:")
    if 'tables' in data:
        tables = data['tables']
        print(f"  Tip: {type(tables)}")
        print(f"  Tablo sayısı: {len(tables)}")
        print(f"  Tablo adları: {list(tables.keys())}")

        if 'gruplar' in tables:
            print(f"\ngruplar tablosu verisi:")
            gruplar_data = tables['gruplar']
            print(f"  Veri tipi: {type(gruplar_data)}")
            print(f"  Kayıt sayısı: {len(gruplar_data) if isinstance(gruplar_data, list) else 'N/A'}")

            if isinstance(gruplar_data, list) and gruplar_data:
                print(f"  İlk kayıt: {gruplar_data[0]}")
                print(f"  Örnek alanlar: {list(gruplar_data[0].keys()) if isinstance(gruplar_data[0], dict) else 'N/A'}")

except Exception as e:
    print(f"Hata: {e}")