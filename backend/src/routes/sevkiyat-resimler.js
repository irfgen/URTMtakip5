// Sevkiyat Resim Yönetimi API Routes
const express = require('express');

// Middleware: Sevkiyat numarasını al (sadece sevkiyat ID gerektiren route'lar için)
const sevkiyatMiddleware = (req, res, next) => {
    const db = getDb();
    
    db.get('SELECT sevkiyat_no FROM sevkiyatlar WHERE id = ?', [req.params.sevkiyatId], (err, row) => {
        db.close();
        
        if (err) {
            console.error('Sevkiyat numarası alma hatası:', err);
            return res.status(500).json({ error: 'Sevkiyat numarası alınamadı' });
        }
        
        if (!row) {
            return res.status(404).json({ error: 'Sevkiyat bulunamadı' });
        }
        
        req.sevkiyatNo = row.sevkiyat_no;
        next();
    });
};

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

const router = express.Router();
const dbPath = path.join(__dirname, '..', '..', 'database.sqlite');

function getDb() {
    return new sqlite3.Database(dbPath);
}

// ========== TOPLU SEVKİYAT RESİMLERİ (middleware'den ÖNCE) ==========

// GET /api/sevkiyat/resimler/toplu/:topluId/kalem/:kalemId - toplu kalem resimleri listele
router.get('/toplu/:topluId/kalem/:kalemId', (req, res) => {
    const { topluId, kalemId } = req.params;
    const db = getDb();
    const ownSql = 'SELECT 1 FROM toplu_sevkiyat_kalemleri WHERE id = ? AND toplu_id = ?';
    db.get(ownSql, [kalemId, topluId], (ownErr, ownRow) => {
        if (ownErr) { db.close(); return res.status(500).json({ error: 'Sahiplik kontrolü yapılamadı' }); }
        if (!ownRow) { db.close(); return res.status(403).json({ error: 'Kalem bu toplu sevkiyata ait değil' }); }
        db.all('SELECT * FROM sevkiyat_resimler WHERE toplu_kalem_id = ? ORDER BY is_temsil DESC, yuklenme_tarihi', [kalemId], (err, rows) => {
            db.close();
            if (err) return res.status(500).json({ error: 'Resim listesi alınamadı' });
            return res.json(rows);
        });
    });
});

// POST /api/sevkiyat/resimler/toplu/:topluId/kalem/:kalemId - toplu kalem resim upload
router.post('/toplu/:topluId/kalem/:kalemId', (req, res) => {
    const { topluId, kalemId } = req.params;
    // sahiplik kontrolü
    const dbCheck = getDb();
    dbCheck.get('SELECT 1 FROM toplu_sevkiyat_kalemleri WHERE id = ? AND toplu_id = ?', [kalemId, topluId], (ownErr, ownRow) => {
        dbCheck.close();
        if (ownErr) return res.status(500).json({ error: 'Sahiplik kontrolü yapılamadı' });
        if (!ownRow) return res.status(403).json({ error: 'Kalem bu toplu sevkiyata ait değil' });

        upload.array('resimler', 10)(req, res, function (err) {
            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: 'Dosya boyutu 500MB\'dan büyük olamaz' });
                if (err.code === 'LIMIT_FILE_COUNT') return res.status(400).json({ error: 'Maksimum 10 dosya yükleyebilirsiniz' });
                return res.status(400).json({ error: 'Dosya yükleme hatası', details: err.message });
            } else if (err) { return res.status(400).json({ error: err.message }); }
            if (!req.files || req.files.length === 0) return res.status(400).json({ error: 'Hiç dosya seçilmedi' });

            const db = getDb();
            const uploadedFiles = []; let completed = 0; const total = req.files.length;
            req.files.forEach((file) => {
                const relativePath = `uploads/sevkiyat_resimleri/${file.filename}`;
                const insert = `
                    INSERT INTO sevkiyat_resimler (sevkiyat_id, kalem_id, resim_adi, resim_yolu, dosya_boyutu, is_temsil, toplu_kalem_id)
                    VALUES (NULL, NULL, ?, ?, ?, ?, ?)
                `;
                const isTemsil = uploadedFiles.length === 0 ? 1 : 0;
                db.run(insert, [file.originalname, relativePath, file.size, isTemsil, kalemId], function (dbErr) {
                    if (dbErr) { try { fs.unlinkSync(file.path); } catch (_) {} }
                    else { uploadedFiles.push({ id: this.lastID, resim_yolu: relativePath, is_temsil: isTemsil }); }
                    completed++;
                    if (completed === total) { db.close(); return res.status(201).json({ uploaded_files: uploadedFiles }); }
                });
            });
        });
    });
});

