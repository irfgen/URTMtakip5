const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/stokTakipListeleriController');

// CRUD ve üyelik işlemleri (spesifik rotaları parametreli rotalardan önce tanımlayın)
router.get('/', ctrl.list);
// Üyelik işlemleri (önce)
router.get('/membership', ctrl.membership);
router.get('/by-stok-karti/:stokKartiId', ctrl.byStokKarti);
router.post('/:id/kalemler', ctrl.addItem);
router.delete('/:id/kalemler/:stok_karti_id', ctrl.removeItem);
// Parametreli rotalar (sonra)
router.get('/:id', ctrl.getById);
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;


