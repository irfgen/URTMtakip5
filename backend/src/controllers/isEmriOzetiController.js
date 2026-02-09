const IsEmriOzet = require('../models/IsEmriOzet');
const IsEmri = require('../models/IsEmri');
const Parca = require('../models/Parca'); // Parca modelini içe aktarıyoruz
const { Op } = require('sequelize');

// İş emri özeti oluştur veya güncelle
exports.createOrUpdateIsEmriOzet = async (req, res) => {
  try {
    console.log('[İş Emri Özet] Gelen veri:', JSON.stringify(req.body, null, 2));
    
    const {
      is_emri_id,
      is_adi,
      baslangic_tarihi,
      bitis_tarihi,
      toplam_calisma_suresi,
      toplam_durus_suresi,
      ara_verme_sayisi,
      toplam_uretilen,
      hurda_sayisi,
      ortalama_parca_suresi,
      verimlilik,
      operator_notu,
      durus_detaylari,
      onaylayan_kullanici,
      setup_sayisi,
      cnc_suresi
    } = req.body;

    console.log('[İş Emri Özet] Parametreler:', { is_emri_id });

    // İş emri ID'nin mevcut olması gerekir
    if (!is_emri_id) {
      console.log('[İş Emri Özet] HATA: İş emri ID yok');
      return res.status(400).json({ error: 'İş emri ID gereklidir' });
    }

    // İş emrini kontrol et
    console.log('[İş Emri Özet] İş emri aranıyor...');
    console.log('[İş Emri Özet] İş emri ID ile aranıyor:', is_emri_id);
    const isEmri = await IsEmri.findByPk(is_emri_id);
    
    if (!isEmri) {
      console.log('[İş Emri Özet] HATA: İş emri bulunamadı');
      return res.status(404).json({ error: 'İş emri bulunamadı' });
    }
    
    console.log('[İş Emri Özet] İş emri bulundu:', { 
      is_emri_id: isEmri.is_emri_id, 
      is_emri_no: isEmri.is_emri_no 
    });

    // durus_detaylari alanının geçerli bir JSON olduğundan emin ol
    let parsedDurusDetaylari = [];
    if (durus_detaylari) {
      try {
        if (typeof durus_detaylari === 'string') {
          parsedDurusDetaylari = JSON.parse(durus_detaylari);
        } else {
          parsedDurusDetaylari = Array.isArray(durus_detaylari) ? durus_detaylari : [];
        }
      } catch (err) {
        console.warn('Geçersiz durus_detaylari formatı, boş array kullanılıyor:', err);
        parsedDurusDetaylari = [];
      }
    }

    // Mevcut özeti kontrol et - is_emri_id ile arama yaparak
    console.log('[İş Emri Özet] Mevcut özet aranıyor, is_emri_id:', isEmri.is_emri_id);
    let ozet = await IsEmriOzet.findOne({
      where: { is_emri_id: isEmri.is_emri_id }
    });

    console.log('[İş Emri Özet] Mevcut özet:', ozet ? 'Bulundu' : 'Bulunamadı');

    const oncekiUretilenAdet = ozet ? ozet.toplam_uretilen || 0 : 0;
    const parcaKodu = isEmri.parca_kodu || is_adi;
    
    if (ozet) {
      console.log('[İş Emri Özet] Özet güncelleniyor...');
      await ozet.update({
        is_adi: is_adi || ozet.is_adi,
        baslangic_tarihi: baslangic_tarihi || ozet.baslangic_tarihi,
        bitis_tarihi: bitis_tarihi || ozet.bitis_tarihi,
        toplam_calisma_suresi: toplam_calisma_suresi !== undefined ? toplam_calisma_suresi : ozet.toplam_calisma_suresi,
        toplam_durus_suresi: toplam_durus_suresi !== undefined ? toplam_durus_suresi : ozet.toplam_durus_suresi,
        ara_verme_sayisi: ara_verme_sayisi !== undefined ? ara_verme_sayisi : ozet.ara_verme_sayisi,
        toplam_uretilen: toplam_uretilen !== undefined ? toplam_uretilen : ozet.toplam_uretilen,
        hurda_sayisi: hurda_sayisi !== undefined ? hurda_sayisi : ozet.hurda_sayisi,
        ortalama_parca_suresi: ortalama_parca_suresi !== undefined ? ortalama_parca_suresi : ozet.ortalama_parca_suresi,
        verimlilik: verimlilik !== undefined ? verimlilik : ozet.verimlilik,
        operator_notu: operator_notu || ozet.operator_notu,
        durus_detaylari: parsedDurusDetaylari,
        onaylayan_kullanici: onaylayan_kullanici || ozet.onaylayan_kullanici,
        onay_tarihi: onaylayan_kullanici ? new Date() : ozet.onay_tarihi,
        setup_sayisi: setup_sayisi !== undefined ? setup_sayisi : ozet.setup_sayisi,
        cnc_suresi: cnc_suresi !== undefined ? cnc_suresi : ozet.cnc_suresi
      });
      console.log('[İş Emri Özet] Özet başarıyla güncellendi');
    } else {
      console.log('[İş Emri Özet] Yeni özet oluşturuluyor...');
      ozet = await IsEmriOzet.create({
        is_emri_id: isEmri.is_emri_id,
        is_adi: is_adi || isEmri.is_adi || '',
        baslangic_tarihi: baslangic_tarihi || new Date(),
        bitis_tarihi: bitis_tarihi || new Date(),
        toplam_calisma_suresi: toplam_calisma_suresi || 0,
        toplam_durus_suresi: toplam_durus_suresi || 0,
        ara_verme_sayisi: ara_verme_sayisi || 0,
        toplam_uretilen: toplam_uretilen || 0,
        hurda_sayisi: hurda_sayisi || 0,
        ortalama_parca_suresi: ortalama_parca_suresi || 0,
        verimlilik: verimlilik || 0,
        operator_notu: operator_notu || '',
        durus_detaylari: parsedDurusDetaylari,
        onaylayan_kullanici: onaylayan_kullanici || null,
        onay_tarihi: onaylayan_kullanici ? new Date() : null,
        setup_sayisi: setup_sayisi || 0,
        cnc_suresi: cnc_suresi || 0
      });
    }

    // Parça stoğunu güncelle ve setup_sayisi, cnc_suresi değerlerini güncelle
    if (parcaKodu) {
      try {
        console.log(`[Parça Aranıyor] Parça kodu: ${parcaKodu}`);
        const parca = await Parca.findByPk(parcaKodu);
        
        if (parca) {
          console.log(`[Parça Bulundu] ${parcaKodu} - Mevcut Setup: ${parca.setupSayisi}, CNC: ${parca.cncIslemeSuresi}, Stok: ${parca.stokAdeti}`);
          
          // Güncellenecek toplam üretilen adet ile önceki adet arasındaki farkı hesapla
          const artisAdeti = (toplam_uretilen || 0) - oncekiUretilenAdet;
          console.log(`[Stok Hesaplama] Toplam üretilen: ${toplam_uretilen}, Önceki: ${oncekiUretilenAdet}, Artış: ${artisAdeti}`);
          
          // Parça güncellemesi için değişiklikleri objede topla
          const updateData = {};
          
          // stokAdeti alanının varlığını kontrol et
          if (parca.stokAdeti !== undefined) {
            // Stok adeti güncellemesi
            if (artisAdeti > 0) {
              updateData.stokAdeti = Math.max(0, parca.stokAdeti + artisAdeti);
            }
          } else {
            console.warn(`[Parça Güncelleme] stokAdeti alanı bulunamadı, artış yapılmayacak`);
          }
          
          // Setup sayısı güncellemesi (0 değilse)
          if (setup_sayisi !== undefined && setup_sayisi > 0) {
            console.log(`[Setup Güncelleme] Gelen setup_sayisi: ${setup_sayisi}`);
            // setupSayisi veya setup_sayisi alanını kontrol et
            if (parca.setupSayisi !== undefined) {
              updateData.setupSayisi = setup_sayisi;
              console.log(`[Setup Güncelleme] setupSayisi alanı kullanılacak: ${setup_sayisi}`);
            } else if (parca.setup_sayisi !== undefined) {
              updateData.setup_sayisi = setup_sayisi;
              console.log(`[Setup Güncelleme] setup_sayisi alanı kullanılacak: ${setup_sayisi}`);
            } else {
              console.warn(`[Parça Güncelleme] setupSayisi/setup_sayisi alanı bulunamadı`);
            }
          }
          
          // CNC işleme süresi güncellemesi (0 değilse)
          if (cnc_suresi !== undefined && cnc_suresi > 0) {
            console.log(`[CNC Güncelleme] Gelen cnc_suresi: ${cnc_suresi}`);
            // cncIslemeSuresi veya cnc_isleme_suresi alanını kontrol et
            if (parca.cncIslemeSuresi !== undefined) {
              updateData.cncIslemeSuresi = cnc_suresi;
              console.log(`[CNC Güncelleme] cncIslemeSuresi alanı kullanılacak: ${cnc_suresi}`);
            } else if (parca.cnc_isleme_suresi !== undefined) {
              updateData.cnc_isleme_suresi = cnc_suresi;
              console.log(`[CNC Güncelleme] cnc_isleme_suresi alanı kullanılacak: ${cnc_suresi}`);
            } else {
              console.warn(`[Parça Güncelleme] cncIslemeSuresi/cnc_isleme_suresi alanı bulunamadı`);
            }
          }
          
          // Eğer güncellenecek değer varsa update işlemini yap
          if (Object.keys(updateData).length > 0) {
            console.log(`[Parça Güncelleme] Güncellenecek alanlar: ${Object.keys(updateData).join(', ')}`);
            try {
              await parca.update(updateData);
              console.log(`[Parça Güncelleme] Başarılı - Parça: ${parcaKodu}`);
              
              if (updateData.stokAdeti !== undefined) {
                console.log(`[Stok] Önceki: ${parca.stokAdeti - artisAdeti}, Yeni: ${updateData.stokAdeti}, Eklenen: ${artisAdeti}`);
              }
              if (updateData.setupSayisi || updateData.setup_sayisi) {
                console.log(`[Setup Sayısı] Yeni: ${updateData.setupSayisi || updateData.setup_sayisi}`);
              }
              if (updateData.cncIslemeSuresi || updateData.cnc_isleme_suresi) {
                console.log(`[CNC Süresi] Yeni: ${updateData.cncIslemeSuresi || updateData.cnc_isleme_suresi}`);
              }
            } catch (updateError) {
              console.error('[Parça Güncelleme] Güncelleme sırasında hata:', updateError);
              // Güncelleme hatası olsa da ana işleme devam et
            }
          } else {
            console.log(`[Parça Güncelleme] Güncellenecek alan bulunamadı`);
          }
        } else {
          console.warn(`[Parça Güncelleme] Belirtilen parça kodu bulunamadı: ${parcaKodu}`);
        }
      } catch (error) {
        console.error('[Parça Güncelleme] Parça işlemi sırasında hata:', error.message);
        console.error(error.stack);
        // Parça güncellemesi hata verse bile ana işleme devam et
      }
    } else {
      console.warn('[Parça Güncelleme] Parça kodu bulunamadı. İş emri ID:', isEmri.is_emri_id);
    }

    res.status(200).json(ozet);
  } catch (error) {
    console.error('İş emri özeti kaydedilirken hata:', error);
    console.error('İsteğin gövdesi:', JSON.stringify(req.body, null, 2));
    console.error('Hata detayları:', error.stack);
    res.status(500).json({ 
      error: 'İş emri özeti kaydedilirken bir hata oluştu',
      details: error.message 
    });
  }
};

