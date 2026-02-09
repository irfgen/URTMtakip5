const TedarikTalebi = require('../models/TedarikTalebi');
const TedarikDetay = require('../models/TedarikDetay');
const StokKarti = require('../models/StokKarti');
const IsEmri = require('../models/IsEmri');
const Sevkiyat = require('../models/Sevkiyat');
const SevkiyatKalem = require('../models/SevkiyatKalem');
const { sequelize, Op } = require('../config/database');

// Firma model'i (function export pattern)
const Firma = require('../models/Firma')(sequelize);

// Tüm tedarik taleplerini listele (sayfalama, arama, filtreleme ile)
const listTedarikTalepleri = async (req, res) => {
  try {
    const {
      sayfa = 1,
      limit = 20,
      q,
      durum,
      kaynak_tipi,
      tarih_baslangic,
      tarih_bitis
    } = req.query;

    const result = await TedarikTalebi.searchWithPagination({
      q,
      durum,
      kaynak_tipi,
      tarih_baslangic,
      tarih_bitis,
      sayfa,
      limit
    });

    // Detayları ekle
    if (result.data && result.data.length > 0) {
      for (const talep of result.data) {
        // Her talep için detayları ayrı olarak sorgula
        const detaylar = await TedarikDetay.findAll({
          where: { talep_id: talep.id },
          attributes: ['miktar', 'birim', 'malzeme_adi', 'malzeme_kodu']
        });
        talep.dataValues.detaylar = detaylar;
      }
    }

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
      filters: { q, durum, kaynak_tipi, tarih_baslangic, tarih_bitis }
    });

  } catch (error) {
    console.error('Tedarik talepleri listesi hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Tedarik talepleri listesi alınırken hata oluştu',
      error: error.message
    });
  }
};

// ID ile tedarik talebi detayı getir
const getTedarikTalebiDetay = async (req, res) => {
  try {
    const { id } = req.params;

    const talep = await TedarikTalebi.findByPk(id, {
      include: [
        {
          model: TedarikDetay,
          as: 'detaylar',
          include: [
            {
              model: StokKarti,
              as: 'stokKarti'
            }
          ]
        },
        {
          model: StokKarti,
          as: 'stokKarti'
        },
        {
          model: IsEmri,
          as: 'isEmri'
        }
      ]
    });

    if (!talep) {
      return res.status(404).json({
        success: false,
        message: 'Tedarik talebi bulunamadı'
      });
    }

    res.json({
      success: true,
      data: talep
    });

  } catch (error) {
    console.error('Tedarik talebi detayı hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Tedarik talebi detayı alınırken hata oluştu',
      error: error.message
    });
  }
};

