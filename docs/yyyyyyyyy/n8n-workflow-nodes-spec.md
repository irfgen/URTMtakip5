# n8n Workflow Node Specifications

**Workflow**: İrsaliye Analiz
**Version**: 1.0.0
**Date**: 2025-01-26

---

## Complete Node-by-Node Specification

### NODE 1: Webhook Trigger

```yaml
Node Display Name: İrsaliye Analiz Webhook
Node Type: Webhook
Node ID: node-1

Configuration:
  Path: irsaliye-analiz
  HTTP Method: POST
  Response Mode: responseNode
  Options:
    Respond to Webhook: Last Node
    Response Code: 200
    Response Headers:
      Content-Type: application/json
      X-Workflow-Version: 1.0.0
  Authentication: None

Webhook URL: https://n8n.igenis.com/webhook/irsaliye-analiz
```

**Expected Input Body**:
```json
{
  "image": "base64_encoded_image_data_without_header",
  "irsaliye_no": "IRS-1735234567890",
  "timestamp": "2025-01-26T10:30:00Z",
  "request_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

### NODE 2: Input Validation

```yaml
Node Display Name: Input Validation
Node Type: Code
Node ID: node-2

Mode: Run Once for All Items
```

**JavaScript Code**:
```javascript
// Input Validation for İrsaliye Analiz
const items = $input.all();
const results = [];

