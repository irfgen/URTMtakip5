const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const MakinaSinifi = require('../models/MakinaSinifi');
const Makina = require('../models/Makina');
const Bom = require('../models/Bom');
const Parca = require('../models/Parca');

/**
 * Makindex Controller - Hiyerarşik yapılandırma sistemi
 */

// Tüm makina sınıflarını listele
exports.getSiniflar = async (req, res) => {
  try {
    const { includeCount = true } = req.query;

    let siniflar;
    if (includeCount === 'true') {
      siniflar = await MakinaSinifi.getSiniflarWithMakinaCount();
    } else {
      siniflar = await MakinaSinifi.getActiveSiniflar();
    }

    res.status(200).json({
      success: true,
      data: siniflar,
      message: 'Makina sınıfları başarıyla listelendi'
    });
  } catch (error) {
    console.error('Makina sınıfları alınırken hata:', error);
    res.status(500).json({
      success: false,
      message: 'Makina sınıfları alınırken bir hata oluştu',
      error: error.message
    });
  }
};

// Sınıfa ait makinaları getir
exports.getMakinalarBySinifId = async (req, res) => {
  try {
    const { sinifId } = req.params;
    const { includeBomCount = false } = req.query;

    if (!sinifId || isNaN(sinifId)) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz sınıf ID'
      });
    }

    const makinalar = await Makina.getMakinalarBySinifId(parseInt(sinifId));

    res.status(200).json({
      success: true,
      data: makinalar,
      message: 'Makinalar başarıyla listelendi'
    });
  } catch (error) {
    console.error('Makinalar alınırken hata:', error);
    res.status(500).json({
      success: false,
      message: 'Makinalar alınırken bir hata oluştu',
      error: error.message
    });
  }
};

// Makinaya ait BOM'ları getir (grup formatında)
exports.getBomsByMakinaId = async (req, res) => {
  try {
    const { makinaId } = req.params;
    const { format = 'bom' } = req.query;

    console.log('🎯 Controller getBomsByMakinaId çağrıldı, makinaId:', makinaId);

    if (!makinaId) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz makina ID'
      });
    }

    const boms = await Bom.getBomsByMakinaId(makinaId);
    console.log('📦 Controller Bom.getBomsByMakinaId sonucu:', boms?.length || 0, 'BOM');

    let responseData;
    if (format === 'grup') {
      // BOM verilerini grup formatına dönüştür
      responseData = boms.map(bom => Bom.transformToGroupFormat(bom));
    } else {
      responseData = boms;
    }

    console.log('📤 API yanıtı gönderiliyor, data length:', responseData?.length || 0);

    res.status(200).json({
      success: true,
      data: responseData,
      format: format,
      message: format === 'grup' ? 'Gruplar başarıyla listelendi' : 'BOM\'lar başarıyla listelendi'
    });
  } catch (error) {
    console.error('BOM\'lar alınırken hata:', error);
    res.status(500).json({
      success: false,
      message: 'BOM\'lar alınırken bir hata oluştu',
      error: error.message
    });
  }
};

// BOM'a ait parçaları getir
exports.getParcalarByBomId = async (req, res) => {
  try {
    const { bomId } = req.params;

    if (!bomId || isNaN(bomId)) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz BOM ID'
      });
    }

    const parcalar = await Bom.getParcalarByBomId(parseInt(bomId));

    res.status(200).json({
      success: true,
      data: parcalar,
      message: 'Parçalar başarıyla listelendi'
    });
  } catch (error) {
    console.error('Parçalar alınırken hata:', error);
    res.status(500).json({
      success: false,
      message: 'Parçalar alınırken bir hata oluştu',
      error: error.message
    });
  }
};

