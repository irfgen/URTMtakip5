const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/parcaTakipListeleriController');

// CRUD
router.get('/', ctrl.list);
router.get('/:id', ctrl.getById);
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);

// Üyelik işlemleri
router.post('/:id/kalemler', ctrl.addItem);
router.delete('/:id/kalemler/:parca_kodu', ctrl.removeItem);
router.get('/membership', ctrl.membership);
router.get('/by-parca/:parcaKodu', ctrl.byParca);

module.exports = router;