for (const item of items) {
  try {
    const { image, irsaliye_no, request_id } = item.json;

    // 1. Required fields validation
    if (!image || typeof image !== 'string') {
      throw new Error(`Request ${request_id}: Missing or invalid image field`);
    }

    if (!irsaliye_no || typeof irsaliye_no !== 'string') {
      throw new Error(`Request ${request_id}: Missing or invalid irsaliye_no field`);
    }

    // 2. Base64 length validation (max 10MB ≈ 13M base64 chars)
    const MAX_BASE64_LENGTH = 13_000_000;
    if (image.length > MAX_BASE64_LENGTH) {
      throw new Error(
        `Request ${request_id}: Image size exceeds 10MB limit ` +
        `(actual: ${(image.length * 3 / 4 / 1024 / 1024).toFixed(2)}MB)`
      );
    }

    // 3. Base64 format validation
    const base64Pattern = /^[A-Za-z0-9+/]*={0,2}$/;
    if (!base64Pattern.test(image)) {
      throw new Error(`Request ${request_id}: Invalid base64 format`);
    }

    // 4. Calculate approximate file size
    const approximateSizeBytes = Math.round((image.length * 3) / 4);
    const approximateSizeMB = (approximateSizeBytes / (1024 * 1024)).toFixed(2);

    // 5. Validate request_id format (UUID)
    if (request_id) {
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidPattern.test(request_id)) {
        throw new Error(`Request ${request_id}: Invalid request_id format`);
      }
    }

    // 6. Validate timestamp if present
    if (item.json.timestamp) {
      const timestamp = new Date(item.json.timestamp);
      if (isNaN(timestamp)) {
        throw new Error(`Request ${request_id}: Invalid timestamp format`);
      }
    }

    // Success - pass validated data
    results.push({
      json: {
        ...item.json,
        validation: {
          passed: true,
          image_size_bytes: approximateSizeBytes,
          image_size_mb: approximateSizeMB,
          validated_at: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    // Validation error
    results.push({
      json: {
        request_id: item.json.request_id || 'unknown',
        success: false,
        error: {
          message: error.message,
          type: 'validation_error',
          details: {
            field: error.message.includes('image') ? 'image' :
                    error.message.includes('irsaliye_no') ? 'irsaliye_no' :
                    error.message.includes('request_id') ? 'request_id' : 'unknown'
          }
        },
        metadata: {
          workflow_version: '1.0.0'
        }
      }
    });
  }
}

return results;
```

**Output on Success**:
```json
{
  "image": "base64_data",
  "irsaliye_no": "IRS-123",
  "timestamp": "2025-01-26T10:30:00Z",
  "request_id": "uuid",
  "validation": {
    "passed": true,
    "image_size_bytes": 1048576,
    "image_size_mb": "1.00",
    "validated_at": "2025-01-26T10:30:01Z"
  }
}
```

**Output on Validation Error**:
```json
{
  "request_id": "uuid",
  "success": false,
  "error": {
    "message": "Request uuid: Image size exceeds 10MB limit",
    "type": "validation_error",
    "details": {
      "field": "image"
    }
  }
}
```

---

### NODE 3: Gemini Vision API Call

```yaml
Node Display Name: Gemini Vision Analysis
Node Type: HTTP Request
Node ID: node-3

Configuration:
  Method: POST
  URL: https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent

  Authentication:
    Type: Query Parameter
    Name: key
    Value:={{$credentials.geminiApiKey}}

  Request Body:
    Content Type: JSON
    Body Type: JSON

  Send Body:
    See JSON below

  Send Headers:
    Content-Type: application/json

  Options:
    Response Format: JSON
    Response Response: Full Response
    Retry On Fail: true
    Max Retries: 3
    Retry Delay: 2000
    Timeout: 30000
```

**Request Body JSON**:
```json
{
  "contents": [
    {
      "parts": [
        {
          "inline_data": {
            "mime_type": "image/jpeg",
            "data": "={{$json.image}}"
          }
        },
        {
          "text": "Bu irsaliye belgesini analiz et ve aşağıdaki JSON formatında döndür. Sadece JSON çıktısı ver, markdown kod bloğu kullanma:\n\n{\n  \"irsaliye_no\": \"Belgedeki irsaliye numarası\",\n  \"tedarikci_adi\": \"Tedarikçi firma adı\",\n  \"belge_tarih\": \"DD.MM.YYYY formatında tarih\",\n  \"aciklama\": \"Belge açıklaması\",\n  \"kalemler\": [\n    {\n      \"stok_kodu\": \"Stok kodu (bulunamazsa null)\",\n      \"parca_adi\": \"Parça adı\",\n      \"miktar\": sayı (sayısal değer, sayı olmadan),\n      \"birim\": \"Birim (Adet, Kg, Ton, vb.)\",\n      \"aciklama\": \"Kalem açıklaması\"\n    }\n  ]\n}\n\nKurallar:\n1. Tüm tarihleri DD.MM.YYYY formatında yaz (örn: 15.01.2024)\n2. Miktarları SAYI olarak yaz, birim yazma (örn: 100 değil \"100 Adet\")\n3. Stok kodu belgede yoksa null olarak işaretle\n4. Boş veya anlamsız kalemleri çıkarma\n5. Sadece JSON döndür, açıklama ekleme\n6. Tırnak işaretlerini düzgün kullan\n7. JSON formatını bozma"
        }
      ]
    }
  ],
  "generationConfig": {
    "temperature": 0.1,
    "topK": 32,
    "topP": 1,
    "maxOutputTokens": 2048
  },
  "safetySettings": [
    {
      "category": "HARM_CATEGORY_HARASSMENT",
      "threshold": "BLOCK_MEDIUM_AND_ABOVE"
    },
    {
      "category": "HARM_CATEGORY_HATE_SPEECH",
      "threshold": "BLOCK_MEDIUM_AND_ABOVE"
    },
    {
      "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
      "threshold": "BLOCK_MEDIUM_AND_ABOVE"
    },
    {
      "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
      "threshold": "BLOCK_MEDIUM_AND_ABOVE"
    }
  ]
}
```

**Credentials Setup**:
```
Credential Name: Gemini Vision API
Credential Type: Header Auth or Generic Credential Type
Fields:
  - geminiApiKey: AIzaSy... (your Gemini API key)
```

**Expected Success Response from Gemini**:
```json
{
  "candidates": [
    {
      "content": {
        "parts": [
          {
            "text": "{\"irsaliye_no\":\"IRS20240115001\",\"tedarikci_adi\":\"ABC Tedarik A.Ş.\",\"belge_tarih\":\"15.01.2024\",\"aciklama\":\"Parça teslimatı\",\"kalemler\":[{\"stok_kodu\":\"P-100\",\"parca_adi\":\"Dişli\",\"miktar\":100,\"birim\":\"Adet\",\"aciklama\":\"\"}]}"
          }
        ]
      },
      "finishReason": "STOP",
      "index": 0,
      "safetyRatings": [...]
    }
  ],
  "usageMetadata": {
    "promptTokenCount": 1234,
    "candidatesTokenCount": 567,
    "totalTokenCount": 1801
  }
}
```

---

### NODE 4: Response Parsing

```yaml
Node Display Name: Parse Gemini Response
Node Type: Code
Node ID: node-4

Mode: Run Once for All Items
```

**JavaScript Code**:
```javascript
// Parse Gemini Response
const items = $input.all();
const results = [];

for (const item of items) {
  try {
    const geminiResponse = item.json;
    const requestId = item.json.request_id;

    // 1. Check for candidates
    const candidates = geminiResponse?.candidates || [];
    if (candidates.length === 0) {
      throw new Error(`Request ${requestId}: No candidates in Gemini response`);
    }

    // 2. Extract content
    const content = candidates[0].content?.parts?.[0]?.text || '';
    if (!content) {
      throw new Error(`Request ${requestId}: Empty content in Gemini response`);
    }

    // 3. Clean up markdown code blocks if present
    let cleanedText = content
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();

    // 4. Handle potential extra text before/after JSON
    const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanedText = jsonMatch[0];
    }

    // 5. Parse JSON
    let parsedData;
    try {
      parsedData = JSON.parse(cleanedText);
    } catch (parseError) {
      throw new Error(
        `Request ${requestId}: Invalid JSON in Gemini response. ` +
        `Preview: ${cleanedText.substring(0, 100)}...`
      );
    }

    // 6. Validate required fields
    const requiredFields = ['irsaliye_no', 'tedarikci_adi', 'belge_tarih'];
    const missingFields = requiredFields.filter(field => {
      const value = parsedData[field];
      return value === null || value === undefined || value === '';
    });

    if (missingFields.length > 0) {
      throw new Error(
        `Request ${requestId}: Missing required fields: ${missingFields.join(', ')}`
      );
    }

    // 7. Validate kalemler array
    if (!parsedData.kalemler || !Array.isArray(parsedData.kalemler)) {
      throw new Error(`Request ${requestId}: kalemler must be an array`);
    }

    // 8. Validate each kalem
    for (let i = 0; i < parsedData.kalemler.length; i++) {
      const kalem = parsedData.kalemler[i];

      if (!kalem.parca_adi || kalem.parca_adi.trim() === '') {
        throw new Error(`Request ${requestId}: Kalem ${i + 1} missing parca_adi`);
      }

      if (typeof kalem.miktar !== 'number') {
        throw new Error(`Request ${requestId}: Kalem ${i + 1} miktar must be a number`);
      }

      if (kalem.miktar <= 0) {
        throw new Error(`Request ${requestId}: Kalem ${i + 1} miktar must be positive`);
      }
    }

    // 9. Validate date format (DD.MM.YYYY)
    const datePattern = /^(\d{2})\.(\d{2})\.(\d{4})$/;
    if (!datePattern.test(parsedData.belge_tarih)) {
      throw new Error(
        `Request ${requestId}: Invalid date format: ${parsedData.belge_tarih}. Expected DD.MM.YYYY`
      );
    }

    // 10. Calculate confidence score
    const finishReason = candidates[0].finishReason;
    const confidenceScore = finishReason === 'STOP' ? 1.0 :
                           finishReason === 'MAX_TOKENS' ? 0.7 : 0.5;

    // Success - return parsed data
    results.push({
      json: {
        request_id: requestId,
        success: true,
        data: parsedData,
        metadata: {
          model: 'gemini-2.0-flash-exp',
          processed_at: new Date().toISOString(),
          raw_confidence: confidenceScore,
          finish_reason: finishReason,
          prompt_tokens: geminiResponse.usageMetadata?.promptTokenCount,
          completion_tokens: geminiResponse.usageMetadata?.candidatesTokenCount,
          total_tokens: geminiResponse.usageMetadata?.totalTokenCount
        }
      }
    });

  } catch (error) {
    // Parsing error
    results.push({
      json: {
        request_id: item.json.request_id || 'unknown',
        success: false,
        error: {
          message: error.message,
          type: 'parsing_error'
        },
        metadata: {
          workflow_version: '1.0.0'
        }
      }
    });
  }
}

return results;
```

---

### NODE 5: Switch (Success/Error Router)

```yaml
Node Display Name: Success or Error
Node Type: Switch
Node ID: node-5

Rules:
  - Conditions:
      Field: success
      Operation: Equal To
      Value: true
    Output: Success
```

**Routes**:
- Success (true) → Node 6 (Success Formatter)
- Error (false/default) → Node 7 (Error Formatter)

---

### NODE 6: Success Response Formatter

```yaml
Node Display Name: Format Success Response
Node Type: Code
Node ID: node-6

Mode: Run Once for All Items
```

**JavaScript Code**:
```javascript
// Success Response Formatter
const items = $input.all();
const results = [];

for (const item of items) {
  // Calculate processing time
  const startTime = new Date(item.json.timestamp);
  const endTime = new Date();
  const processingTimeMs = endTime - startTime;

  // Format success response
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
        finish_reason: item.json.metadata.finish_reason,
        workflow_version: '1.0.0',
        token_usage: {
          prompt: item.json.metadata.prompt_tokens,
          completion: item.json.metadata.completion_tokens,
          total: item.json.metadata.total_tokens
        }
      }
    }
  });
}

