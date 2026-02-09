const express = require('express');
const router = express.Router();
const fasonGrupController = require('../controllers/fasonGrupController');

// Tüm fason gruplarını listele
router.get('/', fasonGrupController.listFasonGruplar);

// Gruba atanmamış fason iş emirlerini getir
router.get('/unassigned', fasonGrupController.getUnassignedFasonIsEmirleri);

// Belirli bir fason grubunu getir
router.get('/:id', fasonGrupController.getFasonGrup);

// Yeni fason grup oluştur
router.post('/', fasonGrupController.createFasonGrup);

// Fason grup güncelle
router.put('/:id', fasonGrupController.updateFasonGrup);

// Fason grup sil
router.delete('/:id', fasonGrupController.deleteFasonGrup);

module.exports = router;
