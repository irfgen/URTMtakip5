const express = require('express');
const makinaStokController = require('../controllers/makinaStokController');
const router = express.Router();

// Stok CRUD operasyonları
router.get('/makina-stok', makinaStokController.listStok);
router.post('/makina-stok', makinaStokController.createStok);
router.get('/makina-stok/:id', makinaStokController.getStokDetail);
router.put('/makina-stok/:id', makinaStokController.updateStok);
router.delete('/makina-stok/:id', makinaStokController.deleteStok);

// Stoktan düşme
router.post('/makina-stok/stoktan-dus', makinaStokController.stoktanDus);

module.exports = router;
