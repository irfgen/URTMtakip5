const express = require('express');
const router = express.Router();
const uretimPlaniController = require('../controllers/uretimPlaniController');

// Temel CRUD işlemleri
router.get('/', uretimPlaniController.getAllUretimPlani);
router.get('/:id', uretimPlaniController.getUretimPlaniById);
router.post('/', uretimPlaniController.createUretimPlani);
router.post('/is-emri-tabanli', uretimPlaniController.createIsEmriTabanliUretimPlani);
router.post('/karma', uretimPlaniController.createKarmaUretimPlani); // YENİ ROUTE

// Excel Import
router.post('/excel-import', uretimPlaniController.excelImport);

router.put('/:id', uretimPlaniController.updateUretimPlani);
router.delete('/:id', uretimPlaniController.deleteUretimPlani);

// BOM Analizi
router.post('/bom-analizi', uretimPlaniController.bomAnalizi);

// Kritik stokta olan parça için iş emri oluşturma
router.post('/kritik-stok/is-emri', uretimPlaniController.parcayiIsEmrineEkle);

// İş emri yönetimi
router.post('/:id/is-emri', uretimPlaniController.addIsEmriToUretimPlani);
router.delete('/:id/is-emri', uretimPlaniController.removeIsEmriFromUretimPlani);

module.exports = router;