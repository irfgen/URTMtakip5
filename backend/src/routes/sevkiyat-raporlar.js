// Sevkiyat Raporlama API Routes
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const ExcelJS = require('exceljs');

const router = express.Router();
const dbPath = path.join(__dirname, '..', '..', 'database.sqlite');

function getDb() {
    return new sqlite3.Database(dbPath);
}

// ========== RAPORLAMA API'LERİ ==========

// GET /api/sevkiyat/raporlar/ozet - Özet Dashboard
router.get('/ozet', (req, res) => {
    const db = getDb();
    
    // Çoklu sorgu için Promise wrapper
    const queries = {
        toplam: 'SELECT COUNT(*) as toplam FROM sevkiyatlar',
        gelen: 'SELECT COUNT(*) as gelen FROM sevkiyatlar WHERE tip = "gelen"',
        giden: 'SELECT COUNT(*) as giden FROM sevkiyatlar WHERE tip = "giden"',
        buAy: `SELECT COUNT(*) as bu_ay FROM sevkiyatlar WHERE strftime('%Y-%m', tarih) = strftime('%Y-%m', 'now')`,
        buHafta: `SELECT COUNT(*) as bu_hafta FROM sevkiyatlar WHERE strftime('%Y-%W', tarih) = strftime('%Y-%W', 'now')`,
        durumDagilim: `
            SELECT durum, COUNT(*) as sayi 
            FROM sevkiyatlar 
            GROUP BY durum
        `,
        firmaDagilim: `
            SELECT f.firma_adi, COUNT(s.id) as sevkiyat_sayisi
            FROM firmalar f
            LEFT JOIN sevkiyatlar s ON f.id = s.firma_id
            GROUP BY f.id, f.firma_adi
            ORDER BY sevkiyat_sayisi DESC
            LIMIT 10
        `
    };
    
    let results = {};
    let completed = 0;
    const totalQueries = Object.keys(queries).length;
    
    Object.keys(queries).forEach(key => {
        db.all(queries[key], [], (err, rows) => {
            if (err) {
                console.error(`${key} sorgu hatası:`, err);
                results[key] = key === 'durumDagilim' || key === 'firmaDagilim' ? [] : { [key]: 0 };
            } else {
                if (key === 'durumDagilim' || key === 'firmaDagilim') {
                    results[key] = rows;
                } else {
                    results[key] = rows[0] || { [key]: 0 };
                }
            }
            
            completed++;
            
            if (completed === totalQueries) {
                db.close();
                res.json(results);
            }
        });
    });
});

// GET /api/sevkiyat/raporlar/trend - Trend analizi
router.get('/trend', (req, res) => {
    const db = getDb();
    const { gun = 30 } = req.query;
    
    const query = `
        SELECT 
            DATE(tarih) as tarih,
            COUNT(*) as toplam,
            SUM(CASE WHEN tip = 'gelen' THEN 1 ELSE 0 END) as gelen,
            SUM(CASE WHEN tip = 'giden' THEN 1 ELSE 0 END) as giden
        FROM sevkiyatlar 
        WHERE tarih >= date('now', '-${parseInt(gun)} days')
        GROUP BY DATE(tarih)
        ORDER BY tarih
    `;
    
    db.all(query, [], (err, rows) => {
        db.close();
        
        if (err) {
            console.error('Trend analizi hatası:', err);
            return res.status(500).json({ error: 'Trend analizi alınamadı' });
        }
        
        res.json(rows);
    });
});

// GET /api/sevkiyat/raporlar/firma-performans - Firma performans raporu
router.get('/firma-performans', (req, res) => {
    const db = getDb();
    const { tarih_baslangic, tarih_bitis } = req.query;
    
    let query = `
        SELECT
            f.firma_adi,
            f.tip as firma_tip,
            COUNT(s.id) as toplam_sevkiyat,
            SUM(CASE WHEN s.tip = 'gelen' THEN 1 ELSE 0 END) as gelen_sevkiyat,
            SUM(CASE WHEN s.tip = 'giden' THEN 1 ELSE 0 END) as giden_sevkiyat,
            SUM(CASE WHEN s.durum = 'tamamlandi' THEN 1 ELSE 0 END) as tamamlanan,
            SUM(CASE WHEN s.durum = 'beklemede' THEN 1 ELSE 0 END) as bekleyen,
            SUM(CASE WHEN s.durum = 'iptal' THEN 1 ELSE 0 END) as iptal
        FROM firmalar f
        LEFT JOIN sevkiyatlar s ON f.id = s.firma_id
        WHERE f.durum = 'aktif'
    `;
    
    const params = [];
    
    if (tarih_baslangic) {
        query += ' AND (s.tarih IS NULL OR DATE(s.tarih) >= DATE(?))';
        params.push(tarih_baslangic);
    }
    
    if (tarih_bitis) {
        query += ' AND (s.tarih IS NULL OR DATE(s.tarih) <= DATE(?))';
        params.push(tarih_bitis);
    }
    
    query += `
        GROUP BY f.id, f.firma_adi, f.tip
        ORDER BY toplam_sevkiyat DESC
    `;
    
    db.all(query, params, (err, rows) => {
        db.close();
        
        if (err) {
            console.error('Firma performans hatası:', err);
            return res.status(500).json({ error: 'Firma performans raporu alınamadı' });
        }
        
        res.json(rows);
    });
});

