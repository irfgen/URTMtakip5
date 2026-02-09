# n8n Integration Implementation Workflow

**Project**: ÜRTM Takip - İrsaliye Yükle n8n Migration
**Workflow Type**: Systematic Production Migration
**Estimated Duration**: 4-5 gün (deployment dahil)
**Risk Level**: Medium (kritik kullanıcı özelliği)
**Date**: 2025-01-26

---

## 📋 Executive Summary

Bu workflow, ÜRTM Takip projesindeki İrsaliye Yükle özelliğinin doğrudan Gemini API kullanımından n8n workflow tabanlı mimariye geçişini yönetir.

### Hedefler
1. ✅ n8n workflow ile orta katman eklemek
2. ✅ API key security'ini iyileştirmek
3. ✅ Error handling ve monitoring eklemek
4. ✅ Zero downtime migration sağlamak

### Başarı Kriterleri
- Success rate ≥ 95%
- Processing time ≤ 30s (ortalama)
- Error rate ≤ 5%
- Zero data loss
- Seamless user experience

---

## 🗂️ Task Breakdown

### PHASE 1: n8n Sunucu Hazırlığı (1 gün)

#### Task 1.1: n8n Erişim Doğrulama
**Priority**: 🔴 CRITICAL
**Duration**: 15 dakika
**Dependencies**: None

**Steps**:
1. [ ] n8n sunucu URL'e erişim test et
   ```bash
   curl -I https://n8n.igenis.com
   ```
2. [ ] n8n admin panel'e login ol
3. [ ] n8n versiyonunu kontrol et (v1.0+)
4. [ ] Workflow create yetkisini kontrol et
5. [ ] Credentials yönetim yetkisini kontrol et

**Success Criteria**:
- ✅ n8n panel'e erişilebilir
- ✅ Workflow oluşturma yetkisi var
- ✅ Credentials yönetimi yetkisi var

**Rollback**: None (hazırlık aşaması)

---

#### Task 1.2: Gemini API Key Credential Oluşturma
**Priority**: 🔴 CRITICAL
**Duration**: 10 dakika
**Dependencies**: Task 1.1

**Steps**:
1. [ ] n8n Credentials menüsüne git
2. [ ] "New Credential" seç
3. [ ] "Header Auth" veya "Generic Credential Type" seç
4. [ ] Credential name: "Gemini Vision API"
5. [ ] API key'i ekle:
   ```
   Name: geminiApiKey
   Value: AIzaSyBiaNep4qK96uL7G775GHBWJHQtUExNw2s (veya yeni key)
   ```
6. [ ] Credential'ı kaydet
7. [ ] Credential test et (n8n validation)

**Security Notes**:
- ⚠️ API key'i git'e commit etme
- ⚠️ API key'i log dosyalarına yazma
- ⚠️ Credential'ı sadece n8n'de sakla

**Success Criteria**:
- ✅ Credential n8n'de güvenli şekilde saklandı
- ✅ Credential validation successful

**Rollback**: Credential sil ve yeniden oluştur

---

#### Task 1.3: n8n Workflow Oluşturma
**Priority**: 🔴 CRITICAL
**Duration**: 60 dakika
**Dependencies**: Task 1.2

**Steps**:
1. [ ] n8n'de "New Workflow" oluştur
2. [ ] Workflow name: "İrsaliye Analiz Workflow"

**Node 1: Webhook Trigger**
- [ ] Webhook node ekle
- [ ] HTTP Method: POST
- [ ] Path: `irsaliye-analiz`
- [ ] Response Mode: responseNode
- [ ] Listen for events: ON
- [ ] Webhook URL'i kopyala

**Node 2: Input Validation**
- [ ] Code node ekle
- [ ] JavaScript kodunu `docs/n8n-workflow-nodes-spec.md`'dan kopyala
- [ ] Validations:
  - Required fields check
  - Max size check (10MB)
  - Base64 format validation
  - UUID validation
  - Timestamp validation