// Yeni tedarik talebi oluştur
const createTedarikTalebi = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const {
      kaynak_tipi,
      kaynak_id,
      parca_kodu,
      stok_karti_id,
      is_emri_id,
      aciklama,
      talep_eden_kullanici,
      termin_tarihi,
      detaylar = [],
      miktar,
      birim,
      birim_fiyat
    } = req.body;

    // Boş string'leri null'a çevir (foreign key constraint hatası için)
    const cleanedStokKartiId = stok_karti_id === '' ? null : stok_karti_id;
    const cleanedIsEmriId = is_emri_id === '' ? null : is_emri_id;

    // Validasyon
    if (!kaynak_tipi) {
      return res.status(400).json({
        success: false,
        message: 'Kaynak tipi zorunludur'
      });
    }

    // Foreign key validasyonu - eğer ID gönderildiyse var olup olmadığını kontrol et
    if (cleanedIsEmriId) {
      const isEmri = await IsEmri.findByPk(cleanedIsEmriId);
      if (!isEmri) {
        return res.status(400).json({
          success: false,
          message: 'Belirtilen iş emri bulunamadı'
        });
      }
    }

    if (cleanedStokKartiId) {
      const stokKarti = await StokKarti.findByPk(cleanedStokKartiId);
      if (!stokKarti) {
        return res.status(400).json({
          success: false,
          message: 'Belirtilen stok kartı bulunamadı'
        });
      }
    }

    // Eğer detaylar yoksa, tek bir detay olarak oluştur
    let talepDetaylari = detaylar;
    if (!talepDetaylari || talepDetaylari.length === 0) {
      if (!parca_kodu && !cleanedStokKartiId) {
        return res.status(400).json({
          success: false,
          message: 'Parça kodu veya stok kartı belirtilmelidir'
        });
      }

      const malzemeAdi = cleanedStokKartiId ?
        (await StokKarti.findByPk(cleanedStokKartiId))?.malzeme_adi || parca_kodu :
        parca_kodu;

      talepDetaylari = [{
        malzeme_adi: malzemeAdi,
        malzeme_kodu: parca_kodu,
        miktar: miktar || 1,
        birim: birim || 'adet',
        birim_fiyat: birim_fiyat || 0,
        stok_karti_id: cleanedStokKartiId,
        termin_tarihi: termin_tarihi
      }];
    }

    // Toplam tutarı hesapla
    const toplamTutar = talepDetaylari.reduce((toplam, detay) => {
      const detayMiktar = parseFloat(detay.miktar) || 0;
      const detayBirimFiyat = parseFloat(detay.birim_fiyat) || 0;
      return toplam + (detayMiktar * detayBirimFiyat);
    }, 0);

    // Talep oluştur
    const talep = await TedarikTalebi.create({
      kaynak_tipi,
      kaynak_id,
      is_emri_id: cleanedIsEmriId,
      parca_kodu,
      stok_karti_id: cleanedStokKartiId,
      aciklama,
      talep_eden_kullanici,
      toplamTutar,
      miktar: miktar || null,
      birim: birim || null,
      birim_fiyat: birim_fiyat || null
    }, { transaction });

    // Talep kodunu güncelle (ID aldıktan sonra)
    talep.talep_kodu = talep.generateTalepKodu();
    await talep.save({ transaction });

    // Detayları oluştur (boş string'leri null'a çevir, ID'leri kaldır)
    const yeniDetaylar = await TedarikDetay.bulkCreate(
      talepDetaylari.map(detay => {
        const { id, ...detayWithoutId } = detay; // ID'yi kaldır
        return {
          ...detayWithoutId,
          talep_id: talep.id,
          stok_karti_id: detayWithoutId.stok_karti_id === '' ? null : detayWithoutId.stok_karti_id
        };
      }),
      { transaction }
    );

    await transaction.commit();

    // Oluşturulan talebi detayları ile birlikte getir
    const olusturulanTalep = await TedarikTalebi.findByPk(talep.id, {
      include: [
        {
          model: TedarikDetay,
          as: 'detaylar',
          include: [
            {
              model: StokKarti,
              as: 'stokKarti'
            }
          ]
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Tedarik talebi başarıyla oluşturuldu',
      data: olusturulanTalep
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Tedarik talebi oluşturma hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Tedarik talebi oluşturulurken hata oluştu',
      error: error.message
    });
  }
};

// Tedarik talebini güncelle
const updateTedarikTalebi = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const {
      aciklama,
      termin_tarihi,
      detaylar,
      birim_fiyat
    } = req.body;

    const talep = await TedarikTalebi.findByPk(id);

    if (!talep) {
      return res.status(404).json({
        success: false,
        message: 'Tedarik talebi bulunamadı'
      });
    }

    // Talep sadece beklemede veya reddedilmiş ise güncellenebilir
    if (!['beklemede', 'reddedildi'].includes(talep.durum)) {
      return res.status(400).json({
        success: false,
        message: 'Sadece beklemede veya reddedilmiş talepler güncellenebilir'
      });
    }

    // Talep bilgilerini güncelle
    await talep.update({
      aciklama,
      birim_fiyat: birim_fiyat || talep.birim_fiyat
    }, { transaction });

    // Detayları güncelle
    if (detaylar && Array.isArray(detaylar)) {
      await TedarikDetay.updateDetaylar(id, detaylar);

      // Talep toplam tutarını yeniden hesapla
      const yeniToplamTutar = await TedarikDetay.calculateToplamTutar(id);
      await talep.update({ toplam_tutar: yeniToplamTutar }, { transaction });
    }

    await transaction.commit();

    // Güncellenmiş talebi getir
    const guncellenenTalep = await TedarikTalebi.findByPk(id, {
      include: [
        {
          model: TedarikDetay,
          as: 'detaylar',
          include: [
            {
              model: StokKarti,
              as: 'stokKarti'
            }
          ]
        }
      ]
    });

    res.json({
      success: true,
      message: 'Tedarik talebi başarıyla güncellendi',
      data: guncellenenTalep
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Tedarik talebi güncelleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Tedarik talebi güncellenirken hata oluştu',
      error: error.message
    });
  }
};

