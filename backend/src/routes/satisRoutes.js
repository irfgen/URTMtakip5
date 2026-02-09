const express = require('express');
const satisController = require('../controllers/satisController');
const router = express.Router();

// Satış CRUD operasyonları
router.get('/satislar', satisController.listSatislar);
router.post('/satislar/makina-sat', satisController.makinaSat);

// Dropdown için makina listesi (özel route'lar yukarıda olmalı)
router.get('/satislar/makinalar', satisController.listMakinalar);

router.get('/satislar/:id', satisController.getSatisDetail);
router.delete('/satislar/:id', satisController.deleteSatis);

module.exports = router;