// Global arama fonksiyonu
exports.globalAra = async (req, res) => {
  try {
    const { q: query, type, limit = 20, offset = 0 } = req.query;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Arama terimi en az 2 karakter olmalıdır'
      });
    }

    const searchTerm = query.trim();
    const results = [];

    // Makina sınıflarında ara
    if (!type || type === 'sinif') {
      const siniflar = await MakinaSinifi.findAll({
        where: {
          [Op.or]: [
            { ad: { [Op.like]: `%${searchTerm}%` } },
            { aciklama: { [Op.like]: `%${searchTerm}%` } }
          ],
          aktif: true
        },
        limit: parseInt(limit)
      });

      siniflar.forEach(sinif => {
        results.push({
          type: 'sinif',
          id: sinif.id,
          ad: sinif.ad,
          aciklama: sinif.aciklama,
          path: sinif.ad,
          url: `/makindex/sinif/${sinif.id}`
        });
      });
    }

    // Makinalarda ara
    if (!type || type === 'makina') {
      const makinalar = await Makina.findAll({
        where: {
          [Op.or]: [
            { name: { [Op.like]: `%${searchTerm}%` } },
            { model: { [Op.like]: `%${searchTerm}%` } },
            { description: { [Op.like]: `%${searchTerm}%` } }
          ]
        },
        include: [
          {
            model: MakinaSinifi,
            as: 'makinaSinifi',
            attributes: ['id', 'ad']
          }
        ],
        limit: parseInt(limit)
      });

      makinalar.forEach(makina => {
        results.push({
          type: 'makina',
          id: makina.makina_id,
          ad: makina.name,
          model: makina.model,
          path: makina.makinaSinifi ? `${makina.makinaSinifi.ad} > ${makina.name}` : makina.name,
          url: `/makindex/makina/${makina.makina_id}`
        });
      });
    }

    // BOM'larda ara
    if (!type || type === 'bom') {
      const boms = await Bom.findAll({
        where: {
          [Op.or]: [
            { name: { [Op.like]: `%${searchTerm}%` } },
            { bom_aciklamasi: { [Op.like]: `%${searchTerm}%` } },
            { bom_kodu: { [Op.like]: `%${searchTerm}%` } }
          ]
        },
        limit: parseInt(limit)
      });

      for (const bom of boms) {
        // BOM'un bağlı olduğu makinaları bul
        const makinalar = await Bom.getBomsByMakinaId(bom.id);
        if (makinalar.length > 0) {
          results.push({
            type: 'bom',
            id: bom.id,
            ad: bom.name,
            bom_kodu: bom.bom_kodu,
            path: `BOM: ${bom.name}`,
            url: `/makindex/bom/${bom.id}`
          });
        }
      }
    }

    // Parçalarda ara
    if (!type || type === 'parca') {
      const parcalar = await Parca.findAll({
        where: {
          [Op.or]: [
            { parca_kodu: { [Op.like]: `%${searchTerm}%` } },
            { parcaAdi: { [Op.like]: `%${searchTerm}%` } },
            { kategori: { [Op.like]: `%${searchTerm}%` } }
          ]
        },
        limit: parseInt(limit)
      });

      for (const parca of parcalar) {
        // Parçanın bağlı olduğu BOM'ları bul
        const bomQuery = `
          SELECT DISTINCT b.id, b.name, b.bom_kodu
          FROM bom_parcalar bp
          JOIN boms b ON bp.bomId = b.id
          WHERE bp.parcaKodu = ?
          LIMIT 5
        `;

        const boms = await sequelize.query(bomQuery, {
          replacements: [parca.parcaKodu],
          type: sequelize.QueryTypes.SELECT
        });

        if (boms.length > 0) {
          results.push({
            type: 'parca',
            id: parca.parca_kodu,
            ad: parca.parcaAdi,
            parca_kodu: parca.parca_kodu,
            stokAdeti: parca.stokAdeti,
            kritik_stok: parca.kritik_stok,
            path: `Parça: ${parca.parcaAdi} (${parca.parca_kodu})`,
            url: `/parcalar/${parca.parca_kodu}`
          });
        }
      }
    }

    // Sonuçları tip'e göre grupla ve limit uygula
    const groupedResults = {};
    results.forEach(item => {
      if (!groupedResults[item.type]) {
        groupedResults[item.type] = [];
      }
      if (groupedResults[item.type].length < parseInt(limit)) {
        groupedResults[item.type].push(item);
      }
    });

    res.status(200).json({
      success: true,
      data: groupedResults,
      total: results.length,
      query: searchTerm,
      message: 'Arama sonuçları başarıyla getirildi'
    });
  } catch (error) {
    console.error('Arama yapılırken hata:', error);
    res.status(500).json({
      success: false,
      message: 'Arama yapılırken bir hata oluştu',
      error: error.message
    });
  }
};

