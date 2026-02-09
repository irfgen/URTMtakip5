const ParcaKayitlari = require('../models/ParcaKayitlari');
const Parca = require('../models/Parca');
const { Op } = require('sequelize');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../../uploads/parca_kayitlari');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const parcaKodu = req.params.parcaKodu || req.body.parcaKodu;
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const filename = `pkayit_${parcaKodu}_${timestamp}${ext}`;
    cb(null, filename);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit (50MB'den artırıldı)
  },
  fileFilter: function (req, file, cb) {
    // Allow images and common document types
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|xls|xlsx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    
    // Allow specific mimetypes for txt files
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    const mimetype = allowedMimeTypes.includes(file.mimetype) || file.mimetype.startsWith('text/');
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Desteklenmeyen dosya türü!'));
    }
  }
}).single('dosya');

// Get all records for a specific part
exports.parcaKayitlariniGetir = async (req, res) => {
  try {
    const { parcaKodu } = req.params;
    
    const kayitlar = await ParcaKayitlari.findAll({
      where: { parcaKodu },
      order: [['siraNo', 'ASC'], ['kayitZamani', 'DESC']],
      include: [{
        model: Parca,
        as: 'parca',
        attributes: ['parcaKodu']
      }]
    });
    
    res.json(kayitlar);
  } catch (error) {
    console.error('Parça kayıtları getirme hatası:', error);
    res.status(500).json({ error: error.message });
  }
};

// Add new record
exports.kayitEkle = async (req, res) => {
  upload(req, res, async function (err) {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    
    try {
      const { parcaKodu } = req.params;
      const { not } = req.body;
      
      if (!req.file) {
        return res.status(400).json({ error: 'Dosya seçilmedi!' });
      }
      
      // Check if part exists
      const parca = await Parca.findByPk(parcaKodu);
      if (!parca) {
        // Delete uploaded file if part doesn't exist
        fs.unlinkSync(req.file.path);
        return res.status(404).json({ error: 'Parça bulunamadı!' });
      }
      
      // Get next sequence number for this part
      const maxSiraNo = await ParcaKayitlari.max('siraNo', {
        where: { parcaKodu }
      });
      const nextSiraNo = (maxSiraNo || 0) + 1;
        // Create record - sadece dosya adını kaydet, tam yolu değil
      const kayit = await ParcaKayitlari.create({
        parcaKodu,
        dosyaYolu: req.file.filename, // sadece dosya adı
        siraNo: nextSiraNo,
        not: not || null
      });
      
      // Update part's parca_kayit_idleri field
      let existingIds = [];
      try {
        existingIds = parca.parcaKayitIdleri ? JSON.parse(parca.parcaKayitIdleri) : [];
      } catch (e) {
        // If parsing fails, initialize as empty array
        existingIds = [];
      }
      existingIds.push(kayit.id);
      
      await parca.update({
        parcaKayitIdleri: JSON.stringify(existingIds)
      });
      
      res.status(201).json(kayit);
    } catch (error) {
      // Delete uploaded file if there's an error
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      console.error('Kayıt ekleme hatası:', error);
      res.status(500).json({ error: error.message });
    }
  });
};

// Delete record
exports.kayitSil = async (req, res) => {
  try {
    const { id } = req.params;
    
    const kayit = await ParcaKayitlari.findByPk(id);
    if (!kayit) {
      return res.status(404).json({ error: 'Kayıt bulunamadı!' });
    }
      // Delete file from filesystem
    const filePath = path.join(__dirname, '../../uploads/parca_kayitlari', kayit.dosyaYolu);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    // Update part's parca_kayit_idleri field
    const parca = await Parca.findByPk(kayit.parcaKodu);
    if (parca && parca.parcaKayitIdleri) {
      const existingIds = JSON.parse(parca.parcaKayitIdleri);
      const updatedIds = existingIds.filter(recordId => recordId !== parseInt(id));
      
      await parca.update({
        parcaKayitIdleri: JSON.stringify(updatedIds)
      });
    }
    
    // Delete record from database
    await kayit.destroy();
    
    res.json({ message: 'Kayıt başarıyla silindi!' });
  } catch (error) {
    console.error('Kayıt silme hatası:', error);
    res.status(500).json({ error: error.message });
  }
};

// Update record notes
exports.kayitGuncelle = async (req, res) => {
  try {
    const { id } = req.params;
    const { not } = req.body;
    
    const kayit = await ParcaKayitlari.findByPk(id);
    if (!kayit) {
      return res.status(404).json({ error: 'Kayıt bulunamadı!' });
    }
    
    await kayit.update({ not });
    
    res.json(kayit);
  } catch (error) {
    console.error('Kayıt güncelleme hatası:', error);
    res.status(500).json({ error: error.message });
  }
};

// Serve uploaded files
exports.dosyaServisEt = async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../../uploads/parca_kayitlari', filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Dosya bulunamadı!' });
    }
    
    res.sendFile(filePath);
  } catch (error) {
    console.error('Dosya servis etme hatası:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = exports;