**Node 3: Gemini Vision API Call**
- [ ] HTTP Request node ekle
- [ ] Method: POST
- [ ] URL: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent`
- [ ] Authentication: Query Parameter → `geminiApiKey` credential
- [ ] Request Body: JSON (docs'dan kopyala)
- [ ] Retry: 3 attempts, 2s delay
- [ ] Timeout: 30s

**Node 4: Response Parsing**
- [ ] Code node ekle
- [ ] JavaScript kodunu docs'dan kopyala
- [ ] JSON parsing
- [ ] Required fields validation
- [ ] Date format validation (DD.MM.YYYY)
- [ ] Kalem array validation

**Node 5: Switch (Success/Error)**
- [ ] Switch node ekle
- [ ] Rules: `success === true` → Success output

**Node 6: Success Response Formatter**
- [ ] Code node ekle
- [ ] Processing time hesapla
- [ ] Response formatını düzenle

**Node 7: Error Response Formatter**
- [ ] Code node ekle
- [ ] Error message formatı
- [ ] Error type classification

**Node 8: Respond to Webhook**
- [ ] Respond to Webhook node ekle
- [ ] Respond with: Using Incoming Body
- [ ] Response Code: 200
- [ ] Headers: Content-Type, X-Workflow-Version

**Node Connections**:
- [ ] Node 1 → Node 2
- [ ] Node 2 → Node 3
- [ ] Node 3 → Node 4
- [ ] Node 4 → Node 5
- [ ] Node 5 (true) → Node 6 → Node 8
- [ ] Node 5 (false) → Node 7 → Node 8

3. [ ] Workflow'u kaydet
4. [ ] Workflow'u aktifleştir (ON)

**Success Criteria**:
- ✅ 8 node oluşturuldu ve bağlandı
- ✅ Workflow aktif
- ✅ Webhook URL alındı

**Rollback**: Workflow'u sil ve yeniden oluştur

---

#### Task 1.4: n8n Workflow Test
**Priority**: 🔴 CRITICAL
**Duration**: 30 dakika
**Dependencies**: Task 1.3

**Test Case 1: Valid İrsaliye**
```bash
curl -X POST https://n8n.igenis.com/webhook/irsaliye-analiz \
  -H "Content-Type: application/json" \
  -d '{
    "image": "base64_encoded_valid_image",
    "irsaliye_no": "TEST-001",
    "timestamp": "2025-01-26T10:00:00Z",
    "request_id": "test-request-1"
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "request_id": "test-request-1",
  "processing_time_ms": <number>,
  "data": {
    "irsaliye_no": "...",
    "tedarikci_adi": "...",
    "belge_tarih": "DD.MM.YYYY",
    "kalemler": [...]
  }
}
```

**Test Case 2: Invalid Base64**
```bash
curl -X POST https://n8n.igenis.com/webhook/irsaliye-analiz \
  -H "Content-Type: application/json" \
  -d '{
    "image": "not_valid_base64!!!",
    "irsaliye_no": "TEST-002"
  }'
```

**Expected**: `success: false, error.type: validation_error`

**Test Case 3: Oversized Image**
```bash
# Image size > 10MB
curl -X POST https://n8n.igenis.com/webhook/irsaliye-analiz \
  -H "Content-Type: application/json" \
  -d '{
    "image": "'$(python3 -c 'print("A" * 14000000')')'",
    "irsaliye_no": "TEST-003"
  }'
```

**Expected**: `success: false, error.message: exceeds 10MB`

**Test Case 4: Missing Fields**
```bash
curl -X POST https://n8n.igenis.com/webhook/irsaliye-analiz \
  -H "Content-Type: application/json" \
  -d '{"irsaliye_no": "TEST-004"}'
