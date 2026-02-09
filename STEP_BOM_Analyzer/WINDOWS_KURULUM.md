# STEP BOM Analyzer - Windows Kurulum Kılavuzu

## 🚀 Hızlı Başlangıç

### 1. Ön Gereksinimler
- **Windows 10/11** (64-bit)
- **FreeCAD 0.20+** kurulu olmalı ([indirme linki](https://www.freecadweb.org/))
- **4GB+ RAM** (büyük dosyalar için 8GB+ önerili)

### 2. Otomatik Çalıştırma
1. **🚀 ÇALIŞTIR.bat** dosyasına çift tıklayın
2. FreeCAD otomatik bulunur ve GUI açılır
3. STEP dosyasını seçin ve analizi başlatın

### 3. Alternatif Çalıştırma
- **START_GUI.py** dosyasına çift tıklayın (Python kuruluysa)
- **TEST.bat** ile sistem testleri yapın

## 📁 Dosya Yapısı

```
STEP_BOM_Analyzer/
├── ÇALIŞTIR.bat          # 🚀 Ana başlatıcı (çift tıklayın)
├── START_GUI.py           # Python GUI başlatıcı  
├── TEST.bat               # Test scripti
├── requirements.txt       # Python gereksinimler
├── core/                  # Ana motorlar
│   ├── freecad_python_wrapper.py
│   ├── freecad_step_processor.py
│   ├── bom_extractor_v2.py
│   └── ...
├── gui/                   # Kullanıcı arayüzü
│   └── workflow_gui.py
└── test_output/           # Çıktı dosyaları
```

## 🎯 Kullanım

### Basit Kullanım
1. **ÇALIŞTIR.bat** çift tıklayın
2. "Browse" ile STEP dosyasını seçin
3. "Start Workflow" butonuna tıklayın
4. Sonuçları "Results" sekmelerinde görüntüleyin

### İleri Düzey
- **Multi-format export**: JSON, Excel, CSV, HTML
- **Part screenshots**: Her parça için 6 açıdan görüntü
- **Server sync**: ÜRTM Takip sistemi entegrasyonu
- **Batch processing**: Çoklu dosya işleme

## 🔧 Sorun Giderme

### FreeCAD Bulunamıyor
```cmd
# FreeCAD kurulum kontrolü
dir "C:\Program Files\FreeCAD*"

# Manuel test
"C:\Program Files\FreeCAD 1.0\bin\python.exe" -c "import FreeCAD; print('OK')"
```

### GUI Açılmıyor
1. **TEST.bat** çalıştırın
2. Hata mesajlarını kontrol edin
3. Windows güvenlik ayarlarını kontrol edin
4. FreeCAD'ı yönetici olarak çalıştırmayı deneyin

### Büyük Dosya Sorunları
- **config.ini**'de `max_file_size_mb` değerini düşürün
- **screenshot_resolution** değerini düşürün  
- Daha fazla RAM kullanın

## 📊 Özellikler

### ✅ Desteklenen Format
- **STEP dosyaları**: .step, .stp, .STEP, .STP
- **Çıktı formatları**: JSON, Excel, CSV, HTML, PDF

### ✅ Analiz Yetenekleri
- Hiyerarşik BOM çıkarma
- Geometrik analiz (hacim, yüzey, kütle)
- Part görselleri (6 açıdan screenshot)
- Assembly yapı analizi
- Server entegrasyonu

### ✅ Performans
- **500MB+** STEP dosya desteği
- **1000+** part assembly desteği
- **Batch processing** çoklu dosya
- **Background processing** GUI donmaması

## 📞 Destek

### Hata Durumunda
1. **test_output/** klasöründeki log dosyalarını kontrol edin
2. **TEST.bat** ile sistem testleri yapın
3. FreeCAD sürümünü kontrol edin: 0.20+ gerekli
4. Windows güvenlik duvarı ayarlarını kontrol edin

### İletişim
- **Email**: [destek@urtmtakip.com]
- **GitHub Issues**: Teknik sorunlar için
- **Dokümantasyon**: ÜRTM Takip web sitesi

---

**Versiyon**: 2.0.0 (Windows Optimized)
**Son Güncelleme**: $(date)
**Geliştirici**: ÜRTM Takip Ekibi