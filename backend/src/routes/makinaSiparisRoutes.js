const express = require('express');
const makinaSiparisController = require('../controllers/makinaSiparisController');
const router = express.Router();

// Sipariş CRUD operasyonları
router.get('/makina-siparisleri', makinaSiparisController.listSiparisler);
router.post('/makina-siparisleri', makinaSiparisController.createSiparis);
router.get('/makina-siparisleri/:id', makinaSiparisController.getSiparisDetail);
router.put('/makina-siparisleri/:id', makinaSiparisController.updateSiparis);
router.delete('/makina-siparisleri/:id', makinaSiparisController.deleteSiparis);

// Durum güncelleme
router.patch('/makina-siparisleri/:id/durum', makinaSiparisController.updateSiparisDurum);

module.exports = router;
