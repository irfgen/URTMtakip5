const express = require('express');
const router = express.Router();
const isEmriDurumController = require('../controllers/isEmriDurumController');

// İş emri durumları route'ları

// Tüm durumları listele
router.get('/', isEmriDurumController.getAll);

// Varsayılan durumları oluştur
router.post('/create-defaults', isEmriDurumController.createDefaults);

// Durumları yeniden sırala
router.post('/reorder', isEmriDurumController.reorder);

// Yeni durum oluştur
router.post('/', isEmriDurumController.create);

// Tek durum getir
router.get('/:id', isEmriDurumController.getById);

// Durum güncelle
router.put('/:id', isEmriDurumController.update);

// Durum sil
router.delete('/:id', isEmriDurumController.delete);

module.exports = router;