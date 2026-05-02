# Enhanced Directory Scanner - Montaj ve Parça Gruplandırma

## 🚀 Genel Bakış

URTM Takip dizin tarama sistemi, artık SLDPART ve SLDSASM dosyalarını birlikte tarayarak hiyerarşik bir gruplandırma yapabilmektedir. Bu gelişme ile birlikte montaj ve parça ilişkileri daha iyi analiz edilebilmektedir.

## ✨ Yeni Özellikler

### 1. İki Tarama Modu

#### Enhanced Mode (Varsayılan)
- ✅ `.sldprt` (Parça) dosyalarını tarar
- ✅ `.sldasm` (Montaj) dosyalarını tarar
- ✅ `.slddrw` (Teknik Resim) dosyalarını tarar
- ✅ `.pdf` dosyalarını tarar
- 🔗 Hiyerarşik ilişkiler kurar
- 📊 Gelişmiş istatistikler sunar

#### Legacy Mode (Geriye Uyumlu)
- ✅ Sadece `.sldprt`, `.slddrw`, `.pdf` dosyalarını tarar
- 📊 Eski istatistik formatını korur

### 2. Hiyerarşik Veri Yapısı

```json
{
  "assemblies": {
    "ANA_MONTAJ": {
      "type": "assembly",
      "parcaAdi": "ANA_MONTAJ",
      "sldasm": ["path/to/ANA_MONTAJ.sldasm"],
      "slddrw": ["path/to/ANA_MONTAJ.slddrw"],
      "pdf": ["path/to/ANA_MONTAJ.pdf"],
      "children": {
        "ALT_MONTAJ_1": {
          "type": "assembly",
          "children": {...}
        },
        "PARCA_1": {
          "type": "part",
          "sldprt": ["path/to/PARCA_1.sldprt"]
        }
      },
      "level": 0,
      "path": "relative/path"
    }
  },
  "parts": {
    "BAGIMSIZ_PARCA": {
      "type": "part",
      "parcaAdi": "BAGIMSIZ_PARCA",
      "sldprt": ["path/to/BAGIMSIZ_PARCA.sldprt"],
      "parent_assembly": null,
      "level": 1
    }
  }
}
```

### 3. Gelişmiş İstatistikler

#### Enhanced Mode İstatistikleri
- **totalAssemblies**: Toplam montaj sayısı
- **totalParts**: Toplam parça sayısı
- **assembliesWithFiles**: Dosyası olan montaj sayısı
- **assembliesWithDrawings**: Çizimi olan montaj sayısı
- **assembliesWithChildren**: Alt parçası olan montaj sayısı
- **partsWith3D**: 3D modeli olan parça sayısı
- **partsWithDrawings**: Teknik resmi olan parça sayısı
- **partsWithPDF**: PDF'i olan parça sayısı
- **standaloneParts**: Bağımsız parça sayısı
- **completeAssemblies**: Komple montaj sayısı
- **totalFiles**: Toplam dosya sayısı

## 🔧 Kurulum ve Yapılandırma

### Client Tarafı

Python client'ta varsayılan olarak **Enhanced Mode** aktiftir:

```python
# Konfigürasyon dosyasında (config.ini)
[SCAN]
mode = enhanced  # veya legacy
extensions = .sldprt,.sldasm,.slddrw,.pdf
max_depth = 10
exclude_folders = IPTAL,iptal,temp,Temp
```

### Backend Tarafı

Backend API yeni veri formatını otomatik olarak algılar:

```javascript
// Enhanced Mode verisi algılanır
const scanMode = data.scanMode || 'legacy';
if (scanMode === 'enhanced') {
  // Gelişmiş istatistikleri işle
}
```

### Frontend Tarafı

Frontend'de tarama sonuçları moda göre farklı gösterilir:

- **Enhanced Mode**: 6 grid gösterimi (Montaj, Parça, Komple, Bağımsız, 3D, Dosya)
- **Legacy Mode**: 4 grid gösterimi (Parça, Dosya, Tam, Eksik)

## 📊 Kullanım Senaryoları

### 1. komple Makine Projesi
```
📁 MAKINE_X/
├── 📁 ANA_MONTAJ/
│   ├── ANA_MONTAJ.sldasm
│   ├── ANA_MONTAJ.slddrw
│   └── 📁 ALT_KOMPOZANLAR/
│       ├── KOMPOZAN_1.sldasm
│       ├── KOMPOZAN_1.slddrw
│       └── 📁 PARCALAR/
│           ├── VIDA_1.sldprt
│           ├── VIDA_1.slddrw
│           ├── YATAK_1.sldprt
│           └── YATAK_1.slddrw
└── 📁 BAGIMSIZ_PARCALAR/
    ├── YARDIMCI_PARCA_1.sldprt
    └── YARDIMCI_PARCA_1.slddrw
```

**Sonuç:**
- 2 Montaj (ANA_MONTAJ, KOMPOZAN_1)
- 2 Alt parça (VIDA_1, YATAK_1)
- 1 Bağımsız parça (YARDIMCI_PARCA_1)

### 2. Sadece Parça Projesi
```
📁 PARCA_PROJESI/
├── PARCA_A.sldprt
├── PARCA_A.slddrw
├── PARCA_B.sldprt
└── PARCA_B.slddrw
```

**Sonuç:**
- 0 Montaj
- 2 Bağımsız parça

## 🔄 Veri Akışı

1. **Client Taraması**:
   - Klasör yapısında gezin
   - Dosyaları türlerine göre ayır
   - Hiyerarşik ilişkileri kur

2. **Sunucuya Gönderim**:
   - JSON formatında veri gönder
   - Tarama modu bilgisini dahil et

3. **Backend İşlemi**:
   - Veriyi mode göre formatla
   - İstatistikleri hesapla
   - Frontend'e ilet

4. **Frontend Gösterimi**:
   - Mode göre uygun grid göster
   - İstatistikleri göster
   - Kaydetme butonları

## 🎯 Avantajları

1. **Gelişmiş Analiz**: Montaj-parça ilişkileri net görünürlük
2. **Esnek Kullanım**: İki mod arasında geçiş imkanı
3. **Geriye Uyumluluk**: Mevcut sistemlerle tam uyum
4. **Zengin İstatistikler**: Detaylı analiz imkanları
5. **Performans**: Büyük projelerde efektif çalışma

## 📝 Notlar

- Enhanced mode varsayılan olarak aktiftir
- Legacy mode'ye geçmek için konfigürasyon dosyasını düzenleyin
- İlişki kurma dizin yapısına göre yapılır (dosya adı benzerliği)
- Daha gelişmiş ilişki kurma için SolidWorks API entegrasyonu planlanmaktadır