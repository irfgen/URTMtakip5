const db = require('../models');
const TezgahPlanlananIsler = db.TezgahPlanlananIsler;
const IsEmri = db.IsEmri;
const Tezgah = db.Tezgah;
const { Op } = require('sequelize');
const sequelize = require('../config/database').sequelize;

// Transaction yönetimi için yardımcı fonksiyon
const safeTransaction = async (callback) => {
  const t = await sequelize.transaction();
  try {
    const result = await callback(t);
    await t.commit();
    return result;
  } catch (error) {
    if (t && !t.finished) {
      try {
        await t.rollback();
      } catch (rollbackError) {
        console.error('Rollback işlemi sırasında hata:', rollbackError);
      }
    }
    throw error;
  }
};

// Tezgah için planlanan iş emirlerini getir
exports.getPlanlanmisIsEmirleri = async (req, res) => {
  try {
    const { tezgahId } = req.params;
    if (!tezgahId) {
      return res.status(400).json({ error: 'Tezgah ID gereklidir' });
    }
    
    // TezgahPlanlananIsler tablosundan bu tezgah için planlanan işleri al (sıralı)
    const planlananKayitlar = await TezgahPlanlananIsler.findAll({
      where: { tezgah_id: tezgahId },
      order: [['sira_no', 'ASC']]
    });
    
    // İş emri ID'lerini çıkar
    const isEmriIdList = planlananKayitlar.map(kayit => kayit.is_emri_id);
    
    // İş emirleri ve sıra numaraları arasında eşleştirme için map
    const siraMap = {};
    planlananKayitlar.forEach(kayit => {
      siraMap[kayit.is_emri_id] = kayit.sira_no;
    });
    
    // İş emirlerini getir
    let planlanmisIsEmirleri = [];
    if (isEmriIdList.length > 0) {
      planlanmisIsEmirleri = await IsEmri.findAll({
        where: {
          is_emri_id: isEmriIdList,
          durum: { [Op.ne]: 'Tamamlandi' }
        }
      });
      
      // Sıra numarasına göre sırala ve sıra bilgisini ekle
      planlanmisIsEmirleri = planlanmisIsEmirleri.map(isEmri => {
        const isEmriObject = isEmri.toJSON();
        isEmriObject.sira_no = siraMap[isEmri.is_emri_id];
        return isEmriObject;
      }).sort((a, b) => a.sira_no - b.sira_no);
    }
    
    res.json(planlanmisIsEmirleri);
  } catch (error) {
    console.error('Planlanan iş emirleri getirilirken hata:', error);
    res.status(500).json({ error: error.message });
  }
};

// Tezgah için planlanan işleri kontrol et ve sayısını döndür
exports.getPlanlanmisIsSayisi = async (req, res) => {
  try {
    const { tezgahId } = req.params;
    
    if (!tezgahId) {
      return res.status(400).json({ error: 'Tezgah ID gereklidir' });
    }

    // Tezgahın var olduğunu kontrol et
    const tezgah = await Tezgah.findByPk(tezgahId);
    if (!tezgah) {
      return res.status(404).json({ error: 'Tezgah bulunamadı' });
    }

    // Bu tezgah için planlanan işlerin sayısını TezgahPlanlananIsler tablosundan getir
    const planlanmisIsSayisi = await TezgahPlanlananIsler.count({
      where: {
        tezgah_id: tezgahId
      }
    });

    res.json({ count: planlanmisIsSayisi });
  } catch (error) {
    console.error('Planlanan iş sayısı getirilirken hata:', error);
    res.status(500).json({ error: error.message });
  }
};

// Bir tezgaha iş planlama (ekleme)
exports.planlananIsEkle = async (req, res) => {
  try {
    const { tezgahId } = req.params;
    const { is_emri_id } = req.body;
    
    if (!tezgahId || !is_emri_id) {
      return res.status(400).json({ error: 'Tezgah ID ve is_emri_id gereklidir' });
    }
    
    // İş emrinin var olduğunu kontrol et
    const IsEmri = require('../models/IsEmri');
    const isEmri = await IsEmri.findByPk(is_emri_id);
    if (!isEmri) {
      return res.status(404).json({ error: 'İş emri bulunamadı' });
    }
    
    // Aynı iş emri aynı tezgaha tekrar eklenmesin
    const mevcut = await TezgahPlanlananIsler.findOne({ 
      where: { tezgah_id: tezgahId, is_emri_id } 
    });
    if (mevcut) {
      return res.status(409).json({ error: 'Bu iş emri zaten bu tezgah için planlanmış' });
    }
    
    // İş emrinin aktif olarak başka bir tezgaha atanmış olup olmadığını kontrol et
    const Tezgah = require('../models/Tezgah');
    const tezgahlar = await Tezgah.findAll({
      attributes: ['tezgah_id', 'tezgah_tanimi', 'is_emirleri']
    });
    
    // Aktif olarak atanmış mı kontrol et
    let aktifTezgahId = null;
    for (const tezgah of tezgahlar) {
      if (tezgah.is_emirleri && Array.isArray(tezgah.is_emirleri)) {
        const aktifIs = tezgah.is_emirleri.find(item => item.is_emri_id === parseInt(is_emri_id));
        if (aktifIs) {
          aktifTezgahId = tezgah.tezgah_id;
          break;
        }
      }
    }
    
    if (aktifTezgahId) {
      return res.status(400).json({ 
        error: 'Bu iş emri şu anda aktif olarak bir tezgaha atanmış durumda. Önce o tezgahtan alınmalı.' 
      });
    }
    
    // Bu iş emrini diğer tezgahların planlama listelerinden kaldır
    await TezgahPlanlananIsler.destroy({
      where: { 
        is_emri_id: is_emri_id,
        tezgah_id: {
          [require('sequelize').Op.ne]: tezgahId
        }
      }
    });
    
    console.log(`İş emri ${isEmri.is_emri_no} (ID: ${is_emri_id}), diğer tezgahların planlama listelerinden kaldırıldı`);
    
    // En son sıra numarasını bul
    const sonKayit = await TezgahPlanlananIsler.findOne({
      where: { tezgah_id: tezgahId },
      order: [['sira_no', 'DESC']]
    });
    
    const sonrakiSiraNo = sonKayit ? sonKayit.sira_no + 10 : 10;
    
    const yeniPlan = await TezgahPlanlananIsler.create({ 
      tezgah_id: tezgahId, 
      is_emri_id, 
      sira_no: sonrakiSiraNo 
    });
    
    console.log(`İş emri ${isEmri.is_emri_no} (ID: ${is_emri_id}) başarıyla tezgah ${tezgahId} planlama listesine eklendi`);
    
    res.status(201).json(yeniPlan);
  } catch (error) {
    console.error('Planlanan iş ekleme hatası:', error);
    res.status(500).json({ error: error.message });
  }
};

