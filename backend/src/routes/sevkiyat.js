// Sevkiyat Modülü AŞAMA 1 - Backend API Routes
// URTMtakip projesi için basit sevkiyat API'leri

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const { generateSevkiyatNo } = require('../../sevkiyat-migration');

const router = express.Router();

// Database connection
const dbPath = path.join(__dirname, '..', '..', 'database.sqlite');

// Sub-routes
const lokasyonlarRouter = require('./sevkiyat-lokasyonlar');
const raporlarRouter = require('./sevkiyat-raporlar');
const kalemleriRouter = require('./sevkiyat-kalemleri');
// resimlerRouter is directly mounted in index.js

// Mount sub-routes
// NOT: firmalarRouter artık ana firmalar routes kullanılıyor - /api/firmalar
router.use('/lokasyonlar', lokasyonlarRouter);
router.use('/raporlar', raporlarRouter);
// NOT: kalemleriRouter, main index.js'te /api/sevkiyat-kalemleri olarak mount edilmiş
// resimlerRouter is directly mounted in index.js at /api/sevkiyat/resimler

// Database helper function
function getDb() {
    return new sqlite3.Database(dbPath);
}

// ========== TEDARIK TALEPLERI INTEGRASYONU ==========

// GET /api/sevkiyat/tedarik-talepleri - Onaylanan tedarik taleplerini listele
router.get('/tedarik-talepleri', (req, res) => {
    const db = getDb();
    const { page = 1, limit = 10, tarih_baslangic, tarih_bitis } = req.query;

    let query = `
        SELECT
            tt.id,
            tt.talep_kodu,
            tt.kaynak_tipi,
            tt.kaynak_id,
            tt.parca_kodu,
            tt.stok_karti_id,
            tt.is_emri_id,
            tt.aciklama,
            tt.talep_eden_kullanici,
            tt.onay_tarihi,
            tt.durum,
            tt.toplam_tutar,
            tt.miktar,
            tt.birim,
            tt.birim_fiyat,
            tt.created_at,
            sk.malzeme_adi,
            sk.malzeme_cinsi,
            sk.kesit,
            sk.boy,
            ie.is_emri_no,
            COUNT(td.id) as detay_sayisi,
            SUM(td.miktar * td.birim_fiyat) as detay_toplami
        FROM tedarik_talepleri tt
        LEFT JOIN tedarik_detaylari td ON tt.id = td.talep_id
        LEFT JOIN stok_kartlari sk ON tt.stok_karti_id = sk.id
        LEFT JOIN is_emirleri ie ON tt.is_emri_id = ie.is_emri_id
        WHERE tt.durum = 'onaylandi'
    `;

    const params = [];

    if (tarih_baslangic) {
        query += ' AND DATE(tt.created_at) >= DATE(?)';
        params.push(tarih_baslangic);
    }

    if (tarih_bitis) {
        query += ' AND DATE(tt.created_at) <= DATE(?)';
        params.push(tarih_bitis);
    }

    query += ' GROUP BY tt.id ORDER BY tt.created_at DESC';

    // Sayfalama
    const offset = (page - 1) * limit;
    query += ` LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    db.all(query, params, (err, rows) => {
        if (err) {
            console.error('Tedarik talepleri listesi hatası:', err);
            db.close();
            return res.status(500).json({ error: 'Tedarik talepleri alınamadı', details: err.message });
        }

        // Toplam kayıt sayısını al
        let countQuery = `
            SELECT COUNT(DISTINCT tt.id) as total
            FROM tedarik_talepleri tt
            WHERE tt.durum = 'onaylandi'
        `;

        const countParams = [];

        if (tarih_baslangic) {
            countQuery += ' AND DATE(tt.created_at) >= DATE(?)';
            countParams.push(tarih_baslangic);
        }

        if (tarih_bitis) {
            countQuery += ' AND DATE(tt.created_at) <= DATE(?)';
            countParams.push(tarih_bitis);
        }

        db.get(countQuery, countParams, (err, countResult) => {
            db.close();

            if (err) {
                console.error('Toplam sayı hesaplama hatası:', err);
                return res.status(500).json({ error: 'Toplam sayı hesaplanamadı' });
            }

            res.json({
                data: rows,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: countResult.total,
                    pages: Math.ceil(countResult.total / limit)
                }
            });
        });
    });
});

// GET /api/sevkiyat/tedarik-talepleri/:id - Onaylanan tedarik talebi detayı
router.get('/tedarik-talepleri/:id', (req, res) => {
    const db = getDb();
    const { id } = req.params;

    const query = `
        SELECT
            tt.*,
            sk.malzeme_adi,
            sk.malzeme_cinsi,
            sk.kesit,
            sk.boy,
            ie.is_emri_no
        FROM tedarik_talepleri tt
        LEFT JOIN stok_kartlari sk ON tt.stok_karti_id = sk.id
        LEFT JOIN is_emirleri ie ON tt.is_emri_id = ie.is_emri_id
        WHERE tt.id = ? AND tt.durum = 'onaylandi'
    `;

    db.get(query, [id], (err, row) => {
        if (err) {
            db.close();
            console.error('Tedarik talebi detay hatası:', err);
            return res.status(500).json({ error: 'Tedarik talebi detayı alınamadı' });
        }

        if (!row) {
            db.close();
            return res.status(404).json({ error: 'Tedarik talebi bulunamadı' });
        }

        // Detayları al
        const detayQuery = `
            SELECT
                td.*,
                sk.malzeme_adi as detay_malzeme_adi,
                sk.malzeme_cinsi as detay_malzeme_cinsi
            FROM tedarik_detaylari td
            LEFT JOIN stok_kartlari sk ON td.stok_karti_id = sk.id
            WHERE td.talep_id = ?
            ORDER BY td.created_at
        `;

        db.all(detayQuery, [id], (detayErr, detaylar) => {
            db.close();

            if (detayErr) {
                console.error('Tedarik detayları hatası:', detayErr);
                return res.status(500).json({ error: 'Tedarik detayları alınamadı' });
            }

            res.json({
                ...row,
                detaylar: detaylar || []
            });
        });
    });
});

// POST /api/sevkiyat/tedarik-talepleri/:id/cevir - Onaylanan tedarik talebini sevkiyata çevir
router.post('/tedarik-talepleri/:id/cevir', (req, res) => {
    const db = getDb();
    const { id } = req.params;
    const { nereden_lokasyon_id, nereye_lokasyon_id, aciklama, olusturan_kullanici } = req.body;

    // Validasyon
    if (!nereden_lokasyon_id || !nereye_lokasyon_id || !olusturan_kullanici) {
        db.close();
        return res.status(400).json({
            error: 'Gerekli alanlar eksik',
            required: ['nereden_lokasyon_id', 'nereye_lokasyon_id', 'olusturan_kullanici']
        });
    }

    // Önce tedarik talebini al
    const talepQuery = `
        SELECT
            tt.*,
            sk.malzeme_adi,
            sk.malzeme_cinsi,
            sk.kesit,
            sk.boy
        FROM tedarik_talepleri tt
        LEFT JOIN stok_kartlari sk ON tt.stok_karti_id = sk.id
        WHERE tt.id = ? AND tt.durum = 'onaylandi'
    `;

    db.get(talepQuery, [id], (err, talep) => {
        if (err) {
            db.close();
            console.error('Tedarik talebi alma hatası:', err);
            return res.status(500).json({ error: 'Tedarik talebi alınamadı' });
        }

        if (!talep) {
            db.close();
            return res.status(404).json({ error: 'Onaylanan tedarik talebi bulunamadı' });
        }

        // Sevkiyat oluştur
        const sevkiyatNo = require('../../sevkiyat-migration').generateSevkiyatNo();
        const now = new Date().toISOString();

        const sevkiyatQuery = `
            INSERT INTO sevkiyatlar (
                sevkiyat_no, tip, firma_id, lokasyon_id, nereden_lokasyon_id, nereye_lokasyon_id,
                tarih, durum, aciklama, olusturan_kullanici, tedarik_talebi_id
            ) VALUES (?, 'gelen', ?, NULL, ?, ?, ?, 'beklemede', ?, ?, ?)
        `;

        db.run(sevkiyatQuery, [
            sevkiyatNo,
            talep.firma_id || null,
            nereden_lokasyon_id,
            nereye_lokasyon_id,
            now,
            `${aciklama || ''} - Tedarik Talebi: ${talep.talep_kodu}${talep.siparis_tarihi ? ' (Sipariş: ' + new Date(talep.siparis_tarihi).toLocaleDateString('tr-TR') + ')' : ''}`,
            olusturan_kullanici,
            talep.id
        ], function(sevkiyatErr) {
            if (sevkiyatErr) {
                db.close();
                console.error('Sevkiyat oluşturma hatası:', sevkiyatErr);
                return res.status(500).json({ error: 'Sevkiyat oluşturulamadı', details: sevkiyatErr.message });
            }

            const sevkiyatId = this.lastID;

            // Tedarik detaylarını sevkiyat kalemlerine çevir
            const detayQuery = `
                SELECT
                    td.*,
                    sk.malzeme_adi,
                    sk.malzeme_cinsi,
                    sk.kesit,
                    sk.boy,
                    sk.adet as stok_adeti
                FROM tedarik_detaylari td
                LEFT JOIN stok_kartlari sk ON td.stok_karti_id = sk.id
                WHERE td.talep_id = ?
            `;

            db.all(detayQuery, [id], (detayErr, detaylar) => {
                if (detayErr) {
                    db.close();
                    console.error('Tedarik detayları hatası:', detayErr);
                    return res.status(500).json({ error: 'Tedarik detayları alınamadı' });
                }

                // Her detay için sevkiyat kalemi oluştur
                const kalemPromises = detaylar.map(detay => {
                    return new Promise((resolve, reject) => {
                        const kalemTipi = detay.stok_karti_id ? 'stok_karti' : 'parca';
                        const stokKartiId = detay.stok_karti_id || null;
                        const parcaKodu = detay.stok_karti_id ? null : detay.malzeme_kodu;

                        const kalemQuery = `
                            INSERT INTO sevkiyat_kalemleri (
                                sevkiyat_id, kalem_tipi, stok_karti_id, parca_kodu, adet,
                                birim_fiyati, toplam_fiyat, aciklama
                            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                        `;

                        // Onaylanan adeti kullan, eğer yoksa detaydaki adeti kullan
                        const kullanilacakAdet = talep.miktar || detay.miktar || 1;
                        const birimFiyat = detay.birim_fiyat || 0;
                        const toplamFiyat = kullanilacakAdet * birimFiyat;

                        db.run(kalemQuery, [
                            sevkiyatId,
                            kalemTipi,
                            stokKartiId,
                            parcaKodu,
                            kullanilacakAdet,
                            birimFiyat,
                            toplamFiyat,
                            `${detay.malzeme_adi} - ${detay.malzeme_cinsi}`
                        ], function(kalemErr) {
                            if (kalemErr) {
                                reject(kalemErr);
                            } else {
                                resolve(this.lastID);
                            }
                        });
                    });
                });

                Promise.all(kalemPromises)
                    .then(() => {
                        // Tedarik talebi durumunu güncelle
                        const updateTalepQuery = `
                            UPDATE tedarik_talepleri
                            SET durum = 'sevkiyata_cevirildi', updated_at = CURRENT_TIMESTAMP
                            WHERE id = ?
                        `;

                        db.run(updateTalepQuery, [id], (updateErr) => {
                            db.close();

                            if (updateErr) {
                                console.error('Tedarik talebi güncelleme hatası:', updateErr);
                                return res.status(500).json({
                                    error: 'Tedarik talebi güncellenemedi',
                                    details: updateErr.message
                                });
                            }

                            res.status(201).json({
                                message: 'Tedarik talebi başarıyla sevkiyata çevrildi',
                                sevkiyat_id: sevkiyatId,
                                sevkiyat_no: sevkiyatNo,
                                tedarik_talebi_id: id
                            });
                        });
                    })
                    .catch((kalemErr) => {
                        db.close();
                        console.error('Sevkiyat kalemleri oluşturma hatası:', kalemErr);
                        res.status(500).json({
                            error: 'Sevkiyat kalemleri oluşturulamadı',
                            details: kalemErr.message
                        });
                    });
            });
        });
    });
});

// ========== SEVKİYAT CRUD API'LERİ ==========

// GET /api/sevkiyat - Sevkiyat listesi (filtreleme ile)
router.get('/', (req, res) => {
    const db = getDb();
    const { tip, firma_id, lokasyon_id, tarih_baslangic, tarih_bitis, durum, page = 1, limit = 10 } = req.query;
    
    let query = `
        SELECT
            s.*,
            f.firma_adi,
            l.lokasyon_adi,
            COUNT(r.id) as resim_sayisi,
            COALESCE(SUM(sk.miktar), 0) as toplam_adet
        FROM sevkiyatlar s
        LEFT JOIN firmalar f ON s.firma_id = f.id
        LEFT JOIN sevkiyat_lokasyonlari l ON s.lokasyon_id = l.id
        LEFT JOIN sevkiyat_resimler r ON s.id = r.sevkiyat_id
        LEFT JOIN sevkiyat_kalemleri sk ON s.id = sk.sevkiyat_id
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
    
    query += ' GROUP BY s.id ORDER BY s.tarih DESC, s.id DESC';
    
    // Sayfalama
    const offset = (page - 1) * limit;
    query += ` LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));
    
    db.all(query, params, (err, rows) => {
        if (err) {
            console.error('Sevkiyat listesi hatası:', err);
            return res.status(500).json({ error: 'Sevkiyat listesi alınamadı', details: err.message });
        }
        
        // Toplam kayıt sayısını al
        let countQuery = `
            SELECT COUNT(DISTINCT s.id) as total
            FROM sevkiyatlar s
            WHERE 1=1
        `;
        
        const countParams = params.slice(0, -2); // LIMIT ve OFFSET'i çıkar
        
        if (tip) countQuery += ' AND s.tip = ?';
        if (firma_id) countQuery += ' AND s.firma_id = ?';
        if (lokasyon_id) countQuery += ' AND s.lokasyon_id = ?';
        if (durum) countQuery += ' AND s.durum = ?';
        if (tarih_baslangic) countQuery += ' AND DATE(s.tarih) >= DATE(?)';
        if (tarih_bitis) countQuery += ' AND DATE(s.tarih) <= DATE(?)';
        
        db.get(countQuery, countParams, (err, countResult) => {
            db.close();
            
            if (err) {
                console.error('Toplam sayı hesaplama hatası:', err);
                return res.status(500).json({ error: 'Toplam sayı hesaplanamadı' });
            }
            
            res.json({
                data: rows,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: countResult.total,
                    pages: Math.ceil(countResult.total / limit)
                }
            });
        });
    });
});

// GET /api/sevkiyat/:id - Tek sevkiyat detayı
router.get('/:id', (req, res) => {
    const db = getDb();
    const { id } = req.params;
    
    const query = `
        SELECT 
            s.*,
            f.firma_adi,
            l.lokasyon_adi
        FROM sevkiyatlar s
        LEFT JOIN firmalar f ON s.firma_id = f.id
        LEFT JOIN sevkiyat_lokasyonlari l ON s.lokasyon_id = l.id
        WHERE s.id = ?
    `;
    
    db.get(query, [id], (err, row) => {
        if (err) {
            db.close();
            console.error('Sevkiyat detay hatası:', err);
            return res.status(500).json({ error: 'Sevkiyat detayı alınamadı' });
        }
        
        if (!row) {
            db.close();
            return res.status(404).json({ error: 'Sevkiyat bulunamadı' });
        }
        
        // Resimleri al
        const resimQuery = 'SELECT * FROM sevkiyat_resimler WHERE sevkiyat_id = ? ORDER BY yuklenme_tarihi';
        
        db.all(resimQuery, [id], (resimErr, resimler) => {
            if (resimErr) {
                console.error('Resim listesi hatası:', resimErr);
                db.close();
                return res.status(500).json({ error: 'Resim listesi alınamadı' });
            }
            
            // Sevkiyat kalemlerini de getir
            const kalemleriQuery = `
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
                    END as mevcut_stok
                FROM sevkiyat_kalemleri sk
                LEFT JOIN stok_kartlari stok ON sk.stok_karti_id = stok.id
                LEFT JOIN parcalar p ON sk.parca_kodu = p.parca_kodu
                WHERE sk.sevkiyat_id = ?
                ORDER BY sk.olusturma_tarihi ASC
            `;
            
            db.all(kalemleriQuery, [id], (kalemleriErr, kalemleri) => {
                db.close();
                
                if (kalemleriErr) {
                    console.error('Sevkiyat kalemleri getirme hatası:', kalemleriErr);
                    return res.status(500).json({ error: 'Sevkiyat kalemleri alınamadı' });
                }
                
                res.json({
                    ...row,
                    resimler: resimler || [],
                    kalemler: kalemleri || []
                });
            });
        });
    });
});

// POST /api/sevkiyat - Yeni sevkiyat oluşturma
router.post('/', (req, res) => {
    const db = getDb();
    const { tip, firma_id = null, lokasyon_id = null, nereden_lokasyon_id = null, nereye_lokasyon_id = null, tarih, durum = 'beklemede', aciklama, olusturan_kullanici } = req.body;

    console.log('Sevkiyat POST request body:', req.body);
    console.log('Extracted values:', { tip, firma_id, lokasyon_id, nereden_lokasyon_id, nereye_lokasyon_id, tarih, durum, aciklama, olusturan_kullanici });

    // Geriye dönük uyumluluk: mobil/desktop eski formlar yalnızca lokasyon_id gönderiyor olabilir
    const normalizedNeredenId = nereden_lokasyon_id ?? (tip === 'giden' ? lokasyon_id : null);
    const normalizedNereyeId = nereye_lokasyon_id ?? (tip === 'gelen' ? lokasyon_id : null);

    // Validasyon: tip, tarih, olusturan_kullanici zorunlu; nereden/nereye ikilisinden EN AZ BİRİ dolu olmalı
    if (!tip || !tarih || !olusturan_kullanici || (!normalizedNeredenId && !normalizedNereyeId)) {
        console.log('Validation failed:', {
            tip: !!tip,
            tarih: !!tarih,
            olusturan_kullanici: !!olusturan_kullanici,
            hasAnyLocation: !!(normalizedNeredenId || normalizedNereyeId)
        });
        db.close();
        return res.status(400).json({
            error: 'Gerekli alanlar eksik',
            required: ['tip', 'tarih', 'olusturan_kullanici', 'nereden_lokasyon_id veya nereye_lokasyon_id'],
            received: { tip, tarih, olusturan_kullanici, nereden_lokasyon_id: normalizedNeredenId, nereye_lokasyon_id: normalizedNereyeId }
        });
    }

    const sevkiyatNo = generateSevkiyatNo();

    const query = `
        INSERT INTO sevkiyatlar (sevkiyat_no, tip, firma_id, lokasyon_id, nereden_lokasyon_id, nereye_lokasyon_id, tarih, durum, aciklama, olusturan_kullanici)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(
        query,
        [
            sevkiyatNo,
            tip,
            firma_id || null,
            lokasyon_id || null,
            normalizedNeredenId,
            normalizedNereyeId,
            tarih,
            durum,
            aciklama || null,
            olusturan_kullanici
        ],
        function (err) {
            db.close();

            if (err) {
                console.error('Sevkiyat oluşturma hatası:', err);
                return res.status(500).json({ error: 'Sevkiyat oluşturulamadı', details: err.message });
            }

            res.status(201).json({
                id: this.lastID,
                sevkiyat_no: sevkiyatNo,
                message: 'Sevkiyat başarıyla oluşturuldu'
            });
        }
    );
});

// POST /api/sevkiyat/toplu - Yeni taslak sevkiyat oluştur
router.post('/toplu', (req, res) => {
    const db = getDb();
    const { tip, lokasyon_id = null, nereden_lokasyon_id = null, nereye_lokasyon_id = null, aciklama = null, olusturan_kullanici = 'system' } = req.body || {};

    if (!tip) {
        db.close();
        return res.status(400).json({ error: 'tip zorunludur' });
    }

    const sevkiyatNo = generateSevkiyatNo();
    const nowIso = new Date().toISOString();
    const query = `
        INSERT INTO sevkiyatlar (sevkiyat_no, tip, firma_id, lokasyon_id, nereden_lokasyon_id, nereye_lokasyon_id, tarih, durum, aciklama, olusturan_kullanici)
        VALUES (?, ?, NULL, ?, ?, ?, ?, 'taslak', ?, ?)
    `;

    db.run(query, [sevkiyatNo, tip, lokasyon_id, nereden_lokasyon_id, nereye_lokasyon_id, nowIso, aciklama, olusturan_kullanici], function (err) {
        db.close();
        if (err) {
            console.error('Taslak sevkiyat oluşturma hatası:', err);
            return res.status(500).json({ error: 'Taslak sevkiyat oluşturulamadı', details: err.message });
        }
        return res.status(201).json({ id: this.lastID, sevkiyat_no: sevkiyatNo, durum: 'taslak' });
    });
});

// PUT /api/sevkiyat/:id/durum - durum geçişi
router.put('/:id/durum', (req, res) => {
    const db = getDb();
    const { id } = req.params;
    const { durum } = req.body || {};

    const allowed = ['taslak', 'beklemede', 'tamamlandi', 'iptal'];
    if (!allowed.includes(durum)) {
        db.close();
        return res.status(400).json({ error: 'Geçersiz durum', allowed });
    }

    // Zorunlu alanlar kontrolü: taslaktan çıkarken nereden/nereye lokasyonları dolu olmalı
    const checkSql = `SELECT nereden_lokasyon_id, nereye_lokasyon_id FROM sevkiyatlar WHERE id = ?`;
    db.get(checkSql, [id], (err, row) => {
        if (err) {
            db.close();
            return res.status(500).json({ error: 'Kontrol hatası', details: err.message });
        }
        if (!row) {
            db.close();
            return res.status(404).json({ error: 'Sevkiyat bulunamadı' });
        }
        if (durum !== 'taslak' && (!row.nereden_lokasyon_id || !row.nereye_lokasyon_id)) {
            db.close();
            return res.status(400).json({ error: 'Nereden ve Nereye lokasyonları seçilmeden taslaktan çıkılamaz' });
        }

        const updateSql = `UPDATE sevkiyatlar SET durum = ?, guncelleme_tarihi = CURRENT_TIMESTAMP WHERE id = ?`;
        db.run(updateSql, [durum, id], function (uErr) {
            db.close();
            if (uErr) {
                return res.status(500).json({ error: 'Durum güncellenemedi', details: uErr.message });
            }
            if (this.changes === 0) {
                return res.status(404).json({ error: 'Sevkiyat bulunamadı' });
            }
            return res.json({ message: 'Durum güncellendi', durum });
        });
    });
});

// POST /api/sevkiyat/:id/tamamla - Sevkiyatı tamamlama (irsaliye fotoğrafıyla birlikte)
router.post('/:id/tamamla', async (req, res) => {
    const db = getDb();
    const { id } = req.params;
    const { irsaliye_no, irsaliye_tarihi, notlar, kontroller } = req.body;

    try {
        // Sevkiyat bilgilerini al
        const sevkiyatQuery = `SELECT s.*, tt.id as tedarik_talebi_id FROM sevkiyatlar s
                               LEFT JOIN tedarik_talepleri tt ON s.tedarik_talebi_id = tt.id
                               WHERE s.id = ?`;

        db.get(sevkiyatQuery, [id], async (err, sevkiyat) => {
            if (err) {
                db.close();
                return res.status(500).json({ error: 'Sevkiyat bilgileri alınamadı', details: err.message });
            }

            if (!sevkiyat) {
                db.close();
                return res.status(404).json({ error: 'Sevkiyat bulunamadı' });
            }

            // Sevkiyat durumunu güncelle
            const updateQuery = `UPDATE sevkiyatlar
                                SET durum = 'tamamlandi',
                                    guncelleme_tarihi = CURRENT_TIMESTAMP,
                                    aciklama = COALESCE(aciklama, '') || ?
                                WHERE id = ?`;

            db.run(updateQuery, [
                `\n\n--- Tamamlama Bilgileri ---\n` +
                `İrsaliye No: ${irsaliye_no || ''}\n` +
                `İrsaliye Tarihi: ${irsaliye_tarihi || ''}\n` +
                `Notlar: ${notlar || ''}\n` +
                `Kontroller: ${kontrollers ? JSON.stringify(kontrollers) : ''}`,
                id
            ], async (updateErr) => {
                if (updateErr) {
                    db.close();
                    return res.status(500).json({ error: 'Sevkiyat tamamlanamadı', details: updateErr.message });
                }

                // Stok kartlarını güncelle
                if (sevkiyat.tedarik_talebi_id) {
                    // Sevkiyat kalemlerini al
                    const kalemlerQuery = `SELECT * FROM sevkiyat_kalemleri WHERE sevkiyat_id = ?`;

                    db.all(kalemlerQuery, [id], async (kalemErr, kalemler) => {
                        if (kalemErr) {
                            console.error('Sevkiyat kalemleri hatası:', kalemErr);
                            // Stok güncellemesi başarısız olsa bile sevkiyat tamamlanmış sayılsın
                        } else {
                            // Her kalem için stok güncelle
                            for (const kalem of kalemler) {
                                if (kalem.stok_karti_id) {
                                    try {
                                        // Stok kartını güncelle
                                        const stokUpdateQuery = `
                                            UPDATE stok_kartlari
                                            SET mevcut_stok = mevcut_stok + ?,
                                                guncelleme_tarihi = CURRENT_TIMESTAMP
                                            WHERE id = ?
                                        `;

                                        db.run(stokUpdateQuery, [kalem.miktar, kalem.stok_karti_id], (stokErr) => {
                                            if (stokErr) {
                                                console.error('Stok güncelleme hatası:', stokErr);
                                            }
                                        });

                                        // Stok hareket kaydı oluştur
                                        const hareketQuery = `
                                            INSERT INTO stok_haraketleri
                                            (stok_karti_id, hareket_tipi, miktar, birim_fiyat, aciklama, olusturan_kullanici, referans_id, referans_tipi)
                                            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                                        `;

                                        db.run(hareketQuery, [
                                            kalem.stok_karti_id,
                                            'giris',
                                            kalem.miktar,
                                            kalem.birim_fiyat,
                                            `Sevkiyat: ${sevkiyat.sevkiyat_no}`,
                                            'Sistem',
                                            id,
                                            'sevkiyat'
                                        ], (hareketErr) => {
                                            if (hareketErr) {
                                                console.error('Stok hareket kaydı hatası:', hareketErr);
                                            }
                                        });
                                    } catch (stokError) {
                                        console.error('Stok güncelleme işlemi hatası:', stokError);
                                    }
                                }
                            }
                        }

                        // İlişkili tedarik talebinin durumunu güncelle
                        if (sevkiyat.tedarik_talebi_id) {
                            const talepUpdateQuery = `UPDATE tedarik_talepleri
                                                      SET durum = 'teslim_edildi',
                                                          teslim_tarihi = CURRENT_TIMESTAMP
                                                      WHERE id = ?`;

                            db.run(talepUpdateQuery, [sevkiyat.tedarik_talebi_id], (talepErr) => {
                                if (talepErr) {
                                    console.error('Tedarik talebi güncelleme hatası:', talepErr);
                                }
                            });
                        }

                        db.close();
                        res.json({
                            success: true,
                            message: 'Sevkiyat başarıyla tamamlandı',
                            sevkiyat_durum: 'tamamlandi'
                        });
                    });
                } else {
                    // Tedarik talebi olmayan normal sevkiyat
                    db.close();
                    res.json({
                        success: true,
                        message: 'Sevkiyat başarıyla tamamlandı',
                        sevkiyat_durum: 'tamamlandi'
                    });
                }
            });
        });
    } catch (error) {
        if (db) db.close();
        return res.status(500).json({ error: 'İşlem hatası', details: error.message });
    }
});

// PUT /api/sevkiyat/:id - Sevkiyat güncelleme
router.put('/:id', (req, res) => {
    const db = getDb();
    const { id } = req.params;
    const { tip, lokasyon_id, nereden_lokasyon_id, nereye_lokasyon_id, tarih, durum, aciklama } = req.body;
    
    const query = `
        UPDATE sevkiyatlar 
        SET tip = ?, lokasyon_id = ?, nereden_lokasyon_id = ?, nereye_lokasyon_id = ?, tarih = ?, durum = ?, aciklama = ?, guncelleme_tarihi = CURRENT_TIMESTAMP
        WHERE id = ?
    `;
    
    db.run(query, [tip, lokasyon_id, nereden_lokasyon_id, nereye_lokasyon_id, tarih, durum, aciklama, id], function(err) {
        db.close();
        
        if (err) {
            console.error('Sevkiyat güncelleme hatası:', err);
            return res.status(500).json({ error: 'Sevkiyat güncellenemedi', details: err.message });
        }
        
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Sevkiyat bulunamadı' });
        }
        
        res.json({ message: 'Sevkiyat başarıyla güncellendi' });
    });
});