// Multer konfigürasyonu
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '..', 'uploads', 'sevkiyat_resimleri');
        
        // Dizin yoksa oluştur
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Dosya adı formatı: sevk_YYYYMMDD_HHMMSS_timestamp.jpeg
        const now = new Date();
        const dateStr = now.toISOString().replace(/[:.]/g, '-').replace('T', '_').split('.')[0];
        const timestamp = Date.now();
        const ext = path.extname(file.originalname) || '.jpeg';
        const fileName = `sevk_${dateStr}_${timestamp}${ext}`;
        cb(null, fileName);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 500 * 1024 * 1024, // 500MB limit
        files: 10 // Maksimum 10 dosya
    },
    fileFilter: function (req, file, cb) {
        const allowedTypes = /jpeg|jpg|png|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Sadece JPEG, PNG ve WebP formatları desteklenir!'));
        }
    }
});

// ========== RESİM YÖNETİMİ API'LERİ ==========

// GET /api/sevkiyat/resimler/dosya/:filename - Dosya servisi (filename ile doğrudan erişim)
router.get('/dosya/:filename', (req, res) => {
    const { filename } = req.params;
    
    console.log('🖼️ Resim dosyası isteniyor:', filename);
    console.log('📁 Route path: /dosya/:filename');
    
    // Path traversal saldırılarını önle
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
        console.log('❌ Geçersiz dosya adı:', filename);
        return res.status(400).json({ error: 'Geçersiz dosya adı' });
    }
    
    const filePath = path.join(__dirname, '..', 'uploads', 'sevkiyat_resimleri', filename);
    
    console.log('📂 Dosya yolu:', filePath);
    
    // Dosya var mı kontrol et
    if (!fs.existsSync(filePath)) {
        console.log('❌ Dosya bulunamadı:', filePath);
        return res.status(404).json({ error: 'Dosya bulunamadı' });
    }
    
    console.log('✅ Dosya bulundu, gönderiliyor...');
    
    // CORS başlıklarını ekle
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.header('Cross-Origin-Resource-Policy', 'cross-origin');
    res.header('Cross-Origin-Embedder-Policy', 'unsafe-none');
    
    // Content-Type'ı belirle
    const ext = path.extname(filename).toLowerCase();
    let contentType = 'image/jpeg';
    if (ext === '.png') contentType = 'image/png';
    else if (ext === '.gif') contentType = 'image/gif';
    else if (ext === '.webp') contentType = 'image/webp';
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400'); // 24 saat cache
    
    res.sendFile(filePath);
});

// Middleware: Sevkiyat numarasını al
router.use('/:sevkiyatId/*', (req, res, next) => {
    const db = getDb();
    
    db.get('SELECT sevkiyat_no FROM sevkiyatlar WHERE id = ?', [req.params.sevkiyatId], (err, row) => {
        db.close();
        
        if (err) {
            console.error('Sevkiyat numarası alma hatası:', err);
            return res.status(500).json({ error: 'Sevkiyat numarası alınamadı' });
        }
        
        if (!row) {
            return res.status(404).json({ error: 'Sevkiyat bulunamadı' });
        }
        
        req.sevkiyatNo = row.sevkiyat_no;
        next();
    });
});