// Bir iş başlatıldığında, o işin diğer tezgahların planlama listesinden kaldırılması
exports.planlananIsleriSil = async (req, res) => {
  try {
    const { isEmriId } = req.params;
    console.log('planlananIsleriSil çağrıldı, isEmriId:', isEmriId);
    
    if (!isEmriId) {
      console.warn('isEmriId gereklidir ama gelmedi');
      return res.status(400).json({ error: 'isEmriId gereklidir' });
    }
    
    // Önce bu ID ile kaç kayıt var kontrol et
    const mevcutKayitlar = await TezgahPlanlananIsler.findAll({ 
      where: { is_emri_id: isEmriId } 
    });
    console.log(`is_emri_id ${isEmriId} için bulunan kayıt sayısı:`, mevcutKayitlar.length);
    
    if (mevcutKayitlar.length > 0) {
      console.log('Bulunan kayıtlar:', mevcutKayitlar.map(k => ({ 
        id: k.id, 
        tezgah_id: k.tezgah_id, 
        is_emri_id: k.is_emri_id, 
        sira_no: k.sira_no 
      })));
    }
    
    // Tüm tezgahlardan bu iş emrini kaldır
    const deleteResult = await TezgahPlanlananIsler.destroy({ 
      where: { is_emri_id: isEmriId } 
    });
    
    console.log(`${deleteResult} kayıt silindi`);
    res.json({ success: true, deletedCount: deleteResult });
  } catch (error) {
    console.error('planlananIsleriSil hatası:', error);
    res.status(500).json({ error: error.message });
  }
};

// Planlanan işlerin sırasını güncelle
exports.siralariGuncelle = async (req, res) => {
  try {
    const { tezgahId } = req.params;
    const { isEmriSiralari } = req.body; // [{ is_emri_id: 1, yeni_sira: 10 }, { is_emri_id: 2, yeni_sira: 20 }] şeklinde
    
    if (!tezgahId || !isEmriSiralari || !Array.isArray(isEmriSiralari) || isEmriSiralari.length === 0) {
      return res.status(400).json({ error: 'Tezgah ID ve iş emirleri sıra bilgileri gereklidir' });
    }
    
    // Yardımcı fonksiyonu kullanarak daha güvenli transaction yönetimi
    const result = await safeTransaction(async (t) => {
      // Update işlemlerinin hata durumunda izlenmesi için
      let updatedItems = 0;
      
      console.log(`${isEmriSiralari.length} iş emrinin sıra güncellemesi başlatılıyor...`);
      
      for (const item of isEmriSiralari) {
        const { is_emri_id, yeni_sira } = item;
        
        if (!is_emri_id || typeof yeni_sira !== 'number') {
          console.warn(`Geçersiz güncelleme bilgisi: is_emri_id=${is_emri_id}, yeni_sira=${yeni_sira}`);
          continue;
        }
        
        // İşlem günlüğü
        console.log(`İş emri ID: ${is_emri_id} için yeni sıra: ${yeni_sira} kaydediliyor...`);
        
        const [updateCount] = await TezgahPlanlananIsler.update(
          { sira_no: yeni_sira },
          { 
            where: { 
              tezgah_id: tezgahId,
              is_emri_id: is_emri_id 
            },
            transaction: t
          }
        );

        // İşlem sonucunu logla
        console.log(`İş emri ID: ${is_emri_id} için güncelleme sonucu: ${updateCount} kayıt etkilendi`);
        updatedItems += updateCount;
      }
      
      console.log(`Toplam ${updatedItems} kayıt başarıyla güncellendi`);
      
      return { updatedItems };
    });
    
    res.json({ 
      success: true, 
      message: 'İş emirleri sırası güncellendi', 
      updatedCount: result.updatedItems 
    });
  } catch (error) {
    console.error('İş emirleri sırası güncelleme hatası:', error);
    res.status(500).json({ error: error.message });
  }
};
