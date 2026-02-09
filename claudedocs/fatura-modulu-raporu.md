# Fatura Modülü Bilgilendirme Raporu

**Tarih**: 2024-12-28
**Modül Versiyonu**: v14.dev1
**Durum**: Production Ready

---

## 📋 Modül Genel Bakış

Fatura modülü, tedarikçilerden gelen faturaların yönetimi, kalemlerinin takibi ve irsaliyelerle eşleştirilmesi için kullanılan sistem modülüdür.

### Temel Özellikler
- ✅ Fatura oluşturma ve düzenleme
- ✅ Kalem (ürün/hizmet) yönetimi
- ✅ AI-powered görsel fatura analizi (n8n + Gemini Vision API)
- ✅ İrsaliye ile 3-way eşleştirme
- ✅ Lock mekanizması (çoklu kullanıcı desteği)
- ✅ Socket.IO ile real-time güncellemeler

---

## 🗄️ Veritabanı Yapısı

### Ana Tablo: `faturalar`

| Alan | Tip | Zorunlu | Açıklama |
|------|-----|---------|----------|
| `id` | INTEGER (PK) | ✅ | Otomatik artan |
| `fatura_no` | STRING(50) | ✅ | Benzersiz fatura numarası |
| `tedarikci_id` | INTEGER | ✅ | Firma foreign key |
| `belge_tarih` | DATE | ✅ | Fatura düzenleme tarihi |
| `vade_tarihi` | DATE | ❌ | Ödeme vade tarihi |
| `belge_tipi` | STRING | ❌ | 'gelis' veya 'cikis' |
| `aciklama` | TEXT | ❌ | Fatura açıklaması |
| `durum` | STRING | ✅ | 'bekliyor', 'kismi_eslesti', 'tam_eslesti' |
| `olusturan_id` | INTEGER | ✅ | Oluşturan kullanıcı |
| `created_at` | DATETIME | ✅ | Kayıt tarihi |
| `updated_at` | DATETIME | ✅ | Güncelleme tarihi |

### Alt Tablo: `fatura_kalemler`

| Alan | Tip | Zorunlu | Açıklama |
|------|-----|---------|----------|
| `id` | INTEGER (PK) | ✅ | Otomatik artan |
| `fatura_id` | INTEGER (FK) | ✅ | Fatura foreign key |
| `stok_kodu` | STRING(100) | ✅ | Ürün stok kodu |
| `mal_hizmet_adi` | STRING(500) | ✅ | Ürün/hizmet adı |
| `miktar` | FLOAT | ✅ | Miktar (decimal) |
| `birim` | STRING(50) | ❌ | Birim (Adet, KG, Lt, Mt, m², m³, Gram) |
| `birim_fiyat` | FLOAT | ❌ | Birim fiyatı |
| `toplam_tutar` | FLOAT | ❌ | Miktar × Birim Fiyat |
| `aciklama` | TEXT | ❌ | Kalem açıklaması |
| `eslesme_durumu` | INTEGER | ✅ | 0=Bekliyor, 1=Eşleşti |
| `eslesen_irsaliye_kalem_id` | INTEGER (FK) | ❌ | Eşleşen irsaliye kalem ID |

---

## 🎯 Kullanım Senaryoları

### 1. Manuel Fatura Oluşturma

```
1. Faturalar sayfasına git
2. "Yeni Fatura" butonuna tıkla
3. Formu doldur:
   - Tedarikçi seç (zorunlu)
   - Fatura No gir (zorunlu)
   - Belge Tarihi seç (zorunlu)
   - Vade Tarihi seç (opsiyonel)
   - Açıklama gir (opsiyonel)
4. Kalemler ekle:
   - "Kalem Ekle" butonuna tıkla
   - Stok Kodu gir (zorunlu)
   - Parça Adı gir (zorunlu)
   - Miktar gir (zorunlu)
   - Birim seç (varsayılan: Adet)
   - Birim Fiyat gir
   - Toplam otomatik hesaplanır
5. "Kaydet" butonuna tıkla
```

### 2. AI ile Fatura Analizi

```
1. Yeni Fatura formunu aç
2. "Fatura Görseli Yükle ve Analiz Et" butonuna tıkla
3. Fatura görselini seç (JPEG, PNG, max 10MB)
4. AI otomatik analiz yapar:
   - Fatura numarası
   - Belge tarihi
   - Vade tarihi
   - Tedarikçi (algılanabilirse)
   - Kalemler listesi
5. Form alanlarını kontrol et ve düzenle
6. "Kaydet" butonuna tıkla
```

**AI Analiz Teknik Detayları:**
- Backend: `/api/faturalar/analiz` endpoint
- Workflow: n8n webhook → Gemini Vision API
- Timeout: 45 saniye
- Format: Base64 encoded image
- Yanıt formatı: JSON (fatura_no, belge_tarih, kalemler[])

### 3. Fatura-İrsaliye Eşleştirme

