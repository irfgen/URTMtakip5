const UygunsuzlukRaporlari = require('../models/UygunsuzlukRaporlari');
const UygunsuzlukNotlari = require('../models/UygunsuzlukNotlari');
const UygunsuzlukTedbirleri = require('../models/UygunsuzlukTedbirleri');
const UygunsuzlukDosyalari = require('../models/UygunsuzlukDosyalari');
const Tezgah = require('../models/Tezgah');
const Personel = require('../models/Personel');
const { Op, fn, col, literal } = require('sequelize');
const path = require('path');

// Helper function: Parse cozum_adimlari from string to array
const parseCozumAdimlari = (rapor) => {
  if (Array.isArray(rapor)) {
    return rapor.map(r => parseCozumAdimlari(r));
  }
  if (rapor && (rapor.cozum_adimlari)) {
    if (typeof rapor.cozum_adimlari === 'string') {
      try {
        rapor.cozum_adimlari = JSON.parse(rapor.cozum_adimlari);
      } catch (e) {
        rapor.cozum_adimlari = [];
      }
    }
  }
  return rapor;
};

/**
 * Uygunsuzluk Raporları Controller (Basitleştirilmiş)
 *
 * Personel ilişkileri kaldırıldı - sadece temel CRUD işlemleri
 */
exports.getAllRaporlar = async (req, res) => {
  try {
    const {
      durum,
      kategori,
      oncelik,
      baslangic_tarih,
      bitis_tarih,
      aktif
    } = req.query;

    const where = { aktif: true };

    // Filtreleme
    if (durum && durum !== 'tumu') where.durum = durum;
    if (kategori && kategori !== 'tumu') where.kategori = kategori;
    if (oncelik && oncelik !== 'tumu') where.oncelik = oncelik;
    if (aktif !== undefined) where.aktif = aktif === 'true';

    // Tarih aralığı filtresi
    if (baslangic_tarih || bitis_tarih) {
      where.tespit_tarihi = {};
      if (baslangic_tarih) {
        where.tespit_tarihi[Op.gte] = new Date(baslangic_tarih);
      }
      if (bitis_tarih) {
        where.tespit_tarihi[Op.lte] = new Date(bitis_tarih);
      }
    }

    const raporlar = await UygunsuzlukRaporlari.findAll({
      where,
      include: [
        {
          model: Tezgah,
          as: 'tezgah',
          attributes: ['tezgah_id', 'tezgah_tanimi'],
          required: false
        },
        {
          model: Personel,
          as: 'raporlayan',
          attributes: ['id', 'personel_adi', 'sicil_no'],
          required: false
        },
        {
          model: Personel,
          as: 'sorumlu',
          attributes: ['id', 'personel_adi', 'sicil_no'],
          required: false
        },
        {
          model: UygunsuzlukNotlari,
          as: 'notlar',
          order: [['created_at', 'DESC']],
          include: [
            {
              model: Personel,
              as: 'yazan',
              attributes: ['id', 'personel_adi'],
              required: false
            }
          ]
        },
        {
          model: UygunsuzlukTedbirleri,
          as: 'tedbirler',
          order: [['created_at', 'ASC']]
        },
        {
          model: UygunsuzlukDosyalari,
          as: 'dosyalar',
          order: [['created_at', 'ASC']],
          include: [
            {
              model: Personel,
              as: 'yukleyen',
              attributes: ['id', 'personel_adi'],
              required: false
            }
          ]
        }
      ],
      order: [['tespit_tarihi', 'DESC']]
    });

    res.json(parseCozumAdimlari(raporlar));
  } catch (error) {
    console.error('Uygunsuzluk raporları listeleme hatası:', error);
    res.status(500).json({ error: error.message });
  }
};

