const express = require('express');
const router = express.Router();

const {
  getTezgahIsPlanimi,
  updateTezgahIsEmri,
  bulkUpdateTezgahIsEmirleri
} = require('../controllers/tezgahIsPlanimi');

// İş emirlerini istasyon bazında getir
router.get('/', getTezgahIsPlanimi);

// İş emri güncelleme
router.put('/:id', updateTezgahIsEmri);

// Toplu güncelleme (drag & drop için)
router.put('/bulk-update', bulkUpdateTezgahIsEmirleri);

module.exports = router;