// Başlangıç verilerini yükle
exports.seedData = async (req, res) => {
  try {
    // Mevcut makinaları getir
    const mevcutMakinalar = await Makina.findAll({
      attributes: ['makina_id', 'name']
    });

    // Makindex.md'deki makinaları sınıflara ata
    const makinaAtamalari = [
      // Panel Ebatlama Sınıfı
      { name: 'DRAGON PE 420-5', sinifAd: 'Panel Ebatlama Sınıfı' },
      { name: 'DRAGON PE 383', sinifAd: 'Panel Ebatlama Sınıfı' },
      { name: 'DRAGON PE 420-4', sinifAd: 'Panel Ebatlama Sınıfı' },

      // Kenar Bantlama Sınıfı
      { name: 'ROYAL 8 EXTRA', sinifAd: 'Kenar Bantlama Sınıfı' },
      { name: 'OF-KA TUANA 56 PLUS', sinifAd: 'Kenar Bantlama Sınıfı' },
      { name: 'OF-KA TUANA 56', sinifAd: 'Kenar Bantlama Sınıfı' },
      { name: 'OF TUANA 56', sinifAd: 'Kenar Bantlama Sınıfı' },
      { name: 'OF MZK 4 DOOR', sinifAd: 'Kenar Bantlama Sınıfı' },
      { name: 'OF MZK-4', sinifAd: 'Kenar Bantlama Sınıfı' },
      { name: 'MZK-4', sinifAd: 'Kenar Bantlama Sınıfı' },

      // Çizgili Yatar Daire Sınıfı
      { name: 'MZK 3200 CONCORD', sinifAd: 'Çizgili Yatar Daire Sınıfı' },
      { name: 'MZK 3800 CONCORD', sinifAd: 'Çizgili Yatar Daire Sınıfı' },
      { name: 'MZK 3200 DIAMOND SX', sinifAd: 'Çizgili Yatar Daire Sınıfı' },

      // Kapı Üretim Makineleri Sınıfı
      { name: 'MZK CNC RIPPER DOUBLE', sinifAd: 'Kapı Üretim Makineleri Sınıfı' },
      { name: 'MZK NC RIPPER DOUBLE PLC CONTROL', sinifAd: 'Kapı Üretim Makineleri Sınıfı' },
      { name: 'FR-532', sinifAd: 'Kapı Üretim Makineleri Sınıfı' },

      // CNC Freze Sınıfı
      { name: 'LINA 2136 PLUS X', sinifAd: 'CNC Freze Sınıfı' },
      { name: 'LINA 2136 ED', sinifAd: 'CNC Freze Sınıfı' },
      { name: 'LINA 2128 PLUS X', sinifAd: 'CNC Freze Sınıfı' }
    ];

    // Sınıfları getir
    const siniflar = await MakinaSinifi.findAll({
      where: { aktif: true }
    });

    const sinifMap = {};
    siniflar.forEach(sinif => {
      sinifMap[sinif.ad] = sinif.id;
    });

    let atamaSayisi = 0;

    // Makinaları sınıflara ata
    for (const atama of makinaAtamalari) {
      const sinifId = sinifMap[atama.sinifAd];
      if (sinifId) {
        const makina = mevcutMakinalar.find(m => m.name === atama.name);
        if (makina) {
          await makina.update({ makina_sinifi_id: sinifId });
          atamaSayisi++;
        }
      }
    }

    res.status(200).json({
      success: true,
      data: {
        atananMakinaSayisi: atamaSayisi,
        toplamMakina: mevcutMakinalar.length,
        sinifSayisi: siniflar.length
      },
      message: 'Başlangıç verileri başarıyla yüklendi'
    });
  } catch (error) {
    console.error('Seed data yüklenirken hata:', error);
    res.status(500).json({
      success: false,
      message: 'Seed data yüklenirken bir hata oluştu',
      error: error.message
    });
  }
};

