# 20. TEKNİK ÇİZİMLER (Technical Drawings) Modülü

## Genel Bakış

Teknik Çizimler modülü, parçalara ait teknik resimlerin yönetimini, görüntülenmesini ve OCR işlemlerini sağlar.

**Route Dosyası:** `backend/src/routes/teknikResimRoutes.js`
**Controller Dosyası:** `backend/src/controllers/teknikResimController.js`

---

## Modül Amacı

- Teknik resim depolama
- Görüntü görüntüleme
- OCR metin çıkarma
- CAD dosya önizleme
- Versiyon takibi

---

## Veritabanı Tablosu

**Teknik Çizimler:** `teknik_cizimler`

| Alan | Tip | Açıklama |
|------|-----|----------|
| id | INTEGER | Birincil anahtar |
| parca_kodu | STRING | Parça kodu |
| dosya_adi | STRING | Dosya adı |
| dosya_yolu | STRING | Dosya yolu |
| dosya_turu | STRING | image, pdf, cad |
| thumbnail_url | STRING | Thumbnail URL |
| boyut | INTEGER | Dosya boyutu (byte) |
| ekleyen | STRING | Ekleyen kullanıcı |
| created_at | DATETIME | Oluşturulma tarihi |

---

## API Endpointleri

### GET İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `GET /health` | Sağlık kontrolü |
| `GET /test` | Test endpoint |
| `GET /:id/dosya` | Dosya getir |
| `GET /:parcaKodu` | Parçanın çizimlerini getir |
| `GET /:id/metadata` | Çizim metadata |

### POST İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `POST /` | Yeni çizim yükle |
| `POST /:id/ocr` | OCR işlemi başlat |
| `POST /thumbnail` | Thumbnail oluştur |

### DELETE İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `DELETE /:id` | Çizimi sil |

---

## Desteklenen Formatlar

| Format | Uzantı | Görüntüleme | OCR |
|--------|--------|-------------|-----|
| PNG | .png | ✅ | ✅ |
| JPG/JPEG | .jpg, .jpeg | ✅ | ✅ |
| PDF | .pdf | ✅ | ✅ |
| STEP | .stp, .step | ❌ | ❌ |
| DWG | .dwg | ❌ | ❌ |

---

## OCR İşlemi (Tesseract.js)

### Desteklenen Diller
- Türkçe (tur)
- İngilizce (eng)
- Almanca (deu)

### Çıkarılabilen Bilgiler
- Parça numaraları
- Ölçüler
- Toleranslar
- Malzeme bilgileri

---

## Temel Fonksiyonlar

### 1. resimYukle(resimData)
Teknik resim yükler.
- Dosya doğrulama
- Thumbnail oluşturma
- Veritabanı kaydı

### 2. ocrIslemi(cizimId)
OCR işlemi başlatır.
- Tesseract.js kullanır
- Metin çıkarır
- Sonucu kaydeder

### 3. dosyaGetir(cizimId)
Dosyayı stream olarak gönderir.

### 4. thumbnailOlustur(cizimId)
Thumbnail oluşturur (Sharp).

---

## Frontend Bileşenleri

| Bileşen | Açıklama |
|---------|----------|
| `TeknikResimGoruntuleyici.jsx` | Çizim görüntüleme |
| `ResimYukleme.jsx` | Yükleme arayüzü |
| `OCRPanel.jsx` | OCR sonuç paneli |
| `CizimListesi.jsx` | Çizim listesi |

---

## Socket.IO Events

| Olay | Açıklama |
|------|----------|
| `teknik-resim:uploaded` | Çizim yüklendi |
| `teknik-resim:ocr-complete` | OCR tamamlandı |

---

## İlişkili Modüller

- **Parçalar** - Parça bağlantısı
- **CAD Import** - CAD dosyaları

---

## Versiyon Geçmişi

| Versiyon | Tarih | Değişiklik |
|----------|-------|------------|
| 1.0 | 2024-02 | İlk versiyon |
| 1.1 | 2024-05 | OCR entegrasyonu |
| 1.2 | 2024-09 | Thumbnail sistemi |
| 1.3 | 2024-12 | PDF desteği |