// DELETE /api/sevkiyat/:id - Sevkiyat silme
router.delete('/:id', (req, res) => {
    const db = getDb();
    const { id } = req.params;
    
    // Önce resimleri sil
    const resimQuery = 'SELECT * FROM sevkiyat_resimler WHERE sevkiyat_id = ?';
    
    db.all(resimQuery, [id], (err, resimler) => {
        if (err) {
            db.close();
            console.error('Resim listesi hatası:', err);
            return res.status(500).json({ error: 'Resim listesi alınamadı' });
        }
        
        // Dosyaları sil
        resimler.forEach(resim => {
            const filePath = path.join(__dirname, resim.resim_yolu);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        });
        
        // Sevkiyatı sil (CASCADE ile resim kayıtları da silinir)
        const deleteQuery = 'DELETE FROM sevkiyatlar WHERE id = ?';
        
        db.run(deleteQuery, [id], function(err) {
            db.close();
            
            if (err) {
                console.error('Sevkiyat silme hatası:', err);
                return res.status(500).json({ error: 'Sevkiyat silinemedi', details: err.message });
            }
            
            if (this.changes === 0) {
                return res.status(404).json({ error: 'Sevkiyat bulunamadı' });
            }
            
            res.json({ message: 'Sevkiyat başarıyla silindi' });
        });
    });
});

