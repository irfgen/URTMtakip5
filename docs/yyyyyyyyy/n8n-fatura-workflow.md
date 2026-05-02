# n8n Fatura Analiz Workflow Dokümantasyonu

## Genel Bakış

Bu dokümantasyon, ÜRTM Takip sisteminde fatura görsellerinin AI ile analiz edilmesi için kullanılan n8n workflow'unun kurulumunu ve yapılandırmasını açıklar.

## Önemli Bilgi

**İrsaliye workflow'u ile Fatura workflow'u aynı Gemini Vision API yapısını kullanır.**

Tek fark:
- **İrsaliye**: `webhook/irsaliye-analiz` → `document_type: "irsaliye"`
- **Fatura**: `webhook/fatura-analiz` → `document_type: "fatura"`

Mevcut irsaliye workflow'unu kopyalayıp sadece webhook path'ini değiştirmek yeterlidir.

## Workflow Kopyalama Adımları

### 1. Mevcut Workflow'u Dışa Aktar

n8n panelinde:
1. Workflows menüsüne git
2. "İrsaliye Analiz" workflow'unu bul
3. Workflow'u seç ve "Export" seçeneğini tıkla
4. JSON formatında indir

### 2. Yeni Workflow Oluştur

1. "New Workflow" butonuna tıkla
2. İndirilen JSON içeriğini yapıştır
3. Aşağıdaki değişiklikleri yap:

#### Webhook Trigger Node (Node 1)

**Eski:**
```json
{
  "path": "irsaliye-analiz",
  "responseMode": "responseNode",
  "options": {}
}
```

**Yeni:**
```json
{
  "path": "fatura-analiz",
  "responseMode": "responseNode",
  "options": {}
}
```

#### Input Validation Node (Node 2)

**Eski:**
```javascript
// Validate required fields
if (!$json.image) {
  return [{ error: 'Image data is required' }];
}

if ($json.irsaliye_no && typeof $json.irsaliye_no !== 'string') {
  return [{ error: 'Invalid irsaliye_no format' }];
}

return [{ valid: true }];
```

**Yeni:**
```javascript
// Validate required fields
if (!$json.image) {
  return [{ error: 'Image data is required' }];
}

if ($json.fatura_no && typeof $json.fatura_no !== 'string') {
  return [{ error: 'Invalid fatura_no format' }];
}

return [{ valid: true }];
```

#### Gemini Vision API Prompt (Node 3)

**Prompt Değişikliği:**

**Eski:**
```
Analyze this Turkish delivery note (irsaliye) image and extract structured data.
...
Return ONLY a JSON object with this exact structure:
{
  "irsaliye_no": "string",
  "belge_tarih": "YYYY-MM-DD",
  ...
}
```

**Yeni:**
```
Analyze this Turkish invoice (fatura) image and extract structured data.
...
Return ONLY a JSON object with this exact structure:
{
  "fatura_no": "string",
  "belge_tarih": "YYYY-MM-DD",
  "vade_tarihi": "YYYY-MM-DD",  // Payment due date
  "tedarikci_id": number,        // Supplier ID (if detectable)
  "aciklama": "string",
  "kalemler": [
    {
      "stok_kodu": "string",
      "mal_hizmet_adi": "string",
      "miktar": number,
      "birim": "string",
      "birim_fiyat": number,
      "kdv_orani": number
    }
  ]
}
```

#### Success Response Formatter (Node 6)

**Eski:**
```javascript
return {
  success: true,
  request_id: $json.request_id,
  processing_time_ms: processingTime,
  data: $json.extractedData,
  metadata: {
    document_type: 'irsaliye',
    model: 'gemini-2.0-flash-exp',
    timestamp: $json.timestamp
  }
};
```

**Yeni:**
```javascript
return {
  success: true,
  request_id: $json.request_id,
  processing_time_ms: processingTime,
  data: $json.extractedData,
  metadata: {
    document_type: 'fatura',
    model: 'gemini-2.0-flash-exp',
    timestamp: $json.timestamp
  }
};
```

### 3. Workflow'u Kaydet ve Aktif Et

1. "Save" butonuna tıkla
2. "Active" toggle'ını aç
3. Webhook URL'i kopyala: `https://n8n.igenis.com/webhook/fatura-analiz`

## Backend Yapılandırması

### Environment Variables

`.env` dosyasına ekle:

```bash
# n8n Webhook URL for Fatura Analysis
N8N_FATURA_WEBHOOK_URL=https://n8n.igenis.com/webhook/fatura-analiz

# n8n API Key (opsiyonel, n8n panelinden al)
N8N_API_KEY=your_api_key_here
```

### Backend Route

`/api/faturalar/analiz` endpoint'i `backend/src/routes/faturalar.js` dosyasına eklenmiştir.

**Endpoint Özellikleri:**
- **Method**: POST
- **Content-Type**: application/json
- **Body**: `{ image: base64_string, fatura_no: string }`
- **Timeout**: 45 saniye
- **Rate Limiting**: Yakında eklenecek

## Frontend Entegrasyonu

### FaturaForm Bileşeni

`frontend/src/components/FaturaForm.jsx` dosyasında:

