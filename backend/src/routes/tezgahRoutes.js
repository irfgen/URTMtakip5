
const express = require('express');
const router = express.Router();
const Tezgah = require('../models/Tezgah');
const IsEmri = require('../models/IsEmri');
const IslemKaydi = require('../models/IslemKaydi');
const TamamlananIs = require('../models/TamamlananIs');
const { createIslemKaydi } = require('../controllers/islemKaydiController');
const { createTamamlananIs } = require('../controllers/tamamlananIsController');
const { planlananIsleriSil } = require('../controllers/tezgahPlanController');
const tezgahController = require('../controllers/tezgahController');
const { Op } = require('sequelize');

// Tek tezgahı ve iş emirlerini getir
router.get('/:id', async (req, res) => {
  try {
    const tezgah = await Tezgah.findByPk(req.params.id);
    if (!tezgah) {
      return res.status(404).json({ error: 'Tezgah bulunamadı' });
    }
    // İş emirleri JSON alanı varsa, detaylarını da ekle
    let is_emirleri = tezgah.is_emirleri || [];
    if (is_emirleri.length > 0) {
      // Her iş emri için detayları çek
      const isEmriIds = is_emirleri.map(is => is.is_emri_id);
      const isEmriDetaylar = await IsEmri.findAll({ where: { is_emri_id: { [Op.in]: isEmriIds } } });
      // id -> detay eşlemesi
      const isEmriDetayMap = {};
      isEmriDetaylar.forEach(is => { isEmriDetayMap[is.is_emri_id] = is; });
      // Her iş emrini detayla birleştir
      is_emirleri = is_emirleri.map(is => ({ ...is, ...((isEmriDetayMap[is.is_emri_id]||{}).dataValues || {}) }));
    }
    const tezgahJson = tezgah.toJSON();
    tezgahJson.is_emirleri = is_emirleri;
    res.json(tezgahJson);
  } catch (error) {
    console.error('Tezgah detay getirme hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

// Tüm tezgahları getir
router.get('/', async (req, res) => {
  try {
    const tezgahlar = await Tezgah.findAll({
      order: [['tezgah_tanimi', 'ASC']]
    });
    if (process.env.API_VERBOSE_LOG === 'true') {
      console.log('Tezgahlar yüklendi:', tezgahlar.length);
    }
    res.json(tezgahlar);
  } catch (error) {
    console.error('Tezgah listesi getirme hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

// Yeni tezgah ekle
router.post('/', async (req, res) => {
  try {
    console.log('Yeni tezgah ekleniyor:', req.body);
    const yeniTezgah = await Tezgah.create(req.body);
    console.log('Yeni tezgah eklendi:', yeniTezgah.tezgah_tanimi);
    res.status(201).json(yeniTezgah);
  } catch (error) {
    console.error('Tezgah ekleme hatası:', error);
    res.status(400).json({ error: error.message });
  }
});

// Tezgah sil - enhanced controller kullanarak
router.delete('/:id', tezgahController.deleteTezgah);

// Tezgah pozisyonlarını toplu güncelle
router.post('/pozisyonlar', async (req, res) => {
  try {
    const pozisyonlar = req.body;
    console.log('Tezgah pozisyonları güncelleniyor:', pozisyonlar);

    // Her tezgah için pozisyon güncelleme
    for (const pozisyon of pozisyonlar) {
      await Tezgah.update(
        {
          pozisyon_x: pozisyon.x,
          pozisyon_y: pozisyon.y
        },
        {
          where: { tezgah_id: pozisyon.tezgah_id }
        }
      );
    }

    res.json({ message: 'Tezgah pozisyonları güncellendi' });
  } catch (error) {
    console.error('Tezgah pozisyonları güncelleme hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

// Tezgah durumunu güncelle
router.put('/:id', async (req, res) => {
  try {
    const tezgah = await Tezgah.findByPk(req.params.id);
    if (!tezgah) {
      console.log('Tezgah bulunamadı:', req.params.id);
      return res.status(404).json({ error: 'Tezgah bulunamadı' });
    }
    console.log('Tezgah güncelleniyor:', tezgah.tezgah_tanimi);
    await tezgah.update(req.body);
    console.log('Tezgah güncellendi');
    res.json(tezgah);
  } catch (error) {
    console.error('Tezgah güncelleme hatası:', error);
    res.status(400).json({ error: error.message });
  }
});

// Tezgaha iş emri ata
router.post('/:id/is-emri-ata', async (req, res) => {
  try {
    const { id } = req.params;
    const { is_emri_id } = req.body;

    if (!is_emri_id) {
      return res.status(400).json({ error: 'İş emri ID gereklidir' });
    }

    const tezgah = await Tezgah.findByPk(id);
    if (!tezgah) {
      return res.status(404).json({ error: 'Tezgah bulunamadı' });
    }

    const isEmri = await IsEmri.findByPk(is_emri_id);
    if (!isEmri) {
      return res.status(404).json({ error: 'İş emri bulunamadı' });
    }

    // İş emrinin mevcut durumunu kontrol et
    let isZatenBaskaYerde = null;
    
    // Tüm tezgahları kontrol et ve bu iş emrine sahip olanı bul
    const tumTezgahlar = await Tezgah.findAll();
    for (const t of tumTezgahlar) {
      if (t.is_emirleri && t.is_emirleri.some(is => is.is_emri_id === parseInt(is_emri_id)) && t.tezgah_id !== parseInt(id)) {
        isZatenBaskaYerde = t;
        break;
      }
    }

    // Eğer iş başka bir tezgaha atanmışsa, o tezgahtan kaldır
    if (isZatenBaskaYerde && isZatenBaskaYerde.tezgah_id !== parseInt(id)) {
      console.log(`İş emri #${is_emri_id} başka bir tezgahta (${isZatenBaskaYerde.tezgah_id}) bulunuyor, kaldırılıyor.`);
      
      // O tezgahın iş listesinden çıkar
      const digerTezgahIsEmirleri = isZatenBaskaYerde.is_emirleri.filter(
        item => item.is_emri_id !== parseInt(is_emri_id)
      );
      
      // Tezgahın durumunu güncelle
      const yeniDurum = digerTezgahIsEmirleri.length > 0 ? 'calisiyor' : 'musait';
      
      await isZatenBaskaYerde.update({
        is_emirleri: digerTezgahIsEmirleri,
        calisma_durumu: yeniDurum
      });
    }

    // İşlem tipi belirleme - eğer bu iş daha önce ara verilmiş ve aynı tezgaha tekrar atanıyorsa "devam" olsun
    let islemTipi = 'baslatma';
    if (isEmri.tezgah_bilgisi && isEmri.tezgah_bilgisi.son_tezgah_id === parseInt(id)) {
      islemTipi = 'devam';
    }

    // İşlem kaydı oluştur
    const islemKaydiData = {
      is_emri_no: isEmri.is_emri_no,
      tezgah_id: tezgah.tezgah_id,
      islem_tipi: islemTipi,
      islenen_adet: null,
      aciklama: islemTipi === 'devam' 
        ? `${tezgah.tezgah_tanimi} tezgahında işe devam edildi` 
        : `${tezgah.tezgah_tanimi} tezgahında iş başlatıldı`
    };
    
    try {
      await IslemKaydi.create(islemKaydiData);
    } catch (error) {
      console.error('İşlem kaydı oluşturma hatası:', error);
    }

    // Aynı tezgaha daha önce atanmış (tamamlanmamış) diğer işlerin tezgah_id bilgisini boşalt
    try {
      await IsEmri.update(
        { tezgah_id: null },
        {
          where: {
            tezgah_id: parseInt(id),
            is_emri_id: { [Op.ne]: parseInt(is_emri_id) },
            durum: { [Op.notIn]: ['tamamlandı', 'iptal'] }
          }
        }
      );
    } catch (clearErr) {
      console.warn('Önceki işlerin tezgah_id temizleme uyarısı:', clearErr.message);
    }

    // İş emrinin durumunu güncelle - tezgah tipine göre uygun durum atanması
    // Tezgah adına göre durum belirleme logic'i
    // İş emri tezgaha atandığında durumu 'tezgahta' olarak ayarla
    let yeniDurum = 'tezgahta'; // Tüm tezgahlar için unified status
    
    console.log(`İş emri durumu güncelleniyor: ${isEmri.durum} -> ${yeniDurum}`);
    
    await isEmri.update({
      durum: yeniDurum,
      tezgah_id: tezgah.tezgah_id,
      tezgah_bilgisi: {
        tezgah_id: tezgah.tezgah_id,
        tezgah_adi: tezgah.tezgah_tanimi,
        atama_tarihi: new Date()
      },
      hareketler: [
        ...(isEmri.hareketler || []),
        `${new Date().toLocaleString('tr-TR')} - ${tezgah.tezgah_tanimi} tezgahına atandı (${yeniDurum})`
      ]
    });

    // Tezgahın iş emirleri listesini güncelle
    let tezgahIsEmirleri = tezgah.is_emirleri || [];
    if (!tezgahIsEmirleri.some(item => item.is_emri_id === isEmri.is_emri_id)) {
      tezgahIsEmirleri = [...tezgahIsEmirleri, {
        is_emri_id: isEmri.is_emri_id,
        is_emri_no: isEmri.is_emri_no,
        is_adi: isEmri.is_adi,
        plan_liste_no: isEmri.plan_liste_no,
        parca_kodu: isEmri.parca_kodu,
        parca_adi: isEmri.parca_adi,
        toplam_adet: isEmri.adet,
        islenen_adet: 0,
        setup_sayisi: isEmri.setup_sayisi,
        cnc_suresi: isEmri.cnc_suresi,
        atama_tarihi: new Date()
      }];
    }

    await tezgah.update({
      is_emirleri: tezgahIsEmirleri,
      calisma_durumu: 'calisiyor'
    });

    // İş emri aktif atandığında tüm planlanan işler listelerinden kaldır
    try {
      const TezgahPlanlananIsler = require('../models').TezgahPlanlananIsler;
      const deleteResult = await TezgahPlanlananIsler.destroy({ 
        where: { is_emri_id: is_emri_id } 
      });
      console.log(`İş emri ${is_emri_id} planlanan işler listelerinden kaldırıldı. Silinen kayıt sayısı: ${deleteResult}`);
    } catch (planError) {
      console.error('Planlanan işlerden silme hatası:', planError);
      // Bu hata ana işlemi durdurmaz, sadece log olarak kalır
    }

    res.json({
      message: 'İş emri tezgaha başarıyla atandı',
      tezgah,
      isEmri
    });
  } catch (error) {
    console.error('İş emri atama hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

// Tezgahtan iş emrini tamamla
router.post('/:id/is-emri-tamamla', async (req, res) => {
  try {
    const { id } = req.params;
    const { is_emri_id, islenen_adet, notlar } = req.body;

    const tezgah = await Tezgah.findByPk(id);
    if (!tezgah) {
      return res.status(404).json({ error: 'Tezgah bulunamadı' });
    }

    // Aktif iş emrini bul
    const aktifIsEmri = tezgah.is_emirleri.find(item => item.is_emri_id === parseInt(is_emri_id));
    if (!aktifIsEmri) {
      return res.status(404).json({ error: 'Bu iş emri tezgaha atanmamış' });
    }

    const isEmri = await IsEmri.findByPk(is_emri_id);
    if (!isEmri) {
      return res.status(404).json({ error: 'İş emri bulunamadı' });
    }

    // İşlem kaydı oluştur
    const islemKaydiData = {
      is_emri_no: isEmri.is_emri_no,
      tezgah_id: tezgah.tezgah_id,
      islem_tipi: 'tamamlama',
      islenen_adet: islenen_adet,
      aciklama: `${tezgah.tezgah_tanimi} tezgahında iş tamamlandı${notlar ? ` - Not: ${notlar}` : ''}`
    };
    
    try {
      await IslemKaydi.create(islemKaydiData);
    } catch (error) {
      console.error('İşlem kaydı oluşturma hatası:', error);
    }

    // İş emrini güncelle - tamamlandı durumuna alınıyor
    console.log(`İş emri ${is_emri_id} durumu 'tamamlandı' olarak güncelleniyor...`);
    await isEmri.update({
      durum: 'tamamlandı',
      aciklama: notlar ? `${isEmri.aciklama || ''}\n${notlar}` : isEmri.aciklama,
      hareketler: [
        ...(isEmri.hareketler || []),
        `${new Date().toLocaleString('tr-TR')} - ${tezgah.tezgah_tanimi} tezgahında iş tamamlandı${islenen_adet ? ` (İşlenen: ${islenen_adet})` : ''}`
      ]
    });
    console.log(`İş emri ${is_emri_id} başarıyla 'tamamlandı' durumuna güncellendi.`);

    // Tamamlanan iş tablosuna kayıt ekle
    const tamamlananIs = await createTamamlananIs(
      tezgah.tezgah_id, 
      isEmri.is_emri_no,  // is_emri_id yerine is_emri_no gönderiyoruz
      islenen_adet, 
      notlar
    );
    
    if (!tamamlananIs) {
      console.warn('Tamamlanan iş kaydı oluşturulamadı');
    } else {
      console.log('Tamamlanan iş kaydı oluşturuldu:', tamamlananIs.id);
    }

    // Tezgahın iş emirleri listesinden bu işi çıkar
    let tezgahIsEmirleri = tezgah.is_emirleri.filter(
      item => item.is_emri_id !== parseInt(is_emri_id)
    );
    
    // Tezgahın durumunu güncelle
    const yeniDurum = tezgahIsEmirleri.length > 0 ? 'calisiyor' : 'musait';
    
    await tezgah.update({
      is_emirleri: tezgahIsEmirleri,
      calisma_durumu: yeniDurum
    });

    // İş emri özetini oluştur/güncelle (tamamlama sonrası)
    try {
      const isEmriOzetController = require('../controllers/isEmriOzetiController');
      // Mevcut controller fonksiyonu HTTP req/res bekliyor; burada direkt model tabanlı payload ile çağıracağız.
      // Controller'a benzer mantığı doğrudan kullanmak için minimal bir çağrı yapıyoruz.
      const ozetPayload = {
        is_emri_id: isEmri.is_emri_id,
        is_adi: isEmri.is_adi,
        bitis_tarihi: new Date(),
        toplam_uretilen: typeof islenen_adet === 'number' ? islenen_adet : undefined,
        setup_sayisi: isEmri.setup_sayisi,
        cnc_suresi: isEmri.cnc_suresi,
        operator_notu: notlar || undefined
      };
      // Controller fonksiyonunu doğrudan kullanmak yerine model üstünden create/update yapan yardımcı çağrı:
      const IsEmriOzet = require('../models/IsEmriOzet');
      let mevcutOzet = await IsEmriOzet.findOne({ where: { is_emri_id: isEmri.is_emri_id } });
      if (mevcutOzet) {
        await mevcutOzet.update({
          is_adi: ozetPayload.is_adi || mevcutOzet.is_adi,
          bitis_tarihi: ozetPayload.bitis_tarihi,
          toplam_uretilen: ozetPayload.toplam_uretilen !== undefined ? ozetPayload.toplam_uretilen : mevcutOzet.toplam_uretilen,
          setup_sayisi: ozetPayload.setup_sayisi !== undefined ? ozetPayload.setup_sayisi : mevcutOzet.setup_sayisi,
          cnc_suresi: ozetPayload.cnc_suresi !== undefined ? ozetPayload.cnc_suresi : mevcutOzet.cnc_suresi,
          operator_notu: ozetPayload.operator_notu !== undefined ? ozetPayload.operator_notu : mevcutOzet.operator_notu
        });
      } else {
        await IsEmriOzet.create({
          is_emri_id: isEmri.is_emri_id,
          is_adi: ozetPayload.is_adi || '',
          baslangic_tarihi: new Date(),
          bitis_tarihi: ozetPayload.bitis_tarihi,
          toplam_calisma_suresi: 0,
          toplam_durus_suresi: 0,
          ara_verme_sayisi: 0,
          toplam_uretilen: ozetPayload.toplam_uretilen || 0,
          hurda_sayisi: 0,
          ortalama_parca_suresi: 0,
          verimlilik: 0,
          operator_notu: ozetPayload.operator_notu || '',
          durus_detaylari: [],
          onaylayan_kullanici: null,
          onay_tarihi: null,
          setup_sayisi: ozetPayload.setup_sayisi || 0,
          cnc_suresi: ozetPayload.cnc_suresi || 0
        });
      }
    } catch (ozetError) {
      console.error('İş emri özeti güncelleme/oluşturma hatası:', ozetError);
    }

    res.json({
      message: 'İş emri başarıyla tamamlandı',
      tezgah,
      isEmri
    });
  } catch (error) {
    console.error('İş emri tamamlama hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

// Tezgahın iş emirleri geçmişini getir
router.get('/:id/is-emirleri-gecmisi', async (req, res) => {
  try {
    const { id } = req.params;
    
    const tezgah = await Tezgah.findByPk(id);
    if (!tezgah) {
      return res.status(404).json({ error: 'Tezgah bulunamadı' });
    }

    res.json({
      tezgah_id: tezgah.tezgah_id,
      tezgah_tanimi: tezgah.tezgah_tanimi,
      aktif_is_emirleri: tezgah.is_emirleri || [],
      gecmis_is_emirleri: tezgah.is_emirleri_gecmisi || []
    });
  } catch (error) {
    console.error('İş emirleri geçmişi getirme hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

// İşe ara ver
router.post('/:id/is-ara-ver', async (req, res) => {
  try {
    const { id } = req.params;
    const { aciklama } = req.body;
    const tezgah = await Tezgah.findByPk(id);
    
    if (!tezgah) {
      return res.status(404).json({ error: 'Tezgah bulunamadı' });
    }

    // Tezgahın aktif iş emri var mı kontrol et
    if (!tezgah.is_emirleri || tezgah.is_emirleri.length === 0) {
      return res.status(400).json({ error: 'Tezgahın aktif iş emri bulunmuyor' });
    }

    const aktifIsEmri = tezgah.is_emirleri[0];

    // İşlem kaydı oluştur
    const islemKaydiData = {
      is_emri_no: aktifIsEmri.is_emri_no,
      tezgah_id: tezgah.tezgah_id,
      islem_tipi: 'durdurma',
      islenen_adet: null,
      aciklama: aciklama || 'İşe ara verildi'
    };
    
    try {
      await IslemKaydi.create(islemKaydiData);
    } catch (error) {
      console.error('İşlem kaydı oluşturma hatası:', error);
    }

    // İş emrini güncelle
    const isEmri = await IsEmri.findByPk(aktifIsEmri.is_emri_id);
    if (isEmri) {
      await isEmri.update({
        durum: 'Beklemede',
        // Tezgah bilgisini koruyoruz ama durum bilgisini güncelliyoruz
        tezgah_bilgisi: {
          ...(isEmri.tezgah_bilgisi || {}),
          son_tezgah_id: tezgah.tezgah_id,
          son_tezgah_adi: tezgah.tezgah_tanimi,
          ara_verme_tarihi: new Date()
        },
        hareketler: [
          ...(isEmri.hareketler || []),
          `${new Date().toLocaleString('tr-TR')} - ${tezgah.tezgah_tanimi} tezgahında işe ara verildi`
        ]
      });
    }

    // Tezgah iş listesinden işi kaldır
    let tezgahIsEmirleri = tezgah.is_emirleri.filter(
      item => item.is_emri_id !== aktifIsEmri.is_emri_id
    );
    
    // Tezgahın durumunu güncelle - eğer hala başka işler varsa çalışıyor, yoksa müsait
    const yeniDurum = tezgahIsEmirleri.length > 0 ? 'calisiyor' : 'musait';
    
    await tezgah.update({
      calisma_durumu: yeniDurum,
      is_emirleri: tezgahIsEmirleri
    });

    res.json({
      message: 'İşe başarıyla ara verildi',
      tezgah,
      isEmri
    });
  } catch (error) {
    console.error('İşe ara verme hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

// Arıza/Bakım Sonlandır
router.post('/:id/ariza-bakim-sonlandir', async (req, res) => {
  try {
    const { id } = req.params;
    const { ariza_bakim_id, yapilan_islemler, maliyet } = req.body;

    const tezgah = await Tezgah.findByPk(id);
    if (!tezgah) {
      return res.status(404).json({ error: 'Tezgah bulunamadı' });
    }

    const ArizaBakim = require('../models/ArizaBakim');
    
    const arizaBakim = await ArizaBakim.findByPk(ariza_bakim_id);
    if (!arizaBakim) {
      return res.status(404).json({ error: 'Arıza/Bakım kaydı bulunamadı' });
    }

    if (arizaBakim.durum !== 'devam_ediyor') {
      return res.status(400).json({ error: 'Bu arıza/bakım kaydı zaten sonlandırılmış' });
    }

    // Arıza/Bakım kaydını güncelle
    await arizaBakim.update({
      durum: 'tamamlandi',
      bitis_tarihi: new Date(),
      yapilan_islemler: yapilan_islemler || arizaBakim.yapilan_islemler,
      maliyet: maliyet || arizaBakim.maliyet
    });

    // Arıza/bakım kayıtları için özel bir iş emri no formatı oluştur
    // Tezgah ID ve arıza bakım ID kullanarak benzersiz bir değer oluştur
    const specialIsEmriNo = `BAKIM-${tezgah.tezgah_id}-${arizaBakim.id}`;

    // İşlem kaydı oluştur
    const islemKaydiData = {
      is_emri_no: specialIsEmriNo,  // Özel iş emri numarası kullan
      tezgah_id: tezgah.tezgah_id,
      islem_tipi: arizaBakim.kayit_tipi === 'ariza' ? 'ariza_giderildi' : 'bakim_tamamlandi',
      islenen_adet: null,
      aciklama: `${tezgah.tezgah_tanimi} tezgahında ${arizaBakim.kayit_tipi} kaydı sonlandırıldı${yapilan_islemler ? ` - İşlemler: ${yapilan_islemler}` : ''}`
    };
    
    try {
      await IslemKaydi.create(islemKaydiData);
    } catch (error) {
      console.error('İşlem kaydı oluşturma hatası:', error);
    }

    // Eğer tezgahın iş emirleri varsa çalışıyor, yoksa boşta olarak güncelle
    const yeniDurum = tezgah.is_emirleri && tezgah.is_emirleri.length > 0 ? 'calisiyor' : 'musait';
    
    await tezgah.update({
      calisma_durumu: yeniDurum
    });

    res.json({
      message: 'Arıza/Bakım kaydı başarıyla sonlandırıldı',
      tezgah,
      arizaBakim
    });
  } catch (error) {
    console.error('Arıza/Bakım sonlandırma hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;