return results;
```

**Output**:
```json
{
  "success": true,
  "request_id": "uuid",
  "processing_time_ms": 2340,
  "data": {
    "irsaliye_no": "IRS20240115001",
    "tedarikci_adi": "ABC Tedarik A.Ş.",
    "belge_tarih": "15.01.2024",
    "aciklama": "Parça teslimatı",
    "kalemler": [...]
  },
  "metadata": {
    "model": "gemini-2.0-flash-exp",
    "processed_at": "2025-01-26T10:30:02Z",
    "confidence_score": 1.0,
    "finish_reason": "STOP",
    "workflow_version": "1.0.0",
    "token_usage": {
      "prompt": 1234,
      "completion": 567,
      "total": 1801
    }
  }
}
```

---

### NODE 7: Error Response Formatter

```yaml
Node Display Name: Format Error Response
Node Type: Code
Node ID: node-7

Mode: Run Once for All Items
```

**JavaScript Code**:
```javascript
// Error Response Formatter
const items = $input.all();
const results = [];

for (const item of items) {
  const error = item.json.error || { message: 'Unknown error', type: 'unknown_error' };

  // Calculate processing time for error cases too
  const startTime = item.json.timestamp ? new Date(item.json.timestamp) : new Date();
  const endTime = new Date();
  const processingTimeMs = endTime - startTime;

  results.push({
    json: {
      success: false,
      request_id: item.json.request_id || 'unknown',
      processing_time_ms: processingTimeMs,
      error: {
        message: error.message,
        type: error.type || 'processing_error',
        timestamp: new Date().toISOString(),
        // Don't expose stack traces to client
        // Log detailed errors server-side instead
      },
      metadata: {
        workflow_version: '1.0.0'
      }
    }
  });
}

