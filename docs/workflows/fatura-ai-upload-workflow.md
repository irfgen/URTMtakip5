# Fatura AI Upload Implementation Workflow

## 📋 Workflow Overview

**Proje**: ÜRTM Takip - Fatura Yükleme ve AI Analiz Entegrasyonu
**Durum**: Implementation Tamamlandı ✅
**Tarih**: 2024-12-28
**Branch**: v14.dev1

---

## 🎯 Hedef

Fatura modülüne AI-powered görsel yükleme ve otomatik analiz özelliği eklemek. İrsaliye modülündeki mevcut yapıyı fatura için uyarlayarak, n8n + Gemini Vision API entegrasyonu ile fatura görsellerinden veri çıkarımını sağlamak.

---

## ✅ Tamamlanan Görevler

### 1. Frontend - FaturaForm Bileşeni
- **Dosya**: `frontend/src/components/FaturaForm.jsx`
- **Değişiklikler**:
  - ✅ `useRef`, `Collapse`, `Card`, `CardMedia` import'ları eklendi
  - ✅ AI analiz state'leri eklendi: `faturaImage`, `analyzing`, `imageExpanded`, `aiDataLoaded`, `fileInputRef`
  - ✅ `handleImageUpload()`: Görüntü yükleme ve base64 dönüşüm
  - ✅ `analyzeFatura()`: `/api/faturalar/analiz` API çağrısı
  - ✅ `handleRemoveImage()`: Görüntü kaldırma
  - ✅ Upload butonu UI (dashed border, cloud icon)
  - ✅ Görüntü önizleme Card (expandable, close button)
  - ✅ "AI Analiz Tamamlandı" success chip

### 2. Backend - API Endpoint
- **Dosya**: `backend/src/routes/faturalar.js`
- **Değişiklikler**:
  - ✅ `axios` ve `uuid` import'ları eklendi
  - ✅ **POST `/api/faturalar/analiz`** endpoint'i oluşturuldu
  - ✅ Base64 image cleaning (data:image/jpeg;base64,...)
  - ✅ n8n webhook payload (image, fatura_no, timestamp, request_id, document_type)
  - ✅ n8n webhook URL: `https://n8n.igenis.com/webhook/fatura-analiz`
  - ✅ 45 saniye timeout
  - ✅ Detaylı hata yönetimi (400, 500, 503, 504)
  - ✅ Request ID tracking

### 3. Dokümantasyon
- **Dosya**: `docs/n8n-fatura-workflow.md`
- ✅ n8n workflow kopyalama adımları
- ✅ Webhook path değişiklikleri
- ✅ Gemini Vision API prompt güncellemeleri
- ✅ Backend yapılandırması
- ✅ Frontend entegrasyonu
- ✅ API yanıt formatları
- ✅ Test senaryoları
- ✅ Monitoring ve debugging

---

## 🔧 Yapılandırma Adımları

### 1. Environment Variables

`.env` dosyasına ekle (veya mevcutsa doğrula):

```bash
# n8n Webhook URL for Fatura Analysis
N8N_FATURA_WEBHOOK_URL=https://n8n.igenis.com/webhook/fatura-analiz

# n8n API Key (opsiyonel, n8n panelinden al)
N8N_API_KEY=your_api_key_here
```

### 2. n8n Workflow Kurulumu

#### Adım 1: Mevcut İrsaliye Workflow'unu Dışa Aktar
```
n8n Panel → Workflows → "İrsaliye Analiz" → Export → JSON indir
```

#### Adım 2: Yeni Fatura Workflow Oluştur
```
n8n Panel → New Workflow → İndirilen JSON'i yapıştır
```

#### Adım 3: Değişiklikleri Uygula

**Node 1 - Webhook Trigger:**
```json
{ "path": "fatura-analiz" }
```

**Node 2 - Input Validation:**
```javascript
if ($json.fatura_no && typeof $json.fatura_no !== 'string') {
  return [{ error: 'Invalid fatura_no format' }];
}
```

