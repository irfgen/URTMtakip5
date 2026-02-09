# Hibrit İrsaliye Analizi Sistemi

> n8n workflow alternatifi - Rule-based OCR + AI-powered document analysis
> Version: 1.0 | Last Updated: 2026-02-04

## 📋 Overview

Sistem, irsaliye ve fatura belgelerini analiz etmek için hibrit bir yaklaşım kullanır:
- **Rule-based Parser**: Basit belgeler için hızlı OCR + pattern matching (ücretsiz)
- **AI Analyzer**: Karmaşık belgeler için LLM-powered analysis (OpenAI/Anthropic)
- **Akıllı Router**: Belge karmaşıklığına göre otomatik yönlendirme

## 🏗️ Mimari

```
┌─────────────────────────────────────────────────────────────────┐
│                    İrsaliye Analiz Request                     │
│                           │                                    │
│                           ▼                                    │
│              ┌─────────────────────────────┐                   │
│              │   HybridAnalysisService     │                   │
│              │   (Complexity Scoring)      │                   │
│              └───────────────┬─────────────┘                   │
│                              │                                 │
│                 ┌────────────┴────────────┐                   │
│                 ▼                         ▼                    │
│        ┌────────────────┐        ┌────────────────┐           │
│        │  Low Score     │        │  High Score    │           │
│        │  (< 0.5)       │        │  (≥ 0.5)       │           │
│        └────────┬───────┘        └────────┬───────┘           │
│                 │                        │                    │
│                 ▼                        ▼                    │
│      ┌──────────────────┐    ┌──────────────────┐            │
│      │ Rule-based       │    │ AI Analyzer       │            │
│      │ Parser Service   │    │ (LLM API)         │            │
│      │                  │    │                   │            │
│      │ • Tesseract OCR  │    │ • OpenAI GPT-4o   │            │
│      │ • Pattern Match  │    │ • Anthropic Claude │            │
│      │ • Fast & Free    │    │ • Higher Accuracy │            │
│      └──────────────────┘    └──────────┬───────┘            │
│                                         │                       │
│                                         ▼                       │
│                              ┌──────────────────┐              │
│                              │ Stok Kartı       │              │
│                              │ Matcher Service  │              │
│                              │                   │              │
│                              │ • Code Matching  │              │
│                              │ • Name Similarity│              │
│                              │ • Validation     │              │
│                              └─────────┬─────────┘              │
│                                        │                        │
│                                        ▼                        │
│                              ┌──────────────────┐              │
│                              │ Structured Output│              │
│                              │ • İrsaliye No     │              │
│                              │ • Tedarikçi      │              │
│                              │ • Tarih          │              │
│                              │ • Kalemler       │              │
│                              └──────────────────┘              │
└─────────────────────────────────────────────────────────────────┘
```

## 📁 Dosya Yapısı

```
backend/src/services/irsaliye/
├── index.js                          # Ana export dosyası
├── IrsaliyeParserService.js          # Rule-based OCR parser
├── AIAnalyzerService.js              # LLM API analyzer
├── HybridAnalysisService.js          # Akıllı router servis
├── StokKartiMatcherService.js        # Stok kartı eşleştirme
└── IrsaliyeAnalysisService.test.js   # Test & health check
```

## 🔌 API Endpoints

| Endpoint | Method | Açıklama |
|----------|--------|----------|
| `/api/irsaliyeler/analiz/v2` | POST | Hibrit irsaliye analizi |
| `/api/irsaliyeler/analiz/health` | GET | Servis durumu |
| `/api/irsaliyeler/analiz/metrics` | GET | Performans metrikleri |
| `/api/irsaliyeler/analiz` | POST | n8n workflow (DEPRECATED) |

## 📤 Request Format (POST /analiz/v2)

```json
{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "strategy": "hybrid",        // rule_based | ai_based | hybrid
  "force_ai": false,           // true = her zaman AI kullan
  "context": {                // Opsiyonel - stok kartları
    "stokKartlari": [...],
    "tedarikciler": [...]
  }
}
```

## 📥 Response Format

```json
{
  "success": true,
  "data": {
    "irsaliyeNo": "ABC123",
    "tedarikci": "Firma A.Ş.",
    "tarih": "2026-02-04",
    "kalemler": [
      {
        "stokKodu": "ABC001",
        "malHizmetAdi": "Plaka 5mm",
        "miktar": 10,
        "birim": "adet",
        "eslenenStokKartiId": 123,
        "matchScore": 0.95,
        "confidence": 0.85
      }
    ],
    "toplamTutar": 1500.50,
    "eslesmeyenKalemler": [],
    "eslesmeOzeti": {
      "exactMatches": 5,
      "highConfidenceMatches": 2,
      "noMatches": 0
    }
  },
  "metadata": {
    "parseMethod": "hybrid_merged",
    "analysisMethod": "hybrid",
    "processingTime": 3500,
    "complexityScore": 0.35,
    "ocrConfidence": 0.82,
    "aiModel": "gpt-4o",
    "validation": {
      "isValid": true,
      "warnings": [],
      "errors": []
    }
  }
}
```

