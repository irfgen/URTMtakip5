const UretimPlani = require('../models/UretimPlani');
const Makina = require('../models/Makina');
const Parca = require('../models/Parca');
const IsEmri = require('../models/IsEmri');
const FasonIsEmri = require('../models/FasonIsEmri');
const FasonGrup = require('../models/FasonGrup');
const StokKarti = require('../models/StokKarti');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database'); // Sequelize instance'ını import et

// Tüm üretim planlarını getir
exports.getAllUretimPlani = async (req, res) => {
  try {
    const { 
      ozel_liste_adi, 
      mobile, 
      limit = 20, 
      offset = 0, 
      search,
      durum 
    } = req.query;
    
    const where = {};
    if (ozel_liste_adi) {
      where.ozel_liste_adi = ozel_liste_adi;
    }
    
    // Arama filtresi
    if (search) {
      where[Op.or] = [
        { ozel_liste_adi: { [Op.like]: `%${search}%` } },
        { durum: { [Op.like]: `%${search}%` } },
        { '$makina.name$': { [Op.like]: `%${search}%` } }
      ];
    }
    
    // Durum filtresi
    if (durum) {
      where.durum = durum;
    }

    // Mobil için hafif response
    const attributes = mobile === 'true' ? 
      ['id', 'ozel_liste_adi', 'miktar', 'durum', 'teslim_tarihi', 'olusturma_tarihi', 'makina_id'] :
      undefined;
    
    const makinaAttributes = mobile === 'true' ? 
      ['name', 'model'] : 
      ['name', 'model'];

    const queryOptions = {
      where,
      include: [
        {
          model: Makina,
          as: 'makina',
          attributes: makinaAttributes
        }
      ],
      order: [['olusturma_tarihi', 'DESC']],
      attributes
    };

    // Pagination sadece mobile'da
    if (mobile === 'true') {
      queryOptions.limit = parseInt(limit);
      queryOptions.offset = parseInt(offset);
    }

    const result = await UretimPlani.findAndCountAll(queryOptions);
    
    // Mobil response formatı
    if (mobile === 'true') {
      res.json({
        data: result.rows,
        pagination: {
          total: result.count,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: (parseInt(offset) + parseInt(limit)) < result.count
        }
      });
    } else {
      res.json(result.rows);
    }
  } catch (error) {
    console.error('Üretim planları listelerken hata:', error);
    res.status(500).json({ error: error.message });
  }
};

// Tek bir üretim planı getir
exports.getUretimPlaniById = async (req, res) => {
  try {
    const { mobile } = req.query;
    
    if (mobile === 'true') {
      // Mobile için basit sorgu
      const uretimPlani = await UretimPlani.findByPk(req.params.id, {
        include: [
          {
            model: Makina,
            as: 'makina',
            attributes: ['name', 'model']
          }
        ]
      });
      
      if (!uretimPlani) {
        return res.status(404).json({ message: 'Üretim planı bulunamadı' });
      }
      
      // İş emirlerini ayrı sorgu ile getir
      const isEmirleri = await IsEmri.findAll({
        where: { uretim_plani_id: req.params.id },
        attributes: ['is_emri_id', 'is_emri_no', 'is_adi', 'durum', 'adet'],
        include: [
          { 
            model: Parca, 
            as: 'parca',
            attributes: ['parca_kodu', 'parca_adi', 'foto_path', 'teknik_resim_path']
          }
        ]
      });
      
      // İstatistikleri ekle
      const stats = {
        toplam_is_emri: isEmirleri.length,
        toplam_fason_is_emri: 0,
        plan_tipi: uretimPlani.makina_id ? 'makina' : 'karma'
      };
      
      res.json({
        ...uretimPlani.toJSON(),
        is_emirleri: isEmirleri.map(ie => ({
          id: ie.is_emri_id, // Frontend expects 'id'
          is_emri_id: ie.is_emri_id,
          is_emri_no: ie.is_emri_no,
          is_adi: ie.is_adi,
          durum: ie.durum,
          adet: ie.adet,
          parca: ie.parca
        })),
        stats
      });
    } else {
      // Desktop için tam sorgu
      const includeOptions = [
        {
          model: Makina,
          as: 'makina',
          attributes: ['name', 'model', 'items']
        },
        {
          model: IsEmri,
          as: 'is_emirleri',
          include: [
            { model: Parca, as: 'parca' }
          ]
        },
        {
          model: FasonIsEmri,
          as: 'fason_is_emirleri',
          include: [
            { model: Parca, as: 'parca' },
            { model: FasonGrup, as: 'fason_grup' }
          ]
        }
      ];

      const uretimPlani = await UretimPlani.findByPk(req.params.id, {
        include: includeOptions
      });
      
      if (!uretimPlani) {
        return res.status(404).json({ message: 'Üretim planı bulunamadı' });
      }
      
      // İstatistikleri ekle
      const stats = {
        toplam_is_emri: uretimPlani.is_emirleri ? uretimPlani.is_emirleri.length : 0,
        toplam_fason_is_emri: uretimPlani.fason_is_emirleri ? uretimPlani.fason_is_emirleri.length : 0,
        plan_tipi: uretimPlani.makina_id ? 'makina' : 'karma'
      };
      
      res.json({
        ...uretimPlani.toJSON(),
        stats
      });
    }
  } catch (error) {
    console.error('Üretim planı getirirken hata:', error);
    res.status(500).json({ error: error.message });
  }
};