```

**Expected**: `success: false, error.message: Missing required fields`

**n8n Executions Dashboard Kontrolü**:
- [ ] Tüm testler Executions'da görünür mü?
- [ ] Success/Failure durumları doğru mu?
- [ ] Processing times makul mü?
- [ ] Error messages detaylı mı?

**Success Criteria**:
- ✅ Tüm test case'leri beklenen sonuçları verdi
- ✅ n8n Executions dashboard'da görünüyor
- ✅ Processing time < 30s
- ✅ Error handling çalışıyor

**Rollback**: Workflow'da hata varsa düzelt ve tekrar test et

---

### PHASE 2: Backend Implementation (1 gün)

#### Task 2.1: Dependency Yükleme
**Priority**: 🟡 IMPORTANT
**Duration**: 10 dakika
**Dependencies**: Phase 1 complete

**Steps**:
1. [ ] Backend dizinine git
   ```bash
   cd /home/irgat12/URTMtakip/backend
   ```

2. [ ] package.json'ı kontrol et
   ```bash
   cat package.json | grep -E "(axios|uuid|express-rate-limit)"
   ```
   - Bu paketler yoksa eklenecek

3. [ ] Paketleri yükle
   ```bash
   npm install axios@^1.6.0 uuid@^9.0.0 express-rate-limit@^7.1.0
   ```

4. [ ] package.json ve package-lock.json'ı kontrol et
   ```bash
   cat package.json | grep -A2 "dependencies"
   ```

5. [ ] Versiyon conflicts kontrol et
   ```bash
   npm check
   # veya
   npm ls
   ```

**Success Criteria**:
- ✅ axios, uuid, express-rate-limit yüklendi
- ✅ Versiyon conflicts yok
- ✅ package-lock.json güncellendi

**Rollback**: `rm -rf node_modules package-lock.json && npm install`

---

#### Task 2.2: Middleware Oluşturma
**Priority**: 🟡 IMPORTANT
**Duration**: 15 dakika
**Dependencies**: Task 2.1

**Steps**:
1. [ ] Middleware dizini kontrol et
   ```bash
   ls -la src/middleware/
   ```

2. [ ] `rateLimit.js` dosyası oluştur
   ```bash
   touch src/middleware/rateLimit.js
   ```

3. [ ] Dosyaya kodu yaz (docs/n8n-integration-design.md'dan kopyala):
   ```javascript
   const rateLimit = require('express-rate-limit');

   const irsaliyeAnalizLimiter = rateLimit({
       windowMs: 60 * 1000, // 1 minute
       max: 60, // 60 requests per minute
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

4. [ ] Dosyayı kaydet
5. [ ] Syntax kontrol et
   ```bash
   node -c src/middleware/rateLimit.js
   ```

**Success Criteria**:
- ✅ rateLimit.js dosyası oluşturuldu
- ✅ Syntax error yok
- ✅ Rate limit: 60/dakika
- ✅ Development'da devre dışı

**Rollback**: `rm src/middleware/rateLimit.js`

---

#### Task 2.3: Route Güncelleme - Yedekleme
**Priority**: 🟡 IMPORTANT
**Duration**: 5 dakika
**Dependencies**: Task 2.2

**Steps**:
1. [ ] irsaliyeler.js route dosyasının yedeğini al
   ```bash
   cp src/routes/irsaliyeler.js src/routes/irsaliyeler.js.backup
   cp src/routes/irsaliyeler.js src/routes/irsaliyeler.js.backup-$(date +%Y%m%d)
   ```

2. [ ] Backup dosyalarını kontrol et
   ```bash
   ls -lh src/routes/irsaliyeler.js.backup*
   ```

3. [ ] Git'de feature branch oluştur (eğer yoksa)
   ```bash
   cd /home/irgat12/URTMtakip
   git checkout -b feature/n8n-integration
   ```

**Success Criteria**:
- ✅ Backup dosyaları oluşturuldu
- ✅ Feature branch oluşturuldu

**Rollback**: `cp src/routes/irsaliyeler.js.backup src/routes/irsaliyeler.js`

---

#### Task 2.4: Route Güncelleme - Kod Değişikliği
**Priority**: 🔴 CRITICAL
**Duration**: 30 dakika
**Dependencies**: Task 2.3

**Steps**:
1. [ ] `src/routes/irsaliyeler.js` dosyasını aç
2. [ ] Satır 311-417 arasını bulun (mevcut /analiz endpoint'i)
3. [ ] Mevcut kodu yorum satırı yap veya sil
4. [ ] Yeni kodu ekle (docs/n8n-integration-design.md'dan):

```javascript
// Imports (dosya başına ekle)
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
        // Error handling
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

5. [ ] Dosyayı kaydet
6. [ ] Syntax kontrol et
   ```bash
   cd backend
   node -c src/routes/irsaliyeler.js
   ```

**Success Criteria**:
- ✅ Kod güncellendi
- ✅ Imports eklendi
- ✅ n8n webhook çağrısı mevcut
- ✅ Error handling complete
- ✅ Syntax valid

**Rollback**: `cp src/routes/irsaliyeler.js.backup src/routes/irsaliyeler.js`

---

#### Task 2.5: Environment Konfigürasyonu
**Priority**: 🔴 CRITICAL
**Duration**: 15 dakika
**Dependencies**: Task 2.4

**Steps**:
1. [ ] `.env` dosyasını yedekle
   ```bash
   cp .env .env.backup
   ```

2. [ ] `.env` dosyasını aç
3. [ ] GEMINI_API_KEY satırını kaldır veya yorum satırı yap:
   ```bash
   # GEMINI_API_KEY=AIzaSyBiaNep4qK96uL7G775GHBWJHQtUExNw2s  # REMOVED - now in n8n
   ```

4. [ ] WEBHOOK_URL satırını kaldır veya yorum satırı yap:
   ```bash
   # WEBHOOK_URL=https://n8n.igenis.com/webhook-test/irsaliye-analiz  # DEPRECATED
   ```

5. [ ] Yeni değişkenleri ekle:
   ```bash
   # n8n Webhook Configuration
   N8N_WEBHOOK_URL=https://n8n.igenis.com/webhook/irsaliye-analiz
   N8N_API_KEY=your_optional_webhook_auth_key_here
   ```

6. [ ] `.env.example` dosyasını da güncelle (opsiyonel ama önerilir)

**Success Criteria**:
- ✅ GEMINI_API_KEY kaldırıldı
- ✅ WEBHOOK_URL kaldırıldı
- ✅ N8N_WEBHOOK_URL eklendi
- ✅ N8N_API_KEY eklendi (opsiyonel)

**Rollback**: `cp .env.backup .env`

---

#### Task 2.6: Unit Tests
**Priority**: 🟢 RECOMMENDED
**Duration**: 45 dakika
**Dependencies**: Task 2.5

**Steps**:
1. [ ] Test dizini kontrol et
   ```bash
   ls -la src/tests/
   ```

2. [ ] Test dosyası oluştur veya güncelle
   ```bash
   touch src/tests/irsaliye-analiz.test.js
   ```

3. [ ] Test kodunu yaz:

```javascript
const request = require('supertest');
const express = require('express');
const irsaliyeRoutes = require('../routes/irsaliyeler');
const axios = require('axios');

// Mock axios
jest.mock('axios');

const app = express();
app.use(express.json());
app.use('/api/irsaliyeler', irsaliyeRoutes);

describe('POST /api/irsaliyeler/analiz', () => {

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should call n8n webhook with correct payload', async () => {
        const mockResponse = {
            data: {
                success: true,
                request_id: 'test-uuid',
                processing_time_ms: 2000,
                data: {
                    irsaliye_no: 'IRS-123',
                    tedarikci_adi: 'Test Firması',
                    belge_tarih: '15.01.2024',
                    aciklama: 'Test',
                    kalemler: []
                },
                metadata: {
                    model: 'gemini-2.0-flash-exp',
                    confidence_score: 0.95
                }
            }
        };

        axios.post.mockResolvedValue(mockResponse);

        const response = await request(app)
            .post('/api/irsaliyeler/analiz')
            .send({
                image: 'data:image/jpeg;base64,testbase64data',
                irsaliye_no: 'IRS-123'
            });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.irsaliye_no).toBe('IRS-123');
        expect(axios.post).toHaveBeenCalledWith(
            expect.stringContaining('n8n.igenis.com'),
            expect.objectContaining({
                image: 'testbase64data',
                irsaliye_no: 'IRS-123',
                request_id: expect.any(String),
                timestamp: expect.any(String)
            }),
            expect.any(Object)
        );
    });

    it('should handle n8n processing errors', async () => {
        const mockResponse = {
            data: {
                success: false,
                request_id: 'test-uuid',
                error: {
                    message: 'Invalid image format',
                    type: 'parsing_error'
                }
            }
        };

        axios.post.mockResolvedValue(mockResponse);

        const response = await request(app)
            .post('/api/irsaliyeler/analiz')
            .send({
                image: 'data:image/jpeg;base64,invalid',
                irsaliye_no: 'IRS-123'
            });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.message).toContain('Invalid image format');
    });

    it('should handle network errors', async () => {
        axios.post.mockRejectedValue(new Error('Network error'));

        const response = await request(app)
            .post('/api/irsaliyeler/analiz')
            .send({
                image: 'data:image/jpeg;base64,test',
                irsaliye_no: 'IRS-123'
            });

        expect(response.status).toBe(503);
        expect(response.body.success).toBe(false);
        expect(response.body.error.type).toBe('network_error');
    });

    it('should validate required fields', async () => {
        const response = await request(app)
            .post('/api/irsaliyeler/analiz')
            .send({
                irsaliye_no: 'IRS-123'
                // image missing
            });

        expect(response.status).toBe(400);
        expect(response.body.error).toContain('Eksik parametreler');
    });

    it('should handle rate limiting', async () => {
        // This test requires rate-limiting to be enabled
        // Skip in development mode
        if (process.env.NODE_ENV === 'development') {
            console.log('Skipping rate limit test in development');
            return;
        }

        const mockResponse = {
            data: { success: true, data: {}, metadata: {} }
        };
        axios.post.mockResolvedValue(mockResponse);

        const requests = [];
        for (let i = 0; i < 65; i++) {
            requests.push(
                request(app)
                    .post('/api/irsaliyeler/analiz')
                    .send({
                        image: 'data:image/jpeg;base64,test',
                        irsaliye_no: `IRS-${i}`
                    })
            );
        }

        const responses = await Promise.all(requests);

        // Last 5 requests should be rate limited
        const rateLimitedResponses = responses.slice(-5);
        rateLimitedResponses.forEach(response => {
            expect(response.status).toBe(429);
        });
    });
});
```

4. [ ] Testleri çalıştır
   ```bash
   npm test -- src/tests/irsaliye-analiz.test.js
   ```

5. [ ] Test sonuçlarını kontrol et

**Success Criteria**:
- ✅ Tüm testler geçti
- ✅ Code coverage ≥ 80%

**Rollback**: Test hatalarını düzelt ve tekrar çalıştır

---

#### Task 2.7: Local Backend Testing
**Priority**: 🔴 CRITICAL
**Duration**: 30 dakika
**Dependencies**: Task 2.6

**Steps**:
1. [ ] Backend'i başlat
   ```bash
   cd /home/irgat12/URTMtakip/backend
   npm run dev
   ```

2. [ ] Backend'in çalıştığını kontrol et
   ```bash
   curl http://127.0.0.1:3000/api/health
   ```

3. [ ] Test Case 1: Valid request
   ```bash
   curl -X POST http://127.0.0.1:3000/api/irsaliyeler/analiz \
     -H "Content-Type: application/json" \
     -d '{
       "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg...(valid base64)",
       "irsaliye_no": "TEST-LOCAL-001"
     }'
   ```

   **Expected**: Success response with parsed data

4. [ ] Test Case 2: Invalid base64
   ```bash
   curl -X POST http://127.0.0.1:3000/api/irsaliyeler/analiz \
     -H "Content-Type: application/json" \
     -d '{
       "image": "not_valid_base64",
       "irsaliye_no": "TEST-LOCAL-002"
     }'
   ```

   **Expected**: n8n validation error

5. [ ] Backend logs'ını kontrol et
   ```bash
   tail -f logs/combined.log
   ```

6. [ ] n8n Executions dashboard'da request'leri görüntüle

7. [ ] Rate limiting test (production mode'da)
   ```bash
   # 65 requests gönder
   for i in {1..65}; do
     curl -X POST http://127.0.0.1:3000/api/irsaliyeler/analiz \
       -H "Content-Type: application/json" \
       -d '{"image":"data:image/jpeg;base64,test","irsaliye_no":"TEST-RL-'$i'"}' &
   done
   ```

**Success Criteria**:
- ✅ Backend çalışıyor
- ✅ Valid request success
- ✅ Invalid requests handled correctly
- ✅ n8n'de executions görünüyor
- ✅ Rate limiting çalışıyor
- ✅ Processing time < 45s

**Rollback**: `cp src/routes/irsaliyeler.js.backup src/routes/irsaliyeler.js`

---

### PHASE 3: Integration Testing (1 gün)

#### Task 3.1: Full Stack Testing
**Priority**: 🟡 IMPORTANT
**Duration**: 45 dakika
**Dependencies**: Phase 2 complete

**Steps**:
1. [ ] Frontend'i başlat
   ```bash
   cd /home/irgat12/URTMtakip/frontend
   npm run dev
   ```

2. [ ] Browser'da frontend'i aç
   ```
   http://localhost:5173
   ```

3. [ ] Login ol (gerekirse)

4. [ ] İrsaliyeler sayfasına git
   ```
   http://localhost:5173/irsaliyeler
   ```

5. [ ] "Yükle" butonuna tıkla

6. [ ] Test resmi seç (örneğin sample-irsaliye.jpg)

7. [ ] "Yükle" butonuna tıkla

8. [ ] Processing indicator'ı bekle

9. [ ] Form sayfasına yönlendirildiğini kontrol et
   ```
   URL: /irsaliyeler/yeni
   ```

10. [ ] Auto-fill data'yı kontrol et:
    - [ ] Tedarikçi adı doldu
    - [ ] İrsaliye no doldu
    - [ ] Tarih doldu
    - [ ] Kalemler listelendi

11. [ ] Console'u kontrol et (errors yok)

12. [ ] Network tab'da request/response'u kontrol et

**Success Criteria**:
- ✅ Upload çalışıyor
- ✅ Processing indicator gösteriliyor
- ✅ Form auto-fill çalışıyor
- ✅ Console errors yok
- ✅ Network requests başarılı

**Rollback**: Backend backup'ı geri yükle

---

#### Task 3.2: Error Scenario Testing
**Priority**: 🟡 IMPORTANT
**Duration**: 45 dakika
**Dependencies**: Task 3.1

**Test Scenarios**:

**Scenario 1: Oversized Image**
1. [ ] 10MB'dan büyük resim hazırla
2. [ ] Upload et
3. [ ] Error message al
4. [ ] Error user-friendly mi?

**Scenario 2: Invalid File Type**
1. [ ] .txt veya .exe dosyası seç
2. [ ] Upload et
3. [ ] Error message al

**Scenario 3: Network Timeout**
1. [ ] n8n workflow'u geçici olarak kapat
2. [ ] Upload et
3. [ ] Timeout error al
4. [ ] Error message uygun mu?

**Scenario 4: Invalid Response from Gemini**
1. [ ] Bozuk resim upload et
2. [ ] Parsing error al
3. [ ] Error detaylı mı?

**Scenario 5: Rate Limiting**
1. [ ] 60+ rapid requests gönder
2. [ ] Rate limit error al
3. [ ] Message clear mı?

**Scenario 6: Concurrent Requests**
1. [ ] 3 simultaneous uploads
2. [ ] Tümü success mi?

**Success Criteria**:
- ✅ Tüm error senaryoları handled
- ✅ Error messages user-friendly
- ✅ App crash yok
- ✅ Recovery smooth

**Rollback**: Hataları düzelt ve tekrar test

---

#### Task 3.3: Performance Testing
**Priority**: 🟢 RECOMMENDED
**Duration**: 60 dakika
**Dependencies**: Task 3.2

**Metrics to Collect**:
- Average processing time
- P95 processing time
- Success rate
- Error rate
- Concurrent request capacity

**Test Plan**:

**Test 1: Single Request Performance**
```bash
# 10 requests, measure timing
for i in {1..10}; do
  time curl -X POST http://127.0.0.1:3000/api/irsaliyeler/analiz \
    -H "Content-Type: application/json" \
    -d @test-payload.json
