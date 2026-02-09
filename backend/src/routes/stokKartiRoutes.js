const express = require('express');
const router = express.Router();
const stokKartiController = require('../controllers/stokKartiController');

// Stok kartı CRUD işlemleri
router.post('/', stokKartiController.stokKartiOlustur);
router.get('/', stokKartiController.stokKartlariGetir);
router.get('/:id', stokKartiController.stokKartiGetir);

// Özel endpoint'ler
router.get('/ara/ham-malzeme-olcu', stokKartiController.hamMalzemeOlcuAra);

module.exports = router;