// Tek rapor detayını getir
exports.getRaporById = async (req, res) => {
  try {
    const rapor = await UygunsuzlukRaporlari.findByPk(req.params.id, {
      include: [
        {
          model: Tezgah,
          as: 'tezgah',
          attributes: ['tezgah_id', 'tezgah_tanimi'],
          required: false
        },
        {
          model: Personel,
          as: 'raporlayan',
          attributes: ['id', 'personel_adi', 'sicil_no'],
          required: false
        },
        {
          model: Personel,
          as: 'sorumlu',
          attributes: ['id', 'personel_adi', 'sicil_no'],
          required: false
        },
        {
          model: UygunsuzlukNotlari,
          as: 'notlar',
          order: [['created_at', 'DESC']],
          include: [
            {
              model: Personel,
              as: 'yazan',
              attributes: ['id', 'personel_adi'],
              required: false
            }
          ]
        },
        {
          model: UygunsuzlukTedbirleri,
          as: 'tedbirler',
          order: [['created_at', 'ASC']]
        },
        {
          model: UygunsuzlukDosyalari,
          as: 'dosyalar',
          order: [['created_at', 'ASC']],
          include: [
            {
              model: Personel,
              as: 'yukleyen',
              attributes: ['id', 'personel_adi'],
              required: false
            }
          ]
        }
      ]
    });

    if (!rapor) {
      return res.status(404).json({ error: 'Rapor bulunamadı' });
    }

    res.json(parseCozumAdimlari(rapor));
  } catch (error) {
    console.error('Uygunsuzluk raporu detayı alma hatası:', error);
    res.status(500).json({ error: error.message });
  }
};

// Yeni rapor oluştur
exports.createRapor = async (req, res) => {
  const t = await UygunsuzlukRaporlari.sequelize.transaction();

  try {
    const {
      baslik,
      aciklama,
      kategori,
      oncelik,
      lokasyon,
      tezgah_id,
      raporlayan_id
    } = req.body;

    // req.files'dan yüklenen dosyaları al
    const uploadedFiles = req.files || [];

    // Otomatik rapor numarası oluştur
    const rapor_no = await UygunsuzlukRaporlari.generateRaporNo();

    // Raporu oluştur
    const rapor = await UygunsuzlukRaporlari.create({
      rapor_no,
      baslik,
      aciklama,
      kategori,
      oncelik,
      lokasyon,
      tezgah_id: tezgah_id || null,
      raporlayan_id: raporlayan_id || null,  // Formdan gelen değer
      resim_yollar: uploadedFiles.map(f => f.path) // Yüklenen dosyaların yollarını kaydet
    }, { transaction: t });

    // Dosyaları veritabanına kaydet
    if (uploadedFiles.length > 0) {
      const dosyaKayitlari = uploadedFiles.map(dosya => ({
        rapor_id: rapor.id,
        dosya_adi: dosya.originalname,
        dosya_yolu: dosya.path,
        dosya_tipi: dosya.mimetype?.includes('image') ? 'resim' :
                  dosya.mimetype?.includes('pdf') ? 'pdf' : 'diger',
        yukleyen_id: raporlayan_id || null  // Raporlayan kişiyi dosya yükleyen olarak kullan
      }));

      await UygunsuzlukDosyalari.bulkCreate(dosyaKayitlari, {
        transaction: t,
        validate: false,
        ignoreDuplicates: true,
        individualHooks: false
      });
    }

    await t.commit();

    // Association yüklemeden yanıt dön - basit JSON
    res.status(201).json({
      id: rapor.id,
      rapor_no: rapor.rapor_no,
      baslik: rapor.baslik,
      aciklama: rapor.aciklama,
      kategori: rapor.kategori,
      oncelik: rapor.oncelik,
      lokasyon: rapor.lokasyon,
      tezgah_id: rapor.tezgah_id,
      raporlayan_id: rapor.raporlayan_id,
      sorumlu_id: rapor.sorumlu_id,
      durum: rapor.durum,
      created_at: rapor.created_at,
      updated_at: rapor.updated_at
    });
  } catch (error) {
    await t.rollback();
    console.error('Uygunsuzluk raporu oluşturma hatası:', error);
    res.status(500).json({ error: error.message });
  }
};