// GET /api/sevkiyat/:sevkiyatId/resimler - Sevkiyata ait resimleri listele
router.get('/:sevkiyatId/resimler', sevkiyatMiddleware, (req, res) => {
    const db = getDb();
    const { sevkiyatId } = req.params;
    
    db.all('SELECT * FROM sevkiyat_resimler WHERE sevkiyat_id = ? ORDER BY yuklenme_tarihi', [sevkiyatId], (err, rows) => {
        db.close();
        
        if (err) {
            console.error('Resim listesi hatası:', err);
            return res.status(500).json({ error: 'Resim listesi alınamadı' });
        }
        
        res.json(rows);
    });
});

// GET /api/sevkiyat/:sevkiyatId/kalem/:kalemId/resimler - Belirli kaleme ait resimleri listele
router.get('/:sevkiyatId/kalem/:kalemId/resimler', sevkiyatMiddleware, (req, res) => {
    const db = getDb();
    const { sevkiyatId, kalemId } = req.params;

    const ownershipQuery = 'SELECT 1 FROM sevkiyat_kalemleri WHERE id = ? AND sevkiyat_id = ?';

    db.get(ownershipQuery, [kalemId, sevkiyatId], (ownErr, ownRow) => {
        if (ownErr) {
            db.close();
            console.error('Kalem sahiplik kontrolü hatası:', ownErr);
            return res.status(500).json({ error: 'Sahiplik kontrolü yapılamadı' });
        }

        if (!ownRow) {
            db.close();
            return res.status(403).json({ error: 'Kalem bu sevkiyata ait değil' });
        }

        db.all(
            'SELECT * FROM sevkiyat_resimler WHERE sevkiyat_id = ? AND kalem_id = ? ORDER BY is_temsil DESC, yuklenme_tarihi',
            [sevkiyatId, kalemId],
            (err, rows) => {
                db.close();
                if (err) {
                    console.error('Kalem resim listesi hatası:', err);
                    return res.status(500).json({ error: 'Resim listesi alınamadı' });
                }
                res.json(rows);
            }
        );
    });
});

// POST /api/sevkiyat/:sevkiyatId/resimler - Resim upload
router.post('/:sevkiyatId/resimler', sevkiyatMiddleware, (req, res, next) => {
    // Sevkiyat no'yu middleware'den al
    req.sevkiyatNo = req.sevkiyatNo;
    
    upload.array('resimler', 10)(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ error: 'Dosya boyutu 500MB\'dan büyük olamaz' });
            }
            if (err.code === 'LIMIT_FILE_COUNT') {
                return res.status(400).json({ error: 'Maksimum 10 dosya yükleyebilirsiniz' });
            }
            return res.status(400).json({ error: 'Dosya yükleme hatası', details: err.message });
        } else if (err) {
            return res.status(400).json({ error: err.message });
        }
        
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'Hiç dosya seçilmedi' });
        }
        
        const db = getDb();
        const { sevkiyatId } = req.params;
        const uploadedFiles = [];
        
        // Her dosya için veritabanına kayıt ekle
        let completed = 0;
        const total = req.files.length;
        
        req.files.forEach((file, index) => {
            const relativePath = `uploads/sevkiyat_resimleri/${file.filename}`;
            
            const query = `
                INSERT INTO sevkiyat_resimler (sevkiyat_id, resim_adi, resim_yolu, dosya_boyutu)
                VALUES (?, ?, ?, ?)
            `;
            
            db.run(query, [sevkiyatId, file.originalname, relativePath, file.size], function(err) {
                if (err) {
                    console.error('Resim veritabanı kayıt hatası:', err);
                    // Dosyayı sil
                    fs.unlinkSync(file.path);
                } else {
                    uploadedFiles.push({
                        id: this.lastID,
                        resim_adi: file.originalname,
                        resim_yolu: relativePath,
                        dosya_boyutu: file.size
                    });
                }
                
                completed++;
                
                // Tüm dosyalar işlendiğinde response gönder
                if (completed === total) {
                    db.close();
                    
                    if (uploadedFiles.length === 0) {
                        return res.status(500).json({ error: 'Hiçbir dosya yüklenemedi' });
                    }
                    
                    res.status(201).json({
                        message: `${uploadedFiles.length} dosya başarıyla yüklendi`,
                        uploaded_files: uploadedFiles
                    });
                }
            });
        });
    });
});

