const path = require('path');
const fs = require('fs');
const { Op } = require('sequelize');
const db = require('../models');
const uploadDir = path.join(__dirname, '../../uploads/siparis_dokumanlari');

// Klasör yoksa oluştur
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Sipariş dokümanı yükle
exports.upload = async (req, res) => {
  try {
    console.log('🔄 Sipariş dokümanı upload isteği geldi');
    console.log('📄 req.body:', req.body);
    console.log('📁 req.file:', req.file);
    
    const { is_emri_id, temporary_upload, is_emri_no } = req.body;
    
    if (!req.file) {
      console.log('❌ Dosya eksik');
      return res.status(400).json({ error: 'Dosya zorunlu.' });
    }
    
    // Geçici yükleme (iş emri henüz oluşturulmamış) veya normal yükleme
    if (!is_emri_id && !temporary_upload) {
      console.log('❌ İş emri ID veya geçici yükleme işareti eksik');
      return res.status(400).json({ error: 'İş emri ID veya geçici yükleme işareti zorunlu.' });
    }
    
    console.log('📋 İş emri ID:', is_emri_id);
    console.log('🔄 Geçici yükleme:', temporary_upload);
    console.log('📄 Dosya bilgileri:', {
      originalname: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      path: req.file.path
    });
    
    const ext = path.extname(req.file.originalname) || '.jpeg';
    const timestamp = Date.now();
    const fileName = temporary_upload 
      ? `temp_siparis_${is_emri_no || 'unknown'}_${timestamp}${ext}`
      : `siparis_${is_emri_id}_${timestamp}${ext}`;
    const destPath = path.join(uploadDir, fileName);
    
    console.log('📁 Hedef dosya yolu:', destPath);
    
    fs.renameSync(req.file.path, destPath);
    console.log('✅ Dosya taşındı');
    
    if (temporary_upload) {
      // Geçici yükleme için özel response
      console.log('📋 Geçici dosya yüklendi, database e kaydedilmedi');
      return res.json({
        message: 'Dosya geçici olarak yüklendi',
        dosya_yolu: `/uploads/siparis_dokumanlari/${fileName}`,
        temporary: true
      });
    }
    
    // Normal yükleme - database'e kaydet
    // Sıralama için mevcut en yüksek değeri bul
    const maxOrder = await db.SiparisDokumani.max('siralama', { where: { is_emri_id } }) || 0;
    console.log('📊 Mevcut max sıralama:', maxOrder);
    
    const dokuman = await db.SiparisDokumani.create({
      is_emri_id,
      dosya_yolu: `/uploads/siparis_dokumanlari/${fileName}`,
      yuklenme_tarihi: new Date(),
      siralama: maxOrder + 1
    });
    
    console.log('✅ Doküman database e kaydedildi:', dokuman.toJSON());
    res.json(dokuman);
  } catch (err) {
    console.error('❌ Upload hatası:', err);
    res.status(500).json({ error: err.message });
  }
};

// Belge listele
exports.list = async (req, res) => {
  try {
    const { is_emri_id } = req.query;
    if (!is_emri_id) return res.status(400).json({ error: 'is_emri_id zorunlu.' });
    
    // Sipariş dokümanları tablosundan dokümanları al
    const dokumanlar = await db.SiparisDokumani.findAll({
      where: { is_emri_id },
      order: [['siralama', 'ASC']]
    });
    
    // İş emri tablosundaki siparis_dokumani_dosya_yolu alanını da kontrol et
    const IsEmri = require('../models/IsEmri');
    const isEmri = await IsEmri.findByPk(is_emri_id);
    
    // Eğer iş emrinde sipariş dokümanı dosya yolu varsa ve henüz siparis_dokumanlari tablosunda yoksa ekle
    if (isEmri && isEmri.siparis_dokumani_dosya_yolu) {
      const mevcutDokuman = dokumanlar.find(d => d.dosya_yolu === isEmri.siparis_dokumani_dosya_yolu);
      if (!mevcutDokuman) {
        const maxOrder = dokumanlar.length > 0 ? Math.max(...dokumanlar.map(d => d.siralama)) : 0;
        dokumanlar.push({
          id: `is_emri_${is_emri_id}`, // Geçici ID
          is_emri_id: parseInt(is_emri_id),
          dosya_yolu: isEmri.siparis_dokumani_dosya_yolu,
          yuklenme_tarihi: isEmri.createdAt || new Date(),
          siralama: maxOrder + 1,
          source: 'is_emri' // Hangi tablodan geldiğini belirtir
        });
      }
    }
    
    res.json(dokumanlar);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Sıralama güncelle
exports.updateOrder = async (req, res) => {
  try {
    const { order } = req.body; // [{id, siralama}, ...]
    if (!Array.isArray(order)) return res.status(400).json({ error: 'order zorunlu.' });
    for (const item of order) {
      await db.SiparisDokumani.update({ siralama: item.siralama }, { where: { id: item.id } });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Sil
exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    const dokuman = await db.SiparisDokumani.findByPk(id);
    if (!dokuman) return res.status(404).json({ error: 'Belge bulunamadı.' });
    // Dosyayı sil
    const filePath = path.join(__dirname, '../../', dokuman.dosya_yolu);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    await dokuman.destroy();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