// Hiyerarşi detaylarını getir (tek bir istekte tüm yapı)
exports.getHierarchyDetails = async (req, res) => {
  try {
    const { sinifId, makinaId, bomId } = req.query;

    let result = {};

    if (sinifId) {
      // Sınıf detayları ve makinaları
      const sinif = await MakinaSinifi.findByPk(sinifId);
      if (sinif) {
        result.sinif = sinif;
        result.makinalar = await Makina.getMakinalarBySinifId(parseInt(sinifId));
      }
    }

    if (makinaId) {
      // Makina detayları ve BOM'ları
      result.makina = await Makina.getMakinaWithDetails(makinaId);
      if (result.makina) {
        result.boms = await Bom.getBomsByMakinaId(makinaId);
      }
    }

    if (bomId) {
      // BOM detayları ve parçaları
      result.bom = await Bom.getBomWithMakinalar(parseInt(bomId));
      result.parcalar = await Bom.getParcalarByBomId(parseInt(bomId));
    }

    res.status(200).json({
      success: true,
      data: result,
      message: 'Hiyerarşi detayları başarıyla getirildi'
    });
  } catch (error) {
    console.error('Hiyerarşi detayları alınırken hata:', error);
    res.status(500).json({
      success: false,
      message: 'Hiyerarşi detayları alınırken bir hata oluştu',
      error: error.message
    });
  }
};

// Yeni makina sınıfı oluştur
exports.createSinif = async (req, res) => {
  try {
    const { ad, aciklama, renk } = req.body;

    // Validasyon
    if (!ad || ad.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Sınıf adı en az 2 karakter olmalıdır'
      });
    }

    // Aynı isimde sınıf var mı kontrol et
    const existingSinif = await MakinaSinifi.findOne({
      where: {
        ad: ad.trim(),
        aktif: true
      }
    });

    if (existingSinif) {
      return res.status(400).json({
        success: false,
        message: 'Bu isimde aktif bir makina sınıfı zaten mevcut'
      });
    }

    // Yeni sınıf oluştur
    const yeniSinif = await MakinaSinifi.create({
      ad: ad.trim(),
      aciklama: aciklama?.trim() || null,
      renk: renk || '#1976d2',
      aktif: true,
      created_at: new Date(),
      updated_at: new Date()
    });

    res.status(201).json({
      success: true,
      data: yeniSinif,
      message: 'Makina sınıfı başarıyla oluşturuldu'
    });
  } catch (error) {
    console.error('Makina sınıfı oluşturulurken hata:', error);
    res.status(500).json({
      success: false,
      message: 'Makina sınıfı oluşturulurken bir hata oluştu',
      error: error.message
    });
  }
};

// Makina sınıfını güncelle
exports.updateSinif = async (req, res) => {
  try {
    const { id } = req.params;
    const { ad, aciklama, renk, aktif } = req.body;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz sınıf ID'
      });
    }

    const sinif = await MakinaSinifi.findByPk(id);
    if (!sinif) {
      return res.status(404).json({
        success: false,
        message: 'Makina sınıfı bulunamadı'
      });
    }

    // Validasyon
    if (ad && ad.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Sınıf adı en az 2 karakter olmalıdır'
      });
    }

    // Aynı isimde başka bir sınıf var mı kontrol et
    if (ad && ad.trim() !== sinif.ad) {
      const existingSinif = await MakinaSinifi.findOne({
        where: {
          ad: ad.trim(),
          aktif: true,
          id: { [Op.ne]: id }
        }
      });

      if (existingSinif) {
        return res.status(400).json({
          success: false,
          message: 'Bu isimde aktif bir makina sınıfı zaten mevcut'
        });
      }
    }

    // Güncelleme verisini hazırla
    const updateData = {
      updated_at: new Date()
    };

    if (ad) updateData.ad = ad.trim();
    if (aciklama !== undefined) updateData.aciklama = aciklama?.trim() || null;
    if (renk) updateData.renk = renk;
    if (aktif !== undefined) updateData.aktif = aktif;

    await sinif.update(updateData);

    res.status(200).json({
      success: true,
      data: sinif,
      message: 'Makina sınıfı başarıyla güncellendi'
    });
  } catch (error) {
    console.error('Makina sınıfı güncellenirken hata:', error);
    res.status(500).json({
      success: false,
      message: 'Makina sınıfı güncellenirken bir hata oluştu',
      error: error.message
    });
  }
};

