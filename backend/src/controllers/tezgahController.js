const Tezgah = require('../models/Tezgah');
const IsEmri = require('../models/IsEmri');
const ArizaBakim = require('../models/ArizaBakim');
const { Op } = require('sequelize');

// Tezgahları getir
exports.getAllTezgahlar = async (req, res) => {
  try {
    const tezgahlar = await Tezgah.findAll({
      order: [['tezgah_id', 'ASC']]
    });

    // Tüm tezgahların arıza/bakım durumunu kontrol et
    const tezgahIds = tezgahlar.map(tezgah => tezgah.tezgah_id);
    
    // Aktif arıza ve bakım kayıtlarını getir
    const aktifArizaBakimlar = await ArizaBakim.findAll({
      where: {
        tezgah_id: { [Op.in]: tezgahIds },
        durum: 'devam_ediyor',
      }
    });
    
    console.log(`${aktifArizaBakimlar.length} aktif arıza/bakım kaydı bulundu`);
    
    // Arıza/bakım durumlarını tezgahlara ekle
    const arizaBakimMap = {};
    aktifArizaBakimlar.forEach(kayit => {
      arizaBakimMap[kayit.tezgah_id] = kayit;
    });
    
    // Tezgahların durumlarını güncelle
    const guncelTezgahlar = tezgahlar.map(tezgah => {
      const tezgahData = tezgah.toJSON();
      const arizaBakim = arizaBakimMap[tezgah.tezgah_id];
      
      if (arizaBakim) {
        // Arıza/bakım durumu varsa tezgah verisine ekle
        tezgahData.ariza_bakim_durumu = {
          durum: arizaBakim.durum,
          tipi: arizaBakim.kayit_tipi,
          baslangic_tarihi: arizaBakim.baslangic_tarihi,
          id: arizaBakim.id
        };
        
        // Tezgahın çalışma durumunu arıza veya bakımda olarak güncelle
        if (arizaBakim.kayit_tipi === 'ariza') {
          tezgahData.calisma_durumu = 'arizada';
        } else if (arizaBakim.kayit_tipi === 'bakim') {
          tezgahData.calisma_durumu = 'bakimda';
        }
      } else {
        // CNC 28 gibi manuel olarak durumu arizada/bakımda yapılmış ancak
        // ilgili ariza_bakim kaydı olmayan tezgahlar için
        if (tezgahData.calisma_durumu === 'arizada' || tezgahData.calisma_durumu === 'bakimda') {
          // Otomatik bir arıza/bakım kaydı oluştur
          tezgahData.ariza_bakim_durumu = {
            durum: 'devam_ediyor',
            tipi: tezgahData.calisma_durumu === 'arizada' ? 'ariza' : 'bakim',
            baslangic_tarihi: new Date(),
            id: null // Öncelikle null olarak işaretleyelim
          };
        }
      }
      
      return tezgahData;
    });
    
    res.json(guncelTezgahlar);
  } catch (error) {
    console.error('Tezgah listeleme hatası:', error);
    res.status(500).json({ 
      error: 'Tezgahlar getirilirken bir hata oluştu',
      details: error.message 
    });
  }
};

// Tek tezgah getir
exports.getTezgahById = async (req, res) => {
  try {
    const tezgah = await Tezgah.findByPk(req.params.id);
    if (!tezgah) {
      return res.status(404).json({ error: 'Tezgah bulunamadı' });
    }
    res.json(tezgah);
  } catch (error) {
    console.error('Tezgah getirme hatası:', error);
    res.status(500).json({ 
      error: 'Tezgah getirilirken bir hata oluştu',
      details: error.message 
    });
  }
};

// Yeni tezgah ekle
exports.createTezgah = async (req, res) => {
  try {
    const yeniTezgah = await Tezgah.create(req.body);
    res.status(201).json(yeniTezgah);
  } catch (error) {
    console.error('Tezgah ekleme hatası:', error);
    res.status(400).json({
      error: 'Tezgah eklenirken bir hata oluştu',
      details: error.message
    });
  }
};

// Tezgah güncelle
exports.updateTezgah = async (req, res) => {
  try {
    const tezgah = await Tezgah.findByPk(req.params.id);
    if (!tezgah) {
      return res.status(404).json({ error: 'Tezgah bulunamadı' });
    }
    await tezgah.update(req.body);
    res.json(tezgah);
  } catch (error) {
    console.error('Tezgah güncelleme hatası:', error);
    res.status(400).json({ 
      error: 'Tezgah güncellenirken bir hata oluştu',
      details: error.message 
    });
  }
};