// Üretim planı için parça listesi oluştur (BOM ve kritik stok kontrolü)
const createPartsList = async (makinaData, miktar) => {
  try {
    // Makinanın BOM yapısını al
    const items = makinaData.items || [];
    const allParts = [];
    const kritikStokParcalari = [];
    
    // Makina içindeki tüm parçaları (direkt veya alt gruplar içinden) topla
    const processItems = async (items, parentPath = '', multiplier = 1) => {
      for (const item of items) {
        const itemQuantity = (item.quantity || 1) * multiplier;
        const itemPath = parentPath ? `${parentPath} > ${item.name}` : item.name;
        
        if (item.type === 'PART') {
          // Parça bilgisini ve üretimdeki toplam adedini kaydet
          const parcaBilgisi = {
            parcaKodu: item.id,
            parcaAdi: item.name,
            miktar: itemQuantity * miktar,
            path: itemPath
          };
          
          // Veritabanından parçanın stok bilgisini kontrol et
          const parcaDetay = await Parca.findByPk(item.id);
          if (parcaDetay) {
            parcaBilgisi.stokMiktari = parcaDetay.stokAdeti || 0;
            parcaBilgisi.kritikStokMiktari = parcaDetay.kritik_stok || 0;
            
            // Üretim sonrası kalan stok miktarı
            const kalanStok = parcaBilgisi.stokMiktari - parcaBilgisi.miktar;
            parcaBilgisi.uretimSonrasiStok = kalanStok;
            
            // Kritik stok kontrolü
            if (kalanStok < parcaBilgisi.kritikStokMiktari) {
              parcaBilgisi.kritikStokUyarisi = true;
              kritikStokParcalari.push({
                ...parcaBilgisi,
                eksikMiktar: parcaBilgisi.kritikStokMiktari - kalanStok
              });
            } else {
              parcaBilgisi.kritikStokUyarisi = false;
            }
          }
          
          allParts.push(parcaBilgisi);
        } else if (item.type === 'BOM' && item.subItems) {
          // Alt grup içindeki parçaları işle
          await processItems(item.subItems, itemPath, itemQuantity);
        }
      }
    };
    
    await processItems(items);
    
    return {
      allParts,
      kritikStokParcalari
    };
  } catch (error) {
    console.error('Parça listesi oluşturulurken hata:', error);
    throw error;
  }
};