// Tedarik talebini sil
const deleteTedarikTalebi = async (req, res) => {
  try {
    const { id } = req.params;

    const talep = await TedarikTalebi.findByPk(id);

    if (!talep) {
      return res.status(404).json({
        success: false,
        message: 'Tedarik talebi bulunamadı'
      });
    }

    // Talep sadece beklemede ise silinebilir
    if (!['beklemede', 'reddedildi'].includes(talep.durum)) {
      return res.status(400).json({
        success: false,
        message: 'Sadece beklemede veya reddedilmiş talepler silinebilir'
      });
    }

    await talep.destroy();

    res.json({
      success: true,
      message: 'Tedarik talebi başarıyla silindi'
    });

  } catch (error) {
    console.error('Tedarik talebi silme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Tedarik talebi silinirken hata oluştu',
      error: error.message
    });
  }
};

// Tedarik talebini onayla
const onaylaTedarikTalebi = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      onaylayan_kullanici,
      notlar,
      firma_id,
      siparis_tarihi,
      onay_adedi
    } = req.body;

    const talep = await TedarikTalebi.findByPk(id);

    if (!talep) {
      return res.status(404).json({
        success: false,
        message: 'Tedarik talebi bulunamadı'
      });
    }

    // Talep durumu değiştirilebilir mi kontrol et
    if (!talep.canChangeStatusTo('onaylandi')) {
      return res.status(400).json({
        success: false,
        message: 'Bu talep onaylanamaz. Mevcut durum: ' + talep.durum
      });
    }

    // Notları birleştir
    let birlesikNotlar = talep.notlar || '';
    if (notlar || firma_id || siparis_tarihi || onay_adedi) {
      birlesikNotlar += '\n\n--- Onay Bilgileri ---\n';
      if (notlar) birlesikNotlar += `Onay Notları: ${notlar}\n`;
      if (firma_id) {
        // Firma bilgilerini al
        const db = require('../config/database').sequelize;
        const [firma] = await db.query(
          'SELECT firma_adi FROM firmalar WHERE id = ?',
          { replacements: [firma_id], type: db.QueryTypes.SELECT }
        );
        birlesikNotlar += `Sipariş Verilen Firma: ${firma?.firma_adi || 'Bilinmeyen'}\n`;
      }
      if (siparis_tarihi) birlesikNotlar += `Sipariş Tarihi: ${new Date(siparis_tarihi).toLocaleDateString('tr-TR')}\n`;
      if (onay_adedi) birlesikNotlar += `Onaylanan Adet: ${onay_adedi}\n`;
    }

    await talep.update({
      durum: 'onaylandi',
      onay_tarihi: new Date(),
      onaylayan_kullanici,
      firma_id: firma_id || null,
      siparis_tarihi: siparis_tarihi ? new Date(siparis_tarihi) : null,
      miktar: onay_adedi || talep.miktar,
      notlar: birlesikNotlar
    });

    // Otomatik sevkiyat oluştur
    if (firma_id) {
      try {
        // Sevkiyat numarası oluştur
        const today = new Date();
        const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

        // Son sevkiyat numarasını bul
        const lastShipment = await Sevkiyat.findOne({
          where: {
            sevkiyat_no: {
              [Op.like]: `SVK-${dateStr}-%`
            }
          },
          order: [['sevkiyat_no', 'DESC']]
        });

        let sequence = 1;
        if (lastShipment) {
          const lastSequence = parseInt(lastShipment.sevkiyat_no.split('-')[2]);
          sequence = lastSequence + 1;
        }

        const sevkiyatNo = `SVK-${dateStr}-${sequence.toString().padStart(3, '0')}`;

        // Sevkiyatı oluştur
        const yeniSevkiyat = await Sevkiyat.create({
          sevkiyat_no: sevkiyatNo,
          tip: 'gelen',
          firma_id: firma_id,
          lokasyon_id: 2, // Varsayılan lokasyon (ORGANIZE)
          tarih: new Date(),
          durum: 'beklemede',
          aciklama: `Otomatik oluşturulan sevkiyat - Talep: ${talep.talep_kodu}`,
          olusturan_kullanici: onaylayan_kullanici || 'Sistem Kullanıcısı',
          tedarik_talebi_id: id
        });

        const sevkiyatId = yeniSevkiyat.id;

        // Sevkiyat kalemlerini oluştur (talep detaylarından)
        const talepDetaylari = await TedarikDetay.findAll({
          where: { talep_id: id }
        });

        for (const detay of talepDetaylari) {
          const parcaKodu = detay.parca_kodu || detay.malzeme_kodu || null;
          const kalemTipi = detay.stok_karti_id ? 'stok_karti' : (parcaKodu ? 'parca' : 'stok_karti');

          await SevkiyatKalem.create({
            sevkiyat_id: sevkiyatId,
            kalem_tipi: kalemTipi,
            stok_karti_id: detay.stok_karti_id || null,
            parca_kodu: parcaKodu,
            aciklama: detay.aciklama || '',
            miktar: detay.miktar || 1
          });
        }
      } catch (sevkiyatError) {
        console.error('Otomatik sevkiyat oluşturma hatası:', sevkiyatError);
        // Sevkiyat oluşturma hatası talep onayını engellemez
      }
    }

    // Oluşturulan talebi detayları ile birlikte getir
    const onaylananTalep = await TedarikTalebi.findByPk(id, {
      include: [
        {
          model: TedarikDetay,
          as: 'detaylar'
        }
      ]
    });

    res.json({
      success: true,
      message: 'Tedarik talebi başarıyla onaylandı' + (firma_id ? ' ve otomatik sevkiyat oluşturuldu' : ''),
      data: onaylananTalep
    });

  } catch (error) {
    console.error('Tedarik talebi onaylama hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Tedarik talebi onaylanırken hata oluştu',
      error: error.message
    });
  }
};