// Tezgah sil
exports.deleteTezgah = async (req, res) => {
  try {
    const tezgah = await Tezgah.findByPk(req.params.id);
    if (!tezgah) {
      return res.status(404).json({ error: 'Tezgah bulunamadı' });
    }
    
    // Tezgahın aktif iş emirleri var mı kontrol et
    if (tezgah.is_emirleri && tezgah.is_emirleri.length > 0) {
      return res.status(400).json({ 
        error: 'Bu tezgah silinemez',
        details: 'Tezgaha atanmış aktif iş emirleri bulunmaktadır. Önce iş emirlerini kaldırın.'
      });
    }

    // Foreign key constraint'ları kontrol et - ilişkili kayıtlar varsa uyar
    const sequelize = tezgah.sequelize;
    
    // Tüm foreign key referanslarını kontrol et
    const checks = [];

    // Kritik tablolar - bunlar silinmemeli
    checks.push(['ariza_bakim', 'arıza/bakım']);
    checks.push(['tamamlanan_isler', 'tamamlanan iş']);
    checks.push(['parca_isleme_kayitlari', 'parça işleme']);

    // Diğer potansiyel foreign key referansları
    checks.push(['is_emirleri', 'iş emri']);
    checks.push(['islem_kayitlari', 'işlem kaydı']);
    checks.push(['tezgah_durum_logs', 'durum log']);
    checks.push(['tezgah_planlanan_isler', 'planlanan iş']);

    const refCounts = {};
    for (const [tableName, description] of checks) {
      try {
        const [result] = await sequelize.query(
          `SELECT COUNT(*) as count FROM ${tableName} WHERE tezgah_id = ?`,
          { replacements: [req.params.id] }
        );
        refCounts[description] = result[0].count;
      } catch (err) {
        console.log(`${tableName} tablosu bulunamadı veya kontrol edilemedi:`, err.message);
        refCounts[description] = 0;
      }
    }

    // Tüm kayıtları logla
    console.log('Tezgah silme kontrolleri - ID:', req.params.id);
    console.log('Bulunan kayıtlar:', refCounts);

    // Kritik kayıtları logla ama silmeye engel olmasın
    const kritikKayitlar = ['arıza/bakım', 'tamamlanan iş', 'parça işleme', 'iş emri', 'işlem kaydı'];
    const bulunanKritikKayitlar = kritikKayitlar.filter(kayit => refCounts[kayit] > 0);

    if (bulunanKritikKayitlar.length > 0) {
      const detaylar = bulunanKritikKayitlar.map(kayit => `${refCounts[kayit]} ${kayit}`).join(', ');
      console.log(`Tezgah ${req.params.id} silinecek - İlişkili kayıtlar korunacak: ${detaylar}`);
    }

    // Tezgahı sil - foreign key constraint'leri geçici olarak devre dışı bırak
    try {
      // Foreign key constraint'leri geçici olarak devre dışı bırak
      await sequelize.query('PRAGMA foreign_keys = OFF');

      // Sadece silinebilir kayıtları temizle (planlanan işler ve durum logları)
      const silinebilirTablolar = ['tezgah_planlanan_isler', 'tezgah_durum_logs'];
      for (const tableName of silinebilirTablolar) {
        try {
          await sequelize.query(`DELETE FROM ${tableName} WHERE tezgah_id = ?`,
            { replacements: [req.params.id] });
          console.log(`${tableName} tablosundan kayıtlar silindi`);
        } catch (err) {
          console.log(`${tableName} tablosundan silme işlemi başarısız:`, err.message);
        }
      }

      // Tezgahı sil - diğer tablolardaki kayıtlar korunur (tezgah_id foreign key referansları null yapılır)
      await tezgah.destroy();

      // Foreign key constraint'leri tekrar etkinleştir
      await sequelize.query('PRAGMA foreign_keys = ON');

      console.log(`Tezgah ${req.params.id} (${tezgah.tezgah_tanimi}) başarıyla silindi. İlişkili kayıtlar korundu.`);
      res.json({
        message: 'Tezgah başarıyla silindi',
        details: 'İlişkili kayıtlar (tamamlanan işler, işlem kayıtları vb.) korundu.'
      });

    } catch (deleteError) {
      // Hata durumunda foreign key constraint'leri tekrar etkinleştir
      try {
        await sequelize.query('PRAGMA foreign_keys = ON');
      } catch (pragmaError) {
        console.error('Foreign key constraint tekrar etkinleştirilirken hata:', pragmaError);
      }
      throw deleteError;
    }
    
  } catch (error) {
    console.error('Tezgah silme hatası:', error);
    
    // Foreign key constraint hatası için özel mesaj
    if (error.name === 'SequelizeForeignKeyConstraintError' || 
        error.message.includes('FOREIGN KEY constraint failed') ||
        error.message.includes('foreign key constraint')) {
      return res.status(400).json({
        error: 'Bu tezgah silinemez',
        details: 'Tezgahın başka tablolarda kayıtları bulunmaktadır. Foreign key constraint hatası.'
      });
    }
    
    res.status(500).json({ 
      error: 'Tezgah silinirken bir hata oluştu',
      details: error.message 
    });
  }
};

