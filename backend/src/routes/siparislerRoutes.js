const express = require('express');
const router = express.Router();

const {
  getAktifIsEmirleri
} = require('../controllers/siparislerController');

// Aktif iş emirlerini getir (sipariş tabı için)
router.get('/aktif-is-emirleri', getAktifIsEmirleri);

module.exports = router;
