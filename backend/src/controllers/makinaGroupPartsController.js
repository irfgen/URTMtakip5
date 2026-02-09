const Makina = require('../models/Makina');
const Parca = require('../models/Parca');
const Bom = require('../models/Bom');
const { Op } = require('sequelize');

/**
 * Seçilen makinanın tüm gruplarını ve her gruptaki parçaları 
 * veritabanından ayrıntılı bilgileriyle birlikte listeler
 */
exports.getMakinaGroupParts = async (req, res) => {
  try {
    const { makina_id } = req.params;
    
    if (!makina_id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Makina ID gerekli' 
      });
    }

    // Makina bilgisini al
    const makina = await Makina.findByPk(makina_id);
    if (!makina) {
      return res.status(404).json({ 
        success: false, 
        message: 'Makina bulunamadı' 
      });
    }

    const result = {
      makina: {
        id: makina.makina_id,
        name: makina.name,
        model: makina.model,
        description: makina.description
      },
      gruplar: [],
      toplam_parca_sayisi: 0,
      toplam_grup_sayisi: 0
    };

    // Makinanın items yapısını analiz et
    const items = makina.items || [];
    const processedGroups = new Set(); // Duplicate grupları önlemek için
    
    // Özyinelemeli fonksiyon ile tüm grupları ve parçaları çıkar
    const processItems = async (items, parentPath = '') => {
      for (const item of items) {
        const itemPath = parentPath ? `${parentPath} > ${item.name}` : item.name;
        
        if (item.type === 'BOM' && !processedGroups.has(item.id)) {
          processedGroups.add(item.id);
          
          // BOM bilgisini veritabanından al
          const bomData = await Bom.findByPk(item.id);
          if (bomData) {
            const groupInfo = {
              group_id: item.id,
              group_name: item.name,
              group_description: bomData.description || '',
              group_path: itemPath,
              group_quantity: item.quantity || 1,
              parts: [],
              sub_groups: []
            };

            // Bu grup için ayrı processed parts kontrolü - aynı parça farklı gruplarda olabilir
            const groupProcessedParts = new Set();

            // Bu grubun alt öğelerini işle
            let subItems = bomData.items || [];
            // Items field'ı string olabilir, JSON.parse yapmalıyız
            if (typeof subItems === 'string') {
              try {
                subItems = JSON.parse(subItems);
              } catch (err) {
                console.error(`BOM ${item.id} items parse hatası:`, err);
                subItems = [];
              }
            }
            
            for (const subItem of subItems) {
              if (subItem.type === 'PART' || subItem.type === 'PARCA') {
                // Parça bilgisini veritabanından al - PARCA isimlerini parcaKodu ile eşleştir
                let parcaData = await Parca.findOne({ where: { parcaKodu: subItem.name } });
                if (!parcaData && subItem.id) {
                  // ID ile de dene
                  parcaData = await Parca.findByPk(subItem.id);
                }
                
                if (parcaData && !groupProcessedParts.has(parcaData.parcaKodu)) {
                  groupProcessedParts.add(parcaData.parcaKodu);
                  
                  groupInfo.parts.push({
                    parca_kodu: parcaData.parcaKodu,
                    parca_adi: parcaData.parcaAdi,
                    kategori: parcaData.kategori,
                    stok_adeti: parcaData.stokAdeti,
                    kritik_stok: parcaData.kritik_stok,
                    tedarik_bedeli: parcaData.tedarikBedeli,
                    imal_mi: parcaData.imalMi,
                    ham_malzeme_cinsi: parcaData.hamMalzemeCinsi,
                    ham_malzeme_olculeri: parcaData.hamMalzemeOlculeri,
                    setup_sayisi: parcaData.setupSayisi,
                    cnc_isleme_suresi: parcaData.cncIslemeSuresi,
                    foto_path: parcaData.foto_path,
                    teknik_resim_path: parcaData.teknik_resim_path,
                    quantity_in_group: subItem.quantity || 1,
                    part_path: `${itemPath} > ${subItem.name}`
                  });
                }
              } else if (subItem.type === 'BOM') {
                // Alt grup varsa, onu da ekle
                groupInfo.sub_groups.push({
                  sub_group_id: subItem.id,
                  sub_group_name: subItem.name,
                  sub_group_quantity: subItem.quantity || 1
                });
                
                // Alt BOM'u özyinelemeli olarak işle
                await processItems([subItem], itemPath);
              }
            }

            result.gruplar.push(groupInfo);
          }
        } else if (item.type === 'PART') {
          // Doğrudan makina seviyesindeki parçalar için ayrı grup oluştur
          const parcaData = await Parca.findByPk(item.id);
          if (parcaData) {
            let directPartsGroup = result.gruplar.find(g => g.group_id === 'DIRECT_PARTS');
            if (!directPartsGroup) {
              directPartsGroup = {
                group_id: 'DIRECT_PARTS',
                group_name: 'Doğrudan Makina Parçaları',
                group_description: 'Doğrudan makina seviyesinde tanımlı parçalar',
                group_path: 'Makina Seviyesi',
                group_quantity: 1,
                parts: [],
                sub_groups: []
              };
              result.gruplar.push(directPartsGroup);
            }

            // Makina seviyesinde aynı parça tekrar eklenmemeli
            const alreadyExists = directPartsGroup.parts.some(p => p.parca_kodu === parcaData.parcaKodu);
            if (!alreadyExists) {
              directPartsGroup.parts.push({
                parca_kodu: parcaData.parcaKodu,
                parca_adi: parcaData.parcaAdi,
                kategori: parcaData.kategori,
                stok_adeti: parcaData.stokAdeti,
                kritik_stok: parcaData.kritik_stok,
                tedarik_bedeli: parcaData.tedarikBedeli,
                imal_mi: parcaData.imalMi,
                ham_malzeme_cinsi: parcaData.hamMalzemeCinsi,
                ham_malzeme_olculeri: parcaData.hamMalzemeOlculeri,
                setup_sayisi: parcaData.setupSayisi,
                cnc_isleme_suresi: parcaData.cncIslemeSuresi,
                foto_path: parcaData.foto_path,
                teknik_resim_path: parcaData.teknik_resim_path,
                quantity_in_group: item.quantity || 1,
                part_path: itemPath
              });
            }
          }
        }

        // Alt öğeler varsa (BOM içindeki BOM'lar için), özyinelemeli olarak işle
        if (item.subItems && Array.isArray(item.subItems)) {
          await processItems(item.subItems, itemPath);
        }
      }
    };

    await processItems(items);

    // İstatistikleri hesapla
    result.toplam_grup_sayisi = result.gruplar.length;
    result.toplam_parca_sayisi = result.gruplar.reduce((total, group) => total + group.parts.length, 0);

    // Grupları parça sayısına göre sırala (en çok parçalı gruplar başta)
    result.gruplar.sort((a, b) => b.parts.length - a.parts.length);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Makina grup-parça listesi alınırken hata:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Makina grup-parça listesi alınırken bir hata oluştu',
      error: error.message 
    });
  }
};

