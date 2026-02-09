const express = require('express');
const router = express.Router();
const isEmriOzetiController = require('../controllers/isEmriOzetiController');

// İş emri özeti oluştur/güncelle
router.post('/', isEmriOzetiController.createOrUpdateIsEmriOzet);

// Tüm iş emri özetlerini getir (bu önce olmalı)
router.get('/all', isEmriOzetiController.getAllIsEmriOzetleri);

// İş emri özetini getir
router.get('/:is_emri_id', isEmriOzetiController.getIsEmriOzet);

// İş emri özetini onayla
router.put('/:is_emri_id/approve', isEmriOzetiController.approveIsEmriOzet);

module.exports = router;