done
```

**Test 2: Load Testing**
```bash
# Use Apache Bench or similar
ab -n 100 -c 10 -p test-payload.json -T application/json \
   http://127.0.0.1:3000/api/irsaliyeler/analiz
```

**Test 3: Stress Testing**
```bash
# Increase concurrency gradually
for concurrency in 1 5 10 20 50; do
  echo "Testing with $concurrency concurrent requests"
  ab -n 100 -c $concurrency -p test-payload.json -T application/json \
     http://127.0.0.1:3000/api/irsaliyeler/analiz
  sleep 10
done
```

**Acceptance Criteria**:
- ✅ Average processing time ≤ 10s
- ✅ P95 processing time ≤ 30s
- ✅ Success rate ≥ 95%
- ✅ No errors under 10 concurrent requests

**Rollback**: Performance issues varsa n8n veya backend optimize et

---

#### Task 3.4: Security Testing
**Priority**: 🟡 IMPORTANT
**Duration**: 30 dakika
**Dependencies**: Task 3.3

**Security Tests**:

**Test 1: API Key Exposure**
```bash
# Check if API key in logs
grep -r "AIzaSy" logs/
grep -r "gemini" logs/ | grep -i "key"
```
**Expected**: No API keys in logs

**Test 2: Input Sanitization**
```bash
# SQL injection attempt
curl -X POST http://127.0.0.1:3000/api/irsaliyeler/analiz \
  -H "Content-Type: application/json" \
  -d '{
    "image": "data:image/jpeg;base64,xyz",
    "irsaliye_no": "'; DROP TABLE irsaliyeler; --"
  }'
