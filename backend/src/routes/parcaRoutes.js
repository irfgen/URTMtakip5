
const express = require('express');
const router = express.Router();
const parcaController = require('../controllers/parcaController');
const bomController = require('../controllers/bomController');

// Parça CRUD işlemleri
router.post('/', parcaController.parcaEkle);
router.get('/', parcaController.parcalariGetir);
router.get('/check', parcaController.checkParcaKodu); // Tek parça kontrol endpoint'i
router.get('/:parcaKodu', parcaController.parcaGetir);
router.put('/:parcaKodu', parcaController.parcaGuncelle);
router.delete('/:parcaKodu', parcaController.parcaSil);

// Bulk işlemler
router.post('/check-bulk', parcaController.checkBulk);
router.post('/batch-check', parcaController.batchCheckParcalar);

// Ham malzeme önerileri
router.get('/:parcaKodu/suggest-ham-malzeme', parcaController.suggestHamMalzeme);

// Özel endpoint'ler
router.get('/resim-yolu/:parca_kodu', parcaController.parcaResimYolu);

// Stok kartı yönetimi endpoint'leri
router.get('/stok-karti/olmayan', parcaController.stokKartiOlmayanParcalar);
router.put('/:parcaKodu/stok-karti', parcaController.parcayaStokKartiAta);
router.delete('/:parcaKodu/stok-karti', parcaController.parcaStokKartiKaldir);

// Maliyet endpoint'leri
router.get('/:parcaKodu/unit-cost', bomController.getPartUnitCost); // Parça birim maliyeti

// QR kod endpoint'leri
router.get('/:parcaKodu/qrcode', parcaController.generateQRCode); // Parça QR kodu oluşturma

module.exports = router;