## ⚙️ Environment Variables

```bash
# AI Configuration (Opsiyonel)
OPENAI_API_KEY=sk-...              # OpenAI API key
AI_PROVIDER=openai                # openai | anthropic
AI_MODEL=gpt-4o                    # Model seçimi

# Hibrit Ayarları
HYBRID_COMPLEXITY_THRESHOLD=0.5  # AI kullanım eşiği (0-1)
ENABLE_AI_ANALYSIS=true          # AIyi aç/kapat
FORCE_AI_ANALYSIS=false           # Zorla AI kullan

# OCR Ayarları
OCR_TIMEOUT=30000                 # OCR zaman aşımı (ms)
OCR_CONFIDENCE_THRESHOLD=0.5     # OCR güven eşiği
```

## 🎯 Strateji Seçimi

| Strateji | Kullanım Durumu | Maliyet | Doğruluk |
|----------|-----------------|--------|---------|
| `rule_based` | Basit belgeler, hızlı işlem | Ücretsiz | %70-80 |
| `ai_based` | Karmaşık belgeler, maksimum doğruluk | $$ | %90-95 |
| `hybrid` (default) | Otomatik seçim | $ | %80-90 |

## 🔍 Stok Kartı Eşleştirme

Sistem çıkarılan ürünleri mevcut stok kartlarıyla eşleştirir:

1. **Tam Eşleşme**: Stok kodu birebir aynı
2. **Yüksek Benzerlik**: İsim benzerliği >%85
3. **Orta Benzerlik**: İsim benzerliği >%70
4. **Düşük Benzerlik**: İsim benzerliği >%50

## 📊 Performans Metrikleri

```bash
# Metrikleri görüntüle
curl http://localhost:3000/api/irsaliyeler/analiz/metrics
```

```json
{
  "totalAnalyses": 150,
  "ruleBasedCount": 120,      # %80 rule-based
  "aiBasedCount": 30,         # %20 AI-based
  "fallbackCount": 5,
  "avgProcessingTime": 2800,
  "ruleBasedRate": 0.80,
  "aiBasedRate": 0.20,
  "fallbackRate": 0.03
}
```

## 🚨 Hata Yönetimi

| Hata Durumu | Davranış |
|-------------|----------|
| API key yapılandırılmadı | Rule-based fallback |
| AI timeout | Rule-based fallback |
| OCR başarısız | Hata döndür |
| Stok kartı bulunamadı | Uyarı log, eşleşmeyen olarak işaretle |

## 🔧 Frontend Kullanımı

```javascript
import { irsaliyeAPI } from './services/api';

// Hibrit analiz (önerilen)
const result = await irsaliyeAPI.analyzeV2(base64Image);

// Sadece rule-based (hızlı)
const result = await irsaliyeAPI.analyzeV2(base64Image, {
  strategy: 'rule_based'
});

// Sadece AI (doğru ama pahalı)
const result = await irsaliyeAPI.analyzeV2(base64Image, {
  strategy: 'ai_based'
});
```

## 📈 Maliyet Analizi

| Hacim | n8n | Hibrit (AI %20) | Tasarruf |
|-------|-----|-----------------|---------|
| 100/ay | $50 | $10 | %80 |
| 500/ay | $250 | $50 | %80 |
| 1000/ay | $500 | $100 | %80 |

## 🔄 Geçiş (n8n → Hibrit)

1. **Frontend**: `/api/irsaliyeler/analiz` → `/api/irsaliyeler/analiz/v2`
2. **Response Format**: Aynı (backwards compatible)
3. **Error Handling**: Daha detaylı hata mesajları

## 🧪 Test

```bash
# Health check
curl http://localhost:3000/api/irsaliyeler/analiz/health

# Test analizi (küçük test resmi)
curl -X POST http://localhost:3000/api/irsaliyeler/analiz/v2 \
  -H "Content-Type: application/json" \
  -d '{"image":"base64data...","strategy":"rule_based"}'
```

## 📚 İlgili Modüller

- **İrsaliyeler**: [backend/src/controllers/irsaliyeController.js](../backend/src/controllers/irsaliyeController.js)
- **Routes**: [backend/src/routes/irsaliyeler.js](../backend/src/routes/irsaliyeler.js)
- **Frontend**: [frontend/src/pages/IrsaliyeForm.jsx](../frontend/src/pages/IrsaliyeForm.jsx)