return results;
```

**Output**:
```json
{
  "success": false,
  "request_id": "uuid",
  "processing_time_ms": 1500,
  "error": {
    "message": "Request uuid: Missing required fields: tedarikci_adi",
    "type": "validation_error",
    "timestamp": "2025-01-26T10:30:02Z"
  },
  "metadata": {
    "workflow_version": "1.0.0"
  }
}
```

---

### NODE 8: Respond to Webhook

```yaml
Node Display Name: Webhook Response
Node Type: Respond to Webhook
Node ID: node-8

Configuration:
  Respond With: 'Using Incoming Body' (pass through JSON from Node 6 or 7)
  Options:
    Response Headers:
      Content-Type: application/json
      X-Powered-By: n8n
      X-Workflow-Version: 1.0.0
```

---

## Workflow Connections

```
┌─────────────┐
│   Node 1    │  Webhook Trigger
│  (Webhook)  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Node 2    │  Validation
│   (Code)    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Node 3    │  Gemini API Call
 │(HTTP Req)  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Node 4    │  Parse Response
│   (Code)    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Node 5    │  Switch (Success/Error)
│  (Switch)   │
└──┬───────┬──┘
   │       │
   │       └──────────► Node 7 (Error Formatter) ─┐
   │                                              │
   └────────────────────► Node 6 (Success Formatter)├──► Node 8 (Respond)
                                                   │
                                                   └──► End
