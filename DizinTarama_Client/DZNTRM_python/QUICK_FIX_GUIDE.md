# 🚀 URTM Dizin Tarama Client - Hızlı Düzeltme Kılavuzu

## ❌ Karşılaşılan Hata
```
_tkinter.TclError: unknown option "-height"
```

## ✅ Çözüm (v1.2.4 ile düzeltildi)

### 1. Client'ı Güncelleyin
En son versiyon (v1.2.4) hata düzeltmelerini içerir:
- ttk.Label height sorunu giderildi
- GUI crash hatası önledi
- Frame-based image placeholder sistemi

### 2. PIL/Pillow Kurulumu (Resimler için)

**Otomatik Kurulum:**
```cmd
install_pillow.bat
```

**Manuel Kurulum:**
```cmd
pip install Pillow
```

**Python 3.13 için alternatif:**
```cmd
py -m pip install Pillow
```

### 3. Test Etme
```cmd
# PIL test script'i
python test_image_loading.py

# Ana client
python main.py
```

## 📋 Dosya Listesi (v1.2.4)

Aşağıdaki dosyaların mevcut olduğundan emin olun:
- ✅ `main.py` - Ana uygulama
- ✅ `part_detail_window.py` - Detay penceresi (DÜZELTİLDİ)
- ✅ `version.py` - Versiyon yönetimi (v1.2.4)
- ✅ `install_pillow.bat` - PIL kurulum script'i
- ✅ `test_image_loading.py` - Resim test script'i
- ✅ `requirements.txt` - Bağımlılıklar

## 🎯 Beklenen Sonuç

### PIL Kurulu İse:
```
📷 Parça Resmi            📋 Teknik Çizim
┌─────────────┐          ┌─────────────┐
│   [RESIM]   │          │   [RESIM]   │
│ 180x120px   │          │ 180x120px   │
│    GÖRÜNÜR  │          │    GÖRÜNÜR  │
├─────────────┤          ├─────────────┤
│📎 foto.jpg │          │📎 draw.pdf │
│🌐 Tarayıcıda Aç │     │🌐 Tarayıcıda Aç │
│📋 URL Kopyala │      │📋 URL Kopyala │
└─────────────┘          └─────────────┘
```

### PIL Kurulu Değilse:
```
📷 Parça Resmi            📋 Teknik Çizim
┌─────────────┐          ┌─────────────┐
│⏳ Yükleniyor │          │⏳ Yükleniyor │
│              │          │              │
├─────────────┤          ├─────────────┤
│📎 foto.jpg │          │📎 draw.pdf │
│⚠️ PIL Gerekli│         │⚠️ PIL Gerekli│
│install_pillow.bat│    │install_pillow.bat│
│🌐 Tarayıcıda Aç │     │🌐 Tarayıcıda Aç │
│📋 URL Kopyala │      │📋 URL Kopyala │
└─────────────┘          └─────────────┘
```

## 🔧 Hata Ayıklama

### Hala Hata Alıyorsanız:

1. **Python Versiyonunu Kontrol Et:**
   ```cmd
   python --version
   # Python 3.8+ gereklidir
   ```

2. **PIL Kurulumunu Doğrula:**
   ```cmd
   python -c "from PIL import Image; print('✅ PIL kurulu')"
   ```

3. **Test Script'ini Çalıştır:**
   ```cmd
   python test_image_loading.py
   ```

4. **Log Dosyalarını Kontrol Et:**
   Client loglarında hata mesajlarını kontrol edin.

## 📞 Destek

Sorun devam ederse:
1. Test script'i çıktısını kaydedin
2. Client log dosyasını paylaşın
3. Python ve PIL versiyonlarını bildirin

---
**Versiyon:** v1.2.4
**Tarih:** 2025-10-03
**Durum:** Production Ready ✅