// ========== OTOMATIK SEVKIYAT OLUSTURMA ==========
// POST /api/sevkiyat/create-from-talep - Talepten sevkiyat oluştur
router.post('/create-from-talep', (req, res) => {
    const db = getDb();
    const { talep_id, firma_id, lokasyon_id } = req.body;

    if (!talep_id || !firma_id || !lokasyon_id) {
        db.close();
        return res.status(400).json({
            error: 'Gerekli alanlar eksik',
            required: ['talep_id', 'firma_id', 'lokasyon_id']
        });
    }

    // Talep detaylarını al
    const talepQuery = `
        SELECT
            tt.*,
            sk.malzeme_adi,
            sk.malzeme_cinsi,
            sk.kesit,
            sk.boy,
            ie.is_emri_no
        FROM tedarik_talepleri tt
        LEFT JOIN stok_kartlari sk ON tt.stok_karti_id = sk.id
        LEFT JOIN is_emirleri ie ON tt.is_emri_id = ie.is_emri_id
        WHERE tt.id = ? AND tt.durum = 'onaylandi'
    `;

    db.get(talepQuery, [talep_id], (err, talep) => {
        if (err) {
            db.close();
            console.error('Talep detayı hatası:', err);
            return res.status(500).json({ error: 'Talep detayı alınamadı' });
        }

        if (!talep) {
            db.close();
            return res.status(404).json({ error: 'Talep bulunamadı veya onaylanmamış' });
        }

        // Sevkiyat no oluştur
        const sevkiyatNo = generateSevkiyatNo();

        // Sevkiyatı oluştur
        const sevkiyatQuery = `
            INSERT INTO sevkiyatlar (
                sevkiyat_no, tip, tarih, aciklama,
                nereden_lokasyon_id, nereye_lokasyon_id,
                firma_id, durum, olusturan_kullanici, olusturma_tarihi, guncelleme_tarihi
            ) VALUES (?, 'giden', ?, ?, ?, ?, ?, 'beklemede', 'Sistem Kullanıcısı', datetime('now'), datetime('now'))
        `;

        const sevkiyatParams = [
            sevkiyatNo,
            new Date().toISOString().split('T')[0], // bugünün tarihi
            `${talep.talep_kodu} - ${talep.aciklama || 'Otomatik sevkiyat'}`,
            lokasyon_id, // nereden
            1, // nereye (varsayılan dış lokasyon)
            firma_id
        ];

        db.run(sevkiyatQuery, sevkiyatParams, function(sevkiyatErr) {
            if (sevkiyatErr) {
                db.close();
                console.error('Sevkiyat oluşturma hatası:', sevkiyatErr);
                return res.status(500).json({ error: 'Sevkiyat oluşturulamadı', details: sevkiyatErr.message });
            }

            const sevkiyatId = this.lastID;

            // Talep detaylarını al
            const detayQuery = `
                SELECT
                    td.*,
                    sk.malzeme_adi as detay_malzeme_adi,
                    sk.malzeme_cinsi as detay_malzeme_cinsi
                FROM tedarik_detaylari td
                LEFT JOIN stok_kartlari sk ON td.stok_karti_id = sk.id
                WHERE td.talep_id = ?
                ORDER BY td.created_at
            `;

            db.all(detayQuery, [talep_id], (detayErr, detaylar) => {
                if (detayErr) {
                    db.close();
                    console.error('Tedarik detayları hatası:', detayErr);
                    return res.status(500).json({ error: 'Tedarik detayları alınamadı' });
                }

                // Sevkiyat kalemlerini oluştur
                let completedKalems = 0;
                const totalKalems = detaylar.length;

                if (totalKalems === 0) {
                    db.close();
                    return res.json({
                        success: true,
                        sevkiyat_id: sevkiyatId,
                        sevkiyat_no: sevkiyatNo,
                        message: 'Sevkiyat başarıyla oluşturuldu (kalem yok)'
                    });
                }

                detaylar.forEach(detay => {
                    const kalemQuery = `
                        INSERT INTO sevkiyat_kalemleri (
                            sevkiyat_id, parca_kodu, malzeme_adi, miktar,
                            birim, birim_fiyat, toplam_tutar, aciklama,
                            olusturma_tarihi, guncelleme_tarihi
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
                    `;

                    const kalemParams = [
                        sevkiyatId,
                        detay.parca_kodu || talep.parca_kodu,
                        detay.detay_malzeme_adi || talep.malzeme_adi,
                        detay.miktar || talep.miktar || 0,
                        detay.birim || talep.birim || 'adet',
                        detay.birim_fiyat || talep.birim_fiyat || 0,
                        (detay.miktar || talep.miktar || 0) * (detay.birim_fiyat || talep.birim_fiyat || 0),
                        detay.aciklama || talep.aciklama || ''
                    ];

                    db.run(kalemQuery, kalemParams, function(kalemErr) {
                        if (kalemErr) {
                            console.error('Kalem oluşturma hatası:', kalemErr);
                        }

                        completedKalems++;
                        if (completedKalems === totalKalems) {
                            db.close();
                            res.json({
                                success: true,
                                sevkiyat_id: sevkiyatId,
                                sevkiyat_no: sevkiyatNo,
                                talep_kodu: talep.talep_kodu,
                                message: 'Sevkiyat başarıyla oluşturuldu'
                            });
                        }
                    });
                });
            });
        });
    });
});

