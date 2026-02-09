const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Klasörler: uploads/fotograflar ve uploads/teknik_resimler ve uploads/siparis_dokumanlari (backend/uploads altına)
const uploadDirs = {
  foto: path.join(__dirname, '../../uploads/fotograflar'),
  teknik: path.join(__dirname, '../../uploads/teknik_resimler'),
  siparis: path.join(__dirname, '../../uploads/siparis_dokumanlari')
};

// Klasörler yoksa oluştur
Object.values(uploadDirs).forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Multer storage ayarı
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === 'foto') {
      cb(null, uploadDirs.foto);
    } else if (file.fieldname === 'teknik') {
      cb(null, uploadDirs.teknik);
    } else if (file.fieldname === 'siparis_dokumani') {
      cb(null, uploadDirs.siparis);
    } else {
      cb(new Error('Geçersiz alan adı!'), null);
    }
  },
  filename: function (req, file, cb) {
    // Türkçe karakterleri ve boşlukları temizle
    function sanitize(str) {
      return str
        .toLowerCase()
        .replace(/[çÇğĞıİöÖşŞüÜ]/g, c => ({'ç':'c','Ç':'c','ğ':'g','Ğ':'g','ı':'i','İ':'i','ö':'o','Ö':'o','ş':'s','Ş':'s','ü':'u','Ü':'u'}[c]||c))
        .replace(/[^a-z0-9]/gi, '_');
    }
    // Parça kodunu al
    let parcaKodu = req.body.parcaKodu || req.query.parcaKodu || (req.headers['x-parcakodu'] || 'parca');
    parcaKodu = sanitize(parcaKodu);
    const ext = path.extname(file.originalname);
    // Her yüklemede benzersiz isim oluşturmak için timestamp ve random ekle
    const unique = Date.now() + '_' + Math.floor(Math.random() * 10000);
    let filename;
    if (file.fieldname === 'teknik') {
      filename = `tres_${parcaKodu}_${unique}${ext}`;
    } else if (file.fieldname === 'foto') {
      filename = `res_${parcaKodu}_${unique}${ext}`;
    } else if (file.fieldname === 'siparis_dokumani') {
      filename = `siparis_${parcaKodu}_${unique}${ext}`;
    } else {
      filename = `${parcaKodu}_${unique}${ext}`;
    }
    cb(null, filename);
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  },
  fileFilter: function (req, file, cb) {
    // Dosya tipi kontrolü
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|xls|xlsx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype) || file.mimetype.startsWith('text/') || file.mimetype.includes('officedocument');
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Yalnızca resim ve doküman dosyaları yükleyebilirsiniz!'));
    }
  }
});

// Fotoğraf veya teknik resim yükleme endpoint'i
router.post('/parca', upload.fields([
  { name: 'foto', maxCount: 1 },
  { name: 'teknik', maxCount: 1 }
]), (req, res) => {
  const result = {};
  // Parça kodunu tekrar sanitize et
  function sanitize(str) {
    return str
      .toLowerCase()
      .replace(/[çÇğĞıİöÖşŞüÜ]/g, c => ({'ç':'c','Ç':'c','ğ':'g','Ğ':'g','ı':'i','İ':'i','ö':'o','Ö':'o','ş':'s','Ş':'s','ü':'u','Ü':'u'}[c]||c))
      .replace(/[^a-z0-9]/gi, '_');
  }
  let parcaKodu = req.body.parcaKodu || req.query.parcaKodu || (req.headers['x-parcakodu'] || 'parca');
  parcaKodu = sanitize(parcaKodu);
  if (req.files['foto']) {
    // Yüklenen dosyanın gerçek adını döndür
    result.foto_path = '/uploads/fotograflar/' + req.files['foto'][0].filename;
  }
  if (req.files['teknik']) {
    result.teknik_resim_path = '/uploads/teknik_resimler/' + req.files['teknik'][0].filename;
  }
  res.json(result);
});

// Sipariş dokümanı yükleme endpoint'i
router.post('/siparis-dokumani', upload.single('siparis_dokumani'), (req, res) => {
  console.log('Sipariş dokümanı yükleme isteği alındı');
  console.log('Yüklenen dosya:', req.file);
  
  if (!req.file) {
    console.log('Dosya yüklenmedi');
    return res.status(400).json({ error: 'Dosya yüklenmedi' });
  }
  
  const result = {
    siparis_dokumani_path: '/uploads/siparis_dokumanlari/' + req.file.filename
  };
  
  console.log('Yükleme başarılı:', result);
  res.json(result);
});

module.exports = router;
