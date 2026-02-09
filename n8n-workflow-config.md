# n8n Workflow Konfigürasyonu - İrsaliye AI Analizi

## Özet

Bu doküman, irsaliye yükleme özelliği için gerekli n8n workflow konfigürasyonunu açıklar. Frontend'den gelen Base64 kodlu irsaliye dosyası alır, Gemini AI ile analiz eder ve yapılandırılmış veriyi döndürür.

## Workflow URL

Frontend configuration'da kullanılan URL (Test Mode):
```
https://n8n.igenis.com/webhook-test/irsaliye-yukle
```

Notlar:
- `/webhook-test/` prefix'i test webhook için kullanılır
- Production için `/webhook/` prefix'i kullanılır

## Beklenen Girdi Formatı

Frontend'den gelen POST request body:

```json
{
  "fileName": "irsaliye_2024.pdf",
  "fileType": "application/pdf",
  "fileData": "data:application/pdf;base64,JVBERi0xLjQKJ..."
}
```

## Beklenen Çıktı Formatı

Frontend'in beklediği response formatı:

```json
{
  "success": true,
  "data": {
    "irsaliye_no": "IRS20240115001",
    "belge_tarih": "2024-01-15",
    "firma_id": "",  // Kullanıcı seçecek
    "tur": "alis",   // "alis" veya "satis"
    "aciklama": "AI tarafından analiz edildi",
    "kalemler": [
      {
        "parca_id": "",     // Kullanıcı parça seçecek
        "miktar": 100,
        "birim": "Adet"
      },
      {
        "parca_id": "",
        "miktar": 50.5,
        "birim": "KG"
      }
    ]
  }
}
```

## n8n Workflow Yapısı

### 1. Webhook Node (Trigger)

**Node Type**: Webhook
**Method**: POST
**Path**: `irsaliye-yukle`
**Authentication**: None (geliştirme için)

### 2. Function Node - Veri Hazırlama

**Node Type**: Function
**Purpose**: Base64 veriyi ayıklar ve Gemini prompt hazırlar

```javascript
// Input data'dan Base64'i çıkar
const fileData = $input.item.json.fileData;
const fileName = $input.item.json.fileName;

// Base64 header'ı kaldır (data:application/pdf;base64, kısmı)
const base64Content = fileData.split(',')[1];

// Gemini AI prompt hazırla
const prompt = `
Bu irsaliye belgesini analiz et ve aşağıdaki JSON formatında döndür:

{
  "irsaliye_no": "İrsaliye numarası (örn: IRS20240115001)",
  "belge_tarih": "YYYY-MM-DD formatında tarih",
  "tur": "alis" veya "satis" (alış/satış),
  "aciklama": "Kısa açıklama",
  "kalemler": [
    {
      "stok_kodu": "Stok kodu varsa",
      "parca_adi": "Parça adı",
      "miktar": sayı değeri,
      "birim": "Adet, KG, Lt, Mt vb."
    }
  ]
}

Kurallar:
- Tarih her zaman YYYY-MM-DD formatında olmalı
- Miktar sayı olmalı (string değil)
- Eğer stok_kodu okunamıyorsa boş string bırak
- En az 1 kalem döndür
- Firma ID döndürme (kullanıcı seçecek)
`;

return {
  json: {
    base64Content: base64Content,
    fileName: fileName,
    prompt: prompt
  }
};
```

### 3. Gemini AI Node

**Node Type**: Gemini
**Model**: Gemini Pro Vision
**Operation**: Generate Content

**Configuration**:
- **Prompt**: `{{ $json.prompt }}`
- **Image Input**: `{{ $json.base64Content }}` (Base64 format)
- **Response Format**: JSON

### 4. Function Node - JSON Parse ve Validasyon

**Node Type**: Function
**Purpose**: Gemini yanıtını parse eder ve validasyon yapar

```javascript
// Gemini yanıtını al
const aiResponse = $input.item.json.response;

// JSON parse
let parsedData;
try {
  // Gemini bazen markdown code block içinde döndürür
  const jsonMatch = aiResponse.match(/```json\n([\s\S]*?)\n```/) ||
                   aiResponse.match(/```\n([\s\S]*?)\n```/);

  if (jsonMatch) {
    parsedData = JSON.parse(jsonMatch[1]);
  } else {
    parsedData = JSON.parse(aiResponse);
  }
} catch (error) {
  throw new Error('Gemini yanıtı JSON formatında değil: ' + error.message);
}

// Validasyon
if (!parsedData.irsaliye_no) {
  throw new Error('irsaliye_no alanı zorunlu');
}
if (!parsedData.belge_tarih) {
  throw new Error('belge_tarih alanı zorunlu');
}
if (!parsedData.kalemler || !Array.isArray(parsedData.kalemler)) {
  throw new Error('kalemler alanı zorunlu ve array olmalı');
}

// Tarih formatını kontrol et ve düzelt
const tarihMatch = parsedData.belge_tarih.match(/(\d{4})-(\d{2})-(\d{2})/);
if (!tarihMatch) {
  throw new Error('belge_tarih YYYY-MM-DD formatında olmalı');
}

// Çıktı formatını frontend'e uygun hale getir
const output = {
  irsaliye_no: String(parsedData.irsaliye_no || ''),
  belge_tarih: parsedData.belge_tarih,
  firma_id: '',  // Kullanıcı seçecek
  tur: parsedData.tur === 'satış' || parsedData.tur === 'satis' ? 'satis' : 'alis',
  aciklama: parsedData.aciklama || 'AI tarafından analiz edildi',
  kalemler: (parsedData.kalemler || []).map(kalem => ({
    parca_id: '',  // Kullanıcı seçecek
    miktar: parseFloat(kalem.miktar) || 0,
    birim: kalem.birim || 'Adet'
  }))
};

return {
  json: output
};
```

