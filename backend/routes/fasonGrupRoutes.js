const express = require('express');
const router = express.Router();
const fasonGrupController = require('../controllers/fasonGrupController');

// Fason grup route'ları
router.get('/', fasonGrupController.getAllFasonGruplar);
router.get('/unassigned', fasonGrupController.getUnassignedFasonIsEmirleri);
router.get('/:id', fasonGrupController.getFasonGrupById);
router.post('/', fasonGrupController.createFasonGrup);
router.put('/:id', fasonGrupController.updateFasonGrup);
router.delete('/:id', fasonGrupController.deleteFasonGrup);

module.exports = router;
