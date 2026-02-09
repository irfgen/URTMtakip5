const express = require('express');
const router = express.Router();
const tezgahRaporController = require('../controllers/tezgahRaporController');

// GET /api/tezgah/rapor/timeline
router.get('/rapor/timeline', tezgahRaporController.getTezgahTimeline);

module.exports = router;