// ========== TESLİM ALMA OTOMASYONU ==========

// POST /api/sevkiyat/:id/teslim-al - Sevkiyat teslim alma ve otomasyon
router.post('/:id/teslim-al', (req, res) => {
    const db = getDb();
    const { id } = req.params;
    const {
        personel_id,
        teslim_notlari = '',
        teslim_tarihi = new Date().toISOString(),
        onay_adedi = null
    } = req.body;

    // Transaction başlat
    db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        // 1. Sevkiyat bilgisini kontrol et
        const sevkiyatQuery = `
            SELECT s.*, tt.id as tedarik_talebi_id, tt.talep_kodu, tt.durum as talep_durumu
            FROM sevkiyatlar s
            LEFT JOIN tedarik_talepleri tt ON s.tedarik_talebi_id = tt.id
            WHERE s.id = ?
        `;

        db.get(sevkiyatQuery, [id], (err, sevkiyat) => {
            if (err) {
                db.run('ROLLBACK');
                db.close();
                return res.status(500).json({
                    success: false,
                    message: 'Sevkiyat bilgisi alinamadi',
                    error: err.message
                });
            }

            if (!sevkiyat) {
                db.run('ROLLBACK');
                db.close();
                return res.status(404).json({
                    success: false,
                    message: 'Sevkiyat bulunamadi'
                });
            }

            if (sevkiyat.durum !== 'beklemede' && sevkiyat.durum !== 'yolda') {
                db.run('ROLLBACK');
                db.close();
                return res.status(400).json({
                    success: false,
                    message: 'Sadece beklemede veya yolda durumundaki sevkiyatlar teslim alinabilir'
                });
            }

            // 2. Personel bilgisini güncelle (notlar alanına teslim alma bilgisini ekle)
            if (personel_id) {
                const personelUpdateQuery = `
                    UPDATE personeller
                    SET notlar = CASE
                        WHEN notlar IS NULL OR notlar = '' THEN 'Sevkiyat teslim alindi: ' + ?
                        ELSE notlar || '\nSevkiyat teslim alindi: ' + ?
                    END,
                        guncelleme_tarihi = CURRENT_TIMESTAMP
                    WHERE id = ?
                `;

                db.run(personelUpdateQuery, [sevkiyat.sevkiyat_no, sevkiyat.sevkiyat_no, personel_id], (personelErr) => {
                    if (personelErr) {
                        db.run('ROLLBACK');
                        db.close();
                        return res.status(500).json({
                            success: false,
                            message: 'Personel durumu güncellenemedi',
                            error: personelErr.message
                        });
                    }
                });
            }

            // 3. Sevkiyat durumunu tamamlandı olarak güncelle
            const sevkiyatUpdateQuery = `
                UPDATE sevkiyatlar
                SET durum = 'tamamlandi',
                    teslim_tarihi = ?,
                    teslim_notlari = ?,
                    onay_adedi = ?,
                    guncelleme_tarihi = CURRENT_TIMESTAMP
                WHERE id = ?
            `;

            db.run(sevkiyatUpdateQuery, [
                teslim_tarihi,
                teslim_notlari,
                onay_adedi,
                id
            ], (sevkiyatErr) => {
                if (sevkiyatErr) {
                    db.run('ROLLBACK');
                    db.close();
                    return res.status(500).json({
                        success: false,
                        message: 'Sevkiyat durumu güncellenemedi',
                        error: sevkiyatErr.message
                    });
                }

                // 4. İlişkili tedarik talebini tamamlandı olarak güncelle
                if (sevkiyat.tedarik_talebi_id) {
                    const talepUpdateQuery = `
                        UPDATE tedarik_talepleri
                        SET durum = 'tamamlandi',
                            teslim_tarihi = ?,
                            updated_at = CURRENT_TIMESTAMP
                        WHERE id = ?
                    `;

                    db.run(talepUpdateQuery, [
                        teslim_tarihi,
                        sevkiyat.tedarik_talebi_id
                    ], (talepErr) => {
                        if (talepErr) {
                            console.warn('Tedarik talebi güncellenemedi:', talepErr.message);
                            // Talep güncelleme hatası işlemi durdurmamalı
                        }
                    });
                }

                // 5. Sevkiyat kalemlerini logla
                const kalemQuery = `
                    SELECT sk.id, sk.parca_kodu, sk.miktar, sk.kalem_tipi,
                           sk.adet, sk.aciklama
                    FROM sevkiyat_kalemleri sk
                    WHERE sk.sevkiyat_id = ?
                `;

                db.all(kalemQuery, [id], (kalemErr, kalemler) => {
                    if (kalemErr) {
                        db.run('ROLLBACK');
                        db.close();
                        return res.status(500).json({
                            success: false,
                            message: 'Sevkiyat kalemleri alinamadi',
                            error: kalemErr.message
                        });
                    }

                    // Her bir kalem için stok güncelle
                    const stokPromises = kalemler.map(kalem => {
                        return new Promise((resolve, reject) => {
                            if (kalem.stok_tipi === 'ham_malzeme') {
                                // Ham malzeme ise stok miktarını artır
                                const yeniAdet = kalem.mevcut_adet + kalem.miktar;
                                const stokUpdateQuery = `
                                    UPDATE stok_kartlari
                                    SET adet = ?, updated_at = CURRENT_TIMESTAMP
                                    WHERE parca_kodu = ?
                                `;

                                db.run(stokUpdateQuery, [yeniAdet, kalem.parca_kodu], (stokErr) => {
                                    if (stokErr) {
                                        reject(stokErr);
                                    } else {
                                        // Stok hareket kaydı oluştur
                                        const hareketQuery = `
                                            INSERT INTO parca_kayitlari
                                            (parca_kodu, islem_tipi, miktar, aciklama, personel_id, created_at)
                                            VALUES (?, 'giris', ?, ?, ?, CURRENT_TIMESTAMP)
                                        `;

                                        db.run(hareketQuery, [
                                            kalem.parca_kodu,
                                            kalem.miktar,
                                            `Sevkiyat teslim alindi - ${sevkiyat.sevkiyat_no}`,
                                            personel_id
                                        ], (hareketErr) => {
                                            if (hareketErr) {
                                                console.warn('Stok hareket kaydı oluşturulamadı:', hareketErr.message);
                                            }
                                            resolve();
                                        });
                                    }
                                });
                            } else {
                                // Parça ise üretim planını güncelle veya yeni plan oluştur
                                // Bu kısım daha karmaşık, şimdilik sadece log bırak
                                console.log(`Parça teslim alindi: ${kalem.parca_kodu} - Miktar: ${kalem.miktar}`);
                                resolve();
                            }
                        });
                    });

                    Promise.all(stokPromises)
                        .then(() => {
                            db.run('COMMIT', (commitErr) => {
                                db.close();

                                if (commitErr) {
                                    return res.status(500).json({
                                        success: false,
                                        message: 'Transaction commit hatası',
                                        error: commitErr.message
                                    });
                                }

                                res.json({
                                    success: true,
                                    message: 'Sevkiyat başarıyla teslim alındı',
                                    data: {
                                        sevkiyat_id: id,
                                        sevkiyat_no: sevkiyat.sevkiyat_no,
                                        personel_id: personel_id,
                                        teslim_tarihi: teslim_tarihi,
                                        tedarik_talebi_id: sevkiyat.tedarik_talebi_id,
                                        talep_kodu: sevkiyat.talep_kodu
                                    }
                                });
                            });
                        })
                        .catch((stokErr) => {
                            db.run('ROLLBACK');
                            db.close();
                            res.status(500).json({
                                success: false,
                                message: 'Stok güncelleme hatası',
                                error: stokErr.message
                            });
                        });
                });
            });
        });
    });
});

module.exports = router;