### 5. Respond to Webhook Node

**Node Type**: Respond to Webhook
**Response Body**:

```json
{
  "success": true,
  "data": {{ $json }}
}
```

**Status Code**: 200
**Response Headers**:
```
Content-Type: application/json
```

## Hata Yönetimi

### Error Workflow

Hata durumlarında frontend'e anlamlı hata mesajları döndürün:

```json
{
  "success": false,
  "error": "Hata mesajı buraya",
  "data": null
}
```

**Yaygın Hatalar**:
1. **Dosya boyutu fazla**: "Dosya boyutu 10MB'dan büyük olamaz"
2. **Geçersiz dosya formatı**: "Sadece PDF ve resim dosyaları desteklenir"
3. **Gemini API hatası**: "AI analizi başarısız oldu"
4. **JSON parse hatası**: "Belge analizi başarısız, okunamayan format"

## Environment Variables

n8n'de bu environment variables'ları tanımlayın:

```bash
GEMINI_API_KEY=your_gemini_api_key_here
```

## Test Senaryosu

### Test Input

```json
{
  "fileName": "test_irsaliye.pdf",
  "fileType": "application/pdf",
  "fileData": "data:application/pdf;base64,JVBERi0x..."
}
```

### Expected Output

```json
{
  "success": true,
  "data": {
    "irsaliye_no": "IRS20250115001",
    "belge_tarih": "2025-01-15",
    "firma_id": "",
    "tur": "alis",
    "aciklama": "AI tarafından analiz edildi",
    "kalemler": [
      {
        "parca_id": "",
        "miktar": 100,
        "birim": "Adet"
      }
    ]
  }
}
```

## Frontend Entegrasyonu

Frontend configuration (`.env` - Test Mode):

```bash
REACT_APP_N8N_WEBHOOK_URL=https://n8n.igenis.com/webhook-test/irsaliye-yukle
```

Not: Production ortamında `/webhook-test/` yerine `/webhook/` kullanın.

## İleri Özellikler (Optional)

### 1. Firma Eşleştirme

Eğer AI firma adını da çıkarabiliyorsa:

```javascript
// Firma eşleştirme ekleyin
const firmaAdi = parsedData.firma_adi || '';
const firmaMatch = await getFirmaByName(firmaAdi);
output.firma_id = firmaMatch?.id || '';
```

### 2. Parça Eşleştirme

Stok koduna göre parça eşleştirme:

```javascript
// Her kalem için parça eşleştirme
output.kalemler = await Promise.all(parsedData.kalemler.map(async kalem => {
  if (kalem.stok_kodu) {
    const parca = await getParcaByStokKodu(kalem.stok_kodu);
    return {
      parca_id: parca?.id || '',
      miktar: parseFloat(kalem.miktar) || 0,
      birim: kalem.birim || 'Adet'
    };
  }
  return {
    parca_id: '',
    miktar: parseFloat(kalem.miktar) || 0,
    birim: kalem.birim || 'Adet'
  };
}));
```

### 3. Güvenlik

Webhook için authentication ekleyin:

```javascript
// Webhook node - Header Authentication
 Headers: {
  "X-API-Key": "{{ $env.WEBHOOK_API_KEY }}"
 }
```

Frontend'de header ekleyin:

```javascript
fetch(n8nWebhookUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': process.env.REACT_APP_N8N_API_KEY
  },
  // ...
});
```

## Troubleshooting

### n8n Workflow Çalışmıyor

1. n8n'in çalıştığını kontrol edin: `https://n8n.igenis.com`
2. Webhook URL'yi kontrol edin
3. Execution log'u inceleyin
4. Gemini API key'in geçerli olduğunu kontrol edin

### Frontend Hata Alıyor

1. Browser console'da network request'i inceleyin
2. CORS hatası varsa n8n settings'den CORS'u enable edin
3. Response formatının doğru olduğunu kontrol edin

### AI Yanıtı Yanlış

1. Prompt'u netleştirin
2. Örnek output ekleyin
3. Validasyon kurallarını sıkılaştırın