**Node 3 - Gemini Prompt:**
```
Analyze this Turkish invoice (fatura) image and extract structured data.
Return ONLY a JSON object with:
{
  "fatura_no": "string",
  "belge_tarih": "YYYY-MM-DD",
  "vade_tarihi": "YYYY-MM-DD",
  "tedarikci_id": number,
  "aciklama": "string",
  "kalemler": [...]
}
```

**Node 6 - Success Response:**
```javascript
metadata: {
  document_type: 'fatura',
  model: 'gemini-2.0-flash-exp'
}
```

#### Adım 4: Kaydet ve Aktif Et
```
Save → Active toggle aç → Webhook URL'i kopyala
```

### 3. Backend Test

```bash
# Backend'i başlat
cd backend
npm run dev

# Test endpoint (başarılı analiz)
curl -X POST http://localhost:3000/api/faturalar/analiz \
  -H "Content-Type: application/json" \
  -d '{
    "image": "data:image/jpeg;base64,/9j/4AAQ...",
    "fatura_no": "TEST-001"
  }'

# Test (eksik görüntü - hata beklenir)
curl -X POST http://localhost:3000/api/faturalar/analiz \
  -H "Content-Type: application/json" \
  -d '{"fatura_no": "TEST-001"}'
```

### 4. Frontend Test

```
1. Frontend'i başlat: npm run dev
2. Browser: http://localhost:5173
3. Fatura sayfasına git
4. "Yeni Fatura" butonuna tıkla
5. "Fatura Görseli Yükle ve Analiz Et" butonuna tıkla
6. Fatura görseli seç (image/*)
7. AI analizi başlamasını bekle
8. Form alanlarının otomatik dolduğunu kontrol et
9. Kalemler listesini kontrol et
```

---

## 📁 Etkilen Dosyalar

```
frontend/
└── src/
    └── components/
        └── FaturaForm.jsx                    ✅ Güncellendi

backend/
└── src/
    └── routes/
        └── faturalar.js                       ✅ Güncellendi

docs/
    └── n8n-fatura-workflow.md                ✅ Yeni oluşturuldu
```

---

## 🔌 API Entegrasyon Detayları

### Endpoint: POST /api/faturalar/analiz

**Request:**
```json
{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABA...",
  "fatura_no": "FAT2024-001"  // opsiyonel
}
```

**Success Response (200 OK):**
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

**Error Response:**
```json
{
  "success": false,
  "error": "Hata mesajı",
  "request_id": "uuid-v4"
}
```

**HTTP Status Codes:**
- `200`: Başarılı
- `400`: Geçersiz görüntü formatı / eksik veri
- `500`: AI servisi geçici olarak kullanılamıyor
- `503`: AI servisi ile bağlantı kurulamadı
- `504`: Analiz zaman aşımına uğradı (45 saniye)

---

## 🎨 UI/UX Detayları

### Upload Butonu (Boş Durum)
```
┌─────────────────────────────────────────┐
│  ☁  Fatura Görseli Yükle ve Analiz Et    │
│         (dashed border, full width)      │
└─────────────────────────────────────────┘
```

### Loading Durumu
```
🔄 Fatura Analiz Ediliyor...
⏳ AI ile fatura analizi yapılıyor, lütfen bekleyin...
```

### Görüntü Yüklendi (Collapsed)
```
┌─────────────────────────────────────────┐
│  [Fatura Görseli Önizleme]              │
│  ⬆️ Genişlet  ✓ AI Analiz Tamamlandı  ❌  │
└─────────────────────────────────────────┘
```

### Görüntü Yüklendi (Expanded)
```
┌─────────────────────────────────────────┐
│                                         │
│         [Tam Ekran Görüntü]              │
│                                         │
└─────────────────────────────────────────┘
  ⬇️ Gizle  ✓ AI Analiz Tamamlandı  ❌
```

---

