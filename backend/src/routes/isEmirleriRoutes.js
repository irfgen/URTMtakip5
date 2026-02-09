const express = require('express');
const router = express.Router();

const {
  updateIsEmriOrder,
  getAllIsEmirleri,
  createIsEmri,
  updateIsEmri,
  deleteIsEmri,
  getIsEmriById,
  getIsEmriByUretimPlani,
  getAtanabilirIsEmirleriForModal,
  batchCreateIsEmirleri,
  createIsEmirleriFromUretimPlani,
  confirmFasonConversion
} = require('../controllers/isEmirleriController');

// İş emri sırasını güncelle (öncelik için)
router.post('/sirala', updateIsEmriOrder);

// Tüm iş emirlerini getir
router.get('/', getAllIsEmirleri);

// Yeni iş emri oluştur
router.post('/', createIsEmri);

// Toplu iş emri oluştur (Excel'den)
router.post('/batch-create', batchCreateIsEmirleri);

// ADIM 4: Üretim planından iş emirleri oluştur
router.post('/create-from-plan', createIsEmirleriFromUretimPlani);

// İş emrini güncelle
router.put('/:id', updateIsEmri);

// İş emrini sil
router.delete('/:id', deleteIsEmri);

// Üretim planına göre iş emirlerini getir
router.get('/by-uretim-plani/:uretimPlaniId', getIsEmriByUretimPlani);

// Modal için atanabilir iş emirlerini getir (duruma göre gruplandırılmış)
router.get('/atanabilir-modal', getAtanabilirIsEmirleriForModal);

// Fason durumuna geçiş onayı
router.post('/:id/confirm-fason', confirmFasonConversion);

// İş emri detaylarını getir
router.get('/:id', getIsEmriById);

module.exports = router; 