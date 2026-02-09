const express = require('express');
const router = express.Router();
const { sequelize } = require('../config/database');

// Test endpoint
router.get('/test', async (req, res) => {
  try {
    res.json({ message: 'Fason grup test endpoint çalışıyor', timestamp: new Date() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Basit fason grup listesi
router.get('/basit', async (req, res) => {
  try {
    const query = 'SELECT * FROM fason_gruplar ORDER BY olusturma_tarihi DESC';
    const [results] = await sequelize.query(query);
    res.json(results);
  } catch (error) {
    console.error('Basit fason grup listesi hatası:', error);
    res.status(500).json({ 
      error: 'Fason grupları listelenirken hata oluştu',
      details: error.message 
    });
  }
});

// Yeni fason grup oluştur
router.post('/basit', async (req, res) => {
  try {
    const { grup_adi, aciklama, renk, olusturan_kisi, fason_is_emirleri } = req.body;
    const { v4: uuidv4 } = require('uuid');
    
    const fason_grup_id = uuidv4();
    const now = new Date().toISOString();
    
    const query = `
      INSERT INTO fason_gruplar 
      (fason_grup_id, grup_adi, aciklama, renk, olusturan_kisi, aktif, toplam_parca_sayisi, olusturma_tarihi, guncelleme_tarihi)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    await sequelize.query(query, {
      replacements: [
        fason_grup_id, 
        grup_adi, 
        aciklama || null, 
        renk || '#1976d2', 
        olusturan_kisi || 'Sistem', 
        1, 
        0, 
        now, 
        now
      ]
    });
    
    // Seçilen fason iş emirlerini gruba ata
    if (fason_is_emirleri && fason_is_emirleri.length > 0) {
      const updateQuery = `
        UPDATE fason_is_emirleri 
        SET fason_grup_id = ?, guncelleme_tarihi = ?
        WHERE fason_is_emri_id IN (${fason_is_emirleri.map(() => '?').join(',')})
      `;
      
      await sequelize.query(updateQuery, {
        replacements: [fason_grup_id, now, ...fason_is_emirleri]
      });
    }
    
    res.status(201).json({ 
      fason_grup_id, 
      grup_adi, 
      aciklama, 
      renk, 
      olusturan_kisi, 
      message: 'Grup başarıyla oluşturuldu',
      atanan_is_emri_sayisi: fason_is_emirleri?.length || 0
    });
  } catch (error) {
    console.error('Fason grup oluşturma hatası:', error);
    res.status(500).json({ 
      error: 'Fason grup oluşturulurken hata oluştu',
      details: error.message 
    });
  }
});

// Grup detayını getir (fason iş emirleri ile)
router.get('/basit/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Grup bilgilerini getir
    const grupQuery = 'SELECT * FROM fason_gruplar WHERE fason_grup_id = ?';
    const [grupResults] = await sequelize.query(grupQuery, {
      replacements: [id]
    });
    
    if (grupResults.length === 0) {
      return res.status(404).json({ error: 'Fason grubu bulunamadı' });
    }
    
    const grup = grupResults[0];
    
    // Bu gruba ait fason iş emirlerini getir
    const fasonIsEmirleriQuery = `
      SELECT 
        fe.*,
        p.parca_kodu as parcaKodu,
        p.parca_adi as parcaAdi,
        p.teknik_resim_path as teknikResimPath,
        p.foto_path as fotoPath
      FROM fason_is_emirleri fe
      LEFT JOIN parcalar p ON fe.parca_kodu = p.parca_kodu
      WHERE fe.fason_grup_id = ?
      ORDER BY fe.olusturma_tarihi DESC
    `;
    
    const [fasonIsEmirleri] = await sequelize.query(fasonIsEmirleriQuery, {
      replacements: [id]
    });
    
    // Grup detayını fason iş emirleri ile birlikte döndür
    const grupDetay = {
      ...grup,
      fason_is_emirleri: fasonIsEmirleri.map(fe => ({
        ...fe,
        parca: {
          parcaKodu: fe.parcaKodu,
          parcaAdi: fe.parcaAdi,
          teknikResimPath: fe.teknikResimPath,
          fotoPath: fe.fotoPath
        }
      })),
      fason_is_emri_sayisi: fasonIsEmirleri.length,
      aktif_parca_sayisi: new Set(fasonIsEmirleri.map(fe => fe.parca_kodu)).size
    };
    
    res.json(grupDetay);
  } catch (error) {
    console.error('Grup detayı getirilirken hata:', error);
    res.status(500).json({ 
      error: 'Grup detayı getirilirken hata oluştu',
      details: error.message 
    });
  }
});

module.exports = router;