// Tedarik talebini reddet
const reddetTedarikTalebi = async (req, res) => {
  try {
    const { id } = req.params;
    const { onaylayan_kullanici, red_nedeni } = req.body;

    const talep = await TedarikTalebi.findByPk(id);

    if (!talep) {
      return res.status(404).json({
        success: false,
        message: 'Tedarik talebi bulunamadı'
      });
    }

    // Talep durumu değiştirilebilir mi kontrol et
    if (!talep.canChangeStatusTo('reddedildi')) {
      return res.status(400).json({
        success: false,
        message: 'Bu talep reddedilemez. Mevcut durum: ' + talep.durum
      });
    }

    await talep.update({
      durum: 'reddedildi',
      onaylayan_kullanici,
      notlar: talep.notlar ?
        talep.notlar + '\n\n--- Red Nedeni ---\n' + (red_nedeni || '') :
        red_nedeni
    });

    res.json({
      success: true,
      message: 'Tedarik talebi başarıyla reddedildi',
      data: talep
    });

  } catch (error) {
    console.error('Tedarik talebi reddetme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Tedarik talebi reddedilirken hata oluştu',
      error: error.message
    });
  }
};

// İrsaliye ekle ve talebi tamamla
const irsaliyeEkleVeTamamla = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const {
      irsaliye_no,
      irsaliye_tarihi,
      teslim_tarihi,
      karsilanan_detaylar = [],
      notlar
    } = req.body;

    const talep = await TedarikTalebi.findByPk(id, {
      include: [
        {
          model: TedarikDetay,
          as: 'detaylar'
        }
      ]
    });

    if (!talep) {
      return res.status(404).json({
        success: false,
        message: 'Tedarik talebi bulunamadı'
      });
    }

    // Talep durumu kontrol et
    if (talep.durum !== 'sipariste') {
      return res.status(400).json({
        success: false,
        message: 'Sadece siparişteki talepler tamamlanabilir'
      });
    }

    // Validasyon
    if (!irsaliye_no) {
      return res.status(400).json({
        success: false,
        message: 'İrsaliye numarası zorunludur'
      });
    }

    // Karşılanan detayları güncelle
    if (karsilanan_detaylar.length > 0) {
      for (const karsilanan of karsilanan_detaylar) {
        await TedarikDetay.update(
          {
            karsilanan_miktar: parseFloat(karsilanan.karsilanan_miktar) || 0
          },
          {
            where: {
              id: karsilanan.detay_id,
              talep_id: id
            },
            transaction
          }
        );
      }
    }

    // Talebi tamamla
    await talep.update({
      durum: 'teslim_edildi',
      irsaliye_no,
      irsaliye_tarihi: irsaliye_tarihi ? new Date(irsaliye_tarihi) : new Date(),
      teslim_tarihi: teslim_tarihi ? new Date(teslim_tarihi) : new Date(),
      notlar: talep.notlar ?
        talep.notlar + '\n\n--- İrsaliye Bilgileri ---\n' + (notlar || '') :
        notlar
    }, { transaction });

    await transaction.commit();

    // Tamamlanan talebi getir
    const tamamlananTalep = await TedarikTalebi.findByPk(id, {
      include: [
        {
          model: TedarikDetay,
          as: 'detaylar'
        }
      ]
    });

    res.json({
      success: true,
      message: 'Tedarik talebi başarıyla tamamlandı',
      data: tamamlananTalep
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Tedarik talebi tamamlama hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Tedarik talebi tamamlanırken hata oluştu',
      error: error.message
    });
  }
};

