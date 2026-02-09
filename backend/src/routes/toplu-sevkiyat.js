const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const router = express.Router();
const dbPath = path.join(__dirname, '..', '..', 'database.sqlite');

function getDb() { return new sqlite3.Database(dbPath); }

function generateTopluNo() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const t = now.getTime().toString().slice(-3);
  return `TSV-${y}${m}${d}-${t}`;
}

// GET /api/toplu-sevkiyat - liste
router.get('/', (req, res) => {
  const db = getDb();
  const { page = 1, limit = 10, durum } = req.query;
  let sql = `
    SELECT t.*, 
      ln.lokasyon_adi AS nereden_lokasyon_adi,
      lg.lokasyon_adi AS nereye_lokasyon_adi,
      (SELECT COUNT(*) FROM toplu_sevkiyat_kalemleri k WHERE k.toplu_id = t.id) AS kalem_sayisi
    FROM toplu_sevkiyat t
    LEFT JOIN sevkiyat_lokasyonlari ln ON ln.id = t.nereden_lokasyon_id
    LEFT JOIN sevkiyat_lokasyonlari lg ON lg.id = t.nereye_lokasyon_id
    WHERE 1=1`;
  const params = [];
  if (durum) { sql += ' AND t.durum = ?'; params.push(durum); }
  sql += ' ORDER BY t.tarih DESC, t.id DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

  db.all(sql, params, (err, rows) => {
    if (err) { db.close(); return res.status(500).json({ error: 'Liste alınamadı' }); }
    let countSql = 'SELECT COUNT(*) AS total FROM toplu_sevkiyat t WHERE 1=1';
    const countParams = [];
    if (durum) { countSql += ' AND t.durum = ?'; countParams.push(durum); }
    db.get(countSql, countParams, (cErr, cRow) => {
      db.close();
      if (cErr) return res.status(500).json({ error: 'Toplam alınamadı' });
      return res.json({ data: rows, pagination: { page: parseInt(page), limit: parseInt(limit), total: cRow.total, pages: Math.ceil(cRow.total / parseInt(limit)) } });
    });
  });
});

// POST /api/toplu-sevkiyat - taslak oluştur
router.post('/', (req, res) => {
  const db = getDb();
  const { nereden_lokasyon_id = null, nereye_lokasyon_id = null, tarih = new Date().toISOString(), aciklama = null, olusturan_kullanici = 'system' } = req.body || {};
  const topluNo = generateTopluNo();
  const sql = `INSERT INTO toplu_sevkiyat (toplu_no, nereden_lokasyon_id, nereye_lokasyon_id, tarih, durum, aciklama, olusturan_kullanici) VALUES (?, ?, ?, ?, 'taslak', ?, ?)`;
  db.run(sql, [topluNo, nereden_lokasyon_id, nereye_lokasyon_id, tarih, aciklama, olusturan_kullanici], function (err) {
    db.close();
    if (err) return res.status(500).json({ error: 'Toplu sevkiyat oluşturulamadı', details: err.message });
    return res.status(201).json({ id: this.lastID, toplu_no: topluNo, durum: 'taslak' });
  });
});

// GET /api/toplu-sevkiyat/:id - detay
router.get('/:id', (req, res) => {
  const db = getDb();
  const { id } = req.params;
  const headSql = `SELECT * FROM toplu_sevkiyat WHERE id = ?`;
  db.get(headSql, [id], (hErr, head) => {
    if (hErr) { db.close(); return res.status(500).json({ error: 'Başlık alınamadı' }); }
    if (!head) { db.close(); return res.status(404).json({ error: 'Kayıt bulunamadı' }); }

    const itemsSql = `
      SELECT k.*,
        (
          SELECT sr.resim_yolu FROM sevkiyat_resimler sr
          WHERE sr.kalem_id IS NULL AND sr.sevkiyat_id IS NULL AND sr.toplu_kalem_id = k.id
          ORDER BY sr.is_temsil DESC, sr.yuklenme_tarihi LIMIT 1
        ) AS temsil_resim_yolu
      FROM toplu_sevkiyat_kalemleri k WHERE k.toplu_id = ? ORDER BY k.olusturma_tarihi ASC`;
    db.all(itemsSql, [id], (iErr, items) => {
      db.close();
      if (iErr) return res.status(500).json({ error: 'Kalemler alınamadı' });
      return res.json({ ...head, kalemler: items || [] });
    });
  });
});