// Rapor güncelle
exports.updateRapor = async (req, res) => {
  try {
    const { baslik, aciklama, kategori, oncelik, lokasyon, tezgah_id, resim_yollar } = req.body;

    const rapor = await UygunsuzlukRaporlari.findByPk(req.params.id);

    if (!rapor) {
      return res.status(404).json({ error: 'Rapor bulunamadı' });
    }

    await rapor.update({
      baslik: baslik || rapor.baslik,
      aciklama: aciklama || rapor.aciklama,
      kategori: kategori || rapor.kategori,
      oncelik: oncelik || rapor.oncelik,
      lokasyon: lokasyon || rapor.lokasyon,
      tezgah_id: tezgah_id || rapor.tezgah_id,
      resim_yollar: resim_yollar || rapor.resim_yollar
    });

    res.json(rapor);
  } catch (error) {
    console.error('Uygunsuzluk raporu güncelleme hatası:', error);
    res.status(500).json({ error: error.message });
  }
};

// Rapor sil (soft delete)
exports.deleteRapor = async (req, res) => {
  try {
    const rapor = await UygunsuzlukRaporlari.findByPk(req.params.id);

    if (!rapor) {
      return res.status(404).json({ error: 'Rapor bulunamadı' });
    }

    await rapor.update({ aktif: false });

    res.json({ message: 'Rapor başarıyla silindi' });
  } catch (error) {
    console.error('Uygunsuzluk raporu silme hatası:', error);
    res.status(500).json({ error: error.message });
  }
};

// Durum güncelle
exports.guncelleDurum = async (req, res) => {
  try {
    const { durum } = req.body;

    const rapor = await UygunsuzlukRaporlari.findByPk(req.params.id);

    if (!rapor) {
      return res.status(404).json({ error: 'Rapor bulunamadı' });
    }

    // Durum geçişi kontrolü
    const gecisler = {
      'acik': ['atandi'],
      'atandi': ['cozum_surecinde', 'acik'],
      'inceleniyor': ['cozum_bekliyor', 'atandi', 'acik'],
      'cozum_bekliyor': ['kapatildi', 'inceleniyor'],
      'cozum_surecinde': ['onay', 'atandi', 'acik'],
      'onay': ['tamamlandi', 'cozum_surecinde'],
      'tamamlandi': [],
      'kapatildi': [],
      'iptal': []
    };

    if (!gecisler[durum] || !gecisler[durum].includes(rapor.durum)) {
      return res.status(400).json({
        error: `Geçersiz durum geçişi. Mevcut durum: ${rapor.durum}`
      });
    }

    await rapor.update({ durum });

    // Kapanış tarihi
    if (durum === 'kapatildi') {
      await rapor.update({ kapanma_tarihi: new Date() });
    }

    res.json(rapor);
  } catch (error) {
    console.error('Durum güncelleme hatası:', error);
    res.status(500).json({ error: error.message });
  }
};

// Not ekle
exports.notEkle = async (req, res) => {
  try {
    const { not } = req.body;

    const rapor = await UygunsuzlukRaporlari.findByPk(req.params.id);

    if (!rapor) {
      return res.status(404).json({ error: 'Rapor bulunamadı' });
    }

    const yeniNot = await UygunsuzlukNotlari.create({
      rapor_id: rapor.id,
      yazan_id: req.user?.id || null,
      not
    });

    res.status(201).json(yeniNot);
  } catch (error) {
    console.error('Not ekleme hatası:', error);
    res.status(500).json({ error: error.message });
  }
};

