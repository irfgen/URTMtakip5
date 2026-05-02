# 36. STEP BOM ANALYZER Modülü

## Genel Bakış

STEP BOM Analyzer modülü, STEP dosyalarından BOM (Bill of Materials) çıkarma, 3D görselleştirme ve analiz işlemlerini gerçekleştirir.

**Konum:** `STEP_BOM_Analyzer/`

---

## Modül Amacı

- STEP dosya BOM çıkarma
- 3D görselleştirme
- Parça listesi oluşturma
- Analiz raporları
- Çeşitli formatlarda export

---

## Teknoloji

- **Platform:** Python 3.8+
- **CAD Processing:** FreeCAD
- **3D Rendering:** matplotlib, trimesh
- **GUI:** Tkinter
- **API:** Flask (opsiyonel)

---

## Desteklenen Formatlar

### Giriş
| Format | Uzantı | BOM | 3D Görsel |
|--------|--------|-----|-----------|
| STEP | .stp, .step | ✅ | ✅ |
| IGES | .igs | ✅ | ✅ |
| OBJ | .obj | ✅ | ✅ |
| STL | .stl | ❌ | ✅ |

### Çıkış
| Format | Açıklama |
|--------|----------|
| JSON | Yapılandırılmış BOM |
| Excel (.xlsx) | Excel tablo formatı |
| CSV | virgülle ayrılmış |
| XML | Standart XML formatı |

---

## Özellikler

### BOM Çıkarma
```python
import FreeCAD
import Part

doc = FreeCAD.open("example.step")
parts = doc.Objects
bom_data = []
for part in parts:
    bom_data.append({
        'name': part.Name,
        'label': part.Label,
        'volume': part.Shape.Volume
    })
```

### 3D Görselleştirme
- Parça mesh görünümü
- Montaj görünümü
- Patlama görünümü (exploded view)
- Kesit görünümü

---

## Ana Modüller

```
STEP_BOM_Analyzer/
├── gui/
│   └── main_gui.py        # Ana GUI
├── core/
│   ├── step_parser.py    # STEP dosya çözümleyici
│   └── bom_extractor.py   # BOM çıkarıcı
├── api/
│   └── server.py          # REST API sunucusu
├── macros/
│   └── analysis_macros.py  # FreeCAD makroları
├── utils/
│   └── export.py          # Export işlemleri
├── test_output/           # Test sonuçları
└── main.py                # Giriş noktası
```

---

## API Endpointleri (Flask Sunucu)

### GET İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `GET /health` | Sağlık kontrolü |
| `GET /bom/:filename` | BOM bilgisi |
| `GET /preview/:filename` | 3D preview |
| `GET /export/:filename/:format` | Export |

### POST İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `POST /analyze` | STEP dosya analizi |
| `POST /export` | Export işlemi |

---

## Export Formatları

### JSON Export
```json
{
  "filename": "assembly.step",
  "total_parts": 45,
  "bom": [
    {
      "name": "Part001",
      "part_number": "PN-001",
      "quantity": 2,
      "material": "Aluminum",
      "volume_cm3": 125.5
    }
  ]
}
```

### Excel Export
| Parça No | Parça Adı | Miktar | Malzeme | Hacim |
|----------|-----------|--------|---------|-------|
| PN-001 | Parça 1 | 2 | Alüminyum | 125.5 |

---

## Konfigürasyon

```python
# config.py
MATERIAL_DENSITIES = {
    'Aluminum': 2.7,
    'Steel': 7.85,
    'Plastic': 1.2
}
EXPORT_FORMATS = ['json', 'xlsx', 'csv', 'xml']
THUMBNAIL_SIZE = (800, 600)
```

---

## Bağımlılıklar

- Python 3.8+
- FreeCAD
- numpy
- matplotlib
- trimesh
- pandas
- openpyxl

---

## Kurulum

```bash
cd STEP_BOM_Analyzer
pip install -r requirements.txt
python main.py
```

---

## İlişkili Modüller

- **Parçalar** - Parça veritabanı güncelleme
- **BOM Yönetimi** - BOM oluşturma
- **Dizin Tarama** - STEP dosya keşfi
- **CAD Import Client** - SolidWorks dosyaları

---

## Versiyon Geçmişi

| Versiyon | Tarih | Değişiklik |
|----------|-------|------------|
| 1.0 | 2024-02 | İlk versiyon |
| 1.1 | 2024-06 | FreeCAD entegrasyonu |
| 1.2 | 2024-09 | 3D görselleştirme eklendi |
| 1.3 | 2024-12 | API sunucusu eklendi |