const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const TezgahDurumLog = require('../models/TezgahDurumLog');
const Tezgah = require('../models/Tezgah');
const IsEmri = require('../models/IsEmri');
const { sequelize } = require('../config/database');

// ESP32 için optimize edilmiş hızlı endpoint
router.post('/tezgah-durum', async (req, res) => {
  const { tezgah_id, durum } = req.body;
  
  // Hızlı validasyon kontrolü
  if (!tezgah_id || durum === undefined) {
    return res.status(400).json({ error: 'tezgah_id ve durum alanları zorunludur' });
  }

  try {
    // HIZLI KAYIT: Minimal transaction ile sadece log kaydı
    // Güvenli timestamp: 2000 yılından küçük gelen değerleri yok sayıp server saatini kullan
    let gelenTimestamp = req.body.timestamp ? new Date(req.body.timestamp) : null;
    const guvenliTimestamp = (gelenTimestamp && gelenTimestamp.getFullYear() >= 2000)
      ? gelenTimestamp
      : new Date();

    const yeniDurum = await TezgahDurumLog.create({
      tezgah_id,
      is_emri_id: null, // Aktif iş yoksa NULL olmalı (FK ihlalini önlemek için)
      durum,
      timestamp: guvenliTimestamp
    });

    // Hızlı yanıt dön - ESP32 için timeout'u önlemek için
    res.status(201).json({
      message: 'Tezgah durum kaydı başarıyla eklendi',
      durum: yeniDurum,
      tezgah_id: tezgah_id,
      kayit_id: yeniDurum.id,
      durum_metni: durum ? 'Çalışıyor' : 'Durdu',
      onceki_durum: 'Durdu', // Basit yanıt
      durum_degisti: true
    });

    // BACKGROUND PROCESSING: Ağır işlemleri asenkron olarak yap
    setImmediate(async () => {
      try {
        // Tezgah bilgilerini al (cache'den veya DB'den)
        const tezgah = await Tezgah.findByPk(tezgah_id);
        if (!tezgah) return;

        // Aktif iş emri var mı kontrol et
        let is_emri_id = 0;
        if (tezgah.is_emirleri && tezgah.is_emirleri.length > 0) {
          is_emri_id = tezgah.is_emirleri[0].is_emri_id;
          
          // İş emri ID'sini güncelle
          await yeniDurum.update({ is_emri_id });
        }

        // Önceki durum kontrolü (background'da)
        const sonDurum = await TezgahDurumLog.findOne({
          where: { 
            tezgah_id,
            id: { [Op.lt]: yeniDurum.id } // Bu kayıttan önceki son kayıt
          },
          order: [['timestamp', 'DESC']],
          limit: 1
        });

        // Parça sayısı güncelleme (sadece çalışıyor->durdu geçişinde)
        if (sonDurum && sonDurum.durum === true && durum === false && is_emri_id) {
          const isEmri = await IsEmri.findByPk(is_emri_id);
          if (isEmri) {
            const yeniAdet = (isEmri.gerceklesen_adet || 0) + 1;
            
            // İş emri güncelleme
            await isEmri.update({ 
              gerceklesen_adet: yeniAdet,
              hareketler: [
                ...(isEmri.hareketler || []),
                `${new Date().toLocaleString('tr-TR')} - Üretilen parça sayısı: ${yeniAdet}`
              ]
            });
            
            // Tezgah iş emri listesi güncelleme
            if (tezgah.is_emirleri && tezgah.is_emirleri.length > 0) {
              let guncelIsEmirleri = [...tezgah.is_emirleri];
              guncelIsEmirleri[0] = {
                ...guncelIsEmirleri[0],
                tamamlanan_adet: yeniAdet
              };
              
              await tezgah.update({ is_emirleri: guncelIsEmirleri });
            }
          }
        }
      } catch (backgroundError) {
        console.error('Background processing hatası:', backgroundError);
        // Background hata olsa bile ESP32'ye yanıt zaten gönderildi
      }
    });

  } catch (error) {
    console.error('Tezgah durum kaydı hatası:', error);
    res.status(500).json({ 
      error: 'Durum kaydı oluşturulamadı', 
      details: error.message 
    });
  }
});

