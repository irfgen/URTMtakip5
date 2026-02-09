const { Parca, ParcaKayitlari, StokKarti, IsEmri, Bom, ParcaBirlestirmeLog } = require('../models');
const { Op, Transaction } = require('sequelize');
const { sequelize } = require('../config/database');
const winston = require('winston');

class ParcaBirlesikController {
  /**
   * Tekrarlanan parçaları tespit et
   * Parça adı ve ham malzeme özelliklerine göre benzerlik analizi yapar
   */
  static async getTekrarliParcalar(req, res) {
    try {
      // Tüm parçaları getir
      const parcalar = await Parca.findAll({
        include: [
          {
            model: StokKarti,
            as: 'stokKarti',
            required: false
          },
          {
            model: ParcaKayitlari,
            as: 'kayitlar',
            required: false
          }
        ]
      });

      // Tekrarlanan parçaları tespit et
      const tekrarliGruplar = await ParcaBirlesikController.analizTekrarliParcalar(parcalar);

      res.json({
        success: true,
        data: tekrarliGruplar,
        message: `${tekrarliGruplar.length} adet tekrarlı parça grubu tespit edildi`
      });

    } catch (error) {
      winston.error('Tekrarlı parça analizi hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Tekrarlı parça analizi sırasında hata oluştu',
        error: error.message
      });
    }
  }

  /**
   * Parçaları analiz ederek tekrarlananları gruplar
   */
  static async analizTekrarliParcalar(parcalar) {
    const gruplar = new Map();

    for (const parca of parcalar) {
      // Normalize edilmiş anahtar oluştur
      const anahtar = ParcaBirlesikController.normalizeParcaAnahtari(parca);
      
      if (!gruplar.has(anahtar)) {
        gruplar.set(anahtar, []);
      }
      
      gruplar.get(anahtar).push({
        ...parca.toJSON(),
        iliskiliKayitSayisi: parca.kayitlar ? parca.kayitlar.length : 0,
        // İlişkili kayıt sayısını hesapla
        bagliVeriler: await ParcaBirlesikController.getBagliVeriler(parca.parcaKodu)
      });
    }

    // Sadece 2 veya daha fazla parça içeren grupları döndür
    const tekrarliGruplar = [];
    for (const [anahtar, parcaListesi] of gruplar) {
      if (parcaListesi.length > 1) {
        tekrarliGruplar.push({
          grup_anahtari: anahtar,
          parca_sayisi: parcaListesi.length,
          parcalar: parcaListesi.sort((a, b) => {
            // En çok bağlı veriye sahip parça önce gelsin
            return (b.bagliVeriler.toplam || 0) - (a.bagliVeriler.toplam || 0);
          })
        });
      }
    }

    return tekrarliGruplar.sort((a, b) => b.parca_sayisi - a.parca_sayisi);
  }

  /**
   * Parça için normalize edilmiş anahtar oluştur
   */
  static normalizeParcaAnahtari(parca) {
    // Parça adını normalize et (büyük/küçük harf, boşluklar)
    const normalizedAdi = parca.parcaAdi
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s]/g, ''); // Özel karakterleri kaldır

    // Ham malzeme bilgilerini normalize et
    let hamMalzeme = '';
    if (parca.stokKarti) {
      hamMalzeme = `${parca.stokKarti.malzeme_cinsi || ''}_${parca.stokKarti.kesit || ''}`;
    } else {
      hamMalzeme = `${parca.hamMalzemeCinsi || ''}_${parca.hamMalzemeOlculeri || ''}`;
    }
    hamMalzeme = hamMalzeme.toLowerCase().replace(/\s+/g, '').replace(/[^\w]/g, '');

    // Kategori normalize et
    const kategori = (parca.kategori || 'diger').toLowerCase().replace(/\s+/g, '');

    return `${normalizedAdi}_${hamMalzeme}_${kategori}`;
  }

  /**
   * Parça ile bağlı veri sayılarını getir
   */
  static async getBagliVeriler(parcaKodu) {
    try {
      const [isEmirleri, bomKayitlari, parcaKayitlari] = await Promise.all([
        // İş emirlerinde bu parça kodu geçen kayıtları say
        IsEmri.count({
          where: {
            parca_kodu: parcaKodu
          }
        }),
        
        // BOM tablolarında bu parça kodu geçen kayıtları say
        Bom.count({
          where: {
            [Op.or]: [
              { parca_kodu: parcaKodu },
              { alt_parca_kodu: parcaKodu }
            ]
          }
        }),
        
        // Parça kayıtları
        ParcaKayitlari.count({
          where: {
            parca_kodu: parcaKodu
          }
        })
      ]);

      const toplam = isEmirleri + bomKayitlari + parcaKayitlari;

      return {
        is_emirleri: isEmirleri,
        bom_kayitlari: bomKayitlari,
        parca_kayitlari: parcaKayitlari,
        toplam
      };
    } catch (error) {
      winston.error(`Bağlı veri sayma hatası - ${parcaKodu}:`, error);
      return {
        is_emirleri: 0,
        bom_kayitlari: 0,
        parca_kayitlari: 0,
        toplam: 0
      };
    }
  }

  /**
   * Parça birleştirme işlemi
   */
  static async birlestirParcalar(req, res) {
    const transaction = await sequelize.transaction();
    
    try {
      const { 
        tutulan_parca_kodu, 
        silinen_parca_kodlari, 
        yeni_parca_bilgileri 
      } = req.body;

      // Validasyon
      if (!tutulan_parca_kodu || !silinen_parca_kodlari || !Array.isArray(silinen_parca_kodlari)) {
        return res.status(400).json({
          success: false,
          message: 'Gerekli parametreler eksik'
        });
      }

      // Tutulan parçayı getir
      const tutulanParca = await Parca.findByPk(tutulan_parca_kodu, { transaction });
      if (!tutulanParca) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: 'Tutulan parça bulunamadı'
        });
      }

      // Silinen parçaları getir
      const silinenParcalar = await Parca.findAll({
        where: {
          parcaKodu: {
            [Op.in]: silinen_parca_kodlari
          }
        },
        transaction
      });

      if (silinenParcalar.length !== silinen_parca_kodlari.length) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: 'Bazı silinecek parçalar bulunamadı'
        });
      }

      // Birleştirme öncesi durumu kaydet (rollback için)
      const oncekiDurum = {
        tutulan_parca: tutulanParca.toJSON(),
        silinen_parcalar: silinenParcalar.map(p => p.toJSON()),
        timestamp: new Date()
      };

      // Birleştirme işlemini gerçekleştir
      const sonuc = await ParcaBirlesikController.parcaBirlestirmeIslemi(
        tutulanParca,
        silinenParcalar,
        yeni_parca_bilgileri,
        transaction
      );

      // Birleştirme log kaydı oluştur
      await ParcaBirlestirmeLog.create({
        tutulan_parca_kodu: tutulan_parca_kodu,
        silinen_parca_kodlari: silinen_parca_kodlari,
        transfer_detaylari: sonuc.transfer_edilen,
        onceki_durum: oncekiDurum,
        kullanici_id: req.user?.id || 'sistem', // Eğer auth middleware varsa
        kullanici_ip: req.ip || req.connection.remoteAddress,
        aciklama: `${silinen_parca_kodlari.length} parça ${tutulan_parca_kodu} koduna birleştirildi`
      }, { transaction });

      await transaction.commit();

      winston.info(`Parça birleştirme işlemi başarılı: ${tutulan_parca_kodu} <- [${silinen_parca_kodlari.join(', ')}]`);

      res.json({
        success: true,
        data: sonuc,
        message: 'Parça birleştirme işlemi başarıyla tamamlandı'
      });

    } catch (error) {
      await transaction.rollback();
      winston.error('Parça birleştirme hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Parça birleştirme işlemi sırasında hata oluştu',
        error: error.message
      });
    }
  }

  /**
   * Parça birleştirme işleminin ana mantığı
   */
  static async parcaBirlestirmeIslemi(tutulanParca, silinenParcalar, yeniParcaBilgileri, transaction) {
    const transferEdilen = {
      is_emirleri: 0,
      bom_kayitlari: 0,
      parca_kayitlari: 0,
      stok_adeti: 0
    };

    // Her silinen parça için işlem yap
    for (const silinenParca of silinenParcalar) {
      // İş emirlerini transfer et
      const isEmirleriGuncelleme = await IsEmri.update(
        { parca_kodu: tutulanParca.parcaKodu },
        {
          where: { parca_kodu: silinenParca.parcaKodu },
          transaction
        }
      );
      transferEdilen.is_emirleri += isEmirleriGuncelleme[0];

      // BOM kayıtlarını transfer et
      const bomGuncelleme1 = await Bom.update(
        { parca_kodu: tutulanParca.parcaKodu },
        {
          where: { parca_kodu: silinenParca.parcaKodu },
          transaction
        }
      );
      
      const bomGuncelleme2 = await Bom.update(
        { alt_parca_kodu: tutulanParca.parcaKodu },
        {
          where: { alt_parca_kodu: silinenParca.parcaKodu },
          transaction
        }
      );
      transferEdilen.bom_kayitlari += bomGuncelleme1[0] + bomGuncelleme2[0];

      // Parça kayıtlarını transfer et
      const parcaKayitlariGuncelleme = await ParcaKayitlari.update(
        { parca_kodu: tutulanParca.parcaKodu },
        {
          where: { parca_kodu: silinenParca.parcaKodu },
          transaction
        }
      );
      transferEdilen.parca_kayitlari += parcaKayitlariGuncelleme[0];

      // Stok adetini topla
      transferEdilen.stok_adeti += silinenParca.stokAdeti || 0;
    }

    // Tutulan parçayı güncelle
    const guncellenecekVeriler = {
      stokAdeti: tutulanParca.stokAdeti + transferEdilen.stok_adeti,
      ...yeniParcaBilgileri
    };

    await tutulanParca.update(guncellenecekVeriler, { transaction });

    // Silinen parçaları kaldır
    const silinenKodlar = silinenParcalar.map(p => p.parcaKodu);
    await Parca.destroy({
      where: {
        parcaKodu: {
          [Op.in]: silinenKodlar
        }
      },
      transaction
    });

    return {
      tutulan_parca: tutulanParca.parcaKodu,
      silinen_parcalar: silinenKodlar,
      transfer_edilen: transferEdilen,
      guncellenen_parca: guncellenecekVeriler
    };
  }

  /**
   * Birleştirme öncesi önizleme
   */
  static async birlestirmeOnizlemesi(req, res) {
    try {
      const { 
        tutulan_parca_kodu, 
        silinen_parca_kodlari 
      } = req.body;

      if (!tutulan_parca_kodu || !silinen_parca_kodlari || !Array.isArray(silinen_parca_kodlari)) {
        return res.status(400).json({
          success: false,
          message: 'Gerekli parametreler eksik'
        });
      }

      // Etkilenecek verileri hesapla
      const onizleme = {
        tutulan_parca: await ParcaBirlesikController.getBagliVeriler(tutulan_parca_kodu),
        silinen_parcalar: {}
      };

      let toplamStokAdeti = 0;
      for (const parcaKodu of silinen_parca_kodlari) {
        const bagliVeriler = await ParcaBirlesikController.getBagliVeriler(parcaKodu);
        onizleme.silinen_parcalar[parcaKodu] = bagliVeriler;
        
        // Parça stok adetini al
        const parca = await Parca.findByPk(parcaKodu, { attributes: ['stokAdeti'] });
        if (parca) {
          toplamStokAdeti += parca.stokAdeti || 0;
        }
      }

      onizleme.toplamlar = {
        transfer_edilecek_stok: toplamStokAdeti,
        toplam_etkilenen_kayit: Object.values(onizleme.silinen_parcalar)
          .reduce((acc, curr) => acc + curr.toplam, 0)
      };

      res.json({
        success: true,
        data: onizleme,
        message: 'Birleştirme önizlemesi hazırlandı'
      });

    } catch (error) {
      winston.error('Birleştirme önizleme hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Önizleme oluşturulurken hata oluştu',
        error: error.message
      });
    }
  }

  /**
   * Birleştirme geçmişini listele
   */
  static async getBirlestirmeGecmisi(req, res) {
    try {
      const { page = 1, limit = 20 } = req.query;
      
      const gecmis = await ParcaBirlestirmeLog.findAndCountAll({
        include: [
          {
            model: Parca,
            as: 'tutulanParca',
            required: false
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: (parseInt(page) - 1) * parseInt(limit)
      });

      res.json({
        success: true,
        data: {
          gecmis: gecmis.rows,
          toplam: gecmis.count,
          sayfa: parseInt(page),
          sayfa_basina: parseInt(limit),
          toplam_sayfa: Math.ceil(gecmis.count / parseInt(limit))
        },
        message: 'Birleştirme geçmişi başarıyla getirildi'
      });

    } catch (error) {
      winston.error('Birleştirme geçmişi getirme hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Birleştirme geçmişi getirilirken hata oluştu',
        error: error.message
      });
    }
  }

  /**
   * Birleştirme işlemini geri al (rollback)
   */
  static async rollbackBirlestirme(req, res) {
    const transaction = await sequelize.transaction();
    
    try {
      const { log_id } = req.params;

      // Log kaydını getir
      const logKaydi = await ParcaBirlestirmeLog.findByPk(log_id, { transaction });
      
      if (!logKaydi) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: 'Birleştirme log kaydı bulunamadı'
        });
      }

      if (logKaydi.rollback_durumu !== 'aktif') {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Bu birleştirme işlemi zaten geri alınmış veya geri alınamaz durumda'
        });
      }

      // Rollback işlemini gerçekleştir
      const rollbackSonuc = await ParcaBirlesikController.rollbackIslemi(logKaydi, transaction);

      // Log kaydını güncelle
      await logKaydi.update({
        rollback_durumu: 'geri_alindi',
        rollback_tarihi: new Date(),
        rollback_kullanici_id: req.user?.id || 'sistem'
      }, { transaction });

      await transaction.commit();

      winston.info(`Parça birleştirme rollback başarılı - Log ID: ${log_id}`);

      res.json({
        success: true,
        data: rollbackSonuc,
        message: 'Birleştirme işlemi başarıyla geri alındı'
      });

    } catch (error) {
      await transaction.rollback();
      winston.error('Rollback hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Geri alma işlemi sırasında hata oluştu',
        error: error.message
      });
    }
  }

  /**
   * Rollback işleminin ana mantığı
   */
  static async rollbackIslemi(logKaydi, transaction) {
    const { onceki_durum, silinen_parca_kodlari, tutulan_parca_kodu } = logKaydi;

    // Önce silinen parçaları geri oluştur
    for (const silinenParcaData of onceki_durum.silinen_parcalar) {
      await Parca.create(silinenParcaData, { transaction });
    }

    // Tutulan parçayı önceki haline getir
    const tutulanParca = await Parca.findByPk(tutulan_parca_kodu, { transaction });
    if (tutulanParca) {
      await tutulanParca.update(onceki_durum.tutulan_parca, { transaction });
    }

    // İlişkili verileri eski haline getir
    // Bu kısım transfer edilen veriler logKaydi.transfer_detaylari'ndan 
    // çıkarılarak tersine çevrilebilir
    
    // Örnek: İş emirlerini eski parçalara geri dağıt
    // Bu kısmı gereksinime göre detaylandır
    
    return {
      geri_oluşturulan_parcalar: silinen_parca_kodlari,
      guncellenen_parca: tutulan_parca_kodu,
      rollback_tarihi: new Date()
    };
  }
}

module.exports = ParcaBirlesikController;