// GET /api/sevkiyat/raporlar/excel - Excel export
router.get('/excel', async (req, res) => {
    const db = getDb();
    const { tip, firma_id, lokasyon_id, tarih_baslangic, tarih_bitis, durum } = req.query;
    
    let query = `
        SELECT 
            s.sevkiyat_no,
            s.tip,
            f.firma_adi,
            l.lokasyon_adi,
            s.tarih,
            s.durum,
            s.aciklama,
            s.olusturan_kullanici,
            s.olusturma_tarihi
        FROM sevkiyatlar s
        LEFT JOIN firmalar f ON s.firma_id = f.id
        LEFT JOIN sevkiyat_lokasyonlari l ON s.lokasyon_id = l.id
        WHERE 1=1
    `;
    
    const params = [];
    
    if (tip) {
        query += ' AND s.tip = ?';
        params.push(tip);
    }
    
    if (firma_id) {
        query += ' AND s.firma_id = ?';
        params.push(firma_id);
    }
    
    if (lokasyon_id) {
        query += ' AND s.lokasyon_id = ?';
        params.push(lokasyon_id);
    }
    
    if (durum) {
        query += ' AND s.durum = ?';
        params.push(durum);
    }
    
    if (tarih_baslangic) {
        query += ' AND DATE(s.tarih) >= DATE(?)';
        params.push(tarih_baslangic);
    }
    
    if (tarih_bitis) {
        query += ' AND DATE(s.tarih) <= DATE(?)';
        params.push(tarih_bitis);
    }
    
    query += ' ORDER BY s.tarih DESC';
    
    db.all(query, params, async (err, rows) => {
        db.close();
        
        if (err) {
            console.error('Excel export veri hatası:', err);
            return res.status(500).json({ error: 'Excel export verisi alınamadı' });
        }
        
        try {
            // Excel dosyası oluştur
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Sevkiyat Listesi');
            
            // Header
            worksheet.addRow([
                'Sevkiyat No',
                'Tip',
                'Firma',
                'Lokasyon',
                'Tarih',
                'Durum',
                'Açıklama',
                'Oluşturan',
                'Oluşturma Tarihi'
            ]);
            
            // Style header
            const headerRow = worksheet.getRow(1);
            headerRow.font = { bold: true };
            headerRow.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE0E0E0' }
            };
            
            // Data rows
            rows.forEach(row => {
                worksheet.addRow([
                    row.sevkiyat_no,
                    row.tip === 'gelen' ? 'Gelen' : 'Giden',
                    row.firma_adi,
                    row.lokasyon_adi,
                    new Date(row.tarih).toLocaleDateString('tr-TR'),
                    row.durum === 'beklemede' ? 'Beklemede' : 
                    row.durum === 'tamamlandi' ? 'Tamamlandı' : 'İptal',
                    row.aciklama || '',
                    row.olusturan_kullanici,
                    new Date(row.olusturma_tarihi).toLocaleDateString('tr-TR')
                ]);
            });
            
            // Auto-size columns
            worksheet.columns.forEach(column => {
                let maxLength = 0;
                column.eachCell({ includeEmpty: false }, cell => {
                    const length = cell.value ? cell.value.toString().length : 0;
                    if (length > maxLength) {
                        maxLength = length;
                    }
                });
                column.width = Math.min(maxLength + 2, 50);
            });
            
            // Response headers
            const fileName = `sevkiyat_raporu_${new Date().toISOString().split('T')[0]}.xlsx`;
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
            
            // Send file
            await workbook.xlsx.write(res);
            res.end();
            
        } catch (excelErr) {
            console.error('Excel oluşturma hatası:', excelErr);
            res.status(500).json({ error: 'Excel dosyası oluşturulamadı' });
        }
    });
});

module.exports = router;