// Yeni üretim planı oluştur
exports.createUretimPlani = async (req, res) => {
  try {
    const { makina_id, miktar, teslim_tarihi, aciklama, ozel_parca_listesi, plan_tipi, ozel_liste_adi } = req.body;
    
    let allParts = [];
    let kritikStokParcalari = [];
    let makina = null;
    
    // Üretim planı tipi makina seçimi mi yoksa özel liste mi?
    if (plan_tipi === 'ozel_liste' && ozel_parca_listesi) {
      // Özel liste durumunda, parçaların kritik stok kontrolünü yap
      allParts = Array.isArray(ozel_parca_listesi) ? ozel_parca_listesi : [];
      
      // Özel listedeki parçaların kritik stok kontrolü
      for (const parcaBilgisi of allParts) {
        const parcaDetay = await Parca.findByPk(parcaBilgisi.parcaKodu);
        if (parcaDetay) {
          // Veritabanındaki alan adlarına göre dinamik olarak belirleme
          parcaBilgisi.stokMiktari = parcaDetay.stokMiktari || parcaDetay.stokAdeti || 0;
          parcaBilgisi.kritikStokMiktari = parcaDetay.kritikStokMiktari || parcaDetay.kritik_stok || 0;
          
          // Üretim sonrası kalan stok miktarı
          const kalanStok = parcaBilgisi.stokMiktari - parcaBilgisi.miktar;
          parcaBilgisi.uretimSonrasiStok = kalanStok;
          
          // Kritik stok kontrolü
          if (kalanStok < parcaBilgisi.kritikStokMiktari) {
            parcaBilgisi.kritikStokUyarisi = true;
            kritikStokParcalari.push({
              ...parcaBilgisi,
              eksikMiktar: parcaBilgisi.kritikStokMiktari - kalanStok
            });
          } else {
            parcaBilgisi.kritikStokUyarisi = false;
          }
        }
      }
    } else {
      // Makina seçimi durumu - mevcut mantık
      makina = await Makina.findByPk(makina_id);
      if (!makina) {
        return res.status(404).json({ message: 'Makina bulunamadı' });
      }
      
      // Parça listesini oluştur ve kritik stok kontrolü yap
      const sonuc = await createPartsList(makina, miktar);
      allParts = sonuc.allParts;
      kritikStokParcalari = sonuc.kritikStokParcalari;
    }
    
    // Üretim planı oluştur
    const uretimPlani = await UretimPlani.create({
      makina_id: plan_tipi === 'ozel_liste' ? null : makina_id,
      miktar,
      teslim_tarihi,
      aciklama,
      bom_snapshot: allParts,
      kritik_stok_uyarisi: kritikStokParcalari.length > 0 ? kritikStokParcalari : null,
      ozel_liste_adi: plan_tipi === 'ozel_liste' ? ozel_liste_adi : null
    });
    
    // İlişkili makina bilgisini ekleyelim (eğer makina seçilmişse)
    const uretimPlaniPlain = uretimPlani.get({ plain: true });
    
    const uretimPlaniWithMakina = {
      ...uretimPlaniPlain,
      makina: makina ? {
        name: makina.name,
        model: makina.model
      } : null
    };
    
    // Yanıtı oluşturalım - tüm gerekli bilgileri açık bir şekilde ekleyelim
    const response = {
      uretimPlani: uretimPlaniWithMakina,
      parcaListesi: allParts,
      kritikStokParcalari: kritikStokParcalari,
      plan_tipi: plan_tipi || 'makina'
    };
    
    res.status(201).json(response);
  } catch (error) {
    console.error('Üretim planı oluşturulurken hata:', error);
    res.status(500).json({ error: error.message });
  }
};

// İş emri tabanlı üretim planı oluştur
exports.createIsEmriTabanliUretimPlani = async (req, res) => {
  try {
    const { plan_adi, is_emirleri, durum } = req.body;
    
    if (!plan_adi || !plan_adi.trim()) {
      return res.status(400).json({ error: 'Plan adı gereklidir' });
    }
    
    if (!is_emirleri || !Array.isArray(is_emirleri) || is_emirleri.length === 0) {
      return res.status(400).json({ error: 'En az bir iş emri gereklidir' });
    }
    
    // Üretim planını oluştur
    const uretimPlani = await UretimPlani.create({
      makina_id: null, // İş emri tabanlı planlar için makina seçimi yok
      miktar: 1, // Varsayılan değer
      teslim_tarihi: new Date(), // Varsayılan olarak bugün
      durum: durum || 'Planlandı',
      aciklama: `İş emri tabanlı plan: ${plan_adi}`,
      ozel_liste_adi: plan_adi,
      bom_snapshot: is_emirleri // İş emirlerini snapshot olarak kaydet
    });
    
    // İş emirlerini bu üretim planına ata
    const isEmriIds = is_emirleri.map(ie => ie.is_emri_id).filter(id => id);
    
    if (isEmriIds.length > 0) {
      await IsEmri.update(
        { uretim_plani_id: uretimPlani.id },
        { where: { is_emri_id: isEmriIds } }
      );
    }
    
    // Oluşturulan planı iş emirleri ile birlikte döndür
    const createdPlan = await UretimPlani.findByPk(uretimPlani.id, {
      include: [
        {
          model: IsEmri,
          as: 'is_emirleri'
        }
      ]
    });
    
    res.status(201).json({
      success: true,
      message: 'Üretim planı başarıyla oluşturuldu',
      uretimPlani: createdPlan
    });
    
  } catch (error) {
    console.error('İş emri tabanlı üretim planı oluşturulurken hata:', error);
    res.status(500).json({ error: error.message });
  }
};

