# 27. DOSYA YÜKLEME (Upload) Modülü

## Genel Bakış

Dosya Yükleme modülü, sisteme yüklenen tüm dosyaların (resim, PDF, CAD vb.) yönetimini sağlar.

**Route Dosyası:** `backend/src/routes/uploadRoutes.js`
**Controller Dosyası:** `backend/src/controllers/uploadController.js`

---

## Modül Amacı

- Dosya yükleme
- Dosya depolama
- Görsel optimizasyonu
- Thumbnail oluşturma
- Dosya erişimi

---

## Depolama Yapısı

```
backend/uploads/
├── parcalar/          # Parça dosyaları
├── teknik-resimler/   # Teknik çizimler
├── sevkiyat/          # Sevkiyat resimleri
├── fason/             # Fason belgeleri
└── general/           # Genel dosyalar

backend/importlar/      # Import dosyaları (Excel, CSV)
```

---

## API Endpointleri

### GET İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `GET /:filename` | Dosya indir |
| `GET /:filename/info` | Dosya bilgisi |
| `GET /:filename/thumbnail` | Thumbnail getir |

### POST İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `POST /parca` | Parça dosyası yükle |
| `POST /upload` | Genel dosya yükleme |
| `POST /upload-part` | Parça thumbnail yükle |
| `POST /upload-image` | Görsel yükleme |

### DELETE İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `DELETE /:resimId` | Dosya sil |

---

## Desteklenen Dosya Türleri

| Tür | Uzantılar | Maks Boyut |
|-----|-----------|------------|
| Görsel | jpg, jpeg, png, gif, webp | 20MB |
| PDF | pdf | 50MB |
| Excel | xlsx, xls | 100MB |
| CAD | step, stp, igs | 200MB |
| Word | doc, docx | 20MB |

---

## Dosya İşleme

### Görsel Optimizasyonu (Sharp)
```javascript
// Thumbnail oluşturma
await sharp(inputPath)
  .resize(300, 300, { fit: 'cover' })
  .toFile(thumbnailPath);

// WebP dönüştürme
await sharp(inputPath)
  .toFormat('webp', { quality: 80 })
  .toFile(outputPath);
```

### Dosya Adlandırma
```
{type}_{id}_{timestamp}_{random}.{ext}
```

---

## Temel Fonksiyonlar

### 1. dosyaYukle(file, type, id)
Dosya yükler.
- Tür kontrolü
- Boyut kontrolü
- Depolama klasörüne kaydetme

### 2. thumbnailOlustur(dosyaId)
Görsel için thumbnail oluşturur.

### 3. dosyaSil(dosyaId)
Dosyayı siler.
- Dosya sisteminden siler
- Veritabanı kaydını siler

### 4. dosyaBilgisiGetir(filename)
Dosya bilgilerini döner.
- Boyut, tarih, tür

---

## Socket.IO Events

| Olay | Açıklama |
|------|----------|
| `upload:progress` | Yükleme ilerlemesi |
| `upload:completed` | Yükleme tamamlandı |
| `upload:failed` | Yükleme başarısız |

---

## İlişkili Modüller

- **Parçalar** - Teknik resim, thumbnail
- **Sevkiyat** - Sevkiyat resimleri
- **Uygunsuzluklar** - Uygunsuzluk belgeleri
- **Notlar** - Not resimleri

---

## Güvenlik

- Dosya türü whitelist
- Dosya boyutu limiti
- Dosya adı sanitize
- Path traversal koruması

---

## Versiyon Geçmişi

| Versiyon | Tarih | Değişiklik |
|----------|-------|------------|
| 1.0 | 2024-01 | İlk versiyon |
| 1.1 | 2024-05 | Sharp entegrasyonu |
| 1.2 | 2024-09 | Thumbnail sistemi |
| 1.3 | 2024-12 | Güvenlik iyileştirmesi |