const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { Vardiya, Personel, VardiyaAtama } = require('../models');

// Tüm vardiyaları getir
router.get('/', async (req, res) => {
  try {
    const { aktif, with_personel } = req.query;
    
    const whereConditions = {};
    if (aktif !== undefined) {
      whereConditions.aktif = aktif === 'true';
    }
    
    const includeOptions = [];
    if (with_personel === 'true') {
      includeOptions.push({
        model: Personel,
        as: 'personeller',
        attributes: ['id', 'personel_adi', 'sicil_no', 'pozisyon', 'aktif']
      });
    }
    
    const vardiyalar = await Vardiya.findAll({
      where: whereConditions,
      include: includeOptions,
      order: [['baslangic_saati', 'ASC']]
    });
    
    res.json(vardiyalar);
  } catch (error) {
    console.error('Vardiya listesi getirilirken hata:', error);
    res.status(500).json({ error: 'Vardiya listesi getirilemedi' });
  }
});

// Vardiya detayı getir
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const vardiya = await Vardiya.findByPk(id, {
      include: [
        {
          model: Personel,
          as: 'personeller',
          attributes: ['id', 'personel_adi', 'sicil_no', 'pozisyon', 'aktif']
        }
      ]
    });
    
    if (!vardiya) {
      return res.status(404).json({ error: 'Vardiya bulunamadı' });
    }
    
    res.json(vardiya);
  } catch (error) {
    console.error('Vardiya detayı getirilirken hata:', error);
    res.status(500).json({ error: 'Vardiya detayı getirilemedi' });
  }
});

// Yeni vardiya ekle
router.post('/', async (req, res) => {
  try {
    const {
      vardiya_adi,
      baslangic_saati,
      bitis_saati,
      haftalik_calisma_gunleri,
      aktif,
      aciklama,
      renk
    } = req.body;
    
    // Temel validasyon
    if (!vardiya_adi || !baslangic_saati || !bitis_saati) {
      return res.status(400).json({ 
        error: 'Vardiya adı, başlangıç saati ve bitiş saati gereklidir' 
      });
    }
    
    const yeniVardiya = await Vardiya.create({
      vardiya_adi,
      baslangic_saati,
      bitis_saati,
      haftalik_calisma_gunleri: haftalik_calisma_gunleri || [1, 2, 3, 4, 5],
      aktif: aktif !== undefined ? aktif : true,
      aciklama,
      renk: renk || '#1976d2'
    });
    
    res.status(201).json(yeniVardiya);
  } catch (error) {
    console.error('Vardiya eklenirken hata:', error);
    res.status(500).json({ error: 'Vardiya eklenemedi' });
  }
});

// Vardiya güncelle
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      vardiya_adi,
      baslangic_saati,
      bitis_saati,
      haftalik_calisma_gunleri,
      aktif,
      aciklama,
      renk
    } = req.body;
    
    const vardiya = await Vardiya.findByPk(id);
    if (!vardiya) {
      return res.status(404).json({ error: 'Vardiya bulunamadı' });
    }
    
    await vardiya.update({
      vardiya_adi,
      baslangic_saati,
      bitis_saati,
      haftalik_calisma_gunleri,
      aktif,
      aciklama,
      renk
    });
    
    res.json(vardiya);
  } catch (error) {
    console.error('Vardiya güncellenirken hata:', error);
    res.status(500).json({ error: 'Vardiya güncellenemedi' });
  }
});

// Vardiya sil
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const vardiya = await Vardiya.findByPk(id);
    if (!vardiya) {
      return res.status(404).json({ error: 'Vardiya bulunamadı' });
    }
    
    // Vardiyaya atanmış personel olup olmadığını kontrol et
    const personelSayisi = await Personel.count({
      where: { vardiya_id: id }
    });
    
    if (personelSayisi > 0) {
      return res.status(400).json({ 
        error: 'Bu vardiyaya atanmış personel bulunmaktadır. Önce personel atamalarını güncelleyin.' 
      });
    }
    
    await vardiya.destroy();
    res.json({ message: 'Vardiya başarıyla silindi' });
  } catch (error) {
    console.error('Vardiya silinirken hata:', error);
    res.status(500).json({ error: 'Vardiya silinemedi' });
  }
});

// Vardiya istatistikleri
router.get('/:id/istatistikler', async (req, res) => {
  try {
    const { id } = req.params;
    const { baslangic_tarihi, bitis_tarihi } = req.query;
    
    const vardiya = await Vardiya.findByPk(id);
    if (!vardiya) {
      return res.status(404).json({ error: 'Vardiya bulunamadı' });
    }
    
    const whereConditions = { vardiya_id: id };
    
    if (baslangic_tarihi || bitis_tarihi) {
      whereConditions.tarih = {};
      if (baslangic_tarihi) {
        whereConditions.tarih[Op.gte] = baslangic_tarihi;
      }
      if (bitis_tarihi) {
        whereConditions.tarih[Op.lte] = bitis_tarihi;
      }
    }
    
    const [
      toplamAtama,
      tamamlananAtama,
      aktifAtama,
      iptalAtama,
      personelSayisi
    ] = await Promise.all([
      VardiyaAtama.count({ where: whereConditions }),
      VardiyaAtama.count({ where: { ...whereConditions, durum: 'tamamlandi' } }),
      VardiyaAtama.count({ where: { ...whereConditions, durum: 'aktif' } }),
      VardiyaAtama.count({ where: { ...whereConditions, durum: 'iptal' } }),
      Personel.count({ where: { vardiya_id: id, aktif: true } })
    ]);
    
    res.json({
      vardiya_adi: vardiya.vardiya_adi,
      personel_sayisi: personelSayisi,
      atama_istatistikleri: {
        toplam: toplamAtama,
        tamamlanan: tamamlananAtama,
        aktif: aktifAtama,
        iptal: iptalAtama,
        planlanan: toplamAtama - tamamlananAtama - aktifAtama - iptalAtama
      }
    });
  } catch (error) {
    console.error('Vardiya istatistikleri getirilirken hata:', error);
    res.status(500).json({ error: 'Vardiya istatistikleri getirilemedi' });
  }
});

module.exports = router;
