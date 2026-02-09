// Sevkiyat Lokasyonları API Routes
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const router = express.Router();
const dbPath = path.join(__dirname, '..', '..', 'database.sqlite');

function getDb() {
    return new sqlite3.Database(dbPath);
}

// ========== LOKASYON YÖNETİMİ API'LERİ ==========

// GET /api/sevkiyat/lokasyonlar - Lokasyon listesi
router.get('/', (req, res) => {
    const db = getDb();
    const { tip, aktif } = req.query;
    
    let query = 'SELECT * FROM sevkiyat_lokasyonlari WHERE 1=1';
    const params = [];
    
    if (tip) {
        query += ' AND tip = ?';
        params.push(tip);
    }
    
    if (aktif !== undefined) {
        query += ' AND aktif = ?';
        params.push(aktif === 'true' ? 1 : 0);
    }
    
    query += ' ORDER BY lokasyon_adi';
    
    db.all(query, params, (err, rows) => {
        db.close();
        
        if (err) {
            console.error('Lokasyon listesi hatası:', err);
            return res.status(500).json({ error: 'Lokasyon listesi alınamadı', details: err.message });
        }
        
        res.json(rows);
    });
});

// GET /api/sevkiyat/lokasyonlar/:id - Tek lokasyon detayı
router.get('/:id', (req, res) => {
    const db = getDb();
    const { id } = req.params;
    
    db.get('SELECT * FROM sevkiyat_lokasyonlari WHERE id = ?', [id], (err, row) => {
        db.close();
        
        if (err) {
            console.error('Lokasyon detay hatası:', err);
            return res.status(500).json({ error: 'Lokasyon detayı alınamadı' });
        }
        
        if (!row) {
            return res.status(404).json({ error: 'Lokasyon bulunamadı' });
        }
        
        res.json(row);
    });
});

// POST /api/sevkiyat/lokasyonlar - Yeni lokasyon oluşturma
router.post('/', (req, res) => {
    const db = getDb();
    const { lokasyon_adi, tip, adres, aktif = true } = req.body;
    
    // Validasyon
    if (!lokasyon_adi || !tip) {
        db.close();
        return res.status(400).json({ 
            error: 'Gerekli alanlar eksik',
            required: ['lokasyon_adi', 'tip']
        });
    }
    
    const query = `
        INSERT INTO sevkiyat_lokasyonlari (lokasyon_adi, tip, adres, aktif)
        VALUES (?, ?, ?, ?)
    `;
    
    db.run(query, [lokasyon_adi, tip, adres, aktif ? 1 : 0], function(err) {
        db.close();
        
        if (err) {
            console.error('Lokasyon oluşturma hatası:', err);
            if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
                return res.status(400).json({ error: 'Bu lokasyon adı zaten kullanılıyor' });
            }
            return res.status(500).json({ error: 'Lokasyon oluşturulamadı', details: err.message });
        }
        
        res.status(201).json({ 
            id: this.lastID,
            message: 'Lokasyon başarıyla oluşturuldu'
        });
    });
});

// PUT /api/sevkiyat/lokasyonlar/:id - Lokasyon güncelleme
router.put('/:id', (req, res) => {
    const db = getDb();
    const { id } = req.params;
    const { lokasyon_adi, tip, adres, aktif } = req.body;
    
    const query = `
        UPDATE sevkiyat_lokasyonlari 
        SET lokasyon_adi = ?, tip = ?, adres = ?, aktif = ?, guncelleme_tarihi = CURRENT_TIMESTAMP
        WHERE id = ?
    `;
    
    db.run(query, [lokasyon_adi, tip, adres, aktif ? 1 : 0, id], function(err) {
        db.close();
        
        if (err) {
            console.error('Lokasyon güncelleme hatası:', err);
            if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
                return res.status(400).json({ error: 'Bu lokasyon adı zaten kullanılıyor' });
            }
            return res.status(500).json({ error: 'Lokasyon güncellenemedi', details: err.message });
        }
        
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Lokasyon bulunamadı' });
        }
        
        res.json({ message: 'Lokasyon başarıyla güncellendi' });
    });
});

// DELETE /api/sevkiyat/lokasyonlar/:id - Lokasyon silme
router.delete('/:id', (req, res) => {
    const db = getDb();
    const { id } = req.params;
    
    // Önce bu lokasyona ait sevkiyat var mı kontrol et
    db.get('SELECT COUNT(*) as count FROM sevkiyatlar WHERE lokasyon_id = ?', [id], (err, result) => {
        if (err) {
            db.close();
            console.error('Lokasyon kullanım kontrolü hatası:', err);
            return res.status(500).json({ error: 'Lokasyon kullanım durumu kontrol edilemedi' });
        }
        
        if (result.count > 0) {
            db.close();
            return res.status(400).json({ 
                error: 'Bu lokasyon sevkiyatlarda kullanıldığı için silinemez',
                sevkiyat_sayisi: result.count
            });
        }
        
        // Lokasyonu sil
        db.run('DELETE FROM sevkiyat_lokasyonlari WHERE id = ?', [id], function(err) {
            db.close();
            
            if (err) {
                console.error('Lokasyon silme hatası:', err);
                return res.status(500).json({ error: 'Lokasyon silinemedi', details: err.message });
            }
            
            if (this.changes === 0) {
                return res.status(404).json({ error: 'Lokasyon bulunamadı' });
            }
            
            res.json({ message: 'Lokasyon başarıyla silindi' });
        });
    });
});

// PUT /api/sevkiyat/lokasyonlar/:id/toggle-aktif - Aktif durumu değiştir
router.put('/:id/toggle-aktif', (req, res) => {
    const db = getDb();
    const { id } = req.params;
    
    db.run('UPDATE sevkiyat_lokasyonlari SET aktif = NOT aktif, guncelleme_tarihi = CURRENT_TIMESTAMP WHERE id = ?', [id], function(err) {
        db.close();
        
        if (err) {
            console.error('Lokasyon aktif durum değiştirme hatası:', err);
            return res.status(500).json({ error: 'Aktif durum değiştirilemedi' });
        }
        
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Lokasyon bulunamadı' });
        }
        
        res.json({ message: 'Lokasyon aktif durumu değiştirildi' });
    });
});

module.exports = router;
