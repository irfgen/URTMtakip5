const express = require('express');
const router = express.Router();
const arizaBakimController = require('../controllers/arizaBakimController');

// Tüm arıza ve bakım kayıtlarını listele (filtreli)
router.get('/', arizaBakimController.getAllArizaBakim);

// İstatistikler
router.get('/istatistikler', arizaBakimController.getArizaBakimIstatistikleri);

// Tek bir arıza/bakım detayı
router.get('/:id', arizaBakimController.getArizaBakimById);

// Tezgahın aktif arıza/bakım kayıtları
router.get('/tezgah/:tezgah_id/aktif', arizaBakimController.getTezgahActiveArizaBakim);

// Yeni arıza/bakım kaydı oluştur
router.post('/', arizaBakimController.createArizaBakim);

// Arıza/bakım kaydını güncelle
router.put('/:id', arizaBakimController.updateArizaBakim);

// Arıza/bakım kaydını sil
router.delete('/:id', arizaBakimController.deleteArizaBakim);

module.exports = router;