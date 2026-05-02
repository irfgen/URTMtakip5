# 21. DİZİN TARAMA (Directory Scanning) Modülü

## Genel Bakış

Dizin Tarama modülü, ağ klasörlerindeki CAD dosyalarını tarayıp parça veritabanı ile eşleştirmeyi sağlar.

**Route Dosyası:** `backend/src/routes/dizinTarama.js`
**Controller Dosyası:** `backend/src/controllers/dizinTaramaController.js`
**Frontend Component:** `frontend/src/components/DizinTarama.jsx`

---

## Modül Amacı

- Klasör tarama ve dosya listeleme
- CAD dosya tespiti
- Parça eşleştirme
- Toplu güncelleme
- Python ve C# client desteği

---

## Desteklenen CAD Formatları

| Format | Uzantılar |
|--------|-----------|
| STEP | .stp, .step |
| IGES | .igs, .iges |
| SolidWorks | .sldprt, .sldasm |
| AutoCAD | .dwg, .dxf |
| PDF | .pdf |

---

## API Endpointleri

### GET İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `GET /analiz` | Dizin analizi |
| `GET /kontrol` | Dizin kontrol |
| `GET /listele` | Dizinleri listele |
| `GET /dizin-tarama-client` | Python client rehberi |
| `GET /dizin-tarama-python-client` | Python client bilgisi |
| `GET /dizin-tarama-csharp-client` | C# client bilgisi |
| `GET /dizin-tarama-rehber` | Genel rehber |

### POST İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `POST /analiz` | Dizin analizi başlat |
| `POST /kontrol` | Dizin kontrol et |
| `POST /listele` | Dizinleri listele |
| `POST /save-parts` | Parçaları kaydet |
| `POST /search-parts` | Parça ara |
| `POST /get-part-info` | Parça bilgisi getir |
| `POST /bulk-part-info` | Toplu parça bilgisi |
| `PUT /update-cad-paths/:parcaKodu` | CAD yolu güncelle |
| `PUT /bulk-update-cad-paths` | Toplu CAD yolu güncelle |

---

## Tarama Sonuç Yapısı

```json
{
  "dizin": "\\\\server\\cad_files",
  "toplam_dosya": 150,
  "eslesen": 120,
  "eslesmeyen": 30,
  "dosyalar": [
    {
      "dosya_adi": "parca_001.stp",
      "tam_yol": "\\\\server\\cad_files\\parca_001.stp",
      "parca_kodu": "PR001",
      "eslesti": true
    }
  ]
}
```

---

## Temel Fonksiyonlar

### 1. dizinTara(dizinYolu)
Belirtilen dizini tarar.
- CAD dosyalarını bulur
- Boyut ve tarih bilgilerini alır

### 2. parcaEsle(dosyaAdi)
Dosya adını parça kodu ile eşleştirir.
- Ad bazlı eşleştirme
- Fuzzy search desteği

### 3. cadYoluGuncelle(parcaKodu, yeniYol)
Parçanın CAD dosya yolunu günceller.

### 4. topluGuncelle(eslestirmeler)
Birden fazla eşleştirmeyi günceller.

---

## Python Client

### Özellikler
- Platform bağımsız
- Schedule edilebilir tarama
- Sunucuya HTTP ile veri gönderimi

### Kullanım
```bash
cd DizinTarama_Client/DZNTRM_python
python main.py --dizin \\server\share --sunucu http://localhost:3000
```

---

## C# Client

### Özellikler
- Windows için optimize
- NTFS indexed search
- Active Directory entegrasyonu

### Kullanım
```bash
cd DizinTarama_Client\DZNTRM_cs
dotnet run --dizin \\server\share --sunucu http://localhost:3000
```

---

## Frontend Bileşenleri

| Bileşen | Açıklama |
|---------|----------|
| `DizinTarama.jsx` | Ana tarama arayüzü |
| `DizinSecici.jsx` | Dizin seçici |
| `EslesmeSonuclari.jsx` | Eşleştirme sonuçları |
| `TopluGuncelleme.jsx` | Toplu güncelleme formu |

---

## Socket.IO Events

| Olay | Açıklama |
|------|----------|
| `dizin:scan-started` | Tarama başladı |
| `dizin:scan-progress` | Tarama ilerliyor |
| `dizin:scan-complete` | Tarama tamamlandı |
| `dizin:match-found` | Eşleşme bulundu |

---

## İlişkili Modüller

- **Parçalar** - Parça bilgileri
- **CAD Import** - CAD dosya işleme
- **STEP BOM Analyzer** - STEP dosya analizi

---

## Versiyon Geçmişi

| Versiyon | Tarih | Değişiklik |
|----------|-------|------------|
| 1.0 | 2024-03 | İlk versiyon |
| 1.1 | 2024-06 | Python client eklendi |
| 1.2 | 2024-09 | C# client eklendi |
| 1.3 | 2024-12 | Toplu güncelleme eklendi |