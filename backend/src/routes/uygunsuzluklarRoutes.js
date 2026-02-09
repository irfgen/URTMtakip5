const express = require('express');
const router = express.Router();
const uygunsuzluklarController = require('../controllers/uygunsuzluklarController');
const authenticateToken = require('../middleware/auth'); // Default export, destructuring yok
const { uploadMultiple, handleUploadError } = require('../middleware/upload');

// ================================
// ÖZEL ROUTE'LAR (Dinamik route'lardan ÖNCE)
// ================================

// İstatistikler - ÖZEL route, önce tanımlanmalı
router.get('/istatistik/ozet', authenticateToken, uygunsuzluklarController.getIstatistik);

// ================================
// TEMEL CRUD ROUTE'LARI
// ================================

// Tüm raporları listele (filtreleme desteği ile)
router.get('/', authenticateToken, uygunsuzluklarController.getAllRaporlar);

// Tekil rapor detay - DİNAMİK route, SONRA tanımlanmalı
router.get('/:id', authenticateToken, uygunsuzluklarController.getRaporById);

// Yeni rapor oluştur (dosya yükleme desteği ile)
router.post('/', authenticateToken,
  uploadMultiple('uygunsuzluk_dosyalari', 10).array('files', 10),
  uygunsuzluklarController.createRapor
);

// Rapor güncelle
router.put('/:id', authenticateToken, uygunsuzluklarController.updateRapor);

// Rapor sil (soft delete)
router.delete('/:id', authenticateToken, uygunsuzluklarController.deleteRapor);

// ================================
// İŞLEM ROUTE'LARI
// ================================

// Durum güncelleme
router.put('/:id/durum', authenticateToken, uygunsuzluklarController.guncelleDurum);

// İnceleme notu ekle
router.post('/:id/not', authenticateToken, uygunsuzluklarController.notEkle);

// Tedbir ekle
router.post('/:id/tedbir', authenticateToken, uygunsuzluklarController.tedbirEkle);

// Dosya yükle (çoklu resim destekli)
router.post('/:id/dosya', authenticateToken,
  uploadMultiple('uygunsuzluk_dosyalari', 10).array('files', 10),
  uygunsuzluklarController.dosyaYukleHandler
);

// Dosya sil
router.delete('/dosya/:dosyaId', authenticateToken, uygunsuzluklarController.dosyaSil);

// Raporu kapat
router.post('/:id/kapat', authenticateToken, uygunsuzluklarController.kapatRapor);

// Sorumlu atama
router.post('/:id/atama', authenticateToken, uygunsuzluklarController.atamaSorumlu);

// Çözüm adımı ekle
router.post('/:id/cozum-adim', authenticateToken, uygunsuzluklarController.cozumAdimEkle);

// Çözüm adımını tamamlandı işaretle
router.put('/:id/cozum-adim/:adimIndex/tamamla', authenticateToken, uygunsuzluklarController.cozumAdimTamamla);

// Raporu onayla
router.post('/:id/onay', authenticateToken, uygunsuzluklarController.onayVer);

// Hata yönetimi middleware'i (upload sonrası)
router.use(handleUploadError);

module.exports = router;