```
**Expected**: Validation error, SQL injection çalışmıyor

**Test 3: Rate Limiting Bypass**
```bash
# Try different headers, IPs, etc.
# Verify rate limiting still works
```

**Test 4: Webhook Authentication (if enabled)**
```bash
# Request without auth header
curl -X POST http://127.0.0.1:3000/api/irsaliyeler/analiz \
  -H "Content-Type: application/json" \
  -d '{"image":"test","irsaliye_no":"TEST"}'
```
**Expected**: Either success (if auth disabled) or 401 Unauthorized

**Success Criteria**:
- ✅ API keys exposed değil
- ✅ Input validation çalışıyor
- ✅ Rate limiting bypass edilemez
- ✅ Authentication works (if enabled)

**Rollback**: Security issues varsa hemen düzelt

---

### PHASE 4: Deployment (1 gün)

#### Task 4.1: Pre-Deployment Checklist
**Priority**: 🔴 CRITICAL
**Duration**: 30 dakika
**Dependencies**: Phase 3 complete

**Checklist**:

**Code Quality**:
- [ ] All tests passing
- [ ] No console errors
- [ ] No TODO comments in critical paths
- [ ] Code reviewed
- [ ] Linting clean

**Configuration**:
- [ ] Production .env configured
- [ ] N8N_WEBHOOK_URL correct
- [ ] N8N_API_KEY set (if needed)
- [ ] GEMINI_API_KEY removed
- [ ] No hardcoded values

**n8n Workflow**:
- [ ] Workflow active in production
- [ ] Webhook URL accessible
- [ ] Credentials configured
- [ ] Test successful

**Monitoring**:
- [ ] Logging configured
- [ ] Error tracking ready
- [ ] Metrics collection ready

**Rollback Plan**:
- [ ] Backup created
- [ ] Rollback steps documented
- [ ] Rollback tested

**Documentation**:
- [ ] API documentation updated
- [ ] Deployment guide written
- [ ] Troubleshooting guide ready

**Success Criteria**:
- ✅ All checklist items complete

**Rollback**: Herhangi bir item eksinse deployment yapma

---

#### Task 4.2: Staging Deployment
**Priority**: 🟡 IMPORTANT
**Duration**: 45 dakika
**Dependencies**: Task 4.1

**Steps**:
1. [ ] Staging environment'a deploy et
   ```bash
   # Platform-a göre (örneğin PM2)
   pm2 restart urtm-takip-staging
   # veya
   git pull staging && npm run build && pm2 restart staging
   ```

2. [ ] Staging'de test et
   ```bash
   # Staging URL
   curl -X POST https://staging.urtmtakip.com/api/irsaliyeler/analiz \
     -H "Content-Type: application/json" \
     -d @test-payload.json
   ```

3. [ ] Full stack test (staging)
   - Frontend test
   - Upload flow test
   - Error scenarios test

4. [ ] Performance test (staging)
   - Processing time
   - Success rate

5. [ ] Monitoring dashboard'a bağlan
   - n8n Executions
   - Backend logs
   - Error tracking

**Success Criteria**:
- ✅ Staging deployment successful
- ✅ All tests passing
- ✅ Performance acceptable
- ✅ Monitoring works

**Rollback**: Staging'de sorun varsa düzelt ve tekrar deploy et

---

#### Task 4.3: Production Deployment
**Priority**: 🔴 CRITICAL
**Duration**: 60 dakika
**Dependencies**: Task 4.2

**Pre-Deployment**:
1. [ ] Production backup al
   ```bash
   # Database backup
   # Code backup
   # Config backup
   ```

2. [ ] Maintenance mode başlat (opsiyonel)
   ```bash
   # User notification
   ```

3. [ ] Feature branch'ten main'e merge et
   ```bash
   git checkout v14.dev1
   git merge feature/n8n-integration
   git push origin v14.dev1
   ```

**Deployment**:
4. [ ] Production build
   ```bash
   cd /home/irgat12/URTMtakip
   npm run build
   ```

5. [ ] Production deploy
   ```bash
   # PM2
   pm2 restart urtm-takip
   # veya systemd
   sudo systemctl restart urtm-takip
   ```

6. [ ] Deployment verify et
   ```bash
   pm2 status
   pm2 logs urtm-takip --lines 50
   ```

**Post-Deployment**:
7. [ ] Smoke test
   ```bash
   curl -X POST https://production.urtmtakip.com/api/irsaliyeler/analiz \
     -H "Content-Type: application/json" \
     -d @test-payload.json
   ```

8. [ ] Full smoke test
   - [ ] Health check endpoint
   - [ ] İrsaliye upload
   - [ ] Error handling
   - [ ] Rate limiting

9. [ ] Monitoring dashboard aç
   - [ ] Real-time metrics
   - [ ] Error rate
   - [ ] Processing time

10. [ ] Maintenance mode kapat (opsiyonel)

**Success Criteria**:
- ✅ Production deployed
- ✅ Smoke tests passing
- ✅ No critical errors
- ✅ Monitoring active

**Rollback**: Eğer critical errors varsa rollback planını uygula

---

#### Task 4.4: Production Verification
**Priority**: 🔴 CRITICAL
**Duration**: 60 dakika
**Dependencies**: Task 4.3

**Verification Steps**:

**1. Functional Verification**
- [ ] İrsaliye upload çalışıyor
- [ ] Auto-fill çalışıyor
- [ ] Error handling çalışıyor
- [ ] Rate limiting çalışıyor

**2. Performance Verification**
- [ ] Processing time < 30s
- [ ] Success rate > 95%
- [ ] No performance degradation

**3. Error Monitoring**
- [ ] Error rate < 5%
- [ ] No critical errors
- [ ] Error types documented

**4. User Testing**
- [ ] 3-5 real user test
- [ ] Feedback collect et
- [ ] Issues document et

**5. Log Analysis**
```bash
# Check logs
tail -100 logs/combined.log | grep -i "error"
tail -100 logs/irsaliye-analiz.log
```

**6. n8n Monitoring**
- [ ] Executions dashboard
- [ ] Success/failure ratio
- [ ] Average execution time

**Success Criteria**:
- ✅ All verification steps passed
- ✅ User feedback positive
- ✅ No critical issues

**Rollback**: Issues varsa analyze et ve karar ver: fix veya rollback

---

### PHASE 5: Monitoring & Rollback (1 hafta)

#### Task 5.1: First Week Monitoring
**Priority**: 🟡 IMPORTANT
**Duration**: 7 gün
**Dependencies**: Task 4.4

**Daily Tasks**:

**Gün 1 (Deployment Day)**:
- [ ] Saatlik success rate check
- [ ] Error log review
- [ ] User feedback check
- [ ] Performance metrics review
- [ ] n8n Executions review

**Gün 2-3**:
- [ ] Daily success rate report
- [ ] Error type analysis
- [ ] Performance trend analysis
- [ ] User feedback collection

**Gün 4-5**:
- [ ] Weekly summary
- [ ] Optimization opportunities
- [ ] User satisfaction survey

**Gün 6-7**:
- [ ] Final assessment
- [ ] Go/No-Go decision for permanent migration

**Metrics to Track**:
- Success rate (target: ≥95%)
- Error rate (target: ≤5%)
- Average processing time (target: ≤10s)
- P95 processing time (target: ≤30s)
- User complaints (target: <5)

**Alert Thresholds**:
- Success rate < 90% → ALERT
- Error rate > 10% → ALERT
- Processing time > 60s → ALERT
- User complaints > 10 → ALERT

**Success Criteria**:
- ✅ All metrics within thresholds
- ✅ No critical issues
- ✅ User feedback positive

**Rollback**: Threshold'lar aşıldıysa rollback değerlendir

---

#### Task 5.2: Issue Management
**Priority**: 🟡 IMPORTANT
**Duration**: Continuous
**Dependencies**: Task 5.1

**Common Issues ve Solutions**:

**Issue 1: High Processing Time**
- Symptom: Processing time > 30s
- Investigation: n8n logs, Gemini API latency
- Solution: n8n workflow optimize et veya Gemini model değiştir

**Issue 2: High Error Rate**
- Symptom: Error rate > 10%
- Investigation: Error type analysis
- Solution: Input validation improve et veya prompt optimize et

**Issue 3: n8n Downtime**
- Symptom: 503 Service Unavailable
- Investigation: n8n sunucu status
- Solution: Fallback mechanism veya n8n backup plan

**Issue 4: API Quota Exceeded**
- Symptom: Gemini API quota error
- Investigation: Token usage monitoring
- Solution: Quota increase veya caching

**Issue 5: User Complaints**
- Symptom: Negative feedback
- Investigation: User interviews
- Solution: UX improve et veya processing time optimize et

**Issue Escalation**:
```
Level 1 (Minor): User can workaround, log and monitor
Level 2 (Moderate): Affects some users, investigate within 24h
Level 3 (Major): Affects many users, investigate within 4h
Level 4 (Critical): System down, rollback immediately
```

**Rollback**: Level 4 issues için hemen rollback

---

#### Task 5.3: Rollback Plan
**Priority**: 🔴 CRITICAL
**Duration**: Hazırlık + Execution
**Dependencies**: Always ready

**Rollback Triggers**:
- Error rate > 10% for 1 hour
- Success rate < 90% for 1 hour
- Processing time > 60s for 1 hour
- Critical user complaints > 10
- System instability
- Data corruption detected

**Rollback Steps**:

**1. Assessment (5 dakika)**
- [ ] Issue identify et
- [ ] Impact assess et
- [ ] Rollback decision ver

**2. Notification (5 dakika)**
- [ ] Team bilgilendir
- [ ] Users bilgilendir (maintenance mode)
- [ ] Status update gönder

**3. Rollback Execution (15 dakika)**
```bash
# Code rollback
git checkout v14.dev1
git revert <commit-hash>
git push origin v14.dev1