// Makina sınıfını sil (soft delete)
exports.deleteSinif = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz sınıf ID'
      });
    }

    const sinif = await MakinaSinifi.findByPk(id);
    if (!sinif) {
      return res.status(404).json({
        success: false,
        message: 'Makina sınıfı bulunamadı'
      });
    }

    // Sınıfa bağlı makina var mı kontrol et
    const makinaSayisi = await Makina.count({
      where: {
        makina_sinifi_id: id,
        deleted_at: null
      }
    });

    if (makinaSayisi > 0) {
      return res.status(400).json({
        success: false,
        message: `Bu sınıfa ${makinaSayisi} adet makina bağlı olduğu için silinemez. Önce makinaları başka bir sınıfa taşıyın.`
      });
    }

    // Soft delete
    await sinif.update({
      aktif: false,
      deleted_at: new Date(),
      updated_at: new Date()
    });

    res.status(200).json({
      success: true,
      message: 'Makina sınıfı başarıyla silindi'
    });
  } catch (error) {
    console.error('Makina sınıfı silinirken hata:', error);
    res.status(500).json({
      success: false,
      message: 'Makina sınıfı silinirken bir hata oluştu',
      error: error.message
    });
  }
};

// Tek bir makina sınıfı detayını getir
exports.getSinifById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz sınıf ID'
      });
    }

    const sinif = await MakinaSinifi.findByPk(id);
    if (!sinif) {
      return res.status(404).json({
        success: false,
        message: 'Makina sınıfı bulunamadı'
      });
    }

    // Sınıfa bağlı makina sayısını getir
    const makinaSayisi = await Makina.count({
      where: {
        makina_sinifi_id: id,
        deleted_at: null
      }
    });

    const result = {
      ...sinif.toJSON(),
      makinaSayisi
    };

    res.status(200).json({
      success: true,
      data: result,
      message: 'Makina sınıfı detayları başarıyla getirildi'
    });
  } catch (error) {
    console.error('Makina sınıfı detayları alınırken hata:', error);
    res.status(500).json({
      success: false,
      message: 'Makina sınıfı detayları alınırken bir hata oluştu',
      error: error.message
    });
  }
};

// Özel grup kategorilerini getir
exports.getOzelGruplar = async (req, res) => {
  try {
    const { tip } = req.query;

    let gruplar;
    if (tip) {
      // Belirli bir tipteki grupları getir (marka, ozel)
      gruplar = await Bom.findAll({
        where: {
          grup_tipi: tip,
          aktif: true
        },
        order: [['name', 'ASC']]
      });
    } else {
      // Tüm özel grupları getir
      gruplar = await Bom.getOzelGruplar();
    }

    // Grup formatına dönüştür
    const groupData = gruplar.map(grup => Bom.transformToGroupFormat(grup));

    res.status(200).json({
      success: true,
      data: groupData,
      message: 'Özel gruplar başarıyla listelendi'
    });
  } catch (error) {
    console.error('Özel gruplar alınırken hata:', error);
    res.status(500).json({
      success: false,
      message: 'Özel gruplar alınırken bir hata oluştu',
      error: error.message
    });
  }
};

// Grup bazında arama yap
exports.grupAra = async (req, res) => {
  try {
    const { q: query, makinaId, limit = 20 } = req.query;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Arama terimi en az 2 karakter olmalıdır'
      });
    }

    const searchTerm = query.trim();
    const results = await Bom.grupAra(searchTerm, makinaId);

    // Grup formatına dönüştür
    const groupData = results.map(grup => Bom.transformToGroupFormat(grup));

    // Limit uygula
    const limitedResults = groupData.slice(0, parseInt(limit));

    res.status(200).json({
      success: true,
      data: limitedResults,
      total: results.length,
      query: searchTerm,
      makinaId: makinaId || null,
      message: 'Grup arama sonuçları başarıyla getirildi'
    });
  } catch (error) {
    console.error('Grup araması yapılırken hata:', error);
    res.status(500).json({
      success: false,
      message: 'Grup araması yapılırken bir hata oluştu',
      error: error.message
    });
  }
};