// İş emri atama
exports.assignIsEmri = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_emri_no, is_emri_id } = req.body;

    // İş emri NO veya ID'den birinin mevcut olması gerekir
    if (!is_emri_no && !is_emri_id) {
      return res.status(400).json({ error: 'İş emri NO veya ID gereklidir' });
    }

    const tezgah = await Tezgah.findByPk(id);
    if (!tezgah) {
      return res.status(404).json({ error: 'Tezgah bulunamadı' });
    }

    // İş emrini kontrol et - önce NO ile, yoksa ID ile ara
    let isEmri = null;
    if (is_emri_no) {
      isEmri = await IsEmri.findOne({ where: { is_emri_no } });
    } else if (is_emri_id) {
      isEmri = await IsEmri.findByPk(is_emri_id);
    }
    
    if (!isEmri) {
      return res.status(404).json({ error: 'İş emri bulunamadı' });
    }

    // Diğer tezgahlardan bu iş emrini kaldır
    const digerTezgahlar = await Tezgah.findAll({
      where: {
        tezgah_id: {
          [require('sequelize').Op.ne]: id
        }
      }
    });

    for (const digerTezgah of digerTezgahlar) {
      if (digerTezgah.is_emirleri && Array.isArray(digerTezgah.is_emirleri)) {
        const filtrelenmisIsEmirleri = digerTezgah.is_emirleri.filter(
          item => item.is_emri_no !== isEmri.is_emri_no
        );
        if (filtrelenmisIsEmirleri.length !== digerTezgah.is_emirleri.length) {
          await digerTezgah.update({
            is_emirleri: filtrelenmisIsEmirleri,
            calisma_durumu: filtrelenmisIsEmirleri.length > 0 ? 'calisiyor' : 'musait'
          });
        }
      }
    }

    // İş emrinin durumunu güncelle
    await isEmri.update({
      durum: 'tezgahta',
      tezgah_bilgisi: {
        tezgah_id: tezgah.tezgah_id,
        tezgah_adi: tezgah.tezgah_tanimi,
        atama_tarihi: new Date()
      }
    });

    // Tezgahın iş emirleri listesini güncelle
    let tezgahIsEmirleri = tezgah.is_emirleri || [];
    if (!tezgahIsEmirleri.some(item => item.is_emri_no === isEmri.is_emri_no)) {
      tezgahIsEmirleri = [...tezgahIsEmirleri, {
        is_emri_no: isEmri.is_emri_no,
        atama_tarihi: new Date(),
        setup_sayisi: isEmri.setup_sayisi,
        cnc_suresi: isEmri.cnc_suresi
      }];
    }

    await tezgah.update({
      is_emirleri: tezgahIsEmirleri,
      calisma_durumu: 'calisiyor'
    });

    res.json({
      message: 'İş emri tezgaha başarıyla atandı',
      tezgah,
      isEmri
    });
  } catch (error) {
    console.error('İş emri atama hatası:', error);
    res.status(500).json({ error: error.message });
  }
};

// İş emrini tamamla
// Arıza/Bakım Sonlandır
exports.endArizaBakim = async (req, res) => {
  try {
    const { tezgah_id, ariza_bakim_id, yapilan_islemler, maliyet } = req.body;

    if (!tezgah_id || !ariza_bakim_id) {
      return res.status(400).json({ error: 'Tezgah ID ve Arıza/Bakım ID gereklidir' });
    }

    const tezgah = await Tezgah.findByPk(tezgah_id);
    if (!tezgah) {
      return res.status(404).json({ error: 'Tezgah bulunamadı' });
    }

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

    // Eğer tezgahın iş emirleri varsa çalışıyor, yoksa boşta olarak güncelle
    const yeniDurum = tezgah.is_emirleri && tezgah.is_emirleri.length > 0 ? 'calisiyor' : 'bosta';
    
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
};
