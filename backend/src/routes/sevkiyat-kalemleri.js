// Sevkiyat Kalemleri API Routes
// Sevkiyat modülüne stok kartı ve parça kalemleri için API endpoints

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Database connection
const dbPath = path.join(__dirname, '..', '..', 'database.sqlite');

function getDb() {
    return new sqlite3.Database(dbPath);
}

// POST /api/sevkiyat-kalemleri - Yeni kalem ekle (basit endpoint)
router.post('/', (req, res) => {
    const db = getDb();
    const { sevkiyat_id, kalem_tipi, stok_karti_id, parca_kodu, adet, birim_fiyati, aciklama } = req.body;

    // Validasyon
    if (!sevkiyat_id || !kalem_tipi || !adet) {
        db.close();
        return res.status(400).json({ 
            error: 'Gerekli alanlar eksik',
            required: ['sevkiyat_id', 'kalem_tipi', 'adet']
        });
    }

    if (kalem_tipi === 'stok_karti' && !stok_karti_id) {
        db.close();
        return res.status(400).json({ error: 'Stok kartı seçilmelidir' });
    }

    if (kalem_tipi === 'parca' && !parca_kodu) {
        db.close();
        return res.status(400).json({ error: 'Parça seçilmelidir' });
    }

    const toplam_fiyat = birim_fiyati ? birim_fiyati * adet : null;

    const query = `
        INSERT INTO sevkiyat_kalemleri 
        (sevkiyat_id, kalem_tipi, stok_karti_id, parca_kodu, adet, birim_fiyati, toplam_fiyat, aciklama)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [sevkiyat_id, kalem_tipi, stok_karti_id, parca_kodu, adet, birim_fiyati, toplam_fiyat, aciklama];

    db.run(query, params, function(err) {
        db.close();

        if (err) {
            console.error('Kalem ekleme hatası:', err);
            return res.status(500).json({ error: 'Kalem eklenemedi', details: err.message });
        }

        res.status(201).json({
            message: 'Kalem başarıyla eklendi',
            kalem_id: this.lastID,
            kalem: {
                id: this.lastID,
                sevkiyat_id,
                kalem_tipi,
                stok_karti_id,
                parca_kodu,
                adet,
                birim_fiyati,
                toplam_fiyat,
                aciklama
            }
        });
    });
});

// GET /api/sevkiyat/:sevkiyat_id/kalemler - Sevkiyat kalemlerini getir
router.get('/:sevkiyat_id/kalemler', (req, res) => {
    const db = getDb();
    const { sevkiyat_id } = req.params;

    const query = `
        SELECT 
            sk.*,
            CASE 
                WHEN sk.kalem_tipi = 'stok_karti' THEN stok.kesit
                WHEN sk.kalem_tipi = 'parca' THEN p.parca_adi
            END as kalem_adi,
            CASE 
                WHEN sk.kalem_tipi = 'stok_karti' THEN stok.malzeme_cinsi
                WHEN sk.kalem_tipi = 'parca' THEN p.parca_kodu
            END as kalem_detay,
            CASE 
                WHEN sk.kalem_tipi = 'stok_karti' THEN stok.boy
                ELSE NULL
            END as stok_boy,
            CASE 
                WHEN sk.kalem_tipi = 'stok_karti' THEN stok.adet
                WHEN sk.kalem_tipi = 'parca' THEN p.stok_adeti
            END as mevcut_stok,
            (
              SELECT sr.resim_yolu 
              FROM sevkiyat_resimler sr 
              WHERE sr.kalem_id = sk.id 
              ORDER BY sr.is_temsil DESC, sr.yuklenme_tarihi 
              LIMIT 1
            ) AS temsil_resim_yolu
        FROM sevkiyat_kalemleri sk
        LEFT JOIN stok_kartlari stok ON sk.stok_karti_id = stok.id
        LEFT JOIN parcalar p ON sk.parca_kodu = p.parca_kodu
        WHERE sk.sevkiyat_id = ?
        ORDER BY sk.olusturma_tarihi ASC
    `;

    db.all(query, [sevkiyat_id], (err, rows) => {
        db.close();

        if (err) {
            console.error('Sevkiyat kalemleri getirme hatası:', err);
            return res.status(500).json({ error: 'Sevkiyat kalemleri alınamadı', details: err.message });
        }

        res.json(rows);
    });
});

// POST /api/sevkiyat/:sevkiyat_id/kalemler - Yeni kalem ekle
router.post('/:sevkiyat_id/kalemler', (req, res) => {
    const db = getDb();
    const { sevkiyat_id } = req.params;
    const { kalem_tipi, stok_karti_id, parca_kodu, adet, birim_fiyati, aciklama } = req.body;

    // Validasyon
    if (!kalem_tipi || !adet) {
        db.close();
        return res.status(400).json({ 
            error: 'Gerekli alanlar eksik',
            required: ['kalem_tipi', 'adet']
        });
    }

    if (parseInt(adet) <= 0) {
        db.close();
        return res.status(400).json({ error: 'Adet 0 dan büyük olmalıdır' });
    }

    if (kalem_tipi === 'stok_karti' && !stok_karti_id) {
        db.close();
        return res.status(400).json({ error: 'Stok kartı seçilmelidir' });
    }

    if (kalem_tipi === 'parca' && !parca_kodu) {
        db.close();
        return res.status(400).json({ error: 'Parça seçilmelidir' });
    }

    const toplam_fiyat = birim_fiyati ? (parseFloat(birim_fiyati) * parseInt(adet)) : null;

    const query = `
        INSERT INTO sevkiyat_kalemleri 
        (sevkiyat_id, kalem_tipi, stok_karti_id, parca_kodu, adet, birim_fiyati, toplam_fiyat, aciklama)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(query, [
        sevkiyat_id, 
        kalem_tipi, 
        stok_karti_id || null, 
        parca_kodu || null, 
        adet, 
        birim_fiyati || null, 
        toplam_fiyat, 
        aciklama || null
    ], function(err) {
        db.close();

        if (err) {
            console.error('Sevkiyat kalemi ekleme hatası:', err);
            return res.status(500).json({ error: 'Sevkiyat kalemi eklenemedi', details: err.message });
        }

        res.status(201).json({ 
            id: this.lastID,
            message: 'Sevkiyat kalemi başarıyla eklendi'
        });
    });
});

