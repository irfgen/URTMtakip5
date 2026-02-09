# n8n Workflow Integration Design Document

**Project**: ÜRTM Takip
**Feature**: İrsaliye Yükle - n8n Integration
**Version**: 1.0.0
**Date**: 2025-01-26
**Status**: Design Complete - Ready for Implementation

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Architecture Overview](#architecture-overview)
3. [n8n Workflow Specification](#n8n-workflow-specification)
4. [Backend Integration](#backend-integration)
5. [Security Implementation](#security-implementation)
6. [Testing Strategy](#testing-strategy)
7. [Migration Plan](#migration-plan)
8. [Monitoring & Logging](#monitoring--logging)

---

## Executive Summary

### Current State
- İrsaliye yükleme özelliği doğrudan Gemini Vision API kullanıyor
- Hardcoded API key güvenlik riski içeriyor
- Backend proxy pattern ile çalışıyor

### Target State
- n8n workflow ile orta katman eklemek
- Merkezi API key yönetimi (n8n credentials)
- Daha esnek ve sürdürülebilir mimari
- Detaylı error handling ve monitoring

### Benefits
1. **Security**: API key n8n credentials'da güvenli şekilde saklanır
2. **Flexibility**: Workflow görsel olarak düzenlenebilir
3. **Monitoring**: n8n dashboard ile detaylı execution tracking
4. **Scalability**: İleride başka AI servisleri kolayca eklenebilir
5. **Maintainability**: Backend kodu basitleşir, karmaşık logic n8n'e taşınır

---

## Architecture Overview

### New Data Flow

```
┌──────────────┐      ┌──────────────┐      ┌─────────────────┐      ┌──────────────┐
│   Frontend   │ ───► │   Backend    │ ───► │      n8n        │ ───► │  Gemini AI   │
│   (React)    │      │   (Express)  │      │  Workflow Engine│      │  Vision API  │
└──────────────┘      └──────────────┘      └─────────────────┘      └──────────────┘
      │                      │                        │
      │ 1. Upload            │ 2. Proxy              │ 3. Process
      │    Base64            │    Webhook            │    Image
      │                      │                        │
      │                      │                        │
      │                      │ 4. Response           │
      │◄─────────────────────┴────────────────────────┘
      │    Structured JSON
      │    Auto-fill data
      └──────────────────────┘
```

### Request/Response Cycle

**Request (1-2)**:
```json
POST /api/irsaliyeler/analiz
{
  "image": "data:image/jpeg;base64,...",
  "irsaliye_no": "IRS-1735234567890"
}

→ Backend
→ n8n Webhook: https://n8n.igenis.com/webhook/irsaliye-analiz
{
  "image": "base64_data",
  "irsaliye_no": "IRS-1735234567890",
  "timestamp": "2025-01-26T10:30:00Z",
  "request_id": "uuid-v4"
}
```

**Processing (3)**:
```
n8n Nodes:
1. Webhook (receive)
2. Validation (check size, format)
3. Gemini Vision API (analyze)
4. Parse Response (extract JSON)
5. Format Success/Error (structure)
6. Respond to Webhook (return)
```

**Response (4)**:
```json
{
  "success": true,
  "request_id": "uuid-v4",
  "processing_time_ms": 2340,
  "data": {
    "irsaliye_no": "IRS20240115001",
    "tedarikci_adi": "Firma A.Ş.",
    "belge_tarih": "15.01.2024",
    "aciklama": "Teslimat",
    "kalemler": [...]
  },
  "metadata": {
    "model": "gemini-2.0-flash-exp",
    "processed_at": "2025-01-26T10:30:02Z",
    "confidence_score": 0.95,
    "workflow_version": "1.0.0"
  }
}
```

---

## n8n Workflow Specification

### Workflow Configuration

**Workflow Name**: `İrsaliye Analiz Workflow`

**Nodes**: 6 nodes
1. Webhook Trigger
2. Input Validation
3. Gemini Vision API Call
4. Response Parsing
5. Success/Error Formatter
6. Respond to Webhook

### Node 1: Webhook Trigger

```yaml
Name: İrsaliye Analiz Webhook
Type: Webhook
Configuration:
  HTTP Method: POST
  Path: irsaliye-analiz
  Authentication: None
  Response Mode: responseNode
  Options:
    - Respond to Webhook: Last Node
    - Response Code: 200
```

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "image": { "type": "string" },
    "irsaliye_no": { "type": "string" },
    "timestamp": { "type": "string", "format": "date-time" },
    "request_id": { "type": "string" }
  },
  "required": ["image", "irsaliye_no"]
}
```

### Node 2: Input Validation

```javascript
// Validation Code
const items = $input.all();
const results = [];

for (const item of items) {
  const { image, irsaliye_no, request_id } = item.json;

  // Required fields
  if (!image || !irsaliye_no) {
    throw new Error(`Request ${request_id}: Missing required fields`);
  }

  // Size check (max 10MB)
  if (image.length > 13_000_000) {
    throw new Error(`Request ${request_id}: Image size exceeds 10MB limit`);
  }

  // Base64 format
  const base64Pattern = /^[A-Za-z0-9+/]*={0,2}$/;
  if (!base64Pattern.test(image)) {
    throw new Error(`Request ${request_id}: Invalid base64 format`);
  }

  const approximateSize = Math.round((image.length * 3) / 4);

  results.push({
    json: {
      ...item.json,
      validation: {
        passed: true,
        image_size_bytes: approximateSize,
        image_size_mb: (approximateSize / (1024 * 1024)).toFixed(2)
      }
    }
  });
}

return results;
```

### Node 3: Gemini Vision API Call

```yaml
Name: Gemini Vision Analysis
Type: HTTP Request
Configuration:
  Method: POST
  URL: https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent
  Authentication: Query Parameter (GEMINI_API_KEY from credentials)
  Response Format: JSON
  Options:
    - Response Response: Full Response
    - Retry On Fail: true
    - Max Retries: 3
    - Retry Delay: 2000
```

**Request Body**:
```json
{
  "contents": [{
    "parts": [
      {
        "inline_data": {
          "mime_type": "image/jpeg",
          "data": "={{$json.image}}"
        }
      },
      {
        "text": "Bu irsaliye belgesini analiz et ve JSON formatında döndür. Sadece JSON çıktısı ver, markdown kullanma:\n\n{\n  \"irsaliye_no\": \"\",\n  \"tedarikci_adi\": \"\",\n  \"belge_tarih\": \"DD.MM.YYYY\",\n  \"aciklama\": \"\",\n  \"kalemler\": [\n    {\"stok_kodu\": \"\", \"parca_adi\": \"\", \"miktar\": 0, \"birim\": \"\", \"aciklama\": \"\"}\n  ]\n}"
      }
    ]
  }],
  "generationConfig": {
    "temperature": 0.1,
    "maxOutputTokens": 2048
  }
}
```

### Node 4: Response Parsing

```javascript
// Parse Gemini Response
const items = $input.all();
const results = [];

for (const item of items) {
  try {
    const geminiResponse = item.json;
    const requestId = item.json.request_id;

    const candidates = geminiResponse.candidates || [];
    if (candidates.length === 0) {
      throw new Error(`Request ${requestId}: No candidates in response`);
    }

    const content = candidates[0].content?.parts?.[0]?.text || '';

    // Remove markdown
    let cleanedText = content
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .trim();

    // Parse JSON
    let parsedData;
    try {
      parsedData = JSON.parse(cleanedText);
    } catch (parseError) {
      throw new Error(`Request ${requestId}: Invalid JSON`);
    }

    // Validate fields
    const requiredFields = ['irsaliye_no', 'tedarikci_adi', 'belge_tarih'];
    const missingFields = requiredFields.filter(field => !parsedData[field]);

    if (missingFields.length > 0) {
      throw new Error(`Request ${requestId}: Missing fields: ${missingFields.join(', ')}`);
    }

    results.push({
      json: {
        request_id: requestId,
        success: true,
        data: parsedData,
        metadata: {
          model: 'gemini-2.0-flash-exp',
          processed_at: new Date().toISOString(),
          raw_confidence: candidates[0].finishReason === 'STOP' ? 1.0 : 0.5
        }
      }
    });

  } catch (error) {
    results.push({
      json: {
        request_id: item.json.request_id || 'unknown',
        success: false,
        error: {
          message: error.message,
          type: 'parsing_error'
        }
      }
    });
  }
}

return results;
```

### Node 5-6: Success/Error Formatter & Response

**Switch Node** routes based on `success` field.

**Success Formatter**:
```javascript
const items = $input.all();
const results = [];

for (const item of items) {
  const startTime = new Date(item.json.timestamp);
  const endTime = new Date();
  const processingTimeMs = endTime - startTime;

  results.push({
    json: {
      success: true,
      request_id: item.json.request_id,
      processing_time_ms: processingTimeMs,
      data: item.json.data,
      metadata: {
        model: item.json.metadata.model,
        processed_at: item.json.metadata.processed_at,
        confidence_score: item.json.metadata.raw_confidence,
        workflow_version: '1.0.0'
      }
    }
  });
}

return results;
```

**Error Formatter**:
```javascript
const items = $input.all();
const results = [];

for (const item of items) {
  const error = item.json.error || { message: 'Unknown error' };

  results.push({
    json: {
      success: false,
      request_id: item.json.request_id || 'unknown',
      error: {
        message: error.message,
        type: error.type || 'processing_error',
        timestamp: new Date().toISOString()
      },
      metadata: {
        workflow_version: '1.0.0'
      }
    }
  });
}

return results;
```

**Respond to Webhook**:
```yaml
Respond With: 'JSON'
Response Code: 200
Options:
  Response Headers:
    Content-Type: application/json
    X-Workflow-Version: 1.0.0
```

---

## Backend Integration

### File: `backend/src/routes/irsaliyeler.js`

**Current (lines 311-417)**: Direct Gemini API call

**New Implementation**:
```javascript
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const irsaliyeAnalizLimiter = require('../middleware/rateLimit');

/**
 * @route   POST /api/irsaliyeler/analiz
 * @desc    Analyze irsaliye image via n8n workflow
 * @access  Private
 */
router.post('/analiz', irsaliyeAnalizLimiter, async (req, res) => {
    const { image, irsaliye_no } = req.body;

    // Validation
    if (!image || !irsaliye_no) {
        return res.status(400).json({
            success: false,
            error: 'Eksik parametreler: image ve irsaliye_no gereklidir'
        });
    }

    // Clean base64 header
    const base64Data = image.includes(',')
        ? image.split(',')[1]
        : image;

    // Generate unique request ID
    const requestId = uuidv4();

    // Prepare n8n webhook payload
    const n8nPayload = {
        image: base64Data,
        irsaliye_no: irsaliye_no,
        timestamp: new Date().toISOString(),
        request_id: requestId
    };

    try {
        // Call n8n webhook
        const n8nResponse = await axios.post(
            process.env.N8N_WEBHOOK_URL || 'https://n8n.igenis.com/webhook/irsaliye-analiz',
            n8nPayload,
            {
                headers: {
                    'Content-Type': 'application/json',
                    ...(process.env.N8N_API_KEY && {
                        'X-n8n-API-Key': process.env.N8N_API_KEY
                    })
                },
                timeout: 45000,
                validateStatus: (status) => status < 500
            }
        );

        // Success
        if (n8nResponse.data.success) {
            return res.status(200).json({
                success: true,
                request_id: requestId,
                processing_time_ms: n8nResponse.data.processing_time_ms,
                data: n8nResponse.data.data,
                metadata: n8nResponse.data.metadata
            });
        }
        // n8n processing error
        else {
            return res.status(400).json({
                success: false,
                request_id: requestId,
                error: n8nResponse.data.error || 'İrsaliye analizi başarısız'
            });
        }

    } catch (error) {
        // Axios error handling
        if (error.response) {
            return res.status(error.response.status).json({
                success: false,
                request_id: requestId,
                error: {
                    message: error.response.data?.error?.message || 'n8n webhook hatası',
                    type: 'webhook_error'
                }
            });
        } else if (error.request) {
            return res.status(503).json({
                success: false,
                request_id: requestId,
                error: {
                    message: 'n8n sunucusuna ulaşılamadı',
                    type: 'network_error'
                }
            });
        } else {
            return res.status(500).json({
                success: false,
                request_id: requestId,
                error: {
                    message: 'Beklenmeyen bir hata oluştu',
                    type: 'unknown_error'
                }
            });
        }
    }
});
```

### File: `backend/src/middleware/rateLimit.js` (NEW)

```javascript
const rateLimit = require('express-rate-limit');

const irsaliyeAnalizLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    message: {
        success: false,
        error: 'Çok fazla istek. Lütfen daha sonra tekrar deneyin.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => process.env.NODE_ENV === 'development'
});

module.exports = irsaliyeAnalizLimiter;
```

### File: `backend/.env`

**Changes**:
```bash
# REMOVE:
# GEMINI_API_KEY=AIzaSyBiaNep4qK96uL7G775GHBWJHQtUExNw2s
# WEBHOOK_URL=https://n8n.igenis.com/webhook-test/irsaliye-analiz

# ADD:
N8N_WEBHOOK_URL=https://n8n.igenis.com/webhook/irsaliye-analiz
N8N_API_KEY=your_optional_webhook_auth_key
```

### Package Dependencies

**backend/package.json**:
```json
{
  "dependencies": {
    "axios": "^1.6.0",
    "uuid": "^9.0.0",
    "express-rate-limit": "^7.1.0"
  }
}
```

**Install**:
```bash
cd backend
npm install axios uuid express-rate-limit
```

---

## Security Implementation

### 1. API Key Management

**n8n Credentials**:
- Credential Name: `Gemini Vision API`
- Type: Header Auth / Query Auth
- Value: Stored securely in n8n
- Never exposed in workflow code

**Backend .env**:
- GEMINI_API_KEY removed
- Only N8N_WEBHOOK_URL and optional N8N_API_KEY

### 2. Webhook Authentication (Optional)

**n8n Webhook**:
```javascript
// Validation Node
const expectedKey = $env.N8N_API_KEY;
const receivedKey = $headers['x-n8n-api-key'];

if (expectedKey && expectedKey !== receivedKey) {
  throw new Error('Unauthorized: Invalid API key');
}
```

**Backend Request**:
```javascript
headers: {
  'X-n8n-API-Key': process.env.N8N_API_KEY
}
```

### 3. IP Whitelist (n8n Settings)

**Allowed IPs**:
- Backend server IP
- 127.0.0.1 (localhost)

### 4. Rate Limiting

**Backend**: 60 requests/minute
**n8n**: Additional workflow-level rate limiting (optional)

### 5. Input Validation

- Max file size: 10MB
- Base64 format validation
- Required fields check

---

## Testing Strategy

### Unit Tests

**backend/tests/irsaliye.test.js**:
```javascript
describe('POST /api/irsaliyeler/analiz', () => {
    it('should call n8n webhook with correct payload', async () => {
        const mockAxios = jest.spyOn(axios, 'post').mockResolvedValue({
            data: {
                success: true,
                request_id: 'test-uuid',
                processing_time_ms: 2000,
                data: { irsaliye_no: 'IRS-123', tedarikci_adi: 'Test', belge_tarih: '01.01.2024', kalemler: [] }
            }
        });

        const response = await request(app)
            .post('/api/irsaliyeler/analiz')
            .send({ image: 'data:image/jpeg;base64,test', irsaliye_no: 'IRS-123' });

        expect(response.status).toBe(200);
        expect(mockAxios).toHaveBeenCalled();
    });

    it('should handle n8n errors', async () => {
        const mockAxios = jest.spyOn(axios, 'post').mockRejectedValue({
            response: { status: 400, data: { error: { message: 'Invalid' } } }
        });

        const response = await request(app)
            .post('/api/irsaliyeler/analiz')
            .send({ image: 'invalid', irsaliye_no: 'IRS-123' });

        expect(response.status).toBe(400);
    });
});
```

### Integration Tests

Test n8n webhook directly with curl or Postman.

### E2E Tests

```javascript
// frontend/e2e/irsaliyeUpload.spec.js
test('complete upload flow', async () => {
    await page.goto('/irsaliyeler');
    await page.click('[data-testid="upload-btn"]');
    await page.setInputFiles('input[type="file"]', 'test.jpg');
    await page.click('[data-testid="confirm-btn"]');
    await expect(page).toHaveURL(/\/irsaliyeler\/yeni/);
});
```

---

## Migration Plan

### Phase 1: Preparation (1 day)
- [ ] n8n workflow created and deployed
- [ ] n8n credentials configured
- [ ] Webhook endpoint tested

### Phase 2: Backend Update (1 day)
- [ ] Create rateLimit.js middleware
- [ ] Update irsaliyeler.js route
- [ ] Update .env file
- [ ] Install dependencies
- [ ] Run unit tests

### Phase 3: Integration Testing (1 day)
- [ ] Test backend → n8n integration
- [ ] Test error scenarios
- [ ] Verify rate limiting
- [ ] Check logs/monitoring

### Phase 4: Production Deploy (1 day)
- [ ] Create feature branch
- [ ] Apply changes
- [ ] Test on staging
- [ ] Merge to main
- [ ] Deploy to production
- [ ] Smoke tests

### Phase 5: Monitoring (1 week)
- [ ] Monitor success rate
- [ ] Check processing times
- [ ] Review error logs
- [ ] User feedback collection

---

## Monitoring & Logging

### Backend Logging

```javascript
// backend/src/config/logger.js
const irsaliyeLogger = winston.createLogger({
    transports: [
        new winston.transports.File({
            filename: 'logs/irsaliye-analiz.log',
            maxsize: 10485760,
            maxFiles: 5
        })
    ]
});

// Usage
irsaliyeLogger.info({
    event: 'irsaliye_analiz_request',
    request_id: requestId,
    irsaliye_no: irsaliye_no,
    timestamp: new Date().toISOString()
});
```

### n8n Monitoring

- Use n8n Executions Dashboard
- Monitor workflow runs
- Track error rates
- Performance metrics

---

## Appendix

### API Documentation

**Endpoint**: `POST /api/irsaliyeler/analiz`

**Request**:
```json
{
  "image": "data:image/jpeg;base64,<data>",
  "irsaliye_no": "IRS-123"
}
```

**Success Response**:
```json
{
  "success": true,
  "request_id": "uuid",
  "processing_time_ms": 2340,
  "data": { ... },
  "metadata": { ... }
}
```

**Error Response**:
```json
{
  "success": false,
  "request_id": "uuid",
  "error": {
    "message": "Error description",
    "type": "error_type"
  }
}
```

---

**Document Version**: 1.0.0
**Last Updated**: 2025-01-26
**Author**: Claude Code (AI Assistant)
**Status**: Ready for Implementation