// POST /api/sevkiyat/:sevkiyatId/kalem/:kalemId/resimler - Kalem bazlı resim upload
router.post('/:sevkiyatId/kalem/:kalemId/resimler', sevkiyatMiddleware, (req, res) => {
    const { sevkiyatId, kalemId } = req.params;

    // Önce sahiplik doğrulaması
    const dbCheck = getDb();
    dbCheck.get('SELECT 1 FROM sevkiyat_kalemleri WHERE id = ? AND sevkiyat_id = ?', [kalemId, sevkiyatId], (ownErr, ownRow) => {
        dbCheck.close();
        if (ownErr) {
            console.error('Kalem sahiplik kontrolü hatası:', ownErr);
            return res.status(500).json({ error: 'Sahiplik kontrolü yapılamadı' });
        }
        if (!ownRow) {
            return res.status(403).json({ error: 'Kalem bu sevkiyata ait değil' });
        }

        upload.array('resimler', 10)(req, res, function (err) {
            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json({ error: 'Dosya boyutu 500MB\'dan büyük olamaz' });
                }
                if (err.code === 'LIMIT_FILE_COUNT') {
                    return res.status(400).json({ error: 'Maksimum 10 dosya yükleyebilirsiniz' });
                }
                return res.status(400).json({ error: 'Dosya yükleme hatası', details: err.message });
            } else if (err) {
                return res.status(400).json({ error: err.message });
            }

            if (!req.files || req.files.length === 0) {
                return res.status(400).json({ error: 'Hiç dosya seçilmedi' });
            }

            const db = getDb();
            const uploadedFiles = [];
            let completed = 0;
            const total = req.files.length;

            req.files.forEach((file) => {
                const relativePath = `uploads/sevkiyat_resimleri/${file.filename}`;
                const insert = `
                    INSERT INTO sevkiyat_resimler (sevkiyat_id, kalem_id, resim_adi, resim_yolu, dosya_boyutu, is_temsil)
                    VALUES (?, ?, ?, ?, ?, ?)
                `;
                const isTemsil = uploadedFiles.length === 0 ? 1 : 0; // İlk eklenen resmi temsil yap
                db.run(insert, [sevkiyatId, kalemId, file.originalname, relativePath, file.size, isTemsil], function (dbErr) {
                    if (dbErr) {
                        console.error('Resim veritabanı kayıt hatası (kalem):', dbErr);
                        try { fs.unlinkSync(file.path); } catch (_) {}
                    } else {
                        uploadedFiles.push({
                            id: this.lastID,
                            resim_adi: file.originalname,
                            resim_yolu: relativePath,
                            dosya_boyutu: file.size,
                            kalem_id: parseInt(kalemId, 10),
                            is_temsil: isTemsil
                        });
                    }
                    completed++;
                    if (completed === total) {
                        db.close();
                        if (uploadedFiles.length === 0) {
                            return res.status(500).json({ error: 'Hiçbir dosya yüklenemedi' });
                        }
                        return res.status(201).json({
                            message: `${uploadedFiles.length} dosya başarıyla yüklendi`,
                            uploaded_files: uploadedFiles
                        });
                    }
                });
            });
        });
    });
});

// TOPLU: POST /api/sevkiyat/resimler/toplu/:topluId/kalem/:kalemId - toplu kalem resim upload
// ========== SEVKİYAT (bireysel) RESİMLERİ ==========