// PUT /api/toplu-sevkiyat/:id - başlık güncelle
router.put('/:id', (req, res) => {
  const db = getDb();
  const { id } = req.params;
  const { nereden_lokasyon_id, nereye_lokasyon_id, tarih, durum, aciklama } = req.body || {};
  const sql = `UPDATE toplu_sevkiyat SET nereden_lokasyon_id = ?, nereye_lokasyon_id = ?, tarih = ?, durum = ?, aciklama = ?, guncelleme_tarihi = CURRENT_TIMESTAMP WHERE id = ?`;
  db.run(sql, [nereden_lokasyon_id, nereye_lokasyon_id, tarih, durum, aciklama, id], function (err) {
    db.close();
    if (err) return res.status(500).json({ error: 'Güncellenemedi', details: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Kayıt bulunamadı' });
    return res.json({ message: 'Güncellendi' });
  });
});

// Durum geçişi
router.put('/:id/durum', (req, res) => {
  const db = getDb();
  const { id } = req.params; const { durum } = req.body || {};
  const allowed = ['taslak','beklemede','tamamlandi','iptal'];
  if (!allowed.includes(durum)) { db.close(); return res.status(400).json({ error: 'Geçersiz durum', allowed }); }
  const chk = `SELECT nereden_lokasyon_id, nereye_lokasyon_id FROM toplu_sevkiyat WHERE id = ?`;
  db.get(chk, [id], (e, r) => {
    if (e) { db.close(); return res.status(500).json({ error: 'Kontrol hatası' }); }
    if (!r) { db.close(); return res.status(404).json({ error: 'Kayıt bulunamadı' }); }
    if (durum !== 'taslak' && (!r.nereden_lokasyon_id || !r.nereye_lokasyon_id)) { db.close(); return res.status(400).json({ error: 'Nereden/Nereye zorunlu' }); }
    db.run(`UPDATE toplu_sevkiyat SET durum = ?, guncelleme_tarihi = CURRENT_TIMESTAMP WHERE id = ?`, [durum, id], function (uErr) {
      db.close(); if (uErr) return res.status(500).json({ error: 'Durum güncellenemedi' }); return res.json({ message: 'Durum güncellendi', durum });
    });
  });
});

// Kalem CRUD
router.get('/:toplu_id/kalemler', (req, res) => {
  const db = getDb();
  const { toplu_id } = req.params;
  db.all(`SELECT * FROM toplu_sevkiyat_kalemleri WHERE toplu_id = ? ORDER BY olusturma_tarihi ASC`, [toplu_id], (err, rows) => {
    db.close(); if (err) return res.status(500).json({ error: 'Kalemler alınamadı' }); return res.json(rows);
  });
});

router.post('/:toplu_id/kalemler', (req, res) => {
  const db = getDb();
  const { toplu_id } = req.params;
  const { kalem_tipi = null, stok_karti_id = null, parca_kodu = null, adet, birim_fiyati, aciklama } = req.body || {};
  if (!adet || parseInt(adet) <= 0) { db.close(); return res.status(400).json({ error: 'Adet > 0 olmalı' }); }
  const toplam_fiyat = birim_fiyati ? (parseFloat(birim_fiyati) * parseInt(adet)) : null;
  const sql = `INSERT INTO toplu_sevkiyat_kalemleri (toplu_id, kalem_tipi, stok_karti_id, parca_kodu, adet, birim_fiyati, toplam_fiyat, aciklama) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
  db.run(sql, [toplu_id, kalem_tipi, stok_karti_id || null, parca_kodu || null, adet, birim_fiyati || null, toplam_fiyat, aciklama || null], function (err) {
    db.close(); if (err) return res.status(500).json({ error: 'Kalem eklenemedi', details: err.message }); return res.status(201).json({ id: this.lastID });
  });
});

router.put('/:toplu_id/kalemler/:kalem_id', (req, res) => {
  const db = getDb(); const { kalem_id } = req.params; const { adet, birim_fiyati, aciklama } = req.body || {};
  if (!adet || parseInt(adet) <= 0) { db.close(); return res.status(400).json({ error: 'Adet > 0 olmalı' }); }
  const toplam_fiyat = birim_fiyati ? (parseFloat(birim_fiyati) * parseInt(adet)) : null;
  db.run(`UPDATE toplu_sevkiyat_kalemleri SET adet = ?, birim_fiyati = ?, toplam_fiyat = ?, aciklama = ?, guncelleme_tarihi = CURRENT_TIMESTAMP WHERE id = ?`, [adet, birim_fiyati || null, toplam_fiyat, aciklama || null, kalem_id], function (err) {
    db.close(); if (err) return res.status(500).json({ error: 'Kalem güncellenemedi' }); if (this.changes === 0) return res.status(404).json({ error: 'Kalem bulunamadı' }); return res.json({ message: 'Güncellendi' });
  });
});

router.delete('/:toplu_id/kalemler/:kalem_id', (req, res) => {
  const db = getDb(); const { kalem_id } = req.params;
  // Resimleri (sevkiyat_resimler.toplu_kalem_id) sil
  db.all('SELECT * FROM sevkiyat_resimler WHERE toplu_kalem_id = ?', [kalem_id], (e, rows) => {
    if (e) { db.close(); return res.status(500).json({ error: 'Resimler alınamadı' }); }
    const fs = require('fs');
    rows.forEach(r => { const fp = path.join(__dirname, '..', r.resim_yolu); if (fs.existsSync(fp)) { try { fs.unlinkSync(fp); } catch (_) {} } });
    db.run('DELETE FROM sevkiyat_resimler WHERE toplu_kalem_id = ?', [kalem_id], function (d1) {
      db.run('DELETE FROM toplu_sevkiyat_kalemleri WHERE id = ?', [kalem_id], function (d2) {
        db.close(); return res.json({ message: 'Kalem ve resimleri silindi' });
      });
    });
  });
});

module.exports = router;