## 🧪 Test Cases

### TC-01: Başarılı Görüntü Yükleme
```
Given: Kullanıcı fatura formunu açar
When: "Fatura Görseli Yükle" butonuna tıklar ve geçerli bir görüntü seçer
Then:
  - Görüntü yüklenir ve gösterilir
  - AI analizi başlar
  - 3-5 saniye içinde analiz tamamlanır
  - Form alanları doldurulur
  - "✓ AI Analiz Tamamlandı" chip gösterilir
```

### TC-02: Geçersiz Dosya Formatı
```
Given: Kullanıcı upload butonuna tıklar
When: PDF dosyası seçer (image/* değil)
Then:
  - Dosya seçilmez (accept="image/*")
  - Hata mesajı gösterilmez
```

### TC-03: Büyük Dosya Yükleme
```
Given: Kullanıcı upload butonuna tıklar
When: 10MB'den büyük bir görüntü seçer
Then:
  - "Dosya boyutu çok büyük. Maksimum 10MB." hatası
  - Analiz başlamaz
  - Görüntü yüklenmez
```

### TC-04: Analiz Zaman Aşımı
```
Given: Kullanıcı görüntü yükler
When: n8n servisi 45 saniye içinde yanıt vermez
Then:
  - "Analiz zaman aşımına uğradı" hatası
  - Görüntü yüklenmiş kalır
  - Kullanıcı tekrar deneyebilir
```

### TC-05: Görüntü Kaldırma
```
Given: Yüklenmiş ve analiz edilmiş bir fatura görüntüsü var
When: ❌ (close) butonuna tıklar
Then:
  - Görüntü kaldırılır
  - "AI Analiz Tamamlandı" chip kaybolur
  - Form verisi korunur
```

### TC-06: Manuel Düzenleme
```
Given: AI analizi ile doldurulmuş form var
When: Kullanıcı verileri manuel olarak düzenler
Then:
  - Form verileri güncellenebilir
  - Kaydet butonu çalışır
  - AI verileri override edilebilir
```

---

## 🚀 Deployment Checklist

### Pre-Deployment
- [ ] n8n workflow oluşturuldu ve aktif edildi
- [ ] Environment variables ayarlandı
- [ ] Backend endpoint test edildi
- [ ] Frontend UI test edildi
- [ ] Error handling doğrulandı

### Production Deployment
1. **n8n Workflow**:
   - [ ] Production n8n instance'a deploy et
   - [ ] Webhook URL'i production environment variable'a ekle
   - [ ] Gemini API key'i kontrol et
   - [ ] Workflow'u aktif et

2. **Backend**:
   - [ ] `.env` dosyasını güncelle
   - [ ] `npm run build` (production build)
   - [ ] Restart backend service

3. **Frontend**:
   - [ ] `npm run build`
   - [ ] Production build'i test et
   - [ ] Deploy to CDN/server

### Post-Deployment
- [ ] Canlı test: Fatura oluştur → AI analiz → Kaydet
- [ ] Backend loglarını izle: `tail -f logs/combined.log | grep fatura-analiz`
- [ ] n8n execution loglarını kontrol et
- [ ] Hata raporlarını izle

### Rollback Plan
Sorun oluşursa:
1. n8n workflow'u deaktif et
2. Frontend upload butonunu gizle (optional prop)
3. Backend endpoint'i comment'le
4. Manuel veri girişine dön

---

## 📊 Monitoring

### Backend Logs
```bash
# Backend loglarını izle
cd backend
tail -f logs/combined.log | grep "fatura-analiz"

# Winston error logları
tail -f logs/error.log
```

### n8n Executions
```
n8n Panel → Executions → "Fatura Analiz" workflow
- Son execution'ları görüntüle
- Başarılı/başarısız oranları
- Processing time'ları analiz et
```

### Key Metrics
- **Analiz Başarısı**: %90+ hedef
- **Ortalama Processing Time**: <5 saniye hedef
- **Error Rate**: <%5 hedef
- **Timeout Rate**: <%2 hedef

