const express = require('express');
const router = express.Router();
const makinaController = require('../controllers/makinaController');
const tezgahController = require('../controllers/tezgahController');
const { validateMakina } = require('../validators/makinaValidator');
const { validateTezgah } = require('../validators/tezgahValidator');

// Makina Sınıfları Route - Önce gelerek :id route'uyla çakışmayı önle
router.get('/makina-siniflari', makinaController.getMakinaSiniflari);

// Tezgah Routes - ÖNCE tanımlanmalı ki :id ile çakışmasın (restart triggered)
router.get('/tezgahlar', tezgahController.listTezgahlar);
router.post('/tezgahlar', validateTezgah, tezgahController.createTezgah);
router.get('/tezgahlar/:id', tezgahController.getTezgahDetail);
router.put('/tezgahlar/:id', validateTezgah, tezgahController.updateTezgah);
router.delete('/tezgahlar/:id', tezgahController.deleteTezgah);
router.post('/tezgahlar/pozisyonlar', tezgahController.updateTezgahPositions);
router.post('/tezgahlar/:id/is-emri-ata', tezgahController.isEmriAta);
router.post('/tezgahlar/:id/is-emri-tamamla', tezgahController.isEmriTamamla);
router.post('/tezgahlar/:id/is-ara-ver', tezgahController.isAraVer);
router.post('/tezgahlar/:id/ariza-bakim-sonlandir', tezgahController.arizaBakimSonlandir);

// Makina Routes - SONRA tanımlanmalı
router.get('/makinalar', makinaController.listMakinalar);
router.post('/makinalar', validateMakina, makinaController.createMakina);
router.get('/makinalar/:id', makinaController.getMakinaDetail);
router.put('/makinalar/:id', validateMakina, makinaController.updateMakina);
router.delete('/makinalar/:id', makinaController.deleteMakina);

module.exports = router;