// Tedbir ekle
exports.tedbirEkle = async (req, res) => {
  try {
    const { tedbir_turu, aciklama, durum } = req.body;

    const rapor = await UygunsuzlukRaporlari.findByPk(req.params.id);

    if (!rapor) {
      return res.status(404).json({ error: 'Rapor bulunamadı' });
    }

    const tedbir = await UygunsuzlukTedbirleri.create({
      rapor_id: rapor.id,
      tedbir_turu,
      aciklama,
      durum: durum || 'planlandı'
    });

    res.status(201).json(tedbir);
  } catch (error) {
    console.error('Tedbir ekleme hatası:', error);
    res.status(500).json({ error: error.message });
  }
};

// Dosya yükle handler
exports.dosyaYukleHandler = async (req, res) => {
  const t = await UygunsuzlukRaporlari.sequelize.transaction();

  try {
    const rapor_id = req.params.id;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Dosya yüklenmedi' });
    }

    const rapor = await UygunsuzlukRaporlari.findByPk(rapor_id);
    if (!rapor) {
      return res.status(404).json({ error: 'Rapor bulunamadı' });
    }

    const dosyalar = req.files.map(file => ({
      rapor_id: rapor.id,
      dosya_adi: file.originalname,
      dosya_yolu: file.path,
      dosya_tipi: file.mimetype.includes('image') ? 'resim' :
                file.mimetype.includes('pdf') ? 'pdf' : 'diger',
      yukleyen_id: req.user?.id || null
    }));

    await UygunsuzlukDosyalari.bulkCreate(dosyalar, {
      transaction: t,
      validate: false,
      ignoreDuplicates: true
    });

    // Raporun resim_yollar alanını güncelle
    const mevcutResimler = rapor.resim_yollar || [];
    const yeniResimler = dosyalar
      .filter(d => d.dosya_tipi === 'resim')
      .map(d => d.dosya_yolu);

    await rapor.update({
      resim_yollar: [...mevcutResimler, ...yeniResimler]
    });

    await t.commit();

    res.json({
      message: 'Dosyalar başarıyla yüklendi',
      dosyalar
    });
  } catch (error) {
    await t.rollback();
    console.error('Dosya yükleme hatası:', error);
    res.status(500).json({ error: error.message });
  }
};

// Dosya sil
exports.dosyaSil = async (req, res) => {
  const t = await UygunsuzlukRaporlari.sequelize.transaction();
  const fs = require('fs');

  try {
    const { dosyaId } = req.params;

    const dosya = await UygunsuzlukDosyalari.findByPk(dosyaId);
    if (!dosya) {
      return res.status(404).json({ error: 'Dosya bulunamadı' });
    }

    // Raporun resim_yollar dizisinden çıkar
    const rapor = await UygunsuzlukRaporlari.findByPk(dosya.rapor_id);
    if (rapor && rapor.resim_yollar) {
      const updatedResimler = rapor.resim_yollar.filter(yol => yol !== dosya.dosya_yolu);
      await rapor.update({ resim_yollar: updatedResimler }, { transaction: t });
    }

    // Fiziksel dosyayı sil
    const filePath = path.join(__dirname, '../../', dosya.dosya_yolu);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Veritabanı kaydını sil
    await dosya.destroy({ transaction: t });

    await t.commit();

    res.json({ message: 'Dosya başarıyla silindi' });
  } catch (error) {
    await t.rollback();
    console.error('Dosya silme hatası:', error);
    res.status(500).json({ error: error.message });
  }
};