// Üretim planını güncelle
exports.updateUretimPlani = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      makina_id, 
      miktar, 
      teslim_tarihi, 
      durum, 
      aciklama, 
      ozel_liste_adi,
      plan_adi,
      is_emirleri,
      fason_isleri
    } = req.body;
    
    const uretimPlani = await UretimPlani.findByPk(id);
    if (!uretimPlani) {
      return res.status(404).json({ message: 'Üretim planı bulunamadı' });
    }
    
    // Karma üretim planı güncellemesi (is_emirleri veya fason_isleri varsa)
    if (is_emirleri || fason_isleri) {
      return await updateKarmaUretimPlani(req, res, uretimPlani);
    }
    
    // Normal makina-tabanlı üretim planı güncellemesi
    // Makina değiştiyse veya miktar değiştiyse BOM snapshot'ı güncelle
    let bom_snapshot = uretimPlani.bom_snapshot;
    let kritik_stok_uyarisi = uretimPlani.kritik_stok_uyarisi;
    
    if (makina_id !== uretimPlani.makina_id || miktar !== uretimPlani.miktar) {
      const makina = await Makina.findByPk(makina_id || uretimPlani.makina_id);
      if (!makina) {
        return res.status(404).json({ message: 'Makina bulunamadı' });
      }
      
      const { allParts, kritikStokParcalari } = await createPartsList(
        makina, 
        miktar || uretimPlani.miktar
      );
      
      bom_snapshot = allParts;
      kritik_stok_uyarisi = kritikStokParcalari.length > 0 ? kritikStokParcalari : null;
    }
    
    // Üretim planını güncelle
    await uretimPlani.update({
      makina_id: makina_id || uretimPlani.makina_id,
      miktar: miktar || uretimPlani.miktar,
      teslim_tarihi: teslim_tarihi || uretimPlani.teslim_tarihi,
      durum: durum || uretimPlani.durum,
      aciklama: aciklama !== undefined ? aciklama : uretimPlani.aciklama,
      bom_snapshot,
      kritik_stok_uyarisi,
      ozel_liste_adi: ozel_liste_adi !== undefined ? ozel_liste_adi : uretimPlani.ozel_liste_adi
    });
    
    res.json({
      message: 'Üretim planı güncellendi',
      uretimPlani: await UretimPlani.findByPk(id)
    });
  } catch (error) {
    console.error('Üretim planı güncellenirken hata:', error);
    res.status(500).json({ error: error.message });
  }
};