// PUT /api/sevkiyat/:sevkiyatId/kalem/:kalemId/resimler/:resimId/temsil - Temsil olarak işaretle
router.put('/:sevkiyatId/kalem/:kalemId/resimler/:resimId/temsil', sevkiyatMiddleware, (req, res) => {
    const { sevkiyatId, kalemId, resimId } = req.params;
    const db = getDb();

    // Sahiplik doğrulaması
    const ownSql = 'SELECT id FROM sevkiyat_resimler WHERE id = ? AND sevkiyat_id = ? AND kalem_id = ?';
    db.get(ownSql, [resimId, sevkiyatId, kalemId], (ownErr, ownRow) => {
        if (ownErr) {
            db.close();
            return res.status(500).json({ error: 'Kontrol hatası' });
        }
        if (!ownRow) {
            db.close();
            return res.status(404).json({ error: 'Resim bulunamadı' });
        }

        db.serialize(() => {
            const resetSql = 'UPDATE sevkiyat_resimler SET is_temsil = 0 WHERE kalem_id = ?';
            const setSql = 'UPDATE sevkiyat_resimler SET is_temsil = 1 WHERE id = ?';
            db.run(resetSql, [kalemId], function (rErr) {
                if (rErr) {
                    db.close();
                    return res.status(500).json({ error: 'Temsil sıfırlanamadı' });
                }
                db.run(setSql, [resimId], function (sErr) {
                    db.close();
                    if (sErr) {
                        return res.status(500).json({ error: 'Temsil atanamadı' });
                    }
                    return res.json({ message: 'Temsil güncellendi' });
                });
            });
        });
    });
});

// DELETE /api/sevkiyat/resimler/:resimId - Tek resim silme
router.delete('/:resimId', (req, res) => {
    const db = getDb();
    const { resimId } = req.params;
    
    // Önce resim bilgisini al
    db.get('SELECT * FROM sevkiyat_resimler WHERE id = ?', [resimId], (err, row) => {
        if (err) {
            db.close();
            console.error('Resim bilgisi alma hatası:', err);
            return res.status(500).json({ error: 'Resim bilgisi alınamadı' });
        }
        
        if (!row) {
            db.close();
            return res.status(404).json({ error: 'Resim bulunamadı' });
        }
        
        // Dosyayı sil
        const filePath = path.join(__dirname, '..', row.resim_yolu);
        if (fs.existsSync(filePath)) {
            try {
                fs.unlinkSync(filePath);
            } catch (fsErr) {
                console.error('Dosya silme hatası:', fsErr);
            }
        }
        
        // Veritabanından sil
        db.run('DELETE FROM sevkiyat_resimler WHERE id = ?', [resimId], function(err) {
            db.close();
            
            if (err) {
                console.error('Resim veritabanı silme hatası:', err);
                return res.status(500).json({ error: 'Resim silinemedi' });
            }
            
            res.json({ message: 'Resim başarıyla silindi' });
        });
    });
});

// GET /api/sevkiyat/resimler/:resimId/download - Resim indirme
router.get('/:resimId/download', (req, res) => {
    const db = getDb();
    const { resimId } = req.params;
    
    db.get('SELECT * FROM sevkiyat_resimler WHERE id = ?', [resimId], (err, row) => {
        db.close();
        
        if (err) {
            console.error('Resim bilgisi alma hatası:', err);
            return res.status(500).json({ error: 'Resim bilgisi alınamadı' });
        }
        
        if (!row) {
            return res.status(404).json({ error: 'Resim bulunamadı' });
        }
        
        const filePath = path.join(__dirname, '..', row.resim_yolu);
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'Dosya bulunamadı' });
        }
        
        res.download(filePath, row.resim_adi);
    });
});

// GET /api/sevkiyat/resimler/:resimId/view - Resim görüntüleme
router.get('/:resimId/view', (req, res) => {
    const db = getDb();
    const { resimId } = req.params;
    
    db.get('SELECT * FROM sevkiyat_resimler WHERE id = ?', [resimId], (err, row) => {
        db.close();
        
        if (err) {
            console.error('Resim bilgisi alma hatası:', err);
            return res.status(500).json({ error: 'Resim bilgisi alınamadı' });
        }
        
        if (!row) {
            return res.status(404).json({ error: 'Resim bulunamadı' });
        }
        
        const filePath = path.join(__dirname, '..', row.resim_yolu);
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'Dosya bulunamadı' });
        }
        
        res.sendFile(filePath);
    });
});

module.exports = router;