// Marka bazlı grupları getir
exports.getGruplarByMarka = async (req, res) => {
  try {
    const { marka } = req.params;

    if (!marka) {
      return res.status(400).json({
        success: false,
        message: 'Marka adı gereklidir'
      });
    }

    const gruplar = await Bom.getGroupsByMarka(marka);

    // Grup formatına dönüştür
    const groupData = gruplar.map(grup => Bom.transformToGroupFormat(grup));

    res.status(200).json({
      success: true,
      data: groupData,
      marka: marka,
      count: groupData.length,
      message: `'${marka}' markasına ait gruplar başarıyla listelendi`
    });
  } catch (error) {
    console.error('Marka bazlı gruplar alınırken hata:', error);
    res.status(500).json({
      success: false,
      message: 'Marka bazlı gruplar alınırken bir hata oluştu',
      error: error.message
    });
  }
};

// Test verisi oluştur (performans testi için)
exports.generateTestData = async (req, res) => {
  try {
    const { count = 100 } = req.query;
    const testDataCount = parseInt(count);

    console.log(`Generating ${testDataCount} test items...`);

    // Test için sentetik veri oluştur
    const testSiniflar = [];
    const testMakinalar = [];
    const testBoms = [];
    const testParcalar = [];

    // Test sınıfları
    for (let i = 1; i <= Math.min(testDataCount / 10, 10); i++) {
      testSiniflar.push({
        ad: `Test Sınıf ${i}`,
        aciklama: `Test amaçlı oluşturulmuş ${i}. sınıf`,
        renk: `#${Math.floor(Math.random()*16777215).toString(16)}`,
        aktif: true,
        olusturulma_tarihi: new Date(),
        guncelleme_tarihi: new Date()
      });
    }

    // Test makinaları
    for (let i = 1; i <= Math.min(testDataCount, 100); i++) {
      testMakinalar.push({
        name: `Test Makina ${i}`,
        model: `TM-${i}X`,
        description: `Test amaçlı ${i}. makine`,
        makina_sinifi_id: (i % 5) + 1, // 1-5 arası rastgele sınıf ID
        makina_turu: 'CNC',
        durumu: 'aktif',
        konum: `Test Atölye ${i}`,
        uretim_kapasitesi: Math.floor(Math.random() * 1000) + 100,
        calisma_saati: Math.floor(Math.random() * 10000),
        son_bakim_tarihi: new Date(),
        olusturulma_tarihi: new Date(),
        guncelleme_tarihi: new Date()
      });
    }

    // Test BOM'ları
    for (let i = 1; i <= Math.min(testDataCount * 2, 200); i++) {
      testBoms.push({
        name: `Test BOM ${i}`,
        bom_kodu: `TB-${i}`,
        bom_aciklamasi: `Test BOM açıklaması ${i}`,
        versiyon: `1.${i}`,
        uretim_miktari: Math.floor(Math.random() * 100) + 1,
        birim: 'Adet',
        olusturulma_tarihi: new Date(),
        guncelleme_tarihi: new Date()
      });
    }

    // Test parçaları
    for (let i = 1; i <= testDataCount; i++) {
      testParcalar.push({
        parca_kodu: `TP-${i.toString().padStart(4, '0')}`,
        parcaAdi: `Test Parça ${i}`,
        kategori: 'Test',
        stokAdeti: Math.floor(Math.random() * 100),
        kritik_stok: Math.floor(Math.random() * 10),
        birim: 'Adet',
        aciklama: `Test amaçlı ${i}. parça`,
        imalMi: Math.random() > 0.5,
        tek_parca: Math.random() > 0.8,
        olusturulma_tarihi: new Date(),
        guncelleme_tarihi: new Date()
      });
    }

    res.status(200).json({
      success: true,
      data: {
        generated: {
          siniflar: testSiniflar.length,
          makinalar: testMakinalar.length,
          boms: testBoms.length,
          parcalar: testParcalar.length,
          totalNodes: testSiniflar.length + testMakinalar.length + testBoms.length + testParcalar.length
        },
        testData: {
          siniflar: testSiniflar,
          makinalar: testMakinalar,
          boms: testBoms,
          parcalar: testParcalar
        }
      },
      message: 'Test verileri başarılu oluşturuldu'
    });
  } catch (error) {
    console.error('Test verileri oluşturulurken hata:', error);
    res.status(500).json({
      success: false,
      message: 'Test verileri oluşturulurken bir hata oluştu',
      error: error.message
    });
  }
};