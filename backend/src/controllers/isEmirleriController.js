// İş emirleri sırasını güncelle (öncelik için)
exports.updateIsEmriOrder = async (req, res) => {
  // Beklemede, Siparis, Iptal gibi bir kolon ve yeni sıralı id listesi beklenir
  const { kolon, idList } = req.body;
  if (!Array.isArray(idList) || !kolon) {
    return res.status(400).json({ error: 'Geçersiz parametre' });
  }
  try {
    // Her iş emrinin sırasını güncelle
    for (let i = 0; i < idList.length; i++) {
      await IsEmri.update({ order: i, durum: kolon }, { where: { is_emri_id: idList[i] } });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const IsEmri = require('../models/IsEmri');
const { Op } = require('sequelize');
const sequelize = require('../config/database').sequelize;
const Tezgah = require('../models/Tezgah');
const UretimPlani = require('../models/UretimPlani');
const Parca = require('../models/Parca');
const StatusUtils = require('../utils/statusUtils');

// Yeni iş emri numarası oluştur (transaction güvenli)
const generateIsEmriNo = async (transaction = null) => {
  const today = new Date();
  const yil = today.getFullYear().toString().slice(-2);
  const ay = (today.getMonth() + 1).toString().padStart(2, '0');
  const prefix = `IE${yil}${ay}`;

  // Bu ay içindeki en yüksek numaralı iş emrini bul
  const sonIsEmri = await IsEmri.findOne({
    where: {
      is_emri_no: {
        [Op.like]: `${prefix}%`
      }
    },
    order: [['is_emri_no', 'DESC']],
    transaction: transaction // Transaction içinde çalışması için
  });

  let siraNo = 1;
  if (sonIsEmri) {
    // Son iş emri numarasından sıra numarasını çıkar
    const sonSiraNo = parseInt(sonIsEmri.is_emri_no.slice(-4));
    siraNo = sonSiraNo + 1;
  }

  // 4 haneli sıra numarası oluştur (örn: 0001)
  return `${prefix}${siraNo.toString().padStart(4, '0')}`;
};

// Export generateIsEmriNo function for use in other controllers
exports.generateIsEmriNo = generateIsEmriNo;

// Tüm iş emirlerini getir
exports.getAllIsEmirleri = async (req, res) => {
  try {
    // Durum filtresi varsa kullan
    const where = {};
    // Arama filtresi
    if (req.query.search) {
      const q = req.query.search;
      where[Op.or] = [
        { is_emri_no: { [Op.like]: `%${q}%` } },
        { is_adi: { [Op.like]: `%${q}%` } },
        { parca_kodu: { [Op.like]: `%${q}%` } }
      ];
    }
    if (req.query.durum) {
      // Case-insensitive durum filtreleme için hem büyük hem küçük harf versiyonlarını kontrol et
      const durum = req.query.durum;
      const durumVariations = [
        durum,
        durum.toLowerCase(),
        durum.charAt(0).toUpperCase() + durum.slice(1).toLowerCase()
      ];
      where.durum = {
        [Op.in]: durumVariations
      };
    } else if (req.query.excludeDurum) {
      // Belirtilen durumları hariç tut
      const excludedDurumlar = req.query.excludeDurum.split(',').map(d => d.trim());
      where.durum = {
        [Op.notIn]: excludedDurumlar
      };
    } else {
      // Varsayılan olarak tamamlanmış iş emirleri de GÖSTERİLİR.
      // EĞER showCompleted=false parametresi varsa tamamlanmışlar gizlenir.
      if (req.query.showCompleted === 'false') {
        where.durum = {
          [Op.notIn]: ['tamamlandı', 'iptal']
        };
      }
    }

    // Tezgahlara atanmış aktif işleri her zaman hariç tut (özel durum dışında)
    // Sadece showAssigned=true parametresi varsa aktif işleri de göster
    if (req.query.showAssigned !== 'true') {
      // Tüm tezgahlardan atanmış iş emri ID'lerini topla
      const tezgahlar = await Tezgah.findAll({
        attributes: ['is_emirleri']
      });
      
      const atanmisIsEmriIDs = new Set();
      tezgahlar.forEach(tezgah => {
        if (tezgah.is_emirleri && Array.isArray(tezgah.is_emirleri)) {
          tezgah.is_emirleri.forEach(isEmri => {
            if (isEmri.is_emri_no) {
              atanmisIsEmriIDs.add(isEmri.is_emri_no);
            }
          });
        }
      });
      
      // Mevcut where koşullarına atanmış olanları hariç tutma ekle
      if (atanmisIsEmriIDs.size > 0) {
        where.is_emri_no = {
          [Op.notIn]: Array.from(atanmisIsEmriIDs)
        };
      }
      
      console.log(`${atanmisIsEmriIDs.size} adet aktif/atanmış iş emri iş emirleri listesinden hariç tutuldu`);
    }

    // Atanmış iş emirlerini hariç tutma seçeneği (eski uyumluluk için korundu)
    if (req.query.excludeAssigned === 'true') {
      // Tüm tezgahlardan atanmış iş emri ID'lerini topla
      const tezgahlar = await Tezgah.findAll({
        attributes: ['is_emirleri']
      });
      
      const atanmisIsEmriIDs = new Set();
      tezgahlar.forEach(tezgah => {
        if (tezgah.is_emirleri && Array.isArray(tezgah.is_emirleri)) {
          tezgah.is_emirleri.forEach(isEmri => {
            if (isEmri.is_emri_no) {
              atanmisIsEmriIDs.add(isEmri.is_emri_no);
            }
          });
        }
      });
      
      // Mevcut where koşullarına atanmış olanları hariç tutma ekle
      if (atanmisIsEmriIDs.size > 0) {
        where.is_emri_no = {
          [Op.notIn]: Array.from(atanmisIsEmriIDs)
        };
      }
      
      console.log(`${atanmisIsEmriIDs.size} adet atanmış iş emri hariç tutuldu (excludeAssigned=true)`);
    }

    const isEmirleri = await IsEmri.findAll({
      where,
      order: [
        ['order', 'ASC'], // Önce kullanıcı tarafından belirlenen sıralama
        ['teslim_tarihi', 'ASC'] // Sonra teslim tarihine göre sırala
      ]
    });

    // Üretim planı açıklamasını iliştir (görüntüleme için)
    try {
      const uniquePlanIds = Array.from(new Set(isEmirleri.map(ie => ie.uretim_plani_id).filter(Boolean)));
      if (uniquePlanIds.length > 0) {
        const UretimPlani = require('../models/UretimPlani');
        const plans = await UretimPlani.findAll({ where: { id: { [Op.in]: uniquePlanIds } } });
        const idToPlan = new Map(plans.map(p => [p.id, p]));
        isEmirleri.forEach(ie => {
          const plan = idToPlan.get(ie.uretim_plani_id);
          if (plan) {
            const aciklama = plan.aciklama || plan.ozel_liste_adi || plan.plan_adi || '';
            ie.dataValues.uretim_plani_aciklama = aciklama || `Plan #${plan.id}`;
          }
        });
      }
    } catch (planMetaError) {
      console.warn('Üretim planı açıklaması eklenemedi:', planMetaError.message);
    }
    
    // Filtre yoksa iş emirlerini durumlara göre gruplayarak döndür
    if (!req.query.durum || req.query.flat === 'true') {
      if (req.query.flat === 'true') {
        // Düz liste formatında döndür
        res.json(isEmirleri);
      } else {
        // İş emirlerini durumlara göre dinamik olarak grupla
        try {
          const grupluIsEmirleri = await StatusUtils.groupIsEmirleriByDurum(isEmirleri);
          res.json(grupluIsEmirleri);
        } catch (error) {
          console.error('Gruplama hatası:', error);
          // Hata durumunda basit gruplama yap
          const basitGruplu = {};
          isEmirleri.forEach(isEmri => {
            const durum = isEmri.durum || 'beklemede';
            if (!basitGruplu[durum]) {
              basitGruplu[durum] = [];
            }
            basitGruplu[durum].push(isEmri);
          });
          res.json(basitGruplu);
        }
      }
    } else {
      // Filtre varsa düz liste olarak döndür
      res.json(isEmirleri);
    }
  } catch (error) {
    console.error('İş emirleri listeleme hatası:', error);
    res.status(500).json({ error: error.message });
  }
};

// Yeni iş emri oluştur
exports.createIsEmri = async (req, res) => {
  try {
    const {
      is_adi,
      plan_liste_no,
      adet,
      malzeme,
      teslim_tarihi,
      oncelik,
      durum,
      aciklama,
      uretim_plani_id,
      planlanan_tezgah,
      parca_kodu,
      malzemesi_siparis_edilecekmi,
      malzeme_siparis_tarihi,
      siparis_dokumani_dosya_yolu,
      malzemenin_geldigi_tarih,
      stok_karti_id,
      tahmini_isleme_suresi
    } = req.body;

    // Zorunlu alanları kontrol et - sadece parça kodu ve adet zorunlu
    if (!parca_kodu || !adet || adet <= 0) {
      return res.status(400).json({
        error: 'Zorunlu alanlar eksik',
        details: 'Parça kodu ve adet bilgisi zorunludur.'
      });
    }

    // Durum validasyonu - eğer durum belirtilmişse geçerli olmalı
    const finalDurum = durum || 'beklemede';
    const isDurumValid = await StatusUtils.isValidDurum(finalDurum);
    if (!isDurumValid) {
      return res.status(400).json({
        error: 'Geçersiz durum',
        details: `"${finalDurum}" geçerli bir durum değil. Lütfen geçerli bir durum seçiniz.`
      });
    }

    // Adet değerini number'a çevir
    const adetSayisi = parseInt(adet);
    
    // Otomatik iş emri numarası oluştur
    const isEmriNo = await generateIsEmriNo();

    // Parça bilgilerini al (eğer parça kodu sağlanmışsa)
    let setupSayisi = 0;
    let cncSuresi = 0;
    if (parca_kodu) {
      const Parca = require('../models/Parca');
      try {
        const parca = await Parca.findByPk(parca_kodu);
        if (parca) {
          // Parça modelinden doğru field isimlerini kullanarak değerleri al
          setupSayisi = parca.setupSayisi || 0;
          cncSuresi = parca.cncIslemeSuresi || 0;
          console.log(`[İş Emri Oluşturma] Parça bilgileri alındı: Parça=${parca_kodu}, Setup=${setupSayisi}, CNC Süresi=${cncSuresi}`);
        } else {
          console.log(`[İş Emri Oluşturma] Parça bulunamadı: ${parca_kodu}`);
        }
      } catch (error) {
        console.error('Parça bilgileri alınırken hata:', error);
      }
    }

    // Determine plan_liste_no value based on uretim_plani_id
    let finalPlanListeNo = plan_liste_no;
    
    // If there's a production plan ID, we'll get its details
    if (uretim_plani_id) {
      try {
        const UretimPlani = require('../models/UretimPlani');
        const Makina = require('../models/Makina');
        
        const uretimPlani = await UretimPlani.findByPk(uretim_plani_id, {
          include: [{
            model: Makina,
            as: 'makina',
            attributes: ['name']
          }]
        });
        
        if (uretimPlani) {
          // If there's a production plan, use its ID and name as plan_liste_no
          const makinaInfo = uretimPlani.makina ? `(${uretimPlani.makina.name})` : '';
          finalPlanListeNo = `Plan #${uretim_plani_id} ${makinaInfo}`;
        }
      } catch (error) {
        console.error('Üretim planı bilgisi alınamadı:', error);
      }
    } else {
      // If there's no production plan, mark it as "Plan Dışı"
      finalPlanListeNo = finalPlanListeNo || 'Plan Dışı';
    }
    
    // Sipariş alanları ve iş emri durumu kuralı
    let yeniDurum = finalDurum;
    if (malzemesi_siparis_edilecekmi) {
      // Sipariş edilecekse sipariş durumuna geç, yoksa beklemede kalır
      const siparisVerilecekDurum = await StatusUtils.isValidDurum('sipariş verilecek');
      yeniDurum = siparisVerilecekDurum ? 'sipariş verilecek' : finalDurum;
    }
    
    console.log('İş emri oluşturuluyor - Durum:', yeniDurum, 'Sipariş edilecek mi:', malzemesi_siparis_edilecekmi);

    // Varsayılan değerler ata
    const varsayilanIsAdi = is_adi || parca_kodu || 'Yeni İş Emri';
    const varsayilanMalzeme = malzeme || 'Belirtilmemiş';
    const varsayilanTeslimTarihi = teslim_tarihi || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 7 gün sonra

    const yeniIsEmri = await IsEmri.create({
      is_emri_no: isEmriNo,
      is_adi: varsayilanIsAdi,
      plan_liste_no: finalPlanListeNo,
      adet: adetSayisi,
      malzeme: varsayilanMalzeme,
      teslim_tarihi: varsayilanTeslimTarihi,
      oncelik: oncelik || 'normal',
      durum: yeniDurum,
      aciklama: aciklama || '',
      uretim_plani_id: uretim_plani_id || null,
      planlanan_tezgah: planlanan_tezgah || null,
      parca_kodu: parca_kodu,
      setup_sayisi: setupSayisi,
      cnc_suresi: cncSuresi,
      tahmini_isleme_suresi: tahmini_isleme_suresi || 1,
      hareketler: [`${new Date().toLocaleString('tr-TR')} - İş emri oluşturuldu (${yeniDurum})`],
      malzemesi_siparis_edilecekmi: !!malzemesi_siparis_edilecekmi,
      malzeme_siparis_tarihi: malzemesi_siparis_edilecekmi ? malzeme_siparis_tarihi : null,
      siparis_dokumani_dosya_yolu: malzemesi_siparis_edilecekmi && siparis_dokumani_dosya_yolu ? siparis_dokumani_dosya_yolu : null,
      malzemenin_geldigi_tarih: malzemenin_geldigi_tarih || null,
      stok_karti_id: stok_karti_id || null
    });

    // Geçici dokümanları kalıcı hale getir
    try {
      const path = require('path');
      const fs = require('fs');
      const db = require('../models');
      
      const uploadDir = path.join(__dirname, '../../uploads/siparis_dokumanlari');
      const tempPrefix = `temp_siparis_${parca_kodu || 'yeni_is_emri'}_`;
      
      // Geçici dosyaları ara
      if (fs.existsSync(uploadDir)) {
        const files = fs.readdirSync(uploadDir);
        const tempFiles = files.filter(file => file.startsWith(tempPrefix));
        
        console.log(`Bulunan geçici dosyalar (${tempPrefix}*):`, tempFiles);
        
        for (let i = 0; i < tempFiles.length; i++) {
          const tempFile = tempFiles[i];
          const tempFilePath = path.join(uploadDir, tempFile);
          
          // Yeni dosya adı oluştur
          const ext = path.extname(tempFile);
          const newFileName = `siparis_${yeniIsEmri.is_emri_no}_${Date.now() + i}${ext}`;
          const newFilePath = path.join(uploadDir, newFileName);
          
          // Dosyayı yeniden adlandır
          fs.renameSync(tempFilePath, newFilePath);
          console.log(`Geçici dosya kalıcı hale getirildi: ${tempFile} -> ${newFileName}`);
          
          // Dokümanı veritabanına kaydet
          await db.SiparisDokumani.create({
            is_emri_no: yeniIsEmri.is_emri_no,
            dosya_yolu: `/uploads/siparis_dokumanlari/${newFileName}`,
            yuklenme_tarihi: new Date(),
            siralama: i + 1
          });
          console.log(`Doküman veritabanına kaydedildi: ${newFileName}`);
        }
      }
    } catch (tempError) {
      console.error('Geçici dokümanları kalıcı hale getirirken hata:', tempError);
      // Bu hata iş emri oluşturmayı engellemez, sadece log'lanır
    }

    // Yeni iş emrini getir ve yanıt olarak gönder
    const olusturulanIsEmri = await IsEmri.findByPk(yeniIsEmri.is_emri_id);
    res.status(201).json(olusturulanIsEmri);
  } catch (error) {
    console.error('İş emri oluşturma hatası:', error);
    res.status(400).json({
      error: 'İş emri oluşturulamadı',
      details: error.message
    });
  }
};

// İş emrini güncelle
exports.updateIsEmri = async (req, res) => {
  const { id } = req.params;
  try {
    const isEmri = await IsEmri.findByPk(id);
    if (!isEmri) {
      return res.status(404).json({ error: 'İş emri bulunamadı' });
    }

    // Create updated data object
    const updateData = { ...req.body };
    
    // Check if parca_kodu is being updated
    if (updateData.parca_kodu !== undefined && 
        updateData.parca_kodu !== isEmri.parca_kodu) {
      try {
        const Parca = require('../models/Parca');
        const parca = await Parca.findByPk(updateData.parca_kodu);
        
        if (parca) {
          // Parçadan setup sayısı ve cnc süresini al
          updateData.setup_sayisi = parca.setupSayisi || 0;
          updateData.cnc_suresi = parca.cncIslemeSuresi || 0;
          console.log(`[İş Emri Güncelleme] Parça bilgileri güncellendi: Parça=${parca.parcaKodu}, Setup=${updateData.setup_sayisi}, CNC Süresi=${updateData.cnc_suresi}`);
          
          // Hareket ekle
          const parcaHareket = `${new Date().toLocaleString('tr-TR')} - Parça ${parca.parcaKodu} olarak değiştirildi`;
          updateData.hareketler = [...(updateData.hareketler || isEmri.hareketler), parcaHareket];
        } else {
          console.log(`[İş Emri Güncelleme] Parça bulunamadı: ${updateData.parca_kodu}`);
        }
      } catch (error) {
        console.error('Parça bilgileri alınırken hata:', error);
      }
    }
    
    // Check if production plan ID is being updated
    if (req.body.uretim_plani_id !== undefined && 
        req.body.uretim_plani_id !== isEmri.uretim_plani_id) {
      
      // Update plan_liste_no based on new uretim_plani_id
      if (req.body.uretim_plani_id) {
        try {
          const UretimPlani = require('../models/UretimPlani');
          const Makina = require('../models/Makina');
          
          const uretimPlani = await UretimPlani.findByPk(req.body.uretim_plani_id, {
            include: [{
              model: Makina,
              as: 'makina',
              attributes: ['name']
            }]
          });
          
          if (uretimPlani) {
            const makinaInfo = uretimPlani.makina ? `(${uretimPlani.makina.name})` : '';
            updateData.plan_liste_no = `Plan #${req.body.uretim_plani_id} ${makinaInfo}`;
          }
        } catch (error) {
          console.error('Üretim planı bilgisi alınamadı:', error);
        }
      } else {
        // If production plan is removed, set to "Plan Dışı"
        updateData.plan_liste_no = 'Plan Dışı';
      }
      
      // Add movement for production plan change
      const planChangeMessage = req.body.uretim_plani_id ?
        `Üretim planı #${req.body.uretim_plani_id}'ye atandı` :
        `Üretim planından çıkarıldı`;
      
      const planHareket = `${new Date().toLocaleString('tr-TR')} - ${planChangeMessage}`;
      updateData.hareketler = [...isEmri.hareketler, planHareket];
    }
    
    // If planlanan_tezgah is updated, add to movements
    if (req.body.planlanan_tezgah !== undefined && 
        req.body.planlanan_tezgah !== isEmri.planlanan_tezgah) {
      try {
        const Tezgah = require('../models/Tezgah');
        const tezgah = req.body.planlanan_tezgah ? 
          await Tezgah.findByPk(req.body.planlanan_tezgah) : null;
        
        const tezgahMessage = tezgah ? 
          `${tezgah.tezgah_tanimi} tezgahına planlandı` : 
          `Tezgah planlaması kaldırıldı`;
        
        const tezgahHareket = `${new Date().toLocaleString('tr-TR')} - ${tezgahMessage}`;
        updateData.hareketler = [...(updateData.hareketler || isEmri.hareketler), tezgahHareket];
      } catch (error) {
        console.error('Tezgah bilgisi alınamadı:', error);
      }
    }

    // Durum değişikliği varsa hareket ekle
    if (req.body.durum && req.body.durum !== isEmri.durum) {
      // Sadece izin verilen durumlar
      const allowed = ['Beklemede', 'Siparis', 'Iptal', 'fason', 'tamamlandı', 'aktif', 'beklemede'];
      if (allowed.includes(req.body.durum)) {
        // Eğer durum "fason"a güncelleniyorsa, özel işlem gerekli
        if (req.body.durum === 'fason') {
          return res.status(202).json({ 
            requiresFasonDialog: true,
            message: 'Fason durumuna geçiş için onay gerekli',
            isEmri: isEmri
          });
        }
        
        const yeniHareket = `${new Date().toLocaleString('tr-TR')} - ${isEmri.durum}'dan ${req.body.durum}'a taşındı`;
        updateData.durum = req.body.durum;
        updateData.hareketler = [...(updateData.hareketler || isEmri.hareketler), yeniHareket];
      }
    }

    await isEmri.update(updateData);
    res.json(isEmri);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// İş emrini sil
exports.deleteIsEmri = async (req, res) => {
  const { id } = req.params;
  
  // Transaction başlat
  const transaction = await sequelize.transaction();
  
  try {
    const isEmri = await IsEmri.findByPk(id);
    if (!isEmri) {
      await transaction.rollback();
      return res.status(404).json({ error: 'İş emri bulunamadı' });
    }

    // 1. Önce tamamlanan işler tablosundaki kayıtları sil
    const TamamlananIs = require('../models/TamamlananIs');
    await TamamlananIs.destroy({
      where: { is_emri_id: id },
      transaction
    });

    // 2. Tezgah durum loglarındaki kayıtları sil
    const TezgahDurumLog = require('../models/TezgahDurumLog');
    try {
      await TezgahDurumLog.destroy({
        where: { is_emri_id: id },
        transaction
      });
    } catch (error) {
      // TezgahDurumLog modeli yoksa ya da hata varsa devam et
      console.log('TezgahDurumLog silinemedi (model bulunamadı veya hata):', error.message);
    }

    // 3. Sipariş dokümanlarını sil
    try {
      const SiparisDokumani = require('../models/SiparisDokumani');
      await SiparisDokumani.destroy({
        where: { is_emri_id: id },
        transaction
      });
    } catch (error) {
      console.log('SiparisDokumani silinemedi (model bulunamadı veya hata):', error.message);
    }

    // 4. İşlem kayıtlarını sil (is_emri_no ile bağlantılı)
    try {
      const IslemKaydi = require('../models/IslemKaydi');
      await IslemKaydi.destroy({
        where: { is_emri_no: isEmri.is_emri_no },
        transaction
      });
    } catch (error) {
      console.log('IslemKaydi silinemedi (model bulunamadı veya hata):', error.message);
    }

    // 5. Tezgahların is_emirleri JSON alanından bu iş emrini çıkar
    const tezgahlar = await Tezgah.findAll({ transaction });
    for (const tezgah of tezgahlar) {
      if (tezgah.is_emirleri && Array.isArray(tezgah.is_emirleri)) {
        const filteredIsEmirleri = tezgah.is_emirleri.filter(
          item => item.is_emri_id !== parseInt(id)
        );
        
        if (filteredIsEmirleri.length !== tezgah.is_emirleri.length) {
          await tezgah.update({
            is_emirleri: filteredIsEmirleri,
            calisma_durumu: filteredIsEmirleri.length > 0 ? 'calisiyor' : 'musait'
          }, { transaction });
          console.log(`İş emri ${id}, ${tezgah.tezgah_tanimi} tezgahının listesinden kaldırıldı`);
        }
      }
    }

    // 6. Son olarak iş emrini sil (CASCADE olan tablolar otomatik silinecek)
    await isEmri.destroy({ transaction });

    // Transaction'ı commit et
    await transaction.commit();

    console.log(`İş emri ${id} (${isEmri.is_emri_no}) başarıyla silindi`);
    res.json({ 
      message: 'İş emri ve ilişkili tüm kayıtlar başarıyla silindi',
      silinen_is_emri: {
        id: isEmri.is_emri_id,
        no: isEmri.is_emri_no,
        is_adi: isEmri.is_adi
      }
    });
    
  } catch (error) {
    // Hata durumunda rollback yap
    await transaction.rollback();
    console.error('İş emri silme hatası:', error);
    res.status(500).json({ 
      error: 'İş emri silinemedi',
      details: error.message 
    });
  }
};

// İş emri detaylarını getir
exports.getIsEmriById = async (req, res) => {
  const { id } = req.params;
  try {
    const isEmri = await IsEmri.findByPk(id);
    if (!isEmri) {
      return res.status(404).json({ error: 'İş emri bulunamadı' });
    }
    res.json(isEmri);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// İş emrini tezgaha ata
exports.assignToTezgah = async (req, res) => {
  try {
    const { is_emri_no } = req.params;
    const { tezgah_id } = req.body;

    const isEmri = await IsEmri.findOne({ where: { is_emri_no } });
    if (!isEmri) {
      return res.status(404).json({ error: 'İş emri bulunamadı' });
    }

    // Kanonik servisi kullan
    const { assignIsEmriToTezgah } = require('../services/isEmriAtamaService');
    const result = await assignIsEmriToTezgah(parseInt(tezgah_id), isEmri.is_emri_id);
    res.json(result.isEmri);
  } catch (error) {
    console.error('Tezgah atama hatası:', error);
    res.status(500).json({ error: 'Tezgah atama işlemi başarısız oldu' });
  }
};

// Üretim planına göre iş emirlerini getir
exports.getIsEmriByUretimPlani = async (req, res) => {
  try {
    const { uretimPlaniId } = req.params;
    
    console.log(`Üretim planı ID'si ile iş emirleri alınıyor: ${uretimPlaniId}`);
    
    const isEmirleri = await IsEmri.findAll({
      where: {
        uretim_plani_id: uretimPlaniId
      },
      include: [
        {
          model: Tezgah,
          as: 'tezgah',
          attributes: ['tezgah_id', 'tezgah_tanimi'],
          required: false
        },
        {
          model: Parca,
          as: 'parca',
          attributes: ['parcaKodu', 'parcaAdi', 'foto_path', 'teknik_resim_path'],
          required: false
        }
      ],
      order: [['olusturma_tarihi', 'DESC']]
    });
    
    console.log(`Bulunan iş emri sayısı: ${isEmirleri.length}`);
    
    // Her iş emri için parça bilgilerini manual olarak yükle (include çalışmıyorsa)
    for (let isEmri of isEmirleri) {
      if (isEmri.parca_kodu && !isEmri.parca) {
        try {
          const parca = await Parca.findOne({
            where: { parcaKodu: isEmri.parca_kodu },
            attributes: ['parcaKodu', 'parcaAdi', 'foto_path', 'teknik_resim_path']
          });
          
          if (parca) {
            // Parça bilgilerini iş emri nesnesine ekle
            isEmri.dataValues.parca = parca;
            console.log(`Parça bilgisi manuel olarak yüklendi: ${isEmri.parca_kodu} -> ${parca.foto_path || 'görsel yok'}`);
          } else {
            console.log(`Parça bulunamadı: ${isEmri.parca_kodu}`);
          }
        } catch (error) {
          console.error(`Parça bilgisi yüklenirken hata (${isEmri.parca_kodu}):`, error);
        }
      }
    }
    
    res.json(isEmirleri);
  } catch (error) {
    console.error('İş emirleri getirilirken hata:', error);
    res.status(500).json({ error: error.message });
  }
};

// Modal için atanabilir iş emirlerini getir - duruma göre gruplandırılmış
exports.getAtanabilirIsEmirleriForModal = async (req, res) => {
  try {
    console.log('Modal için atanabilir iş emirleri isteniyor...');
    
    // Query parametresinden tamamlanan işlerin gösterilip gösterilmeyeceğini al
    const tamamlananlariGoster = req.query.tamamlananlari_goster === 'true';
    console.log('Tamamlanan işler gösterilecek mi:', tamamlananlariGoster);
    
    // Hariç tutulacak durumlar: sipariş aşamasında, iptal, kaynak, fason
    // Tamamlandı durumu opsiyonel olarak hariç tutulur
    let haricTutulanDurumlar = ['siparişte', 'siparis', 'iptal', 'kaynak', 'fason'];
    if (!tamamlananlariGoster) {
      haricTutulanDurumlar.push('tamamlandı');
    }
    
    console.log('Hariç tutulan durumlar:', haricTutulanDurumlar);
    
    // Tüm tezgahlardan atanmış iş emri ID'lerini topla
    // Bu modal özellikle tezgaha atanmamış işleri göstermek içindir
    const tezgahlar = await Tezgah.findAll({
      attributes: ['is_emirleri']
    });
    
    const atanmisIsEmriIDs = new Set();
    tezgahlar.forEach(tezgah => {
      if (tezgah.is_emirleri && Array.isArray(tezgah.is_emirleri)) {
        tezgah.is_emirleri.forEach(isEmri => {
          if (isEmri.is_emri_no) {
            atanmisIsEmriIDs.add(isEmri.is_emri_no);
          }
        });
      }
    });
    
    console.log(`${atanmisIsEmriIDs.size} adet tezgaha atanmış iş emri bulundu:`, Array.from(atanmisIsEmriIDs).slice(0, 5).join(', ') + (atanmisIsEmriIDs.size > 5 ? '...' : ''));
    
    if (atanmisIsEmriIDs.size > 0) {
      console.log('Filtrelenecek (atanmış) iş emri ID\'leri:', Array.from(atanmisIsEmriIDs));
    }
    
    // Parca modelini import et
    const Parca = require('../models/Parca');
    
    // Büyük küçük harf duyarsız arama için LOWER() kullan ve belirtilen durumları hariç tut
    const whereConditions = {
      [Op.and]: [
        {
          [Op.and]: haricTutulanDurumlar.map(durum => 
            sequelize.where(
              sequelize.fn('LOWER', sequelize.col('durum')), 
              { [Op.ne]: durum.toLowerCase() }
            )
          )
        }
      ]
    };
    
    // Atanmış iş emirlerini hariç tut
    if (atanmisIsEmriIDs.size > 0) {
      whereConditions[Op.and].push({
        is_emri_no: {
          [Op.notIn]: Array.from(atanmisIsEmriIDs)
        }
      });
    }
    
    const isEmirleri = await IsEmri.findAll({
      where: whereConditions,
      include: [
        {
          model: Parca,
          as: 'parca', // Association alias'ını kontrol et
          required: false // LEFT JOIN için
        }
      ],
      order: [['teslim_tarihi', 'ASC'], ['olusturma_tarihi', 'ASC']]
    });
    
    console.log(`Bulunan atanabilir iş emri sayısı: ${isEmirleri.length}`);
    
    // Duruma göre dinamik gruplandırma - hariç tutulan durumlar dışındaki tüm durumları dahil et
    const gruplandırılmısDurumlar = {};
    
    isEmirleri.forEach(isEmri => {
      const durum = isEmri.durum.toLowerCase().trim();
      console.log(`İş emri ${isEmri.is_emri_no} durumu: "${durum}"`);
      
      // Eğer bu durum için grup yoksa oluştur
      if (!gruplandırılmısDurumlar[durum]) {
        gruplandırılmısDurumlar[durum] = [];
      }
      
      gruplandırılmısDurumlar[durum].push(isEmri);
    });
    
    // Her durum için iş emri sayılarını logla
    Object.keys(gruplandırılmısDurumlar).forEach(durum => {
      console.log(`${durum}: ${gruplandırılmısDurumlar[durum].length} iş emri`);
    });
    
    res.json(gruplandırılmısDurumlar);
  } catch (error) {
    console.error('Atanabilir iş emirleri getirilirken hata:', error);
    res.status(500).json({ 
      error: 'Atanabilir iş emirleri yüklenemedi',
      details: error.message 
    });
  }
};

/**
 * ADIM 4: Üretim planından iş emirleri oluşturma (Excel verisinden)
 */
exports.createIsEmirleriFromUretimPlani = async (req, res) => {
    try {
        const { uretimPlani } = req.body;

        if (!uretimPlani || !Array.isArray(uretimPlani)) {
            return res.status(400).json({ error: 'Geçersiz üretim planı verisi' });
        }

        const transaction = await sequelize.transaction();

        try {
            const isEmirleri = [];

            // Sıralı olarak iş emirlerini oluştur (unique constraint sorununu önlemek için)
            for (let i = 0; i < uretimPlani.length; i++) {
                const item = uretimPlani[i];
                
                // Plan liste no'yu Item sütunundan al
                const planListeNo = item['Item'] || item['item'] || item['ITEM'];
                
                // Zorunlu alanları kontrol et
                if (!planListeNo || !item.Adet || !item.Malzemesi) {
                    throw new Error(`Eksik veri: Item=${planListeNo}, Adet=${item.Adet}, Malzemesi=${item.Malzemesi}`);
                }

                // Transaction ile iş emri numarası oluştur
                const isEmriNo = await generateIsEmriNo(transaction);
                
                // Parça kodu olarak planListeNo'yu kullan
                let parcaKodu = planListeNo;
                let setupSayisi = 0;
                let cncSuresi = 0;

                // Parça bilgilerini kontrol et ve al
                try {
                    const parca = await Parca.findOne({
                        where: { parcaKodu: parcaKodu },
                        transaction: transaction
                    });
                    
                    if (parca) {
                        setupSayisi = parca.setupSayisi || 0;
                        cncSuresi = parca.cncIslemeSuresi || 0;
                        console.log(`[${i+1}/${uretimPlani.length}] Parça bilgisi bulundu: ${parcaKodu} -> Setup: ${setupSayisi}, CNC: ${cncSuresi}`);
                    } else {
                        console.log(`[${i+1}/${uretimPlani.length}] Parça bulunamadı, yeni parça kodu olarak kullanılacak: ${parcaKodu}`);
                    }
                } catch (parcaError) {
                    console.error(`Parça kontrol hatası: ${parcaKodu}`, parcaError);
                }
                
                const isEmriData = {
                    is_emri_no: isEmriNo,
                    is_adi: planListeNo, // Item'ı iş adı olarak kullan
                    plan_liste_no: planListeNo,
                    parca_kodu: parcaKodu, // Parça kodunu ekle
                    adet: parseInt(item.Adet) || 1,
                    malzeme: item.Malzemesi,
                    teslim_tarihi: new Date(),
                    durum: 'Beklemede',
                    setup_sayisi: setupSayisi,
                    cnc_suresi: cncSuresi,
                    hareketler: [`${new Date().toLocaleString('tr-TR')} - Excel'den otomatik oluşturuldu`]
                };

                console.log(`[${i+1}/${uretimPlani.length}] Oluşturulacak iş emri:`, {
                    no: isEmriData.is_emri_no,
                    parca: isEmriData.parca_kodu,
                    adet: isEmriData.adet,
                    malzeme: isEmriData.malzeme
                });
                
                const isEmri = await IsEmri.create(isEmriData, { transaction });

                isEmirleri.push(isEmri);
            }

            await transaction.commit();

            res.json({
                message: `${isEmirleri.length} iş emri başarıyla oluşturuldu`,
                isEmirleri: isEmirleri
            });

        } catch (error) {
            await transaction.rollback();
            throw error;
        }

    } catch (error) {
        console.error('Üretim planından iş emri oluşturma hatası:', error);
        res.status(500).json({ 
            error: 'İş emirleri oluşturulurken hata oluştu', 
            details: error.message 
        });
    }
};

/**
 * Toplu iş emri oluşturma (Excel'den gelen parça listesi için)
 */
exports.batchCreateIsEmirleri = async (req, res) => {
    const t = await sequelize.transaction();
    
    try {
        const { 
            parcaListesi, 
            varsayilanTeslimTarihi, 
            oncelik = 'Normal',
            planListeAdi,
            aciklama,
            uretimPlaniId
        } = req.body;
        
        // Validasyon
        if (!parcaListesi || !Array.isArray(parcaListesi) || parcaListesi.length === 0) {
            return res.status(400).json({ 
                error: 'parcaListesi gereklidir ve boş olamaz' 
            });
        }
        
        const createdIsEmirleri = [];
        
        for (const parcaItem of parcaListesi) {
            const { parcaKodu, parcaAdi, adet, teslimTarihi } = parcaItem;
            
            if (!parcaKodu || !adet) {
                throw new Error(`Eksik bilgi: parcaKodu=${parcaKodu}, adet=${adet}`);
            }
            
            // Parçanın veritabanında var olup olmadığını kontrol et
            const parca = await Parca.findOne({ 
                where: { 
                    [Op.or]: [
                        { parcaKodu: parcaKodu },
                        { parcaAdi: parcaKodu } // Excel'de parça adı olarak gelebilir
                    ]
                } 
            });
            
            if (!parca) {
                throw new Error(`Parça bulunamadı: ${parcaKodu}`);
            }
            
            // Yeni iş emri numarası oluştur
            const isEmriNo = await generateIsEmriNo(t);
            
            // İş emri verisi hazırla
            const isEmriData = {
                is_emri_no: isEmriNo,
                parca_kodu: parca.parcaKodu,
                is_adi: parca.parcaAdi || parcaKodu,
                adet: parseInt(adet),
                malzeme: parca.malzeme || 'Belirtilmemiş',
                teslim_tarihi: teslimTarihi || varsayilanTeslimTarihi,
                durum: 'Beklemede',
                oncelik: oncelik,
                aciklama: aciklama ? `${aciklama} - Excel'den oluşturuldu` : 'Excel\'den otomatik oluşturuldu',
                plan_liste_no: planListeAdi || 'Excel İçe Aktarım',
                olusturma_tarihi: new Date(),
                guncelleme_tarihi: new Date()
            };
            
            // İş emrini oluştur
            const isEmri = await IsEmri.create(isEmriData, { transaction: t });
            
            // Üretim planına ata (belirtilmişse)
            if (uretimPlaniId) {
                // Üretim planı varlığını kontrol et
                const uretimPlani = await UretimPlani.findByPk(uretimPlaniId);
                if (uretimPlani) {
                    await isEmri.update({ 
                        uretim_plani_id: uretimPlaniId 
                    }, { transaction: t });
                }
            }
            
            createdIsEmirleri.push({
                is_emri_no: isEmri.is_emri_no,
                is_emri_adi: isEmri.is_adi,
                parca_kodu: isEmri.parca_kodu,
                is_adi: isEmri.is_adi,
                adet: isEmri.adet,
                teslim_tarihi: isEmri.teslim_tarihi,
                durum: isEmri.durum
            });
        }
        
        await t.commit();
        
        res.status(201).json({
            success: true,
            message: `${createdIsEmirleri.length} adet iş emri başarıyla oluşturuldu`,
            data: {
                oluşturulanIsEmirleri: createdIsEmirleri,
                toplamAdet: createdIsEmirleri.length,
                planListeAdi: planListeAdi
            }
        });
        
    } catch (error) {
        await t.rollback();
        console.error('Toplu iş emri oluşturma hatası:', error);
        res.status(500).json({ 
            success: false,
            error: error.message || 'Toplu iş emri oluşturulurken hata oluştu'
        });
    }
};

// Fason durumuna geçiş onayı ve fason iş emri oluşturma
exports.confirmFasonConversion = async (req, res) => {
  const { id } = req.params;
  const { 
    fasonData, // Fason iş emri verileri
    confirm = false 
  } = req.body;

  try {
    const isEmri = await IsEmri.findByPk(id);
    if (!isEmri) {
      return res.status(404).json({ error: 'İş emri bulunamadı' });
    }

    if (!confirm) {
      return res.status(400).json({ error: 'Fason dönüşümü onaylanmadı' });
    }

    // Transaction başlat
    const transaction = await sequelize.transaction();

    try {
      // 1. İş emrini fason durumuna güncelle
      const yeniHareket = `${new Date().toLocaleString('tr-TR')} - ${isEmri.durum}'dan fason'a taşındı`;
      await isEmri.update({
        durum: 'fason',
        hareketler: [...isEmri.hareketler, yeniHareket]
      }, { transaction });

      // 2. Fason iş emri oluştur
      const FasonIsEmri = require('../models/FasonIsEmri');
      
      const fasonIsEmri = await FasonIsEmri.create({
        is_emri_id: isEmri.is_emri_id, // Ana iş emri ile ilişkilendir
        parca_kodu: isEmri.parca_kodu,
        fason_adet: fasonData.fason_adet || isEmri.adet,
        teslim_tarihi: fasonData.teslim_tarihi || isEmri.teslim_tarihi,
        ilgili_kisi: fasonData.ilgili_kisi || 'Sistem',
        tedarikci: fasonData.tedarikci || '',
        durum: 'beklemede',
        aciklama: fasonData.aciklama || `${isEmri.is_emri_no} iş emrinden türetildi`,
        uretim_plani_id: isEmri.uretim_plani_id
      }, { transaction });

      await transaction.commit();

      // İş emrini yeniden getir (güncellenmiş hali ile)
      const updatedIsEmri = await IsEmri.findByPk(id);

      res.json({
        message: 'İş emri başarıyla fason durumuna geçirildi',
        isEmri: updatedIsEmri,
        fasonIsEmri: fasonIsEmri
      });

    } catch (error) {
      await transaction.rollback();
      throw error;
    }

  } catch (error) {
    console.error('Fason dönüşüm hatası:', error);
    res.status(500).json({ 
      error: 'Fason dönüşümü başarısız oldu',
      details: error.message 
    });
  }
};