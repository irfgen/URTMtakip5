const express = require('express');
const grupController = require('../controllers/grupController');
const router = express.Router();

// Grup CRUD operasyonları
router.get('/gruplar', grupController.listGruplar);
router.post('/gruplar', grupController.createGrup);
router.get('/gruplar/:id', grupController.getGrupDetail);
router.put('/gruplar/:id', grupController.updateGrup);
router.delete('/gruplar/:id', grupController.deleteGrup);

// Gruba parça ekleme/çıkarma
router.put('/gruplar/:id/parcalar', grupController.updateGrupParcalar);

module.exports = router;