1. **Upload Butonu**: Kullanıcı fatura görselini seçer
2. **Base64 Dönüşümü**: Görüntü otomatik olarak base64'e çevrilir
3. **API Çağrısı**: `/api/faturalar/analiz` endpoint'ine POST isteği
4. **AI Analizi**: n8n → Gemini Vision API ile analiz
5. **Otomatik Doldurma**: Elde edilen veri forma yüklenir

### Kullanıcı Akışı

```
1. Kullanıcı "Fatura Görseli Yükle ve Analiz Et" butonuna tıklar
2. Dosya seçer (image/*)
3. Görüntü yüklenir ve önizleme gösterilir
4. Otomatik olarak AI analizi başlar
5. Analiz tamamlanınca:
   - Form alanları doldurulur (fatura_no, tarih, tedarikçi, etc.)
   - Kalemler listesine eklenir
   - "✓ AI Analiz Tamamlandı" bildirimi gösterilir
```

## API Yanıt Formatı

### Başarılı Yanıt

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

### Hata Yanıtları

```json
{
  "success": false,
  "error": "Hata mesajı",
  "request_id": "uuid-v4"
}
```

**Olası Hata Kodleri:**
- `400`: Geçersiz görüntü formatı
- `500`: AI servisi geçici olarak kullanılamıyor
- `503`: AI servisi ile bağlantı kurulamadı
- `504`: Analiz zaman aşımına uğradı

## Test Senaryoları

### 1. Başarılı Analiz

```bash
curl -X POST http://localhost:3000/api/faturalar/analiz \
  -H "Content-Type: application/json" \
  -d '{
    "image": "data:image/jpeg;base64,/9j/4AAQ...",
    "fatura_no": "TEST-001"
  }'
```

**Beklenen Yanıt:** 200 OK, extracted data ile

### 2. Eksik Görüntü

```bash
curl -X POST http://localhost:3000/api/faturalar/analiz \
  -H "Content-Type: application/json" \
  -d '{"fatura_no": "TEST-001"}'
```

**Beklenen Yanıt:** 400 Bad Request, "Image data is required"

### 3. Zaman Aşımı

45 saniyeden uzun süren analizler:

**Beklenen Yanıt:** 504 Gateway Timeout

## Monitoring ve Logging

### Backend Logs

```bash
# Backend loglarını izle
cd backend
npm run dev

# Winston loglarını görüntüle
tail -f logs/combined.log | grep "fatura-analiz"
```

### n8n Workflow Executions

1. n8n paneline git
2. Executions menüsüne tıkla
3. "Fatura Analiz" workflow'unu seç
4. Son execution'ları görüntüle

### Hata Ayıklama

**Sorun**: "Analiz başarısız" hatası

**Çözüm**:
1. n8n workflow'unun aktif olduğunu kontrol et
2. Webhook URL'in doğru olduğunu doğrula
3. Gemini API key'in geçerli olduğunu kontrol et

**Sorun**: "Analiz zaman aşımına uğradı"

**Çözüm**:
1. Görüntü boyutunu küçült (max 10MB)
2. Network bağlantısını kontrol et
3. n8n sunucu yükünü kontrol et

## Güvenlik

### API Key Yönetimi

1. **n8n API Key**: `.env` dosyasında sakla, asla repo'ya commit etme
2. **Webhook URL**: HTTPS kullan, production'da secret path kullan
3. **Rate Limiting**: Production'da 60 req/minute limit ekle

### Input Validation

- Görüntü boyutu: Max 10MB
- Görüntü formatı: `image/*` (JPEG, PNG)
- Base64 encoding: Zorunlu
- Timeout: 45 saniye

## Dağıtım

### Production

1. **Environment Variables**: Production'da `N8N_FATURA_WEBHOOK_URL` set et
2. **n8n Workflow**: Production workflow'unu aktif et
3. **Test**: Canlıya almadan önce test senaryolarını çalıştır
4. **Monitoring**: Winston loglarını ve n8n execution'larını izle

### Rollback

Sorun oluşursa:
1. n8n workflow'u deaktif et
2. Frontend'de upload butonunu gizle
3. Backend endpoint'ini comment'le
4. Manuel veri girişine dön

## İleri Geliştirmeler

### Planlanan Özellikler

1. **Batch Processing**: Birden fazla fatura aynı anda analiz edilebilir
2. **PDF Support**: PDF fatura formatı desteği
3. **Auto-Matching**: Analiz sonrası otomatik irsaliye eşleştirme
4. **Confidence Score**: AI analiz güvenilirlik skoru
5. **History**: Analiz geçmişi ve tekrar kullanım

### Performans Optimizasyonları

1. **Image Compression**: Görüntüleri otomatik_compress et
2. **Caching**: Aynı fatura için cache kullan
3. **Queue**: Asenkron job queue ile işlem
4. **CDN**: n8n sunucu için CDN kullan

## Kaynaklar

- [n8n Documentation](https://docs.n8n.io/)
- [Gemini API Documentation](https://ai.google.dev/)
- [ÜRTM Takip Wiki](./knowledge-base.md)
- [İrsaliye Analiz Workflow](./n8n-integration-workflow.md)
