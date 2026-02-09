const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const siparisDokumaniController = require('../controllers/siparisDokumaniController');

// Multer ayarları (geçici upload klasörü)
const upload = multer({ 
  dest: path.join(__dirname, '../../uploads/tmp'),
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  },
  fileFilter: function (req, file, cb) {
    // Dosya tipi kontrolü - tüm dosya tiplerini kabul et
    cb(null, true);
  }
});

// Yükle
router.post('/upload', upload.single('file'), siparisDokumaniController.upload);
// Listele
router.get('/list', siparisDokumaniController.list);
// Sıralama güncelle
router.patch('/order', siparisDokumaniController.updateOrder);
// Sil
router.delete('/:id', siparisDokumaniController.remove);

module.exports = router;