// Raporu kapat
exports.kapatRapor = async (req, res) => {
  const t = await UygunsuzlukRaporlari.sequelize.transaction();

  try {
    const { maliyet, etkinlik_puani, kapatma_notu } = req.body;

    const rapor = await UygunsuzlukRaporlari.findByPk(req.params.id);

    if (!rapor) {
      await t.commit();
      return res.status(404).json({ error: 'Rapor bulunamadı' });
    }

    if (rapor.durum !== 'cozum_bekliyor') {
      await t.commit();
      return res.status(400).json({ error: 'Sadece çözüm bekleyen raporlar kapatılabilir' });
    }

    // Sonuç notu ekle
    await UygunsuzlukNotlari.create({
      rapor_id: rapor.id,
      yazan_id: rapor.raporlayan_id || null,
      not: `KAPATMA: ${kapatma_notu || 'Rapor kapatıldı'}\nEtkinlik: ${etkinlik_puani}/5\nMaliyet: ${maliyet || 0} TL`
    }, { transaction: t });

    // Raporu kapat - transaction parametresi eklendi
    await rapor.update({
      durum: 'kapatildi',
      kapanma_tarihi: new Date(),
      maliyet: maliyet || rapor.maliyet,
      etkinlik_puani: etkinlik_puani
    }, { transaction: t });

    // Tedbirleri tamamlandı olarak işaretle
    await UygunsuzlukTedbirleri.update(
      { durum: 'tamamlandi' },
      {
        where: { rapor_id: rapor.id }
      },
      { transaction: t }
    );

    await t.commit();

    // Plain JSON döndür - association yükleme sorunlarını önlemek için
    res.json({
      id: rapor.id,
      rapor_no: rapor.rapor_no,
      baslik: rapor.baslik,
      aciklama: rapor.aciklama,
      kategori: rapor.kategori,
      oncelik: rapor.oncelik,
      durum: rapor.durum,
      lokasyon: rapor.lokasyon,
      tezgah_id: rapor.tezgah_id,
      raporlayan_id: rapor.raporlayan_id,
      sorumlu_id: rapor.sorumlu_id,
      hedef_tarih: rapor.hedef_tarih,
      tespit_tarihi: rapor.tespit_tarihi,
      kapanma_tarihi: rapor.kapanma_tarihi,
      maliyet: rapor.maliyet,
      etkinlik_puani: rapor.etkinlik_puani,
      aktif: rapor.aktif,
      created_at: rapor.created_at,
      updated_at: rapor.updated_at
    });
  } catch (error) {
    await t.rollback();
    console.error('Rapor kapatma hatası:', error);
    res.status(500).json({ error: error.message });
  }
};

// Sorumlu atama
exports.atamaSorumlu = async (req, res) => {
  try {
    const { sorumlu_id, hedef_tarih } = req.body;

    const rapor = await UygunsuzlukRaporlari.findByPk(req.params.id);

    if (!rapor) {
      return res.status(404).json({ error: 'Rapor bulunamadı' });
    }

    // Raporu güncelle
    await rapor.update({
      sorumlu_id,
      atama_tarihi: new Date(),
      hedef_tarih: hedef_tarih || null,
      durum: 'atandi'
    });

    // Güncellenmiş raporu ilişkilerle birlikte getir
    const updatedRapor = await UygunsuzlukRaporlari.findByPk(req.params.id, {
      include: [
        {
          model: Personel,
          as: 'sorumlu',
          attributes: ['id', 'personel_adi', 'sicil_no'],
          required: false
        }
      ]
    });

    res.json(parseCozumAdimlari(updatedRapor));
  } catch (error) {
    console.error('Sorumlu atama hatası:', error);
    res.status(500).json({ error: error.message });
  }
};

