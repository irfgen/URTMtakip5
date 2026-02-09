const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const irsaliyeController = require('../controllers/irsaliyeController');
const { body, param, query, validationResult } = require('express-validator');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const { irsaliyeAnalizLimiter } = require('../middleware/rateLimiter');

// Apply auth middleware to all routes (skip in test mode)
if (process.env.NODE_ENV !== 'test') {
  router.use(authMiddleware);
} else {
  // In test mode, use a pass-through middleware that sets req.user and req.io
  // User ID can be passed via X-Test-User-Id header for multi-user tests
  router.use((req, res, next) => {
    const testUserId = req.headers['x-test-user-id']
      ? parseInt(req.headers['x-test-user-id'])
      : 1;

    req.user = {
      id: testUserId,
      ad_soyad: 'Test User',
      email: 'test@example.com',
      role: ['admin']
    };
    req.io = null;
    next();
  });
}

// GET /api/irsaliyeler - List with filters
router.get('/', [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('tedarikci_id').optional().isInt(),
    query('durum').optional().isIn(['bekliyor', 'kismi_eslesti', 'tam_eslesti']),
    query('baslangic_tarih').optional().isISO8601().toDate(),
    query('bitis_tarih').optional().isISO8601().toDate()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    try {
        const result = await irsaliyeController.list(req.query);
        res.json({
            success: true,
            data: result.data,
            pagination: result.pagination
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/irsaliyeler/:id - Detail
router.get('/:id', [
    param('id').isInt()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
        const data = await irsaliyeController.getById(req.params.id, req.user);
        res.json({ success: true, data });
    } catch (error) {
        if (error.message === 'NOT_FOUND') {
            return res.status(404).json({ success: false, error: 'İrsaliye bulunamadı' });
        }
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/irsaliyeler - Create
router.post('/', [
    body('irsaliye_no').trim().notEmpty().isLength({ max: 50 }),
    body('tedarikci_id').isInt(),
    body('belge_tarih').isISO8601().toDate(),
    body('belge_tipi').optional().isIn(['gelis', 'cikis']),
    body('aciklama').optional().trim(),
    body('kalemler').optional().isArray()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log('❌ Validation Errors:', JSON.stringify(errors.array(), null, 2));
        console.log('❌ Request Body:', JSON.stringify(req.body, null, 2));
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
        const data = await irsaliyeController.create(req.body, req.user);
        res.status(201).json({
            success: true,
            message: 'İrsaliye başarıyla oluşturuldu',
            data
        });
    } catch (error) {
        console.error('❌ Create Error:', error);
        if (error.message === 'DUPLICATE_ENTRY') {
            return res.status(400).json({
                success: false,
                error: 'Bu irsaliye no zaten mevcut'
            });
        }
        res.status(500).json({ success: false, error: error.message });
    }
});

// PUT /api/irsaliyeler/:id - Update
router.put('/:id', [
    param('id').isInt(),
    body('irsaliye_no').optional().trim().notEmpty().isLength({ max: 50 }),
    body('tedarikci_id').optional().isInt(),
    body('belge_tarih').optional().isISO8601().toDate(),
    body('belge_tipi').optional().isIn(['gelis', 'cikis']),
    body('aciklama').optional().trim()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
        const data = await irsaliyeController.update(req.params.id, req.body, req.user);
        res.json({
            success: true,
            message: 'İrsaliye başarıyla güncellendi',
            data
        });
    } catch (error) {
        if (error.message === 'NOT_FOUND') {
            return res.status(404).json({ success: false, error: 'İrsaliye bulunamadı' });
        }
        if (error.message === 'LOCKED_BY_OTHER') {
            return res.status(409).json({
                success: false,
                error: 'Kayıt başka bir kullanıcı tarafından kilitli'
            });
        }
        res.status(500).json({ success: false, error: error.message });
    }
});

// DELETE /api/irsaliyeler/:id - Delete
router.delete('/:id', [
    param('id').isInt()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
        await irsaliyeController.delete(req.params.id, req.user);
        res.json({ success: true, message: 'İrsaliye başarıyla silindi' });
    } catch (error) {
        if (error.message === 'NOT_FOUND') {
            return res.status(404).json({ success: false, error: 'İrsaliye bulunamadı' });
        }
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/irsaliyeler/:id/kalemler - List items
router.get('/:id/kalemler', [
    param('id').isInt()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
        const data = await irsaliyeController.getKalemler(req.params.id);
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/irsaliyeler/:id/kalemler - Add item
router.post('/:id/kalemler', [
    param('id').isInt(),
    body('mal_hizmet_adi').trim().notEmpty().withMessage('Mal/Hizmet adı zorunludur'),
    body('stok_kodu').optional().trim().isLength({ max: 100 }),
    body('miktar').isFloat({ min: 0.0001 }),
    body('birim').optional().trim(),
    body('aciklama').optional().trim()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
        const data = await irsaliyeController.addKalem(req.params.id, req.body, req.user);
        res.status(201).json({
            success: true,
            message: 'Kalem başarıyla eklendi',
            data
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/irsaliyeler/:id/lock - Acquire lock
router.post('/:id/lock', [
    param('id').isInt()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
        const result = await irsaliyeController.acquireLock(req.params.id, req.user.id);

        // Emit Socket.IO event
        if (req.io) {
            req.io.of('/fatura-eslestirme').emit('lock-acquired', {
                belgeTipi: 'irsaliye',
                belgeId: req.params.id,
                lockedBy: req.user.id,
                lockedAt: result.locked_at
            });
        }

        res.json({ success: true, data: result });
    } catch (error) {
        if (error.message === 'LOCKED_BY_OTHER') {
            return res.status(409).json({
                success: false,
                error: 'Kayıt başka bir kullanıcı tarafından kilitli',
                lockedBy: error.lockedBy,
                lockedAt: error.lockedAt
            });
        }
        res.status(500).json({ success: false, error: error.message });
    }
});

// DELETE /api/irsaliyeler/:id/lock - Release lock
router.delete('/:id/lock', async (req, res) => {
    try {
        await irsaliyeController.releaseLock(req.params.id, req.user.id);

        if (req.io) {
            req.io.of('/fatura-eslestirme').emit('lock-released', {
                belgeTipi: 'irsaliye',
                belgeId: req.params.id
            });
        }

        res.json({ success: true, message: 'Lock bırakıldı' });
    } catch (error) {
        if (error.message === 'NOT_LOCK_OWNER') {
            return res.status(403).json({
                success: false,
                error: 'Sadece kendi lockunuzu bırakabilirsiniz'
            });
        }
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/irsaliyeler/:id/force-unlock - Admin force unlock
router.post('/:id/force-unlock', [
    param('id').isInt(),
    body('reason').trim().notEmpty()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    // Admin check
    if (!req.user.role?.includes('admin')) {
        return res.status(403).json({
            success: false,
            error: 'Only admins can force unlock'
        });
    }

    try {
        const result = await irsaliyeController.forceUnlock(
            req.params.id,
            req.user.id,
            req.body.reason
        );

        if (req.io && result.previousLockHolder) {
            req.io.of('/fatura-eslestirme').to(result.previousLockHolder.toString()).emit('lock-force-released', {
                belgeTipi: 'irsaliye',
                belgeId: req.params.id,
                reason: req.body.reason,
                releasedBy: req.user.ad_soyad
            });
        }

        res.json({ success: true, message: 'Lock zorla bırakıldı' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/irsaliyeler/analiz/health - Hibrit analiz servisi health check
router.get('/analiz/health', async (req, res) => {
    try {
        const IrsaliyeAnalysisService = require('../services/irsaliye/IrsaliyeAnalysisService.test');
        const health = await IrsaliyeAnalysisService.healthCheck();
        res.json(health);
    } catch (error) {
        res.status(500).json({
            status: 'error',
            error: error.message
        });
    }
});

// GET /api/irsaliyeler/analiz/metrics - Hibrit analiz servis metrikleri
router.get('/analiz/metrics', async (req, res) => {
    try {
        const IrsaliyeAnalysisService = require('../services/irsaliye/IrsaliyeAnalysisService.test');
        const metrics = await IrsaliyeAnalysisService.getMetrics();
        res.json(metrics);
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
});

// POST /api/irsaliyeler/analiz/v2 - Hibrit irsaliye analizi (Rule-based + AI)
router.post('/analiz/v2', irsaliyeAnalizLimiter, [
    body('image').notEmpty().withMessage('Image data is required'),
    body('strategy').optional().isIn(['rule_based', 'ai_based', 'hybrid']),
    body('force_ai').optional().isBoolean(),
    body('context').optional().isObject()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    let hybridAnalyzer;
    try {
        const { image, strategy, force_ai, context } = req.body;

        // Clean base64 header
        const base64Data = image.includes(',') ? image.split(',')[1] : image;
        const imageBuffer = Buffer.from(base64Data, 'base64');

        // DEBUG: Log received image info
        const crypto = require('crypto');
        const imageHash = crypto.createHash('md5').update(imageBuffer).digest('hex');
        console.log('[DEBUG IRSALIYE V2] Received image:', {
            imageSize: imageBuffer.length,
            imageHash: imageHash.substring(0, 16),
            strategy: strategy,
            forceAI: force_ai,
            hasContext: !!context
        });

        // Import hybrid service
        const { analyzeIrsaliye } = require('../services/irsaliye');

        // Build options
        const options = {
            strategy: strategy,
            forceAI: force_ai,
            context: context
        };

        // Run analysis
        const result = await analyzeIrsaliye(imageBuffer, options);

        res.json({
            success: true,
            data: {
                irsaliyeNo: result.irsaliyeNo?.value || result.irsaliyeNo,
                tedarikci: result.tedarikci?.value || result.tedarikci,
                tarih: result.tarih?.value || result.tarih,
                kalemler: result.kalemler || [],
                toplamTutar: result.toplamTutar || null,
                eslesmeyenKalemler: result.eslesmeyenKalemler || [],
                eslesmeOzeti: result.eslesmeOzeti || null
            },
            metadata: {
                parseMethod: result.metadata?.parseMethod,
                analysisMethod: result.strategy,
                processingTime: result.processingTime,
                complexityScore: result.complexityScore,
                ocrConfidence: result.metadata?.ocrConfidence,
                aiModel: result.metadata?.aiModel,
                validation: result.validation
            }
        });

    } catch (error) {
        console.error('[İrsaliye V2 Analiz Error]:', error);

        // Provide helpful error messages
        let errorMessage = 'İrsaliye analizi başarısız';
        let errorDetails = null;

        if (error.message.includes('API yetki')) {
            errorMessage = 'AI servisi yapılandırılmadı';
            errorDetails = 'Lütfen OPENAI_API_KEY veya ANTHROPIC_API_KEY environment variable\'larını yapılandırın';
        } else if (error.message.includes('timeout')) {
            errorMessage = 'Analiz zaman aşımına uğradı';
            errorDetails = 'Belge çok karmaşık veya AI servisi yavaş yanıt veriyor';
        } else if (error.message.includes('OCR')) {
            errorMessage = 'OCR işlemi başarısız';
            errorDetails = 'Belge okunamadı, lütfen daha net bir resim yükleyin';
        }

        res.status(500).json({
            success: false,
            error: errorMessage,
            details: errorDetails,
            message: error.message
        });
    }
});

// POST /api/irsaliyeler/analiz - AI ile irsaliye analizi (n8n workflow üzerinden - DEPRECATED, use /analiz/v2)
router.post('/analiz', irsaliyeAnalizLimiter, [
    body('image').notEmpty().withMessage('Image data is required'),
    body('irsaliye_no').optional().trim()
], async (req, res) => {
    // Add deprecation warning header
    res.setHeader('X-API-Deprecation', 'This endpoint is deprecated. Use /api/irsaliyeler/analiz/v2 instead.');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
        const { image, irsaliye_no } = req.body;

        console.log('[DEBUG] İrsaliye Analiz Request:', {
            hasImage: !!image,
            imageLength: image?.length,
            irsaliye_no
        });

        // Validation
        if (!image || !irsaliye_no) {
            console.log('[DEBUG] Validation failed');
            return res.status(400).json({
                success: false,
                error: 'Eksik parametreler: image ve irsaliye_no gereklidir'
            });
        }

        // Clean base64 header (data:image/jpeg;base64,...)
        const base64Data = image.includes(',')
            ? image.split(',')[1]
            : image;

        // Generate unique request ID for tracking
        const requestId = uuidv4();

        // Prepare n8n webhook payload
        const n8nPayload = {
            image: base64Data,
            irsaliye_no: irsaliye_no,
            timestamp: new Date().toISOString(),
            request_id: requestId
        };

        // Call n8n webhook
        const webhookUrl = process.env.N8N_WEBHOOK_URL || 'https://n8n.igenis.com/webhook/irsaliye-analiz';

        console.log('[DEBUG] Calling n8n webhook:', {
            url: webhookUrl,
            payloadSize: JSON.stringify(n8nPayload).length,
            hasApiKey: !!process.env.N8N_API_KEY
        });

        const n8nResponse = await axios.post(
            webhookUrl,
            n8nPayload,
            {
                headers: {
                    'Content-Type': 'application/json',
                    ...(process.env.N8N_API_KEY && {
                        'X-n8n-API-Key': process.env.N8N_API_KEY
                    })
                },
                timeout: 45000, // 45 seconds (n8n processing + Gemini API calls)
                validateStatus: (status) => status < 500 // Retry on 5xx errors
            }
        );

        console.log('[DEBUG] n8n Response:', {
            status: n8nResponse.status,
            hasData: !!n8nResponse.data,
            success: n8nResponse.data?.success
        });

        // Success response from n8n
        if (n8nResponse.data.success) {
            return res.status(200).json({
                success: true,
                request_id: requestId,
                processing_time_ms: n8nResponse.data.processing_time_ms,
                data: n8nResponse.data.data,
                metadata: n8nResponse.data.metadata
            });
        }
        // n8n processing error (4xx)
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
            // Server responded with error status
            const statusCode = error.response.status;
            const errorMessage = error.response.data?.error?.message || 'n8n webhook hatası';

            return res.status(statusCode).json({
                success: false,
                request_id: requestId,
                error: {
                    message: errorMessage,
                    type: 'webhook_error',
                    details: statusCode >= 500 ? 'Sunucu hatası, lütfen tekrar deneyin' : undefined
                }
            });
        }
        else if (error.request) {
            // Request made but no response received (network error)
            return res.status(503).json({
                success: false,
                request_id: requestId,
                error: {
                    message: 'n8n sunucusuna ulaşılamadı. Lütfen daha sonra tekrar deneyin.',
                    type: 'network_error'
                }
            });
        }
        else {
            // Other errors (request config, etc.)
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

module.exports = router;