// PUT /api/sevkiyat/:sevkiyat_id/kalemler/:kalem_id - Kalem güncelle
router.put('/:sevkiyat_id/kalemler/:kalem_id', (req, res) => {
    const db = getDb();
    const { kalem_id } = req.params;
    const { adet, birim_fiyati, aciklama } = req.body;

    if (!adet) {
        db.close();
        return res.status(400).json({ error: 'Adet alanı zorunludur' });
    }

    if (parseInt(adet) <= 0) {
        db.close();
        return res.status(400).json({ error: 'Adet 0 dan büyük olmalıdır' });
    }

    const toplam_fiyat = birim_fiyati ? (parseFloat(birim_fiyati) * parseInt(adet)) : null;

    const query = `
        UPDATE sevkiyat_kalemleri 
        SET adet = ?, birim_fiyati = ?, toplam_fiyat = ?, aciklama = ?, guncelleme_tarihi = CURRENT_TIMESTAMP
        WHERE id = ?
    `;

    db.run(query, [adet, birim_fiyati || null, toplam_fiyat, aciklama || null, kalem_id], function(err) {
        db.close();

        if (err) {
            console.error('Sevkiyat kalemi güncelleme hatası:', err);
            return res.status(500).json({ error: 'Sevkiyat kalemi güncellenemedi', details: err.message });
        }

        if (this.changes === 0) {
            return res.status(404).json({ error: 'Sevkiyat kalemi bulunamadı' });
        }

        res.json({ message: 'Sevkiyat kalemi başarıyla güncellendi' });
    });
});

// DELETE /api/sevkiyat/:sevkiyat_id/kalemler/:kalem_id - Kalem sil
router.delete('/:sevkiyat_id/kalemler/:kalem_id', (req, res) => {
    const db = getDb();
    const { kalem_id } = req.params;

    // Önce kaleme bağlı resimleri al ve dosyaları sil
    db.all('SELECT * FROM sevkiyat_resimler WHERE kalem_id = ?', [kalem_id], (err, rows) => {
        if (err) {
            db.close();
            console.error('Kalem resimleri alınamadı:', err);
            return res.status(500).json({ error: 'Kalem resimleri alınamadı' });
        }

        rows.forEach((row) => {
            const filePath = path.join(__dirname, '..', row.resim_yolu);
            if (fs.existsSync(filePath)) {
                try { fs.unlinkSync(filePath); } catch (_) {}
            }
        });

        // Veritabanından resimleri sil
        db.run('DELETE FROM sevkiyat_resimler WHERE kalem_id = ?', [kalem_id], function (delImgErr) {
            if (delImgErr) {
                db.close();
                console.error('Kalem resimleri silinemedi:', delImgErr);
                return res.status(500).json({ error: 'Kalem resimleri silinemedi' });
            }

            // Son olarak kalemi sil
            db.run('DELETE FROM sevkiyat_kalemleri WHERE id = ?', [kalem_id], function (delKalemErr) {
                db.close();
                if (delKalemErr) {
                    console.error('Sevkiyat kalemi silme hatası:', delKalemErr);
                    return res.status(500).json({ error: 'Sevkiyat kalemi silinemedi', details: delKalemErr.message });
                }
                if (this.changes === 0) {
                    return res.status(404).json({ error: 'Sevkiyat kalemi bulunamadı' });
                }
                return res.json({ message: 'Sevkiyat kalemi ve resimleri silindi' });
            });
        });
    });
});