# Config rollback
cp .env.backup .env

# Restart services
pm2 restart urtm-takip

# Verify rollback
curl http://127.0.0.1:3000/api/health
```

**4. Verification (10 dakika)**
- [ ] System working mi?
- [ ] Old functionality restored mu?
- [ ] No data loss mi?

**5. Post-Rollback (30 dakika)**
- [ ] Root cause analysis
- [ ] Fix develop et
- [ ] Test fix
- [ ] Plan redeployment

**Rollback Test** (Staging'de):
```bash
# Simulate rollback scenario
# Verify rollback works correctly
```

**Success Criteria**:
- ✅ Rollback completed
- ✅ System stable
- ✅ No data loss

**Rollback of Rollback**:
- Fix validated → redeploy

---

## 📊 Quality Gates

### Gate 1: n8n Workflow Ready
**Criteria**:
- ✅ Workflow active
- ✅ All nodes connected
- ✅ Test cases passing
- ✅ Credentials configured
- ✅ Webhook URL accessible

**Sign-off**: DevOps Engineer

---

### Gate 2: Backend Implementation Ready
**Criteria**:
- ✅ Code changes complete
- ✅ Unit tests passing
- ✅ Local testing successful
- ✅ Configuration updated
- ✅ Backup created

**Sign-off**: Backend Developer

---

### Gate 3: Integration Testing Complete
**Criteria**:
- ✅ Full stack testing passed
- ✅ Error scenarios handled
- ✅ Performance acceptable
- ✅ Security tests passed
- ✅ No critical issues

**Sign-off**: QA Engineer

---

### Gate 4: Production Ready
**Criteria**:
- ✅ Staging deployment successful
- ✅ All quality gates passed
- ✅ Monitoring configured
- ✅ Rollback plan ready
- ✅ Stakeholder approval

**Sign-off**: Project Manager + Tech Lead

---

### Gate 5: Production Stable
**Criteria**:
- ✅ First week metrics acceptable
- ✅ No critical issues
- ✅ User feedback positive
- ✅ System stable
- ✅ Documentation complete

**Sign-off**: Project Manager

---

## 🎯 Success Criteria

### Technical Metrics
| Metric | Target | Actual |
|--------|--------|--------|
| Success Rate | ≥95% | ___ |
| Error Rate | ≤5% | ___ |
| Avg Processing Time | ≤10s | ___ |
| P95 Processing Time | ≤30s | ___ |
| Availability | ≥99% | ___ |
| Zero Data Loss | 100% | ___ |

### User Experience Metrics
| Metric | Target | Actual |
|--------|--------|--------|
| User Satisfaction | ≥4/5 | ___ |
| Complaint Count | <5/week | ___ |
| Feature Adoption | ≥80% | ___ |

### Development Metrics
| Metric | Target | Actual |
|--------|--------|--------|
| Code Coverage | ≥80% | ___ |
| Test Pass Rate | 100% | ___ |
| Deployment Time | <60 min | ___ |
| Rollback Time | <30 min | ___ |

---

## 📞 Communication Plan

### Pre-Deployment
- [ ] Development team briefed
- [ ] Stakeholders informed
- [ ] Users notified (maintenance window)
- [ ] Support team trained

### During Deployment
- [ ] Status updates every 15 min
- [ ] Issue escalation channel active
- [ ] Rollback decision protocol clear

### Post-Deployment
- [ ] Success announcement
- [ ] Documentation shared
- [ ] Training materials available
- [ ] Support channel open

---

## 📚 Appendix

### A. Useful Commands

**n8n Testing**:
```bash
# Test webhook
curl -X POST https://n8n.igenis.com/webhook/irsaliye-analiz \
  -H "Content-Type: application/json" \
  -d @test-payload.json