// Talep durumunu siparişte olarak güncelle
const siparisteGuncelle = async (req, res) => {
  try {
    const { id } = req.params;
    const { tedarik_tarihi, notlar } = req.body;

    const talep = await TedarikTalebi.findByPk(id);

    if (!talep) {
      return res.status(404).json({
        success: false,
        message: 'Tedarik talebi bulunamadı'
      });
    }

    // Talep durumu değiştirilebilir mi kontrol et
    if (!talep.canChangeStatusTo('sipariste')) {
      return res.status(400).json({
        success: false,
        message: 'Bu talep siparişte olarak güncellenemez. Mevcut durum: ' + talep.durum
      });
    }

    await talep.update({
      durum: 'sipariste',
      tedarik_tarihi: tedarik_tarihi ? new Date(tedarik_tarihi) : null,
      notlar: talep.notlar ?
        talep.notlar + '\n\n--- Sipariş Bilgileri ---\n' + (notlar || '') :
        notlar
    });

    res.json({
      success: true,
      message: 'Tedarik talebi siparişte olarak güncellendi',
      data: talep
    });

  } catch (error) {
    console.error('Tedarik talebi güncelleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Tedarik talebi güncellenirken hata oluştu',
      error: error.message
    });
  }
};

// İstatistikler getir
const getIstatistikler = async (req, res) => {
  try {
    const { baslangic_tarihi, bitis_tarihi } = req.query;

    const istatistikler = await TedarikTalebi.getIstatistikler(baslangic_tarihi, bitis_tarihi);

    res.json({
      success: true,
      data: istatistikler
    });

  } catch (error) {
    console.error('İstatistikler hatası:', error);
    res.status(500).json({
      success: false,
      message: 'İstatistikler alınırken hata oluştu',
      error: error.message
    });
  }
};

// Kaynağa göre talepleri getir
const getByKaynak = async (req, res) => {
  try {
    const { kaynak_tipi, kaynak_id } = req.params;

    const talepler = await TedarikTalebi.findByKaynak(kaynak_tipi, kaynak_id);

    res.json({
      success: true,
      data: talepler
    });

  } catch (error) {
    console.error('Kaynağa göre talepler hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Kaynağa göre talepler alınırken hata oluştu',
      error: error.message
    });
  }
};

module.exports = {
  listTedarikTalepleri,
  getTedarikTalebiDetay,
  createTedarikTalebi,
  updateTedarikTalebi,
  deleteTedarikTalebi,
  onaylaTedarikTalebi,
  reddetTedarikTalebi,
  irsaliyeEkleVeTamamla,
  siparisteGuncelle,
  getIstatistikler,
  getByKaynak
};