---

## 🐛 Bilinen Sorunlar ve Çözümler

### Sorun: "Analiz başarısız" hatası
**Çözüm**:
1. n8n workflow'unun aktif olduğunu kontrol et
2. Webhook URL'in doğru olduğunu doğrula
3. Gemini API key'in geçerli olduğunu kontrol et
4. Backend loglarını kontrol et: `tail -f logs/combined.log`

### Sorun: Görüntü yüklenmiyor
**Çözüm**:
1. Dosya formatını kontrol et (image/*)
2. Dosya boyutunu kontrol et (max 10MB)
3. Browser console'u kontrol et
4. Network tab'da API çağrısını kontrol et

### Sorun: Form alanları doldurulmuyor
**Çözüm**:
1. API yanıt formatını kontrol et
2. Alan adlarını doğrula (fatura_no vs irsaliye_no)
3. Frontend console'da hata mesajlarını kontrol et
4. AI analiz sonucunu logla

---

## 🔄 İleri Adımlar

### Phase 2: İyileştirmeler
- [ ] **Batch Processing**: Birden fazla fatura aynı anda
- [ ] **PDF Support**: PDF fatura formatı desteği
- [ ] **Auto-Matching**: Analiz sonrası otomatik irsaliye eşleştirme
- [ ] **Confidence Score**: AI analiz güvenilirlik skoru
- [ ] **History**: Analiz geçmişi ve tekrar kullanım

### Phase 3: Optimizasyon
- [ ] **Image Compression**: Görüntüleri otomatik_compress et
- [ ] **Caching**: Aynı fatura için cache kullan
- [ ] **Queue**: Asenkron job queue ile işlem
- [ ] **CDN**: n8n sunucu için CDN kullan
- [ ] **Rate Limiting**: 60 req/minute limit

---

## 📚 Referanslar

### İlgili Dokümanlar
- [n8n Fatura Workflow](docs/n8n-fatura-workflow.md)
- [Fatura-İrsaliye Eşleştirme Context](_context/fatura_irsaliye_esle.md)
- [İrsaliye Analiz Workflow](docs/n8n-integration-workflow.md)
- [Knowledge Base](docs/knowledge-base.md)

### Mevcut Kod Referansları
- **İrsaliye Upload**: `frontend/src/pages/IrsaliyeForm.jsx:303-356`
- **İrsaliye API**: `backend/src/routes/irsaliyeler.js:317-450`
- **Eşleştirme Service**: `backend/src/services/eslestirmeService.js`
- **Socket.IO Middleware**: `backend/src/middleware/socket.js`

---

## ✅ Completion Status

| Görev | Durum | Notlar |
|------|-------|--------|
| Frontend - FaturaForm UI | ✅ | Upload butonu + AI analiz |
| Frontend - State Management | ✅ | useRef + useState |
| Frontend - API Integration | ✅ | /api/faturalar/analiz |
| Backend - API Endpoint | ✅ | POST /analiz route |
| Backend - n8n Integration | ✅ | Webhook call + error handling |
| Backend - Validation | ✅ | Image + fatura_no validation |
| Dokümantasyon - n8n Workflow | ✅ | Kurulum adımları |
| Dokümantasyon - API Specs | ✅ | Request/Response formatları |
| Dokümantasyon - Test Cases | ✅ | TC-01 through TC-06 |
| Deployment Checklist | ✅ | Pre/Post-deployment |

---

**Workflow Durumu**: ✅ TAMAMLANDI
**Production Ready**: Evet (n8n workflow kurulumu gerekli)
**Test Edildi**: Hayır (kullanıcı tarafında test bekleniyor)
**Son Güncelleme**: 2024-12-28

---

*Bu workflow, fatura yükleme özelliğinin tam implementation planını içerir. Tüm kod değişiklikleri tamamlanmış ve deploy için hazırdır.*