```
1. Faturalar sayfasından fatura seç
2. "Eşleştir" butonuna tıkla
3. Eşleştirme sayfası açılır:
   - Sol panel: Fatura kalemleri
   - Sağ panel: İrsaliye kalemleri
   - 3-way matching algoritması:
     * Miktar eşleşmesi (+40 puan)
     * Stok kodu eşleşmesi (+30 puan)
     * Mal/hizmet adı benzerliği (+30 puan)
   - Min eşleşme skoru: 50/100
4. Eşleşmeleri onayla
5. Fatura durumu güncellenir:
   - Tamamı eşleşti → 'tam_eslesti'
   - Kısmi eşleşti → 'kismi_eslesti'
   - Bekliyor → 'bekliyor'
```

---

## 🔌 API Endpoint'leri

### Fatura İşlemleri

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/faturalar` | Fatura listesi (filtreleme, sayfalama) |
| GET | `/api/faturalar/:id` | Fatura detayı |
| POST | `/api/faturalar` | Yeni fatura oluştur |
| PUT | `/api/faturalar/:id` | Fatura güncelle |
| DELETE | `/api/faturalar/:id` | Fatura sil |
| GET | `/api/faturalar/:id/kalemler` | Fatura kalemleri listesi |
| POST | `/api/faturalar/:id/kalemler` | Kalem ekle |

### AI Analiz Endpoint

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | `/api/faturalar/analiz` | Fatura görselini AI ile analiz et |

**Request Format:**
```json
{
  "image": "data:image/jpeg;base64,/9j/4AAQ...",
  "fatura_no": "FAT2024-001"  // opsiyonel
}
```

**Success Response (200):**
```json
{
  "success": true,
  "request_id": "uuid-v4",
  "processing_time_ms": 3500,
  "data": {
    "fatura_no": "FAT2024-001",
    "belge_tarih": "2024-12-28",
    "vade_tarihi": "2025-01-28",
    "tedarikci_id": 15,
    "aciklama": "Açıklama metni",
    "kalemler": [
      {
        "stok_kodu": "PRC-001",
        "mal_hizmet_adi": "Parça A",
        "miktar": 100,
        "birim": "Adet",
        "birim_fiyat": 25.50,
        "kdv_orani": 20
      }
    ]
  },
  "metadata": {
    "document_type": "fatura",
    "model": "gemini-2.0-flash-exp",
    "timestamp": "2024-12-28T10:30:00.000Z"
  }
}
```

**Error Response (4xx/5xx):**
```json
{
  "success": false,
  "error": "Hata mesajı",
  "request_id": "uuid-v4"
}
```

### Lock Yönetimi

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | `/api/faturalar/:id/lock` | Fatura kilitle (düzenleme için) |
| DELETE | `/api/faturalar/:id/lock` | Kildi bırak |

---

## ✅ Frontend Validasyon Kuralları

### Form Validasyonu (Formik + Yup)

```javascript
// Zorunlu alanlar
tedarikci_id: number (required)
fatura_no: string (required, max 50 karakter)
belge_tarih: date (required)
vade_tarihi: date (optional, >= belge_tarih)

// Kalem validasyonu
stok_kodu: string (required)
parca_adi: string (required)
miktar: number (required, >= 0.0001)
birim_fiyat: number (optional, >= 0)
```

### Backend Validasyonu

```javascript
// Route level validation
fatura_no: trim().notEmpty().isLength({ max: 50 })
tedarikci_id: isInt()
belge_tarih: isISO8601().toDate()
kalemler: optional().isArray()

// Model level validation
stok_kodu: notNull, notEmpty
mal_hizmet_adi: notNull, notEmpty
miktar: notNull
```

---

## 🔒 Validasyon Hata Mesajları

| Hata Kodu | Mesaj | Çözüm |
|-----------|-------|--------|
| VALIDATION_ERROR | "Mal/Hizmet adı zorunludur" | Kalemde parça adı boş |
| VALIDATION_ERROR | "Stok kodu zorunludur" | Kalemde stok kodu boş |
| DUPLICATE_ENTRY | "Bu fatura no zaten mevcut" | Farklı fatura no kullan |
| LOCKED_BY_OTHER | "Kayıt başka bir kullanıcı tarafından kilitli" | Bekleyip tekrar dene |
| NOT_FOUND | "Fatura bulunamadı" | Fatura ID kontrol et |

---

## 🎨 UI Bileşenleri

### FaturaForm Component
- **Konum**: `frontend/src/components/FaturaForm.jsx`
- **Tür**: Dialog (Modal)
- **Özellikler**:
  - Formik form yönetimi
  - Material-UI komponentleri
  - AI upload butonu
  - Kalem tablosu (ekle/sil/düzenle)
  - Otomatik hesaplama (toplam tutar)
  - Hata yönetimi

### Faturalar Page
- **Konum**: `frontend/src/pages/Faturalar.jsx`
- **Özellikler**:
  - DataGrid tablosu
  - Filtreleme (arama, durum, tarih aralığı)
  - Sayfalama (10, 20, 50, 100)
  - Sıralama (tarih, tutar)
  - İşlem butonları (eşleştir, detay)

### FaturaDetay Page
- **Konum**: `frontend/src/pages/FaturaDetay.jsx`
- **Özellikler**:
  - Fatura bilgileri gösterimi
  - Kalem listesi tablosu
  - Düzenleme butonu
  - Silme butonu
  - Eşleştirme butonu
  - Lock/unlock butonları

---

## 📊 Fatura Durumları

| Durum | Değer | Açıklama |
|-------|-------|----------|
| Bekliyor | `bekliyor` | Henüz eşleşme yapılmadı |
| Kısmi Eşleşti | `kismi_eslesti` | Bazı kalemler eşleşti |
| Tam Eşleşti | `tam_eslesti` | Tüm kalemler eşleşti |

Durum güncellemesi otomatik:
- Eşleştirme sonrası otomatik güncellenir
- Kalemlerin `eslesme_durumu` 1 ise eşleşmiş sayılır

---

## 🔧 Yapılandırma

### Environment Variables

```bash
# Backend (.env)
N8N_FATURA_WEBHOOK_URL=https://n8n.igenis.com/webhook/fatura-analiz
N8N_API_KEY=your_api_key_here

