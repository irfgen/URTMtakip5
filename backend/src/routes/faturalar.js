const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const faturaController = require('../controllers/faturaController');
const { body, param, query, validationResult } = require('express-validator');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

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

// GET /api/faturalar - List with filters
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
        const result = await faturaController.list(req.query);
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

// GET /api/faturalar/:id - Detail
router.get('/:id', [
    param('id').isInt()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
        const data = await faturaController.getById(req.params.id, req.user);
        res.json({ success: true, data });
    } catch (error) {
        if (error.message === 'NOT_FOUND') {
            return res.status(404).json({ success: false, error: 'Fatura bulunamadı' });
        }
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/faturalar - Create
router.post('/', [
    body('fatura_no').trim().notEmpty().isLength({ max: 50 }),
    body('tedarikci_id').isInt(),
    body('belge_tarih').isISO8601().toDate(),
    body('belge_tipi').optional().isIn(['gelis', 'cikis']),
    body('aciklama').optional().trim(),
    body('kalemler').optional().isArray()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
        const data = await faturaController.create(req.body, req.user);
        res.status(201).json({
            success: true,
            message: 'Fatura başarıyla oluşturuldu',
            data
        });
    } catch (error) {
        if (error.message === 'DUPLICATE_ENTRY') {
            return res.status(400).json({
                success: false,
                error: 'Bu fatura no zaten mevcut'
            });
        }
        res.status(500).json({ success: false, error: error.message });
    }
});

// PUT /api/faturalar/:id - Update
router.put('/:id', [
    param('id').isInt(),
    body('fatura_no').optional().trim().notEmpty().isLength({ max: 50 }),
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
        const data = await faturaController.update(req.params.id, req.body, req.user);
        res.json({
            success: true,
            message: 'Fatura başarıyla güncellendi',
            data
        });
    } catch (error) {
        if (error.message === 'NOT_FOUND') {
            return res.status(404).json({ success: false, error: 'Fatura bulunamadı' });
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

// DELETE /api/faturalar/:id - Delete
router.delete('/:id', [
    param('id').isInt()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
        await faturaController.delete(req.params.id, req.user);
        res.json({ success: true, message: 'Fatura başarıyla silindi' });
    } catch (error) {
        if (error.message === 'NOT_FOUND') {
            return res.status(404).json({ success: false, error: 'Fatura bulunamadı' });
        }
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/faturalar/:id/kalemler - List items
router.get('/:id/kalemler', [
    param('id').isInt()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
        const data = await faturaController.getKalemler(req.params.id);
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/faturalar/:id/kalemler - Add item
router.post('/:id/kalemler', [
    param('id').isInt(),
    body('stok_kodu').trim().notEmpty(),
    body('mal_hizmet_adi').trim().notEmpty(),
    body('miktar').isFloat({ min: 0.0001 }),
    body('birim_fiyat').optional().isFloat({ min: 0 }),
    body('birim').optional().trim(),
    body('aciklama').optional().trim()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
        const data = await faturaController.addKalem(req.params.id, req.body, req.user);
        res.status(201).json({
            success: true,
            message: 'Kalem başarıyla eklendi',
            data
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/faturalar/:id/lock - Acquire lock
router.post('/:id/lock', [
    param('id').isInt()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
        const result = await faturaController.acquireLock(req.params.id, req.user.id);

        // Emit Socket.IO event
        if (req.io) {
            req.io.of('/fatura-eslestirme').emit('lock-acquired', {
                belgeTipi: 'fatura',
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

// POST /api/faturalar/analiz - AI ile fatura analizi (Gemini API - n8n yerine direkt)
router.post('/analiz', [
    body('image').notEmpty().withMessage('Image data is required'),
    body('fatura_no').optional().trim()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    const { image, fatura_no } = req.body;

    // Base64 header'ı temizle (data:image/jpeg;base64,...)
    const base64Data = image.includes(',')
        ? image.split(',')[1]
        : image;

    // İstek için benzersiz ID oluştur
    const requestId = uuidv4();
    const startTime = Date.now();

    // DEBUG: Log received image info
    const crypto = require('crypto');
    const imageBuffer = Buffer.from(base64Data, 'base64');
    const imageHash = crypto.createHash('md5').update(imageBuffer).digest('hex');
    console.log('[DEBUG FATURA ANALIZ] Received image:', {
        imageSize: imageBuffer.length,
        imageHash: imageHash.substring(0, 16),
        faturaNo: fatura_no,
        requestId: requestId
    });

    try {
        // Import AI Analyzer Service
        const AIAnalyzerService = require('../services/irsaliye/AIAnalyzerService');
        const aiAnalyzer = new AIAnalyzerService();

        // Fatura-specific prompt
        const faturaPrompt = `Sen Türkçe fatura belgelerini analiz eden uzman bir asistansın.

Görevin: Gönderilen belgeden şu bilgileri structured JSON formatında çıkarmak:

1. faturaNo: Fatura numarası (FTXXXX veya sıra no formatı)
2. vknTckn: VKN TCKN
3. aliciAdi: Alici unvanı/adı
4. tarih: Fatura tarihi (YYYY-MM-DD formatında)
5. vadeTarihi: Vade tarihi (YYYY-MM-DD formatında, varsa)
6. kalemler: Ürün/malzeme listesi (TÜM KALEMLERİ ÇIKARMA ZORUNLU)
   - stokKodu: Stok kodu (varsa)
   - malHizmetAdi: Mal/hizmet adı
   - miktar: Miktar (sayı)
   - birim: Birim (adet, kg, lt, m, vb.)
   - birimFiyat: Birim fiyatı (varsa)
   - toplam: Toplam (varsa)

KRİTİK KURALLAR:
- TABLODAKİ HER SATIRI tek tek oku - HİÇBİR SATIRI ATLAMA
- Bulanık veya küçük metin olsa bile tahmin et, NULL kullanma
- En az 3 karakter okuyabiliyorsan o kalemi mutlaka ekle
- Emin olmadığında düşük confidence (0.3-0.5) ekle ama kalemi atla
- Tablo sonunu (toplam, genel toplam, kdv dahil satırları) KALEM olarak ekleme
- Miktar ve fiyat sütunlarını dikkatli oku

TABLO YAPISI:
Türkçe faturalarda genellikle şu sütunlar vardır:
- Malzeme / Ürün / Açıklama
- Miktar / Adet / Miktâr
- Birim (Adet, KG, LT, M, vb.)
- Birim Fiyat
- Toplam

${fatura_no ? `Fatura No: ${fatura_no}` : ''}

EK KURALLAR:
- Türkçe karakterleri doğru kullan (Ç, Ğ, I, İ, Ö, Ş, Ü)
- JSON formatında yanıt ver, açıklama yapma
- Kalemleri eksiksiz çık, az çıkardığında hata olur

Örnek JSON formatı:
{
  "faturaNo": "FT2024001",
  "vknTckn": "VXXXXXXXXX",
  "aliciAdi": "Firma A.Ş.",
  "tarih": "2024-01-15",
  "vadeTarihi": "2024-02-15",
  "kalemler": [
    {
      "stokKodu": "ABC001",
      "malHizmetAdi": "Plaka 5mm",
      "miktar": 10,
      "birim": "adet",
      "birimFiyat": 150.50,
      "toplam": 1505.00
    }
  ]
}`;

        // Call Gemini API
        const response = await aiAnalyzer.callGemini(
            base64Data,
            faturaPrompt,
            aiAnalyzer.getImageMimeType(imageBuffer)
        );

        // Parse AI response
        const analyzedData = aiAnalyzer.parseAIResponse(response);

        // Normalize field names for frontend compatibility
        // Frontend expects: fatura_no, belge_tarih, vade_tarihi, kalemler (with mal_hizmet_adi)
        const normalizedData = {
            fatura_no: analyzedData.faturaNo || null,
            belge_tarih: analyzedData.tarih || null,
            vade_tarihi: analyzedData.vadeTarihi || null,
            aciklama: analyzedData.aliciAdi ? `Alıcı: ${analyzedData.aliciAdi}` : null,
            kalemler: (analyzedData.kalemler || []).map(k => ({
                stok_kodu: k.stokKodu || '',
                mal_hizmet_adi: k.malHizmetAdi || '',
                miktar: k.miktar || 0,
                birim: k.birim || 'Adet',
                birim_fiyat: k.birimFiyat || 0,
                toplam_tutar: k.toplam || (k.miktar || 0) * (k.birimFiyat || 0)
            }))
        };

        // Add metadata
        const processingTime = Date.now() - startTime;
        normalizedData.metadata = {
            parseMethod: 'ai_analyzer',
            model: aiAnalyzer.model,
            provider: aiAnalyzer.apiProvider,
            timestamp: new Date().toISOString()
        };

        console.log('[DEBUG FATURA] Normalized result:', {
            faturaNo: normalizedData.fatura_no,
            belgeTarih: normalizedData.belge_tarih,
            kalemCount: normalizedData.kalemler?.length,
            kalemler: normalizedData.kalemler?.map(k => ({
                name: k.mal_hizmet_adi,
                qty: k.miktar
            })),
            processingTime: processingTime
        });

        return res.status(200).json({
            success: true,
            request_id: requestId,
            processing_time_ms: processingTime,
            data: normalizedData,
            metadata: normalizedData.metadata
        });

    } catch (error) {
        console.error('[FATURA ANALIZ ERROR]:', error.message);

        // Provide helpful error messages
        let errorMessage = 'Fatura analizi başarısız';
        let errorDetails = null;

        if (error.message.includes('API yetki')) {
            errorMessage = 'AI servisi yapılandırılmadı';
            errorDetails = 'Lütfen GEMINI_API_KEY environment variable\'ını yapılandırın';
        } else if (error.message.includes('timeout')) {
            errorMessage = 'Analiz zaman aşımına uğradı';
            errorDetails = 'Belge çok karmaşık veya AI servisi yavaş yanıt veriyor';
        } else if (error.message.includes('OCR') || error.message.includes('JSON')) {
            errorMessage = 'Belge işlenemedi';
            errorDetails = 'Belge okunamadı, lütfen daha net bir resim yükleyin';
        }

        return res.status(500).json({
            success: false,
            error: errorMessage,
            details: errorDetails,
            request_id: requestId,
            message: error.message
        });
    }
});

// DELETE /api/faturalar/:id/lock - Release lock
router.delete('/:id/lock', async (req, res) => {
    try {
        await faturaController.releaseLock(req.params.id, req.user.id);

        if (req.io) {
            req.io.of('/fatura-eslestirme').emit('lock-released', {
                belgeTipi: 'fatura',
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

module.exports = router;
