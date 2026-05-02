# 35. CAD IMPORT CLIENT Modülü

## Genel Bakış

CAD Import Client modülü, SolidWorks COM otomasyonu ile CAD dosyalarından thumbnail oluşturma ve parça bilgisi çıkarma işlemlerini gerçekleştirir.

**Konum:** `CAD_Import_Client/`

---

## Modül Amacı

- SolidWorks COM otomasyonu
- Thumbnail oluşturma (.sldprt, .sldasm)
- Batch processing
- Sunucu ile HTTP iletişimi

---

## Teknoloji

- **Platform:** Python (Windows)
- **CAD:** SolidWorks COM Automation
- **İletişim:** HTTP REST API
- **GUI:** Tkinter

---

## Desteklenen Formatlar

| Format | Uzantı | Thumbnail | BOM Çıkarma |
|--------|--------|-----------|-------------|
| SolidWorks Part | .sldprt | ✅ | ✅ |
| SolidWorks Assembly | .sldasm | ✅ | ✅ |
| STEP | .stp, .step | ❌ | ✅ |
| IGES | .igs | ❌ | ✅ |

---

## Özellikler

### Thumbnail Oluşturma
```python
import win32com.client

swApp = win32com.client.Dispatch("SolidWorks.Application")
swModel = swApp.OpenDoc("path/to/file.sldprt", 1)
swModel.SaveThumbnail("output.png")
swApp.CloseDoc("path/to/file.sldprt")
```

### Batch Processing
- Belirtilen klasördeki tüm CAD dosyalarını işler
- Kuyruk sistemi ile sıralı işleme
- Progress takibi

---

## Ana Modüller

```
CAD_Import_Client/
├── gui/
│   └── main_gui.py        # Ana GUI
├── core/
│   └── solidworks_api.py  # SolidWorks COM interface
├── utils/
│   └── file_handler.py    # Dosya işleme
└── main.py                # Giriş noktası
```

---

## API Entegrasyonu

### Backend Endpointleri

| Endpoint | Açıklama |
|----------|----------|
| `POST /api/cad-import/upload` | Thumbnail yükle |
| `POST /api/cad-import/process` | İşleme başlat |
| `GET /api/cad-import/status/:jobId` | İş durumu |

---

## Konfigürasyon

```python
# config.py
SOLIDWORKS_VERSION = "2024"  # SolidWorks versiyonu
OUTPUT_FORMAT = "PNG"        # Thumbnail formatı
OUTPUT_SIZE = (300, 300)     # Thumbnail boyutu
BATCH_SIZE = 10              # Batch işlem boyutu
```

---

## Bağımlılıklar

- Python 3.8+
- SolidWorks 2019+
- `win32com` (pywin32)
- `requests` (HTTP)
- `Pillow` (görüntü işleme)

---

## Kurulum

```bash
cd CAD_Import_Client
pip install -r requirements.txt
python main.py
```

---

## İlişkili Modüller

- **Parçalar** - Parça thumbnail güncelleme
- **Dizin Tarama** - CAD dosya keşfi
- **STEP BOM Analyzer** - STEP dosya işleme

---

## Versiyon Geçmişi

| Versiyon | Tarih | Değişiklik |
|----------|-------|------------|
| 1.0 | 2024-03 | İlk versiyon |
| 1.1 | 2024-07 | Batch processing eklendi |
| 1.2 | 2024-10 | SolidWorks 2024 destği |