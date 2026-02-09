# STEP BOM Analyzer - Windows Kurulum ve Kullanım Kılavuzu

## 🚀 Windows Sisteminize Kurulum

### Sistem Gereksinimleri
- **Windows 10/11** (64-bit önerili)
- **4GB+ RAM** (büyük STEP dosyaları için 8GB+ önerili)
- **2GB boş disk alanı** (FreeCAD + Python + uygulama için)
- **İnternet bağlantısı** (kurulum ve server erişimi için)

---

## 📦 Adım Adım Kurulum

### 1. FreeCAD Kurulumu (En Önemli!)

```bash
1. https://www.freecadweb.org/ adresine gidin
2. "Download" butonuna tıklayın  
3. "Windows 64-bit" versiyonunu indirin (FreeCAD 0.20+ önerili)
4. İndirilen .exe dosyasını çalıştırın
5. Kurulum sihirbazında "Python scripting" seçeneğini işaretleyin
6. Kurulumu tamamlayın
```

**⚠️ ÖNEMLİ**: FreeCAD kurulumunda **Python API desteği** aktif olmalı!

### 2. Python Kurulumu

Windows'ta Python kurulu değilse:
```bash
1. https://python.org adresine gidin
2. "Download Python 3.x" butonuna tıklayın
3. Kurulum sırasında "Add Python to PATH" seçeneğini işaretleyin
4. "Install Now" ile kurulumu tamamlayın
```

### 3. STEP BOM Analyzer İndirme

Projeyi bilgisayarınıza indirin:
```bash
# Git ile (eğer Git yüklüyse)
git clone [repo-url] STEP_BOM_Analyzer
cd STEP_BOM_Analyzer

# Veya ZIP olarak indirip çıkarın
```

### 4. Python Bağımlılıkları

**Command Prompt** veya **PowerShell** açın ve proje klasörüne gidin:

```bash
# Proje klasörüne git
cd C:\path\to\STEP_BOM_Analyzer

# Bağımlılıkları kur
pip install -r requirements.txt

# FreeCAD entegrasyonu test et
python -c "import FreeCAD; print('FreeCAD başarıyla yüklendi!')"
```

### 5. Konfigürasyon

`config.ini` dosyasını düzenleyin (Notepad++ veya herhangi bir metin editörü ile):

```ini
[SERVER]
url = http://192.168.1.206:3000  # ÜRTM Takip server adresiniz
api_base = /api/cad-import
timeout = 30

[FREECAD_PROCESSING]
supported_extensions = .step,.stp,.STEP,.STP
max_file_size_mb = 500
gui_mode = true
screenshot_resolution = 1920x1080

[BOM_GENERATION]
include_assemblies = true
include_parts = true
auto_numbering = true
export_images = true
export_formats = json,excel,csv,html

[GUI_SETTINGS]
window_width = 1400
window_height = 900
theme = default
```

---

## 🎯 Uygulamayı Çalıştırma

### GUI Modunda (Önerilen)

```bash
# Command Prompt'ta proje klasöründe
python gui/workflow_gui.py
```

Bu komut modern, kullanıcı dostu arayüzü açar.

### Komut Satırı Modunda

```bash
# Hızlı STEP analizi için
python -c "from core.workflow_orchestrator import run_step_bom_analysis; run_step_bom_analysis('dosya.step')"
```

---

## 🖥️ GUI Kullanım Kılavuzu

### Ana Pencere Bölümleri

1. **🔧 Input Configuration**
   - STEP dosyası seçimi
   - Çıktı klasörü belirleme
   - İş akışı seçenekleri

2. **📊 Workflow Progress**
   - 7 fazlı iş akışı takibi
   - Gerçek zamanlı progress barları
   - Her faz için detaylı durum

3. **📋 Results Display**
   - Summary: Genel sonuçlar
   - BOM: Hiyerarşik BOM tablosu
   - Files: Üretilen dosyalar
   - Logs: Detaylı işlem logları

### Tipik İş Akışı

```bash
1. "Browse" ile STEP dosyanızı seçin
2. "Output Dir" klasörünü belirleyin
3. Seçenekleri ayarlayın:
   ✅ Include Part Rendering (Part resimleri)
   ✅ Generate Visual Reports (HTML/Excel raporları)  
   ✅ Enable Server Sync (ÜRTM Takip senkronizasyonu)
4. "🚀 Start Workflow" butonuna tıklayın
5. Progress barlarında ilerlemeyi takip edin
6. Results sekmelerinde sonuçları inceleyin
```