# Check workflow status (n8n API)
curl https://n8n.igenis.com/api/v1/workflows \
  -H "Authorization: Bearer <N8N_API_KEY>"
```

**Backend Testing**:
```bash
# Test backend endpoint
curl -X POST http://127.0.0.1:3000/api/irsaliyeler/analiz \
  -H "Content-Type: application/json" \
  -d @test-payload.json

# Check logs
tail -f logs/combined.log
tail -f logs/irsaliye-analiz.log
```

**Performance Testing**:
```bash
# Apache Bench
ab -n 100 -c 10 -p payload.json -T application/json \
   http://127.0.0.1:3000/api/irsaliyeler/analiz

# Wrk
wrk -t4 -c100 -d30s -s post.lua http://127.0.0.1:3000/api/irsaliyeler/analiz
```

**Monitoring**:
```bash
# PM2 monitoring
pm2 monit

# System resources
htop
iostat -x 1

# Network monitoring
nethogs
```

---

### B. Troubleshooting Guide

**Issue: n8n webhook timeout**
```bash
# Check n8n status
curl https://n8n.igenis.com/healthz

# Check workflow executions
# n8n UI → Executions

# Check network connectivity
ping n8n.igenis.com
traceroute n8n.igenis.com
```

**Issue: Backend 503 error**
```bash
# Check backend logs
pm2 logs urtm-takip --err

