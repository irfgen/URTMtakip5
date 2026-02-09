const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { VardiyaAtama, Personel, Vardiya } = require('../models');

// Vardiya atamalarını getir
router.get('/', async (req, res) => {
  try {
    const { 
      baslangic_tarihi, 
      bitis_tarihi, 
      personel_id, 
      vardiya_id, 
      durum 
    } = req.query;
    
    const whereConditions = {};
    
    if (baslangic_tarihi || bitis_tarihi) {
      whereConditions.tarih = {};
      if (baslangic_tarihi) {
        whereConditions.tarih[Op.gte] = baslangic_tarihi;
      }
      if (bitis_tarihi) {
        whereConditions.tarih[Op.lte] = bitis_tarihi;
      }
    }
    
    if (personel_id) {
      whereConditions.personel_id = personel_id;
    }
    
    if (vardiya_id) {
      whereConditions.vardiya_id = vardiya_id;
    }
    
    if (durum) {
      whereConditions.durum = durum;
    }
    
    const atamalar = await VardiyaAtama.findAll({
      where: whereConditions,
      include: [
        {
          model: Personel,
          as: 'personel',
          attributes: ['id', 'personel_adi', 'sicil_no', 'pozisyon']
        },
        {
          model: Vardiya,
          as: 'vardiya',
          attributes: ['id', 'vardiya_adi', 'baslangic_saati', 'bitis_saati', 'renk']
        }
      ],
      order: [['tarih', 'DESC'], ['vardiya_id', 'ASC']]
    });
    
    res.json(atamalar);
  } catch (error) {
    console.error('Vardiya atamaları getirilirken hata:', error);
    res.status(500).json({ error: 'Vardiya atamaları getirilemedi' });
  }
});

// Belirli tarih aralığında atama takvimi getir
router.get('/takvim', async (req, res) => {
  try {
    const { baslangic_tarihi, bitis_tarihi } = req.query;
    
    if (!baslangic_tarihi || !bitis_tarihi) {
      return res.status(400).json({ 
        error: 'Başlangıç ve bitiş tarihleri gereklidir' 
      });
    }
    
    const atamalar = await VardiyaAtama.findAll({
      where: {
        tarih: {
          [Op.between]: [baslangic_tarihi, bitis_tarihi]
        }
      },
      include: [
        {
          model: Personel,
          as: 'personel',
          attributes: ['id', 'personel_adi', 'sicil_no', 'pozisyon']
        },
        {
          model: Vardiya,
          as: 'vardiya',
          attributes: ['id', 'vardiya_adi', 'baslangic_saati', 'bitis_saati', 'renk']
        }
      ],
      order: [['tarih', 'ASC'], ['vardiya_id', 'ASC']]
    });
    
    // Tarihe göre grupla
    const takvim = {};
    atamalar.forEach(atama => {
      const tarih = atama.tarih;
      if (!takvim[tarih]) {
        takvim[tarih] = [];
      }
      takvim[tarih].push(atama);
    });
    
    res.json(takvim);
  } catch (error) {
    console.error('Vardiya takvimi getirilirken hata:', error);
    res.status(500).json({ error: 'Vardiya takvimi getirilemedi' });
  }
});

// Yeni vardiya ataması oluştur
router.post('/', async (req, res) => {
  try {
    const {
      personel_id,
      vardiya_id,
      tarih,
      baslangic_saati,
      bitis_saati,
      notlar
    } = req.body;
    
    // Temel validasyon
    if (!personel_id || !vardiya_id || !tarih) {
      return res.status(400).json({ 
        error: 'Personel ID, vardiya ID ve tarih gereklidir' 
      });
    }
    
    // Aynı tarihte personelin başka ataması var mı kontrol et
    const mevcutAtama = await VardiyaAtama.findOne({
      where: {
        personel_id,
        tarih
      }
    });
    
    if (mevcutAtama) {
      return res.status(400).json({ 
        error: 'Bu personelin bu tarihte zaten bir vardiya ataması bulunmaktadır' 
      });
    }
    
    const yeniAtama = await VardiyaAtama.create({
      personel_id,
      vardiya_id,
      tarih,
      baslangic_saati,
      bitis_saati,
      notlar
    });
    
    // İlişkili verilerle birlikte döndür
    const atamaWithRelations = await VardiyaAtama.findByPk(yeniAtama.id, {
      include: [
        {
          model: Personel,
          as: 'personel',
          attributes: ['id', 'personel_adi', 'sicil_no', 'pozisyon']
        },
        {
          model: Vardiya,
          as: 'vardiya',
          attributes: ['id', 'vardiya_adi', 'baslangic_saati', 'bitis_saati', 'renk']
        }
      ]
    });
    
    res.status(201).json(atamaWithRelations);
  } catch (error) {
    console.error('Vardiya ataması oluşturulurken hata:', error);
    res.status(500).json({ error: 'Vardiya ataması oluşturulamadı' });
  }
});