// İş emri özetini getir
exports.getIsEmriOzet = async (req, res) => {
  try {
    const { is_emri_id } = req.params;
    
    // Önce iş emrini bul
    const isEmri = await IsEmri.findByPk(is_emri_id);
    if (!isEmri) {
      return res.status(404).json({ error: 'İş emri bulunamadı' });
    }

    const ozet = await IsEmriOzet.findOne({
      where: { is_emri_id: isEmri.is_emri_id },
      include: [
        {
          model: IsEmri,
          as: 'is_emri',
          attributes: ['is_emri_no', 'is_adi']
        }
      ]
    });

    if (!ozet) {
      return res.status(404).json({ error: 'İş emri özeti bulunamadı' });
    }

    res.json(ozet);
  } catch (error) {
    console.error('İş emri özeti getirilirken hata:', error);
    res.status(500).json({ error: error.message });
  }
};

// İş emri özetini onayla
exports.approveIsEmriOzet = async (req, res) => {
  try {
    const { is_emri_id } = req.params;
    const { onaylayan_kullanici } = req.body;

    if (!onaylayan_kullanici) {
      return res.status(400).json({ error: 'Onaylayan kullanıcı bilgisi gereklidir' });
    }

    // Önce iş emrini bul
    const isEmri = await IsEmri.findByPk(is_emri_id);
    if (!isEmri) {
      return res.status(404).json({ error: 'İş emri bulunamadı' });
    }

    const ozet = await IsEmriOzet.findOne({
      where: { is_emri_id: isEmri.is_emri_id }
    });

    if (!ozet) {
      return res.status(404).json({ error: 'İş emri özeti bulunamadı' });
    }

    await ozet.update({ 
      onaylayan_kullanici, 
      onay_tarihi: new Date() 
    });

    res.json(ozet);
  } catch (error) {
    console.error('İş emri özeti onaylanırken hata:', error);
    res.status(500).json({ error: error.message });
  }
};

// Tüm iş emri özetlerini getir
exports.getAllIsEmriOzetleri = async (req, res) => {
  try {
    const { onaylayan_kullanici, is_emri_id } = req.query;
    
    const where = {};
    
    if (onaylayan_kullanici !== undefined) {
      if (onaylayan_kullanici === 'true') {
        where.onaylayan_kullanici = { [Op.not]: null };
      } else {
        where.onaylayan_kullanici = null;
      }
    }
    
    if (is_emri_id) {
      where.is_emri_id = is_emri_id;
    }

    const ozetler = await IsEmriOzet.findAll({
      where,
      include: [
        {
          model: IsEmri,
          as: 'is_emri',
          attributes: ['is_emri_no', 'is_adi']
        }
      ],
      order: [['ozet_id', 'DESC']]
    });

    res.json(ozetler);
  } catch (error) {
    console.error('İş emri özetleri listelenirken hata:', error);
    res.status(500).json({ error: error.message });
  }
};