# Check port availability
netstat -tulpn | grep 3000

# Check backend process
ps aux | grep node
```

**Issue: High processing time**
```bash
# Check n8n execution time
# n8n UI → Executions → Filter by workflow

# Check Gemini API latency
# Analyze response times

# Check network latency
ping -c 10 generativelanguage.googleapis.com
```

**Issue: Rate limiting too aggressive**
```bash
# Check rate limit config
grep -A10 "rateLimit" src/middleware/rateLimit.js

# Adjust if needed
# Edit rateLimit.js
# Restart backend
pm2 restart urtm-takip
```

---

### C. Rollback Script

```bash
#!/bin/bash
# rollback.sh - n8n Integration Rollback Script

echo "Starting rollback..."

# 1. Stop services
pm2 stop urtm-takip

# 2. Revert code changes
cd /home/irgat12/URTMtakip
git checkout v14.dev1
git log --oneline -5
git revert HEAD~1..HEAD

# 3. Restore config
cp backend/.env.backup backend/.env

# 4. Reinstall dependencies (if needed)
cd backend
npm install

# 5. Restart services
pm2 start urtm-takip

# 6. Verify
sleep 5
curl http://127.0.0.1:3000/api/health

echo "Rollback completed!"
```

---

**Document Version**: 1.0.0
**Last Updated**: 2025-01-26
**Status**: Ready for Execution
**Next Step**: Begin Phase 1 - n8n Sunucu Hazırlığı