// Karma üretim planını güncelle (yardımcı fonksiyon)
const updateKarmaUretimPlani = async (req, res, uretimPlani) => {
  const transaction = await sequelize.transaction(); // Doğru transaction kullanımı
  
  try {
    const { 
      plan_adi, 
      aciklama, 
      is_emirleri = [], 
      fason_isleri = [] 
    } = req.body;
    
    // Üretim planı temel bilgilerini güncelle
    await uretimPlani.update({
      ozel_liste_adi: plan_adi || uretimPlani.ozel_liste_adi,
      aciklama: aciklama !== undefined ? aciklama : uretimPlani.aciklama,
      durum: 'aktif',
      guncelleme_tarihi: new Date()
    }, { transaction });
    
    // Mevcut iş emirlerinin üretim planı bağlantısını kaldır
    await IsEmri.update(
      { uretim_plani_id: null },
      { 
        where: { uretim_plani_id: uretimPlani.id },
        transaction 
      }
    );
    
    // Mevcut fason işlerinin üretim planı bağlantısını kaldır
    await FasonIsEmri.update(
      { uretim_plani_id: null },
      { 
        where: { uretim_plani_id: uretimPlani.id },
        transaction 
      }
    );
    
    // Yeni iş emirlerini bağla
    if (is_emirleri.length > 0) {
      const isEmriIds = is_emirleri.map(ie => ie.is_emri_id).filter(Boolean);
      if (isEmriIds.length > 0) {
        await IsEmri.update(
          { uretim_plani_id: uretimPlani.id },
          { 
            where: { is_emri_id: isEmriIds },
            transaction 
          }
        );
      }
    }
    
    // Yeni fason işlerini bağla
    if (fason_isleri.length > 0) {
      const fasonIds = fason_isleri.map(f => f.fason_is_emri_id).filter(Boolean);
      if (fasonIds.length > 0) {
        await FasonIsEmri.update(
          { uretim_plani_id: uretimPlani.id },
          { 
            where: { fason_is_emri_id: fasonIds },
            transaction 
          }
        );
      }
    }
    
    await transaction.commit();
    
    // Güncellenmiş üretim planını döndür
    const updatedPlan = await UretimPlani.findByPk(uretimPlani.id, {
      include: [
        {
          model: IsEmri,
          as: 'is_emirleri',
          include: [{ model: Parca, as: 'parca' }]
        },
        {
          model: FasonIsEmri,
          as: 'fason_is_emirleri',
          include: [{ model: FasonGrup, as: 'fason_grup' }]
        }
      ]
    });
    
    res.json({
      message: 'Karma üretim planı başarıyla güncellendi',
      uretimPlani: updatedPlan,
      stats: {
        toplam_is_emri: is_emirleri.length,
        toplam_fason_is_emri: fason_isleri.length,
        plan_tipi: 'karma'
      }
    });
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

// Üretim planını sil
exports.deleteUretimPlani = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    
    const uretimPlani = await UretimPlani.findByPk(id);
    if (!uretimPlani) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Üretim planı bulunamadı' });
    }
    
    // Önce ilişkili iş emirlerinin bağlantısını kaldır
    await IsEmri.update(
      { uretim_plani_id: null },
      { 
        where: { uretim_plani_id: id },
        transaction 
      }
    );
    
    // İlişkili fason işlerinin bağlantısını kaldır
    await FasonIsEmri.update(
      { uretim_plani_id: null },
      { 
        where: { uretim_plani_id: id },
        transaction 
      }
    );
    
    // Son olarak üretim planını sil
    await uretimPlani.destroy({ transaction });
    
    await transaction.commit();
    
    res.json({ 
      success: true,
      message: 'Üretim planı başarıyla silindi' 
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Üretim planı silinirken hata:', error);
    res.status(500).json({ 
      success: false,
      error: error.message,
      message: 'Üretim planı silinirken hata oluştu' 
    });
  }
};

// Kritik stok parçasını iş emrine ekle
exports.parcayiIsEmrineEkle = async (req, res) => {
  try {
    const { parcaKodu, miktar, aciklama } = req.body;
    
    // Parça bilgisini kontrol et
    const parca = await Parca.findByPk(parcaKodu);
    if (!parca) {
      return res.status(404).json({ message: 'Parça bulunamadı' });
    }
    
    // TODO: Bu kısmı isEmirleriController.js içindeki createIsEmri fonksiyonuna benzer şekilde
    // özelleştir ve iş emri oluştur
    
    // Şimdilik basit bir yanıt dön
    res.status(201).json({
      message: 'Parça için iş emri oluşturuldu',
      isEmri: {
        is_adi: `${parca.parcaKodu} Üretim`,
        plan_liste_no: 'Plan Dışı',
        adet: miktar,
        malzeme: parca.malzeme || 'Belirtilmedi',
        aciklama: aciklama || `${parca.parcaKodu} parçası için kritik stok nedeniyle oluşturulan iş emri`
      }
    });
  } catch (error) {
    console.error('İş emri oluşturulurken hata:', error);
    res.status(500).json({ error: error.message });
  }
};

// BOM Analizi - Makina için parça listesi ve stok analizi döndür
exports.bomAnalizi = async (req, res) => {
  try {
    const { makina_id, miktar } = req.body;
    
    if (!makina_id || !miktar) {
      return res.status(400).json({ 
        message: 'Makina ID ve miktar gerekli' 
      });
    }
    
    // Makina bilgisini al
    const makina = await Makina.findByPk(makina_id);
    if (!makina) {
      return res.status(404).json({ message: 'Makina bulunamadı' });
    }
    
    // Parça listesini oluştur ve kritik stok kontrolü yap
    const { allParts, kritikStokParcalari } = await createPartsList(makina, miktar);
    
    // Makina temel bilgileri
    const makinaBilgisi = {
      id: makina.id,
      name: makina.name,
      model: makina.model
    };
    
    // Analiz sonuçları
    const analizSonucu = {
      makina: makinaBilgisi,
      miktar: miktar,
      parcaListesi: allParts,
      kritikStokParcalari: kritikStokParcalari,
      toplamParcaTuru: allParts.length,
      kritikParcaSayisi: kritikStokParcalari.length,
      yeterliStokParcaSayisi: allParts.filter(p => !p.kritikStokUyarisi).length,
      analizTarihi: new Date()
    };
    
    res.json(analizSonucu);
  } catch (error) {
    console.error('BOM analizi yapılırken hata:', error);
    res.status(500).json({ error: error.message });
  }
};

// Karma üretim planı oluştur (iş emri + fason)
exports.createKarmaUretimPlani = async (req, res) => {
  try {
    const { plan_adi, is_emirleri = [], fason_is_emirleri = [], durum = 'aktif', aciklama } = req.body;
    
    // Validasyon
    if (!plan_adi || !plan_adi.trim()) {
      return res.status(400).json({ error: 'Plan adı gereklidir' });
    }
    
    if (is_emirleri.length === 0 && fason_is_emirleri.length === 0) {
      return res.status(400).json({ error: 'En az bir iş emri veya fason iş emri gereklidir' });
    }
    
    console.log(`[DEBUG] Karma üretim planı oluşturuluyor: ${plan_adi}`);
    console.log(`[DEBUG] İş emirleri: ${is_emirleri.length}, Fason iş emirleri: ${fason_is_emirleri.length}`);
    
    // Üretim planını oluştur
    const uretimPlani = await UretimPlani.create({
      makina_id: null, // Karma planlar için makina seçimi yok
      miktar: 1,
      teslim_tarihi: new Date(),
      durum: durum,
      aciklama: aciklama || `Karma plan: ${plan_adi}`,
      ozel_liste_adi: plan_adi,
      bom_snapshot: {
        is_emirleri: is_emirleri,
        fason_is_emirleri: fason_is_emirleri,
        olusturma_tarihi: new Date()
      }
    });
    
    // İş emirlerini bu üretim planına ata
    if (is_emirleri.length > 0) {
      const isEmriIds = is_emirleri.map(ie => ie.is_emri_id).filter(id => id);
      
      if (isEmriIds.length > 0) {
        await IsEmri.update(
          { uretim_plani_id: uretimPlani.id },
          { where: { is_emri_id: isEmriIds } }
        );
        console.log(`[DEBUG] ${isEmriIds.length} iş emri üretim planına atandı`);
      }
    }
    
    // Fason iş emirlerini bu üretim planına ata
    if (fason_is_emirleri.length > 0) {
      const fasonIsEmriIds = fason_is_emirleri.map(fie => fie.fason_is_emri_id).filter(id => id);
      
      if (fasonIsEmriIds.length > 0) {
        await FasonIsEmri.update(
          { uretim_plani_id: uretimPlani.id },
          { where: { fason_is_emri_id: fasonIsEmriIds } }
        );
        console.log(`[DEBUG] ${fasonIsEmriIds.length} fason iş emri üretim planına atandı`);
      }
    }
    
    // Oluşturulan planı detaylarıyla birlikte döndür
    const createdPlan = await UretimPlani.findByPk(uretimPlani.id, {
      include: [
        {
          model: IsEmri,
          as: 'is_emirleri',
          include: [
            { model: Parca, as: 'parca' }
          ]
        },
        {
          model: FasonIsEmri,
          as: 'fason_is_emirleri',
          include: [
            { model: Parca, as: 'parca' },
            { model: FasonGrup, as: 'fason_grup' }
          ]
        }
      ]
    });
    
    res.status(201).json({
      success: true,
      message: 'Karma üretim planı başarıyla oluşturuldu',
      uretimPlani: createdPlan,
      stats: {
        toplam_is_emri: is_emirleri.length,
        toplam_fason_is_emri: fason_is_emirleri.length,
        plan_tipi: 'karma'
      }
    });
    
  } catch (error) {
    console.error('Karma üretim planı oluşturulurken hata:', error);
    res.status(500).json({ 
      success: false,
      error: error.message,
      message: 'Karma üretim planı oluşturulurken hata oluştu'
    });
  }
};

// İş emrini üretim planına ekle
exports.addIsEmriToUretimPlani = async (req, res) => {
  try {
    const { id } = req.params; // Üretim planı ID'si
    const { is_emri_id: isEmriId } = req.body; // İş emri ID'si
    
    // Üretim planının var olduğunu kontrol et
    const uretimPlani = await UretimPlani.findByPk(id);
    if (!uretimPlani) {
      return res.status(404).json({ error: 'Üretim planı bulunamadı' });
    }
    
    // İş emrinin var olduğunu kontrol et
    const isEmri = await IsEmri.findByPk(isEmriId);
    if (!isEmri) {
      return res.status(404).json({ error: 'İş emri bulunamadı' });
    }
    
    // İş emrini üretim planına ata
    await IsEmri.update(
      { uretim_plani_id: id },
      { where: { is_emri_id: isEmriId } }
    );
    
    // Güncellenmiş planı döndür
    const updatedPlan = await UretimPlani.findByPk(id, {
      include: [
        {
          model: IsEmri,
          as: 'is_emirleri',
          include: [
            { model: Parca, as: 'parca' }
          ]
        }
      ]
    });
    
    res.json({ 
      success: true,
      message: 'İş emri başarıyla üretim planına eklendi',
      uretimPlani: updatedPlan
    });
    
  } catch (error) {
    console.error('İş emri üretim planına eklenirken hata:', error);
    res.status(500).json({ error: error.message });
  }
};

// İş emrini üretim planından çıkar
exports.removeIsEmriFromUretimPlani = async (req, res) => {
  try {
    const { id } = req.params; // Üretim planı ID'si
    const { is_emri_id: isEmriId } = req.body; // İş emri ID'si
    
    // Üretim planının var olduğunu kontrol et
    const uretimPlani = await UretimPlani.findByPk(id);
    if (!uretimPlani) {
      return res.status(404).json({ error: 'Üretim planı bulunamadı' });
    }
    
    // İş emrinin var olduğunu kontrol et
    const isEmri = await IsEmri.findByPk(isEmriId);
    if (!isEmri) {
      return res.status(404).json({ error: 'İş emri bulunamadı' });
    }
    
    // İş emrini üretim planından çıkar
    await IsEmri.update(
      { uretim_plani_id: null },
      { where: { is_emri_id: isEmriId } }
    );
    
    // Güncellenmiş planı döndür
    const updatedPlan = await UretimPlani.findByPk(id, {
      include: [
        {
          model: IsEmri,
          as: 'is_emirleri',
          include: [
            { model: Parca, as: 'parca' }
          ]
        }
      ]
    });
    
    res.json({ 
      success: true,
      message: 'İş emri başarıyla üretim planından çıkarıldı',
      uretimPlani: updatedPlan
    });
    
  } catch (error) {
    console.error('İş emri üretim planından çıkarılırken hata:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Excel'den üretim planı oluştur
 * Parça listesini alır, eksik parçaları oluşturur ve iş emirleri oluşturur
 */
exports.excelImport = async (req, res) => {
  try {
    const { parcaListesi, eksikParcalar, createMissingParts = true } = req.body;
    
    if (!parcaListesi || !Array.isArray(parcaListesi) || parcaListesi.length === 0) {
      return res.status(400).json({ 
        success: false,
        error: 'parcaListesi gereklidir ve boş olamaz' 
      });
    }

    const transaction = await sequelize.transaction();
    
    try {
      const results = {
        olustrulanParcalar: [],
        olustrulanIsEmirleri: [],
        hatalar: []
      };

      // Stok kartlarını getir (malzeme eşleştirme için)
      const stokKartlari = await StokKarti.findAll({
        attributes: ['stok_karti_id', 'stok_kodu', 'stok_adi', 'cinsi', 'olcu'],
        transaction
      });

      // 1. Eksik parçaları oluştur (createMissingParts true ise)
      if (createMissingParts && eksikParcalar && eksikParcalar.length > 0) {
        for (const eksikParcaAdi of eksikParcalar) {
          // Excel'den bu parça için detayları bul
          const parcaDetay = parcaListesi.find(p => p.parcaAdi === eksikParcaAdi);
          if (!parcaDetay) continue;

          try {
            // Akıllı malzeme eşleştirme
            const matchedStokKarti = smartMaterialMatching(parcaDetay, stokKartlari);
            
            // Yeni parça oluştur
            const yeniParca = await Parca.create({
              parcaKodu: parcaDetay.parcaAdi,
              parcaAdi: parcaDetay.parcaAdi,
              hamMalzemeOlculeri: parcaDetay.kesit || '',
              uzunluk: parcaDetay.boy ? parseFloat(parcaDetay.boy) : null,
              hamMalzemeCinsi: parcaDetay.malzeme || '',
              stok_karti_id: matchedStokKarti?.stok_karti_id || null,
              imalMi: true,
              createdAt: new Date(),
              updatedAt: new Date()
            }, { transaction });

            results.olustrulanParcalar.push({
              parcaKodu: yeniParca.parcaKodu,
              parcaAdi: yeniParca.parcaAdi,
              stokKartiId: yeniParca.stok_karti_id,
              matchedStokKarti: matchedStokKarti
            });

          } catch (error) {
            console.error(`Parça oluşturma hatası (${eksikParcaAdi}):`, error);
            results.hatalar.push({
              parcaAdi: eksikParcaAdi,
              hata: error.message,
              tip: 'parca_olusturma'
            });
          }
        }
      }

      // 2. Her parça için iş emri oluştur
      
      for (const parcaItem of parcaListesi) {
        try {
          // Parçayı veritabanından bul (yeni oluşturulan veya mevcut)
          const parca = await Parca.findOne({
            where: {
              [Op.or]: [
                { parcaKodu: parcaItem.parcaAdi },
                { parcaAdi: parcaItem.parcaAdi }
              ]
            },
            transaction
          });

          if (!parca) {
            results.hatalar.push({
              parcaAdi: parcaItem.parcaAdi,
              hata: 'Parça bulunamadı ve oluşturulamadı',
              tip: 'parca_bulunamadi'
            });
            continue;
          }

          // İş emri numarası oluştur
          const isEmriNo = await generateIsEmriNo(transaction);

          // İş emri oluştur
          const yeniIsEmri = await IsEmri.create({
            is_emri_no: isEmriNo,
            parca_kodu: parca.parcaKodu,
            is_adi: `Excel Import - ${parca.parcaAdi}`,
            adet: parcaItem.adet || 1,
            durum: 'beklemede',
            is_tipi: 'normal',
            olusturma_tarihi: new Date(),
            guncelleme_tarihi: new Date()
          }, { transaction });

          results.olustrulanIsEmirleri.push({
            is_emri_id: yeniIsEmri.is_emri_id,
            is_emri_no: yeniIsEmri.is_emri_no,
            parca_kodu: yeniIsEmri.parca_kodu,
            is_adi: yeniIsEmri.is_adi,
            adet: yeniIsEmri.adet,
            durum: yeniIsEmri.durum,
            parca: {
              parcaKodu: parca.parcaKodu,
              parcaAdi: parca.parcaAdi,
              foto_path: parca.foto_path
            }
          });

        } catch (error) {
          console.error(`İş emri oluşturma hatası (${parcaItem.parcaAdi}):`, error);
          results.hatalar.push({
            parcaAdi: parcaItem.parcaAdi,
            hata: error.message,
            tip: 'is_emri_olusturma'
          });
        }
      }

      // Transaction'ı commit et
      await transaction.commit();

      // Başarı yanıtı
      res.json({
        success: true,
        message: `Excel import başarıyla tamamlandı. ${results.olustrulanParcalar.length} parça, ${results.olustrulanIsEmirleri.length} iş emri oluşturuldu.`,
        data: {
          planAdi: `Excel Import - ${new Date().toLocaleDateString('tr-TR')}`,
          isEmirleri: results.olustrulanIsEmirleri,
          olustrulanParcalar: results.olustrulanParcalar,
          hatalar: results.hatalar,
          istatistikler: {
            toplamParça: parcaListesi.length,
            olustrulanParcaSayisi: results.olustrulanParcalar.length,
            olustrulanIsEmriSayisi: results.olustrulanIsEmirleri.length,
            hataSayisi: results.hatalar.length
          }
        }
      });

    } catch (error) {
      // Hata durumunda transaction'ı rollback et
      await transaction.rollback();
      throw error;
    }

  } catch (error) {
    console.error('Excel import hatası:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

/**
 * Akıllı malzeme eşleştirme algoritması
 */
function smartMaterialMatching(parcaDetay, stokKartlari) {
  if (!parcaDetay.malzeme && !parcaDetay.kesit) return null;
  
  let bestMatch = null;
  let bestScore = 0;

  for (const stok of stokKartlari) {
    let score = 0;
    
    // Malzeme cinsi eşleştirmesi
    if (parcaDetay.malzeme && stok.cinsi) {
      const parcaMalzeme = parcaDetay.malzeme.toUpperCase();
      const stokCinsi = stok.cinsi.toUpperCase();
      
      if (stokCinsi.includes(parcaMalzeme) || parcaMalzeme.includes(stokCinsi)) {
        score += 50;
      }
      
      // Özel malzeme türleri için bonus
      if ((parcaMalzeme.includes('SOĞUK') && stokCinsi.includes('SOĞUK')) ||
          (parcaMalzeme.includes('SICAK') && stokCinsi.includes('SICAK')) ||
          (parcaMalzeme.includes('GALVANIZ') && stokCinsi.includes('GALVANIZ'))) {
        score += 30;
      }
    }
    
    // Kesit/ölçü eşleştirmesi
    if (parcaDetay.kesit && stok.olcu) {
      const parcaKesit = parcaDetay.kesit.toUpperCase().replace(/[^0-9X]/g, '');
      const stokOlcu = stok.olcu.toUpperCase().replace(/[^0-9X]/g, '');
      
      if (parcaKesit === stokOlcu) {
        score += 40;
      } else if (parcaKesit.includes(stokOlcu) || stokOlcu.includes(parcaKesit)) {
        score += 20;
      }
    }
    
    // Stok kodu ile parça adı benzerliği
    if (stok.stok_kodu && parcaDetay.parcaAdi) {
      const stokKodu = stok.stok_kodu.toUpperCase();
      const parcaAdi = parcaDetay.parcaAdi.toUpperCase();
      
      if (stokKodu.includes(parcaAdi.substring(0, 4)) || 
          parcaAdi.includes(stokKodu.substring(0, 4))) {
        score += 10;
      }
    }
    
    if (score > bestScore) {
      bestScore = score;
      bestMatch = stok;
    }
  }
  
  // Minimum eşik skoru (50)
  return bestScore >= 50 ? bestMatch : null;
}

/**
 * Yeni iş emri numarası oluştur
 */
async function generateIsEmriNo(transaction = null) {
  
  // Son iş emrini bul
  const sonIsEmri = await IsEmri.findOne({
    order: [['is_emri_id', 'DESC']],
    attributes: ['is_emri_no'],
    transaction
  });
  
  if (sonIsEmri && sonIsEmri.is_emri_no) {
    // Mevcut numaradan sonrakini oluştur
    const sonNo = parseInt(sonIsEmri.is_emri_no.replace(/[^\d]/g, '')) || 0;
    return `IE${String(sonNo + 1).padStart(6, '0')}`;
  } else {
    // İlk iş emri
    return 'IE000001';
  }
}