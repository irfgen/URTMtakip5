const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { Personel, Vardiya } = require('../models');

// Tüm personelleri getir
router.get('/', async (req, res) => {
  try {
    const { aktif, vardiya_id, pozisyon } = req.query;
    
    const whereConditions = {};
    if (aktif !== undefined) {
      whereConditions.aktif = aktif === 'true';
    }
    if (vardiya_id) {
      whereConditions.vardiya_id = vardiya_id;
    }
    if (pozisyon) {
      whereConditions.pozisyon = { [Op.like]: `%${pozisyon}%` };
    }
    
    const personeller = await Personel.findAll({
      where: whereConditions,
      include: [
        {
          model: Vardiya,
          as: 'vardiya',
          attributes: ['id', 'vardiya_adi', 'baslangic_saati', 'bitis_saati', 'renk']
        }
      ],
      order: [['personel_adi', 'ASC']]
    });
    
    res.json(personeller);
  } catch (error) {
    console.error('Personel listesi getirilirken hata:', error);
    res.status(500).json({ error: 'Personel listesi getirilemedi' });
  }
});

// Personel detayı getir
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const personel = await Personel.findByPk(id, {
      include: [
        {
          model: Vardiya,
          as: 'vardiya',
          attributes: ['id', 'vardiya_adi', 'baslangic_saati', 'bitis_saati', 'renk']
        }
      ]
    });
    
    if (!personel) {
      return res.status(404).json({ error: 'Personel bulunamadı' });
    }
    
    res.json(personel);
  } catch (error) {
    console.error('Personel detayı getirilirken hata:', error);
    res.status(500).json({ error: 'Personel detayı getirilemedi' });
  }
});

// Yeni personel ekle
router.post('/', async (req, res) => {
  try {
    const {
      personel_adi,
      sicil_no,
      pozisyon,
      telefon,
      email,
      vardiya_id,
      aktif,
      maas,
      ise_baslama_tarihi,
      notlar
    } = req.body;
    
    // Temel validasyon
    if (!personel_adi) {
      return res.status(400).json({ 
        error: 'Personel adı gereklidir' 
      });
    }
    
    // Sicil no benzersizlik kontrolü
    if (sicil_no) {
      const mevcutPersonel = await Personel.findOne({
        where: { sicil_no }
      });
      if (mevcutPersonel) {
        return res.status(400).json({ 
          error: 'Bu sicil numarası zaten kullanılmaktadır' 
        });
      }
    }
    
    const yeniPersonel = await Personel.create({
      personel_adi,
      sicil_no,
      pozisyon,
      telefon,
      email,
      vardiya_id,
      aktif: aktif !== undefined ? aktif : true,
      maas,
      ise_baslama_tarihi,
      notlar
    });
    
    // Vardiya bilgisi ile birlikte döndür
    const personelWithVardiya = await Personel.findByPk(yeniPersonel.id, {
      include: [
        {
          model: Vardiya,
          as: 'vardiya',
          attributes: ['id', 'vardiya_adi', 'baslangic_saati', 'bitis_saati', 'renk']
        }
      ]
    });
    
    res.status(201).json(personelWithVardiya);
  } catch (error) {
    console.error('Personel eklenirken hata:', error);
    res.status(500).json({ error: 'Personel eklenemedi' });
  }
});

// Personel güncelle
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      personel_adi,
      sicil_no,
      pozisyon,
      telefon,
      email,
      vardiya_id,
      aktif,
      maas,
      ise_baslama_tarihi,
      notlar
    } = req.body;
    
    const personel = await Personel.findByPk(id);
    if (!personel) {
      return res.status(404).json({ error: 'Personel bulunamadı' });
    }
    
    // Sicil no benzersizlik kontrolü (sadece değiştirildiyse)
    if (sicil_no && sicil_no !== personel.sicil_no) {
      const mevcutPersonel = await Personel.findOne({
        where: { sicil_no, id: { [Op.ne]: id } }
      });
      if (mevcutPersonel) {
        return res.status(400).json({ 
          error: 'Bu sicil numarası zaten kullanılmaktadır' 
        });
      }
    }
    
    await personel.update({
      personel_adi,
      sicil_no,
      pozisyon,
      telefon,
      email,
      vardiya_id,
      aktif,
      maas,
      ise_baslama_tarihi,
      notlar
    });
    
    // Vardiya bilgisi ile birlikte döndür
    const personelWithVardiya = await Personel.findByPk(id, {
      include: [
        {
          model: Vardiya,
          as: 'vardiya',
          attributes: ['id', 'vardiya_adi', 'baslangic_saati', 'bitis_saati', 'renk']
        }
      ]
    });
    
    res.json(personelWithVardiya);
  } catch (error) {
    console.error('Personel güncellenirken hata:', error);
    res.status(500).json({ error: 'Personel güncellenemedi' });
  }
});

// Personel sil
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const personel = await Personel.findByPk(id);
    if (!personel) {
      return res.status(404).json({ error: 'Personel bulunamadı' });
    }
    
    // Soft delete yerine aktif durumunu false yap
    await personel.update({ aktif: false });
    
    res.json({ message: 'Personel başarıyla pasif hale getirildi' });
  } catch (error) {
    console.error('Personel silinirken hata:', error);
    res.status(500).json({ error: 'Personel silinemedi' });
  }
});

// Personel kalıcı olarak sil
router.delete('/:id/kalici', async (req, res) => {
  try {
    const { id } = req.params;
    
    const personel = await Personel.findByPk(id);
    if (!personel) {
      return res.status(404).json({ error: 'Personel bulunamadı' });
    }
    
    await personel.destroy();
    res.json({ message: 'Personel kalıcı olarak silindi' });
  } catch (error) {
    console.error('Personel kalıcı olarak silinirken hata:', error);
    res.status(500).json({ error: 'Personel kalıcı olarak silinemedi' });
  }
});

module.exports = router;