/**
 * Belirli bir grubun detaylarını ve parçalarını getirir
 */
exports.getGroupDetails = async (req, res) => {
  try {
    const { group_id } = req.params;
    
    if (!group_id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Grup ID gerekli' 
      });
    }

    // BOM bilgisini al
    const bomData = await Bom.findByPk(group_id);
    if (!bomData) {
      return res.status(404).json({ 
        success: false, 
        message: 'Grup bulunamadı' 
      });
    }

    const result = {
      group_id: bomData.bom_id,
      group_name: bomData.name,
      group_description: bomData.description,
      parts: [],
      sub_groups: []
    };

    // Grup içindeki parçaları işle
    const items = bomData.items || [];
    for (const item of items) {
      if (item.type === 'PART') {
        const parcaData = await Parca.findByPk(item.id);
        if (parcaData) {
          result.parts.push({
            parca_kodu: parcaData.parcaKodu,
            parca_adi: parcaData.parcaAdi,
            kategori: parcaData.kategori,
            stok_adeti: parcaData.stokAdeti,
            kritik_stok: parcaData.kritik_stok,
            tedarik_bedeli: parcaData.tedarikBedeli,
            imal_mi: parcaData.imalMi,
            ham_malzeme_cinsi: parcaData.hamMalzemeCinsi,
            ham_malzeme_olculeri: parcaData.hamMalzemeOlculeri,
            setup_sayisi: parcaData.setupSayisi,
            cnc_isleme_suresi: parcaData.cncIslemeSuresi,
            foto_path: parcaData.foto_path,
            teknik_resim_path: parcaData.teknik_resim_path,
            quantity: item.quantity || 1
          });
        }
      } else if (item.type === 'BOM') {
        result.sub_groups.push({
          sub_group_id: item.id,
          sub_group_name: item.name,
          sub_group_quantity: item.quantity || 1
        });
      }
    }

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Grup detayları alınırken hata:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Grup detayları alınırken bir hata oluştu',
      error: error.message 
    });
  }
};

/**
 * Tüm makinaların grup-parça özet listesini getirir
 */
exports.getAllMakinaGroupPartsOverview = async (req, res) => {
  try {
    const makinalar = await Makina.findAll({
      attributes: ['makina_id', 'name', 'model', 'items'],
      where: {
        durum: 'aktif'
      }
    });

    const result = [];

    for (const makina of makinalar) {
      const items = makina.items || [];
      
      // Hızlı grup ve parça sayımı
      let grupSayisi = 0;
      let parcaSayisi = 0;

      const countItems = (items) => {
        for (const item of items) {
          if (item.type === 'BOM') {
            grupSayisi++;
          } else if (item.type === 'PART') {
            parcaSayisi++;
          }
          
          if (item.subItems && Array.isArray(item.subItems)) {
            countItems(item.subItems);
          }
        }
      };

      countItems(items);

      result.push({
        makina_id: makina.makina_id,
        makina_name: makina.name,
        makina_model: makina.model,
        toplam_grup_sayisi: grupSayisi,
        toplam_parca_sayisi: parcaSayisi
      });
    }

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Makina özet listesi alınırken hata:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Makina özet listesi alınırken bir hata oluştu',
      error: error.message 
    });
  }
};
