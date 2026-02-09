const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const eslestirmeController = require('../controllers/eslestirmeController');
const { body, param, validationResult } = require('express-validator');

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

// GET /api/eslestirme/oneler/:fatura_id - Get matching suggestions
router.get('/oneler/:fatura_id', [
    param('fatura_id').isInt()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
        const data = await eslestirmeController.getOneriler(req.params.fatura_id);
        res.json({ success: true, data });
    } catch (error) {
        if (error.message === 'NOT_FOUND') {
            return res.status(404).json({ success: false, error: 'Fatura bulunamadı' });
        }
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/eslestirme/gruplu-oneler/:fatura_id - Get grouped matching suggestions for each kalem
router.get('/gruplu-oneler/:fatura_id', [
    param('fatura_id').isInt()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
        const data = await eslestirmeController.getGrupluOneriler(req.params.fatura_id);
        res.json({ success: true, data });
    } catch (error) {
        if (error.message === 'NOT_FOUND') {
            return res.status(404).json({ success: false, error: 'Fatura bulunamadı' });
        }
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/eslestirme/onayla - Confirm matching
router.post('/onayla', [
    body('fatura_id').isInt(),
    body('eslestirmeler').isArray(),
    body('eslestirmeler.*.fatura_kalem_id').isInt(),
    body('eslestirmeler.*.irsaliye_kalem_id').isInt(),
    body('eslestirmeler.*.fatura_miktar').isFloat({ min: 0 }),
    body('eslestirmeler.*.irsaliye_miktar').isFloat({ min: 0 }),
    body('eslestirmeler.*.neden').optional().trim()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
        const result = await eslestirmeController.onayla(
            req.body.fatura_id,
            req.body.eslestirmeler,
            req.user.id,
            req.io
        );
        res.json({
            success: true,
            message: 'Eşleşme başarıyla onaylandı',
            data: result
        });
    } catch (error) {
        if (error.message === 'NOT_FOUND') {
            return res.status(404).json({ success: false, error: 'Fatura bulunamadı' });
        }
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                error: 'Validasyon hatası',
                details: error.details
            });
        }
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/eslestirme/reddet - Reject matching
router.post('/reddet', [
    body('fatura_kalem_id').isInt(),
    body('irsaliye_kalem_id').isInt(),
    body('neden').optional().trim()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
        await eslestirmeController.reddet(
            req.body.fatura_kalem_id,
            req.body.irsaliye_kalem_id,
            req.body.neden,
            req.user.id
        );
        res.json({ success: true, message: 'Eşleşme reddedildi' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/eslestirme/manuel - Manual matching
router.post('/manuel', [
    body('fatura_kalem_id').isInt(),
    body('irsaliye_kalem_id').isInt(),
    body('neden').optional().trim()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
        const result = await eslestirmeController.manuelEslestirme(
            req.body.fatura_kalem_id,
            req.body.irsaliye_kalem_id,
            req.body.neden,
            req.user.id,
            req.io
        );
        res.json({
            success: true,
            message: 'Manuel eşleşme başarıyla yapıldı',
            data: result
        });
    } catch (error) {
        if (error.message === 'ALREADY_MATCHED') {
            return res.status(400).json({
                success: false,
                error: 'Bu kalem zaten eşleştirilmiş'
            });
        }
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/eslestirme/eslestirme-kaldir/:fatura_kalem_id - Remove matching
router.post('/eslestirme-kaldir/:fatura_kalem_id', [
    param('fatura_kalem_id').isInt(),
    body('neden').trim().notEmpty()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
        await eslestirmeController.eslestirmeKaldir(
            req.params.fatura_kalem_id,
            req.body.neden,
            req.user.id,
            req.io
        );
        res.json({ success: true, message: 'Eşleşme kaldırıldı' });
    } catch (error) {
        if (error.message === 'NOT_MATCHED') {
            return res.status(400).json({
                success: false,
                error: 'Bu kalem eşleştirilmemiş'
            });
        }
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/eslestirme/durum/:fatura_id - Get matching status
router.get('/durum/:fatura_id', [
    param('fatura_id').isInt()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
        const data = await eslestirmeController.getDurum(req.params.fatura_id);
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