// İstatistikler
exports.getIstatistik = async (req, res) => {
  try {
    const { baslangic_tarih, bitis_tarih } = req.query;

    const where = { aktif: true };

    // Tarih filtresi
    if (baslangic_tarih || bitis_tarih) {
      where.tespit_tarihi = {};
      if (baslangic_tarih) {
        where.tespit_tarihi[Op.gte] = new Date(baslangic_tarih);
      }
      if (bitis_tarih) {
        where.tespit_tarihi[Op.lte] = new Date(bitis_tarih);
      }
    }

    // Toplam raporlar
    const toplam = await UygunsuzlukRaporlari.count({ where });

    // Durum bazında
    const durumDagilimi = await UygunsuzlukRaporlari.findAll({
      attributes: ['durum', [fn('COUNT', '*'), 'count']],
      where,
      group: ['durum'],
      raw: true
    });

    // Kategori bazında
    const kategoriDagilimi = await UygunsuzlukRaporlari.findAll({
      attributes: ['kategori', [fn('COUNT', '*'), 'count']],
      where,
      group: ['kategori'],
      raw: true
    });

    // Öncelik bazında
    const oncelikDagilimi = await UygunsuzlukRaporlari.findAll({
      attributes: ['oncelik', [fn('COUNT', '*'), 'count']],
      where,
      group: ['oncelik'],
      raw: true
    });

    // Açık rapor sayısı
    const acikRaporlar = await UygunsuzlukRaporlari.count({
      where: { ...where, durum: ['acik', 'atandi', 'inceleniyor'] }
    });

    // Kritik raporlar (acil)
    const kritikRaporlar = await UygunsuzlukRaporlari.count({
      where: { ...where, oncelik: 'acil', durum: ['acik', 'atandi', 'inceleniyor'] }
    });

    const istatistik = {
      toplam,
      acik: acikRaporlar,
      kritik: kritikRaporlar,
      kapanan: await UygunsuzlukRaporlari.count({
        where: { ...where, durum: 'kapatildi' }
      }),
      durum_dağilimi: durumDagilimi,
      kategori_dağilimi: kategoriDagilimi,
      oncelik_dağilimi: oncelikDagilimi,
     ortalama_kapanma_suresi: 0
    };

    res.json(istatistik);
  } catch (error) {
    console.error('İstatistik hatası:', error);
    res.status(500).json({ error: error.message });
  }
};

// Çözüm adımı ekle
exports.cozumAdimEkle = async (req, res) => {
  try {
    const { adim } = req.body;

    if (!adim || adim.trim() === '') {
      return res.status(400).json({ error: 'Çözüm adımı boş olamaz' });
    }

    const rapor = await UygunsuzlukRaporlari.findByPk(req.params.id);

    if (!rapor) {
      return res.status(404).json({ error: 'Rapor bulunamadı' });
    }

    // İlk adım eklenirken durumu cozum_surecinde yap
    // cozum_adimlari string ise parse et (SQLite JSON TEXT olarak saklar)
    let mevcutAdimlar = rapor.cozum_adimlari || [];
    if (typeof mevcutAdimlar === 'string') {
      try {
        mevcutAdimlar = JSON.parse(mevcutAdimlar);
      } catch (e) {
        mevcutAdimlar = [];
      }
    }
    if (!Array.isArray(mevcutAdimlar)) {
      mevcutAdimlar = [];
    }

    const yeniDurum = mevcutAdimlar.length === 0 ? 'cozum_surecinde' : rapor.durum;

    mevcutAdimlar.push({
      adim: adim.trim(),
      tamamlandi: false,
      eklenme_tarihi: new Date().toISOString()
    });

    await rapor.update({
      cozum_adimlari: mevcutAdimlar,
      durum: yeniDurum
    });

    // Güncellenmiş raporu ilişkilerle birlikte getir
    const updatedRapor = await UygunsuzlukRaporlari.findByPk(req.params.id, {
      include: [
        {
          model: Personel,
          as: 'raporlayan',
          attributes: ['id', 'personel_adi', 'sicil_no'],
          required: false
        },
        {
          model: Personel,
          as: 'sorumlu',
          attributes: ['id', 'personel_adi', 'sicil_no'],
          required: false
        }
      ]
    });

    res.json(parseCozumAdimlari(updatedRapor));
  } catch (error) {
    console.error('Çözüm adımı ekleme hatası:', error);
    res.status(500).json({ error: error.message });
  }
};