// Tezgah durumlarını getiren endpoint
router.get('/tezgah-durum/:tezgahId', async (req, res) => {
  try {
    const { tezgahId } = req.params;
    const { limit = 100 } = req.query; // Query parametresi eklendi
    
    const durumlar = await TezgahDurumLog.findAll({
      where: { tezgah_id: tezgahId },
      order: [['timestamp', 'DESC']],
      limit: parseInt(limit) || 100
    });
    
    // Timestamp'leri doğru formatta frontend'e gönder
    const formatliDurumlar = durumlar.map(durum => ({
      ...durum.toJSON(),
      timestamp: durum.timestamp.toISOString() // UTC formatında gönder
    }));
    
    res.json(formatliDurumlar);
  } catch (error) {
    console.error('Tezgah durum geçmişi getirme hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

// Tezgah üretim analizini getiren endpoint
router.get('/tezgah-analiz/:tezgahId', async (req, res) => {
  try {
    const { tezgahId } = req.params;
    const { baslangic, bitis } = req.query;
    
    // Zaman filtresini oluştur
    const where = { tezgah_id: tezgahId };
    if (baslangic && bitis) {
      where.timestamp = {
        [Op.between]: [new Date(baslangic), new Date(bitis)]
      };
    }
    
    // Durum kayıtlarını çek
    const durumlar = await TezgahDurumLog.findAll({
      where,
      order: [['timestamp', 'ASC']]
    });
    
    // Analiz için veriler
    let calisma = 0;
    let durma = 0;
    let calismaSureleri = [];
    let durmaSureleri = [];
    let oncekiDurum = null;
    let oncekiZaman = null;
    
    // Durum geçişlerini analiz et
    durumlar.forEach(durum => {
      if (oncekiDurum !== null && oncekiZaman) {
        const sure = (new Date(durum.timestamp) - new Date(oncekiZaman)) / 1000 / 60; // Dakika cinsinden
        
        if (oncekiDurum) {
          calisma += sure;
          calismaSureleri.push({ baslangic: oncekiZaman, bitis: durum.timestamp, sure });
        } else {
          durma += sure;
          durmaSureleri.push({ baslangic: oncekiZaman, bitis: durum.timestamp, sure });
        }
      }
      
      oncekiDurum = durum.durum;
      oncekiZaman = durum.timestamp;
    });
    
    res.json({
      tezgah_id: tezgahId,
      toplam_calisma_dk: calisma,
      toplam_durma_dk: durma,
      calisma_orani: calisma > 0 ? (calisma / (calisma + durma)) * 100 : 0,
      calisma_sureleri: calismaSureleri,
      durma_sureleri: durmaSureleri,
      veri_sayisi: durumlar.length
    });
  } catch (error) {
    console.error('Tezgah analiz hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

// İş emri bazlı çalışma süresi hesaplama endpoint'i
router.get('/calisma-suresi/:tezgahId/:isEmriId', async (req, res) => {
  try {
    const { tezgahId, isEmriId } = req.params;
    
    // Tezgah ve iş emri için durum kayıtlarını çek
    const durumlar = await TezgahDurumLog.findAll({
      where: { 
        tezgah_id: tezgahId,
        is_emri_id: isEmriId 
      },
      order: [['timestamp', 'ASC']]
    });
    
    if (durumlar.length === 0) {
      return res.json({
        toplam_calisma_dakika: 0,
        toplam_calisma_saat: '0 saat 0 dakika',
        kayit_sayisi: 0
      });
    }
    
    let toplamCalismaDakika = 0;
    let oncekiDurum = null;
    let oncekiZaman = null;
    
    durumlar.forEach(durum => {
      if (oncekiDurum !== null && oncekiZaman) {
        // Eğer önceki durum 'çalışıyor' idi, bu süreyi hesapla
        if (oncekiDurum === true) {
          const sure = (new Date(durum.timestamp) - new Date(oncekiZaman)) / 1000 / 60; // Dakika
          if (sure > 0) {
            toplamCalismaDakika += sure;
          }
        }
      }
      
      oncekiDurum = durum.durum;
      oncekiZaman = durum.timestamp;
    });
    
    // Eğer son durum çalışıyor ise, şu anki zamana kadar olan süreyi ekle
    const sonDurum = durumlar[durumlar.length - 1];
    if (sonDurum && sonDurum.durum === true) {
      const simdikiSure = (new Date() - new Date(sonDurum.timestamp)) / 1000 / 60; // Dakika
      if (simdikiSure > 0) {
        toplamCalismaDakika += simdikiSure;
      }
    }
    
    // Saat ve dakika formatına çevir
    const saat = Math.floor(toplamCalismaDakika / 60);
    const dakika = Math.round(toplamCalismaDakika % 60);
    const formatliSure = saat > 0 ? `${saat} saat ${dakika} dakika` : `${dakika} dakika`;
    
    res.json({
      toplam_calisma_dakika: Math.round(toplamCalismaDakika),
      toplam_calisma_saat: formatliSure,
      kayit_sayisi: durumlar.length
    });
  } catch (error) {
    console.error('Çalışma süresi hesaplama hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