// GET /api/sevkiyat/stok-kartlari-arama - Stok kartları arama
router.get('/stok-kartlari-arama', (req, res) => {
    const db = getDb();
    const { q = '', limit = 20 } = req.query;

    let query = `
        SELECT 
            id, kesit, boy, malzeme_cinsi, malzeme_adi, adet, kritik_stok_miktari,
            lokasyon, firma
        FROM stok_kartlari 
        WHERE aktif_mi = 1
    `;

    let params = [];

    if (q) {
        query += ` AND (
            kesit LIKE ? OR 
            malzeme_cinsi LIKE ? OR 
            malzeme_adi LIKE ? OR
            lokasyon LIKE ?
        )`;
        const searchTerm = `%${q}%`;
        params = [searchTerm, searchTerm, searchTerm, searchTerm];
    }

    query += ` ORDER BY malzeme_cinsi, kesit LIMIT ?`;
    params.push(parseInt(limit));

    db.all(query, params, (err, rows) => {
        db.close();

        if (err) {
            console.error('Stok kartları arama hatası:', err);
            return res.status(500).json({ error: 'Stok kartları aranamadı', details: err.message });
        }

        // Format the results
        const formattedRows = rows.map(row => ({
            ...row,
            olculeriFormatted: row.kesit + (row.boy ? ` x ${row.boy}mm` : ''),
            stokDurumu: row.adet <= row.kritik_stok_miktari ? 'kritik' : 'normal'
        }));

        res.json(formattedRows);
    });
});

// GET /api/sevkiyat/parcalar-arama - Parçalar arama
router.get('/parcalar-arama', (req, res) => {
    const db = getDb();
    const { q = '', limit = 20 } = req.query;

    let query = `
        SELECT 
            parca_kodu, parca_adi, stok_adeti, kritik_stok, 
            imal_mi, tedarik_bedeli, foto_path
        FROM parcalar 
        WHERE 1=1
    `;

    let params = [];

    if (q) {
        query += ` AND (
            parca_kodu LIKE ? OR 
            parca_adi LIKE ?
        )`;
        const searchTerm = `%${q}%`;
        params = [searchTerm, searchTerm];
    }

    query += ` ORDER BY parca_kodu LIMIT ?`;
    params.push(parseInt(limit));

    db.all(query, params, (err, rows) => {
        db.close();

        if (err) {
            console.error('Parçalar arama hatası:', err);
            return res.status(500).json({ error: 'Parçalar aranamadı', details: err.message });
        }

        // Format the results
        const formattedRows = rows.map(row => ({
            ...row,
            stokDurumu: row.stok_adeti <= row.kritik_stok ? 'kritik' : 'normal'
        }));

        res.json(formattedRows);
    });
});

// POST /api/sevkiyat-kalemleri - Basit kalem ekleme
router.post('/', (req, res) => {
    const db = getDb();
    const { sevkiyat_id, kalem_tipi, stok_karti_id, parca_kodu, adet, birim_fiyati, aciklama } = req.body;

    // Validasyon
    if (!sevkiyat_id || !kalem_tipi || !adet) {
        db.close();
        return res.status(400).json({ 
            error: 'Gerekli alanlar eksik',
            required: ['sevkiyat_id', 'kalem_tipi', 'adet']
        });
    }

    if (kalem_tipi === 'stok_karti' && !stok_karti_id) {
        db.close();
        return res.status(400).json({ error: 'Stok kartı seçilmelidir' });
    }

    if (kalem_tipi === 'parca' && !parca_kodu) {
        db.close();
        return res.status(400).json({ error: 'Parça kodu gereklidir' });
    }

    const toplam_fiyat = birim_fiyati ? (birim_fiyati * adet) : null;

    const query = `
        INSERT INTO sevkiyat_kalemleri 
        (sevkiyat_id, kalem_tipi, stok_karti_id, parca_kodu, adet, birim_fiyati, toplam_fiyat, aciklama)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(query, [sevkiyat_id, kalem_tipi, stok_karti_id, parca_kodu, adet, birim_fiyati, toplam_fiyat, aciklama], function(err) {
        db.close();

        if (err) {
            console.error('Kalem ekleme hatası:', err);
            return res.status(500).json({ error: 'Kalem eklenemedi', details: err.message });
        }

        res.status(201).json({
            message: 'Kalem başarıyla eklendi',
            kalem: {
                id: this.lastID,
                sevkiyat_id,
                kalem_tipi,
                stok_karti_id,
                parca_kodu,
                adet,
                birim_fiyati,
                toplam_fiyat,
                aciklama
            }
        });
    });
});

module.exports = router;