// Çözüm adımını tamamlandı işaretle
exports.cozumAdimTamamla = async (req, res) => {
  try {
    // adimIndex URL parametresinden gelir (req.params), req.body'den değil
    const adimIndex = parseInt(req.params.adimIndex);

    if (isNaN(adimIndex) || adimIndex < 0) {
      return res.status(400).json({ error: 'Geçersiz adım indeksi' });
    }

    const rapor = await UygunsuzlukRaporlari.findByPk(req.params.id);

    if (!rapor) {
      return res.status(404).json({ error: 'Rapor bulunamadı' });
    }

    // cozum_adimlari string ise parse et (SQLite JSON TEXT olarak saklar)
    let adimlar = rapor.cozum_adimlari || [];
    if (typeof adimlar === 'string') {
      try {
        adimlar = JSON.parse(adimlar);
      } catch (e) {
        adimlar = [];
      }
    }
    if (!Array.isArray(adimlar)) {
      adimlar = [];
    }

    if (adimIndex >= adimlar.length) {
      return res.status(400).json({ error: 'Adım indeksi dışarıda taştı' });
    }

    // Adımı tamamlandı olarak işaretle
    adimlar[adimIndex].tamamlandi = true;
    adimlar[adimIndex].tamamlanma_tarihi = new Date().toISOString();

    // Tüm adımlar tamamlandıysa durumu 'onay' yap
    const tumAdimlarTamam = adimlar.length > 0 && adimlar.every(a => a.tamamlandi);
    const yeniDurum = tumAdimlarTamam ? 'onay' : rapor.durum;

    await rapor.update({
      cozum_adimlari: adimlar,
      durum: yeniDurum
    });

    // Güncellenmiş raporu ilişkilerle birlikte getir
    const updatedRapor = await UygunsuzlukRaporlari.findByPk(req.params.id, {
      include: [
        {
          model: Personel,
          as: 'raporlayan',
          attributes: ['id', 'personel_adi', 'sicil_no'],
          required: false
        },
        {
          model: Personel,
          as: 'sorumlu',
          attributes: ['id', 'personel_adi', 'sicil_no'],
          required: false
        }
      ]
    });

    res.json(parseCozumAdimlari(updatedRapor));
  } catch (error) {
    console.error('Çözüm adımı tamamlama hatası:', error);
    res.status(500).json({ error: error.message });
  }
};

// Raporu onayla ve tamamlandı olarak işaretle
exports.onayVer = async (req, res) => {
  const t = await UygunsuzlukRaporlari.sequelize.transaction();

  try {
    const { onay_notu } = req.body;

    const rapor = await UygunsuzlukRaporlari.findByPk(req.params.id);

    if (!rapor) {
      await t.commit();
      return res.status(404).json({ error: 'Rapor bulunamadı' });
    }

    if (rapor.durum !== 'onay') {
      await t.commit();
      return res.status(400).json({ error: 'Sadece onay bekleyen raporlar onaylanabilir' });
    }

    // Onay notu ekle
    await UygunsuzlukNotlari.create({
      rapor_id: rapor.id,
      yazan_id: rapor.raporlayan_id || null,
      not: `ONAY: ${onay_notu || 'Rapor onaylandı ve tamamlandı'}`
    }, { transaction: t });

    // Raporu tamamlandı olarak işaretle
    await rapor.update({
      durum: 'tamamlandi',
      kapanma_tarihi: new Date()
    }, { transaction: t });

    await t.commit();

    // Güncellenmiş raporu ilişkilerle birlikte getir
    const updatedRapor = await UygunsuzlukRaporlari.findByPk(req.params.id, {
      include: [
        {
          model: Personel,
          as: 'raporlayan',
          attributes: ['id', 'personel_adi', 'sicil_no'],
          required: false
        },
        {
          model: Personel,
          as: 'sorumlu',
          attributes: ['id', 'personel_adi', 'sicil_no'],
          required: false
        }
      ]
    });

    res.json(parseCozumAdimlari(updatedRapor));
  } catch (error) {
    await t.rollback();
    console.error('Onay verme hatası:', error);
    res.status(500).json({ error: error.message });
  }
};
