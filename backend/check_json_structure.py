#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
JSON dosyasının yapısını kontrol et
"""

import json

json_file_path = '/home/urtmtakip/Belgeler/URTMtakip/backend/export_data.json'

try:
    with open(json_file_path, 'r', encoding='utf-8') as file:
        data = json.load(file)

    print("JSON dosyası anahtarları:")
    for key in data.keys():
        print(f"  - {key}")

    if 'gruplar' in data:
        print("\ngruplar bölümü:")
        print(f"  Tip: {type(data['gruplar'])}")
        print(f"  Alt anahtarlar: {list(data['gruplar'].keys())}")

        if 'gruplar' in data['gruplar']:
            grup_data = data['gruplar']['gruplar']
            print(f"\ngruplar verisi tipi: {type(grup_data)}")
            if isinstance(grup_data, dict):
                print(f"  Örnek grup anahtarları: {list(grup_data.keys())[:5]}")
                if grup_data:
                    first_key = list(grup_data.keys())[0]
                    print(f"  İlk grup verisi ({first_key}): {grup_data[first_key]}")
        else:
            print("gruplar altında 'gruplar' anahtarı bulunamadı")

except Exception as e:
    print(f"Hata: {e}")