---

## 📂 Çıktı Dosyaları

İşlem tamamlandıktan sonra çıktı klasöründe:

```
workflow_output/
├── bom_reports/
│   ├── Assembly_BOM.html      # Görsel BOM raporu
│   ├── Assembly_BOM.xlsx      # Excel BOM tablosu
│   └── part_gallery.html      # Part resim galerisi
├── part_renders/
│   ├── PART001_front.png      # Part resimleri
│   ├── PART001_back.png
│   ├── PART001_thumbnail.png
│   └── ...
└── bom_exports/
    ├── bom_structure.json     # JSON BOM verisi
    ├── bom_table.csv         # CSV BOM tablosu
    └── bom_statistics.xml    # İstatistik verileri
```

---

## 🔧 Sorun Giderme

### FreeCAD Bulunamıyor Hatası

```bash
# FreeCAD kurulum kontrolü
dir "C:\Program Files\FreeCAD*"

# Python'dan FreeCAD test
python -c "import sys; print(sys.path)"
python -c "import FreeCAD; print(FreeCAD.__version__)"
```

**Çözüm**: FreeCAD'ı yeniden kurun, Python API seçeneğini aktifleştirin.

### Tkinter Hatası

```bash
# Tkinter test
python -c "import tkinter; print('GUI hazır')"
```

**Çözüm**: Python kurulumunda tkinter dahil değilse, Python'ı yeniden kurun.

### Büyük STEP Dosyası Sorunları

```ini
# config.ini'de ayarları düşürün
[FREECAD_PROCESSING]
max_file_size_mb = 200
screenshot_resolution = 1280x720
memory_limit_mb = 2000
```

### Server Bağlantı Sorunları

1. ÜRTM Takip server'ının çalıştığından emin olun
2. Network bağlantısını kontrol edin
3. config.ini'deki server URL'ini doğrulayın
4. GUI'de "Test Connection" butonunu kullanın

---

## 🚀 Performans İpuçları

### Büyük STEP Dosyaları İçin
- **RAM**: 8GB+ kullanın
- **SSD**: Hızlı disk tercih edin  
- **FreeCAD**: GUI modunu kapatmayın (screenshot için gerekli)
- **Batch Size**: config.ini'de batch_size değerini ayarlayın

### Hızlı BOM Çıkarma İçin
```ini
[BOM_GENERATION]
include_images = false      # Resimleri atla
export_formats = json,csv   # Sadece gerekli formatlar
```

---

## 📊 Örnek Kullanım Senaryoları

### Senaryo 1: Hızlı BOM Analizi
```bash
1. STEP dosyası seç
2. "Include Part Rendering" kapat
3. "Generate Visual Reports" aç
4. Start Workflow
5. 5-10 dakikada HTML BOM raporu hazır
```

### Senaryo 2: Kapsamlı Görsel Analiz  
```bash
1. STEP dosyası seç
2. Tüm seçenekleri aç
3. Start Workflow  
4. 20-30 dakikada tüm resimler + raporlar hazır
```

### Senaryo 3: Server Entegrasyonu
```bash
1. ÜRTM Takip server ayarlarını yap
2. "Enable Server Sync" aç
3. Start Workflow
4. BOM otomatik olarak server'a yüklenir
```

---

## 📞 Destek ve İletişim

**Sorun yaşadığınızda:**

1. **Log dosyalarını kontrol edin**: `step_bom_analyzer.log`
2. **Test fonksiyonlarını çalıştırın**:
   ```bash
   python test_full_workflow.py
   python test_workflow_gui.py
   ```
3. **Config ayarlarınızı doğrulayın**
4. **FreeCAD sürümünüzü kontrol edin** (0.20+ önerili)

**Başarılı kurulum testi:**
```bash
# Bu komut hatasız çalışmalı
python -c "
import FreeCAD
import tkinter
from core.workflow_orchestrator import WorkflowOrchestrator
print('✅ Sistem hazır!')
"
```

---

**🎉 Windows kurulumunuz başarıyla tamamlandı!**  
**STEP dosyalarınızı analiz etmeye başlayabilirsiniz.**

**Versiyon**: 2.0.0 (FreeCAD-Only)  
**Hedef Platform**: Windows 10/11  
**Son Güncelleme**: 2025-09-07