# Frontend (Vite proxy)
VITE_API_BASE_URL=/api
```

### n8n Workflow

**Workflow Name**: Fatura Analiz
**Webhook Path**: `/fatura-analiz`
**Trigger**: POST request
**Processing**:
1. Input validation
2. Image cleaning (base64)
3. Gemini Vision API analizi
4. JSON parse ve validasyon
5. Response formatting

---

## 🧪 Test Senaryoları

### TC-01: Manuel Fatura Oluşturma
```
Given: Kullanıcı fatura formunu açar
When: Tüm zorunlu alanları doldurur
Then: Fatura başarıyla kaydedilir
Then: Fatura listesinde görünür
```

### TC-02: AI ile Fatura Analizi
```
Given: Kullanıcı yeni fatura formu açar
When: "Fatura Görseli Yükle" butonuna tıklar ve geçerli bir görüntü seçer
Then:
  - Görüntü yüklenir
  - AI analizi başlar
  - 3-5 saniye içinde analiz tamamlanır
  - Form alanları doldurulur
  - "✓ AI Analiz Tamamlandı" bildirimi gösterilir
```

### TC-03: Fatura-İrsaliye Eşleştirme
```
Given: Kullanıcının faturası var ve irsaliyeler mevcut
When: "Eşleştir" butonuna tıklar
Then:
  - Eşleştirme sayfası açılır
  - Otomatik eşleşme yapılır (skor >= 50)
  - Eşleşmeler görsel olarak gösterilir
  - Onaylama sonrası fatura durumu güncellenir
```

### TC-04: Geçersiz Fatura Numarası
```
Given: Kullanıcı mevcut bir fatura no girer
When: "Kaydet" butonuna tıklar
Then: "Bu fatura no zaten mevcut" hatası gösterilir
```

### TC-05: Boş Kalem ile Kaydetme
```
Given: Kullanıcı kalemler olmadan kaydetmeye çalışır
When: "Kaydet" butonuna tıklar
Then: Form validasyonu engeller
```

---

## 📚 İlgili Dokümanlar

- [n8n Fatura Workflow](../docs/n8n-fatura-workflow.md)
- [Fatura AI Upload Workflow](../docs/workflows/fatura-ai-upload-workflow.md)
- [İrsaliye-Fatura Eşleştirme](../_context/fatura_irsaliye_esle.md)
- [API Documentation](./api-documentation.md)

---

## 🚀 Deployment

### Production Kurulum

1. **n8n Workflow**:
   - n8n paneline git
   - "İrsaliye Analiz" workflow'unu kopyala
   - Webhook path'i `fatura-analiz` olarak değiştir
   - Gemini prompt'u fatura için güncelle
   - Workflow'u aktif et

2. **Backend**:
   - `.env` dosyasını güncelle
   - `npm run build`
   - Restart backend service

3. **Frontend**:
   - `npm run build`
   - Production build'i test et
   - Deploy to CDN/server

### Monitoring

```bash
# Backend logları
tail -f logs/combined.log | grep "fatura-analiz"

# n8n execution logları
n8n Panel → Executions → "Fatura Analiz"
```

---

## 💡 İpuçları

1. **AI Analiz**:
   - net ve okunabilir fatura görselleri kullanın
   - İngilizce faturalar daha iyi tanınır
   - Karmaşık düzenler için manuel düzeltme yapın

2. **Eşleştirme**:
   - Stok kodları tutarlı kullanın
   - Önce irsaliyeleri oluşturun
   - Eşleşme skorunu inceleyin

3. **Performans**:
   - Büyük fatura listelerinde sayfalama kullanın
   - Filtreleme ile sonuç daraltın
   - AI analizi için ortalama 3-5 saniye bekleyin

---

**Rapor Hazırlayan**: Claude Code AI Assistant
**Son Güncelleme**: 2024-12-28 20:56