```

---

## Error Handling Flow

```
Node 2 (Validation Error)
  │
  └─► Success: false, type: validation_error
      │
      └─► Node 5 (Switch) ──► Node 7 (Error Formatter) ──► Node 8 (Respond)
           │
           └─► Returns 400 Bad Request

Node 3 (Gemini API Error)
  │
  └─► Network error or API error
      │
      └─► Node 3 retry (up to 3 times)
          │
          └─► Still fails ──► Node 4 catches ──► Node 5 ──► Node 7 ──► Node 8
                                    │
                                    └─► Returns 503 Service Unavailable

Node 4 (Parsing Error)
  │
  └─► Invalid JSON or missing fields
      │
      └─► Success: false, type: parsing_error
          │
          └─► Node 5 ──► Node 7 ──► Node 8
                    │
                    └─► Returns 400 Bad Request
```

---

## Testing the Workflow

### Test Case 1: Valid İrsaliye

```bash
curl -X POST https://n8n.igenis.com/webhook/irsaliye-analiz \
  -H "Content-Type: application/json" \
  -d '{
    "image": "base64_encoded_valid_irsaliye_image",
    "irsaliye_no": "IRS-TEST-001",
    "timestamp": "2025-01-26T10:30:00Z",
    "request_id": "test-request-001"
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "request_id": "test-request-001",
  "processing_time_ms": <number>,
  "data": {
    "irsaliye_no": "...",
    "tedarikci_adi": "...",
    "belge_tarih": "DD.MM.YYYY",
    "kalemler": [...]
  }
}
```

### Test Case 2: Invalid Base64

```bash
curl -X POST https://n8n.igenis.com/webhook/irsaliye-analiz \
  -H "Content-Type: application/json" \
  -d '{
    "image": "not_valid_base64!!!",
    "irsaliye_no": "IRS-TEST-002"
  }'
```

**Expected Response**:
```json
{
  "success": false,
  "error": {
    "message": "...Invalid base64 format...",
    "type": "validation_error"
  }
}
```

### Test Case 3: Oversized Image

```bash
curl -X POST https://n8n.igenis.com/webhook/irsaliye-analiz \
  -H "Content-Type: application/json" \
  -d '{
    "image": "'"$(python3 -c 'print("A" * 14000000')")"'",
    "irsaliye_no": "IRS-TEST-003"
  }'
```

**Expected Response**:
```json
{
  "success": false,
  "error": {
    "message": "...Image size exceeds 10MB limit...",
    "type": "validation_error"
  }
}
```

---

## Workflow Export (JSON)

To import this workflow into n8n:

1. Copy the complete workflow JSON (generated by n8n when you export)
2. In n8n UI: Import from JSON / URL
3. Configure credentials (Gemini API Key)
4. Activate workflow
5. Test webhook endpoint

---

**Document Version**: 1.0.0
**Last Updated**: 2025-01-26