// Vardiya ataması güncelle
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      personel_id,
      vardiya_id,
      tarih,
      baslangic_saati,
      bitis_saati,
      durum,
      fiili_baslangic,
      fiili_bitis,
      notlar
    } = req.body;
    
    const atama = await VardiyaAtama.findByPk(id);
    if (!atama) {
      return res.status(404).json({ error: 'Vardiya ataması bulunamadı' });
    }
    
    // Tarih değiştiriliyorsa çakışma kontrolü
    if (tarih && tarih !== atama.tarih) {
      const mevcutAtama = await VardiyaAtama.findOne({
        where: {
          personel_id: personel_id || atama.personel_id,
          tarih,
          id: { [Op.ne]: id }
        }
      });
      
      if (mevcutAtama) {
        return res.status(400).json({ 
          error: 'Bu personelin bu tarihte zaten bir vardiya ataması bulunmaktadır' 
        });
      }
    }
    
    await atama.update({
      personel_id,
      vardiya_id,
      tarih,
      baslangic_saati,
      bitis_saati,
      durum,
      fiili_baslangic,
      fiili_bitis,
      notlar
    });
    
    // İlişkili verilerle birlikte döndür
    const atamaWithRelations = await VardiyaAtama.findByPk(id, {
      include: [
        {
          model: Personel,
          as: 'personel',
          attributes: ['id', 'personel_adi', 'sicil_no', 'pozisyon']
        },
        {
          model: Vardiya,
          as: 'vardiya',
          attributes: ['id', 'vardiya_adi', 'baslangic_saati', 'bitis_saati', 'renk']
        }
      ]
    });
    
    res.json(atamaWithRelations);
  } catch (error) {
    console.error('Vardiya ataması güncellenirken hata:', error);
    res.status(500).json({ error: 'Vardiya ataması güncellenemedi' });
  }
});

// Vardiya ataması sil
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const atama = await VardiyaAtama.findByPk(id);
    if (!atama) {
      return res.status(404).json({ error: 'Vardiya ataması bulunamadı' });
    }
    
    await atama.destroy();
    res.json({ message: 'Vardiya ataması başarıyla silindi' });
  } catch (error) {
    console.error('Vardiya ataması silinirken hata:', error);
    res.status(500).json({ error: 'Vardiya ataması silinemedi' });
  }
});

// Vardiya başlat
router.post('/:id/baslat', async (req, res) => {
  try {
    const { id } = req.params;
    
    const atama = await VardiyaAtama.findByPk(id);
    if (!atama) {
      return res.status(404).json({ error: 'Vardiya ataması bulunamadı' });
    }
    
    if (atama.durum === 'aktif') {
      return res.status(400).json({ error: 'Vardiya zaten aktif' });
    }
    
    await atama.update({
      durum: 'aktif',
      fiili_baslangic: new Date()
    });
    
    res.json({ message: 'Vardiya başarıyla başlatıldı' });
  } catch (error) {
    console.error('Vardiya başlatılırken hata:', error);
    res.status(500).json({ error: 'Vardiya başlatılamadı' });
  }
});

// Vardiya bitir
router.post('/:id/bitir', async (req, res) => {
  try {
    const { id } = req.params;
    
    const atama = await VardiyaAtama.findByPk(id);
    if (!atama) {
      return res.status(404).json({ error: 'Vardiya ataması bulunamadı' });
    }
    
    if (atama.durum !== 'aktif') {
      return res.status(400).json({ error: 'Vardiya aktif değil' });
    }
    
    await atama.update({
      durum: 'tamamlandi',
      fiili_bitis: new Date()
    });
    
    res.json({ message: 'Vardiya başarıyla bitirildi' });
  } catch (error) {
    console.error('Vardiya bitirilirken hata:', error);
    res.status(500).json({ error: 'Vardiya bitirilemedi' });
  }
});

// Toplu vardiya ataması oluştur
router.post('/toplu', async (req, res) => {
  try {
    const { personel_ids, vardiya_id, baslangic_tarihi, bitis_tarihi } = req.body;
    
    if (!personel_ids || !Array.isArray(personel_ids) || personel_ids.length === 0) {
      return res.status(400).json({ error: 'Personel IDs gereklidir' });
    }
    
    if (!vardiya_id || !baslangic_tarihi || !bitis_tarihi) {
      return res.status(400).json({ 
        error: 'Vardiya ID, başlangıç ve bitiş tarihleri gereklidir' 
      });
    }
    
    const baslangic = new Date(baslangic_tarihi);
    const bitis = new Date(bitis_tarihi);
    const atamalar = [];
    
    // Tarih aralığındaki her gün için atama oluştur
    for (let tarih = new Date(baslangic); tarih <= bitis; tarih.setDate(tarih.getDate() + 1)) {
      const tarihStr = tarih.toISOString().split('T')[0];
      
      for (const personel_id of personel_ids) {
        // Mevcut atamayı kontrol et
        const mevcutAtama = await VardiyaAtama.findOne({
          where: {
            personel_id,
            tarih: tarihStr
          }
        });
        
        if (!mevcutAtama) {
          atamalar.push({
            personel_id,
            vardiya_id,
            tarih: tarihStr
          });
        }
      }
    }
    
    if (atamalar.length === 0) {
      return res.status(400).json({ 
        error: 'Oluşturulacak yeni atama bulunamadı (tüm atamalar zaten mevcut)' 
      });
    }
    
    const yeniAtamalar = await VardiyaAtama.bulkCreate(atamalar);
    
    res.status(201).json({
      message: `${yeniAtamalar.length} vardiya ataması başarıyla oluşturuldu`,
      atamalar: yeniAtamalar
    });
  } catch (error) {
    console.error('Toplu vardiya ataması oluşturulurken hata:', error);
    res.status(500).json({ error: 'Toplu vardiya ataması oluşturulamadı' });
  }
});

module.exports = router;
