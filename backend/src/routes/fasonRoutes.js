const express = require('express');
const router = express.Router();
const fasonIsEmriController = require('../controllers/fasonIsEmriController');
const fasonTeklifController = require('../controllers/fasonTeklifController');

// Fason İş Emirleri
router.get('/is-emirleri', fasonIsEmriController.listFasonIsEmirleri);
router.get('/is-emirleri/selectable', fasonIsEmriController.getSelectableFasonIsEmirleri); // YENİ ROUTE
router.get('/is-emirleri/by-uretim-plani/:uretim_plani_id', fasonIsEmriController.getFasonIsEmirleriByUretimPlani); // YENİ ROUTE
router.get('/is-emirleri/:id', fasonIsEmriController.getFasonIsEmriDetail);
router.post('/is-emirleri', fasonIsEmriController.createFasonIsEmri);
router.put('/is-emirleri/:id', fasonIsEmriController.updateFasonIsEmri);
router.delete('/is-emirleri/:id', fasonIsEmriController.deleteFasonIsEmri);
router.post('/is-emirleri/:id/teslim-al', fasonIsEmriController.teslimAlFasonIsEmri);
router.patch('/is-emirleri/:id/durum', fasonIsEmriController.updateFasonIsEmriDurum);

// Ham Malzeme İşlemleri
router.post('/is-emirleri/:id/ham-malzeme-gonder', fasonIsEmriController.hamMalzemeGonder);
router.patch('/is-emirleri/:id/ham-malzeme-durum', fasonIsEmriController.hamMalzemeDurumGuncelle);
router.post('/is-emirleri/:id/ham-malzeme-teslim', fasonIsEmriController.hamMalzemeTeslimEt);

// Fason Teklifler
router.get('/teklifler', fasonTeklifController.listAllTeklifler);
router.get('/teklifler/parca/:parca_kodu', fasonTeklifController.listTekliflerByParcaKodu);
router.get('/teklifler/is-emri/:fason_is_emri_id', fasonTeklifController.listTekliflerByFasonIsEmriId);
router.post('/teklifler', fasonTeklifController.createTeklif);
router.put('/teklifler/:id', fasonTeklifController.updateTeklif);
router.delete('/teklifler/:id', fasonTeklifController.deleteTeklif);
router.post('/teklifler/:id/kabul-et', fasonTeklifController.kabulEtTeklif);

// Excel Import Endpoints
router.post('/teklifler/upload-excel', fasonTeklifController.uploadExcelMiddleware, fasonTeklifController.uploadAndParseExcel);
router.get('/teklifler/check-parca', fasonTeklifController.checkParcaKodu);
router.post('/teklifler/bulk-create', fasonTeklifController.bulkCreateTeklifler);

// AI Analiz Endpoints
router.post('/teklifler/analyze-documents', fasonTeklifController.analyzeTeklifDocuments);

module.exports = router;
