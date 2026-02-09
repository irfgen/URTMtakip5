const { IslemKaydi, IsEmri, Tezgah, sequelize } = require('../models');
const { QueryTypes } = require('sequelize');

// İşlem kaydı oluştur
exports.createIslemKaydi = async (req, res) => {
  try {
    const { is_emri_no, tezgah_id, durum, islenen_adet, aciklama } = req.body;
    
    // İş emrinin var olduğunu kontrol et
    const isEmri = await IsEmri.findOne({ where: { is_emri_no } });
    if (!isEmri) {
      return res.status(404).json({ error: 'İş emri bulunamadı' });
    }
    
    // Tezgahın var olduğunu kontrol et
    const tezgah = await Tezgah.findByPk(tezgah_id);
    if (!tezgah) {
      return res.status(404).json({ error: 'Tezgah bulunamadı' });
    }
    
    // İşlem kaydını oluştur
    const islemKaydi = await IslemKaydi.create({
      is_emri_no,
      tezgah_id,
      durum,
      islenen_adet: islenen_adet || 0,
      aciklama,
      tarih_saat: new Date()
    });
    
    // İş emrinin durumunu güncelle
    if (durum === 'basladi' && isEmri.durum !== 'Uretimde') {
      await isEmri.update({ durum: 'Uretimde', tezgah_id });
    } else if (durum === 'tamamlandi' && isEmri.durum !== 'Tamamlandi') {
      await isEmri.update({ durum: 'Tamamlandi' });
    }
    
    return res.status(201).json(islemKaydi);
  } catch (error) {
    console.error('İşlem kaydı oluşturma hatası:', error);
    return res.status(500).json({ error: 'İşlem kaydı oluşturulurken bir hata oluştu' });
  }
};

// İş emrine göre işlem kayıtlarını getir
exports.getIslemKayitlariByIsEmri = async (req, res) => {
  try {
    const { isEmriNo } = req.params;
    
    const islemKayitlari = await IslemKaydi.findAll({
      where: { is_emri_no: isEmriNo },
      order: [['tarih_saat', 'ASC']],
      include: [
        { model: Tezgah, as: 'tezgah', attributes: ['tezgah_id', 'ad'] }
      ]
    });
    
    return res.status(200).json(islemKayitlari);
  } catch (error) {
    console.error('İşlem kayıtlarını getirme hatası:', error);
    return res.status(500).json({ error: 'İşlem kayıtları getirilirken bir hata oluştu' });
  }
};

// Tezgaha göre işlem kayıtlarını getir
exports.getIslemKayitlariByTezgah = async (req, res) => {
  try {
    const { tezgahId } = req.params;
    
    const islemKayitlari = await IslemKaydi.findAll({
      where: { tezgah_id: tezgahId },
      order: [['tarih_saat', 'DESC']],
      include: [
        { model: IsEmri, as: 'is_emri', attributes: ['is_emri_id', 'is_emri_no', 'is_adi'] }
      ]
    });
    
    return res.status(200).json(islemKayitlari);
  } catch (error) {
    console.error('İşlem kayıtlarını getirme hatası:', error);
    return res.status(500).json({ error: 'İşlem kayıtları getirilirken bir hata oluştu' });
  }
};

// İşlem kaydını güncelle
exports.updateIslemKaydi = async (req, res) => {
  try {
    const { id } = req.params;
    const { durum, islenen_adet, aciklama } = req.body;
    
    const islemKaydi = await IslemKaydi.findByPk(id);
    if (!islemKaydi) {
      return res.status(404).json({ error: 'İşlem kaydı bulunamadı' });
    }
    
    await islemKaydi.update({
      durum,
      islenen_adet,
      aciklama
    });
    
    return res.status(200).json(islemKaydi);
  } catch (error) {
    console.error('İşlem kaydı güncelleme hatası:', error);
    return res.status(500).json({ error: 'İşlem kaydı güncellenirken bir hata oluştu' });
  }
};

// İşlem kaydını sil
exports.deleteIslemKaydi = async (req, res) => {
  try {
    const { id } = req.params;
    
    const islemKaydi = await IslemKaydi.findByPk(id);
    if (!islemKaydi) {
      return res.status(404).json({ error: 'İşlem kaydı bulunamadı' });
    }
    
    await islemKaydi.destroy();
    
    return res.status(200).json({ message: 'İşlem kaydı başarıyla silindi' });
  } catch (error) {
    console.error('İşlem kaydı silme hatası:', error);
    return res.status(500).json({ error: 'İşlem kaydı silinirken bir hata oluştu' });
  }
};

// İş emrinin işlem özeti için verileri hesapla
exports.calculateIsEmriStats = async (req, res) => {
  try {
    const { isEmriId } = req.params;
    const { tezgahId } = req.query; // Query parametresi olarak tezgah ID'si
    console.log("İş Emri İstatistikleri Hesaplanıyor. İş Emri ID:", isEmriId, "Tezgah ID:", tezgahId);
    
    // İş emri bilgilerini al
    const isEmri = await IsEmri.findByPk(isEmriId);
    if (!isEmri) {
      console.error(`İş emri bulunamadı. ID: ${isEmriId}`);
      return res.status(200).json({
        baslangic_tarihi: null,
        bitis_tarihi: null,
        toplam_calisma_suresi: 0,
        toplam_durus_suresi: 0,
        toplam_uretilen: 0,
        ortalama_parca_suresi: 0,
        durus_detaylari: [],
        calisma_durus_dongu_sayisi: 0,
        cnc_setup_sayisi: 1 // 0 olan değerleri 1 olarak kabul et
      });
    }
    
    console.log("İş emri bulundu:", isEmri.is_emri_no);
    
    // Tezgah durum loglarını al - tezgahId varsa sadece o tezgah için filtrele
    let query = `SELECT * FROM tezgah_durum_logs 
                 WHERE is_emri_id = ?`;
    let replacements = [isEmriId];
    
    if (tezgahId) {
      query += ` AND tezgah_id = ?`;
      replacements.push(tezgahId);
      console.log(`Sadece Tezgah ID ${tezgahId} için durum logları alınıyor.`);
    } else {
      console.log("Tüm tezgahlar için durum logları alınıyor.");
    }
    
    query += ` ORDER BY timestamp ASC`;
    
    const allDurumLogs = await sequelize.query(query, {
      replacements,
      type: QueryTypes.SELECT
    });
    
    const logMessage = tezgahId 
      ? `İş emri ${isEmriId} - Tezgah ${tezgahId} için ${allDurumLogs.length} adet ham durum logu bulundu.`
      : `İş emri ${isEmriId} için ${allDurumLogs.length} adet ham durum logu bulundu.`;
    console.log(logMessage);
    
    // Üst üste gelen aynı durumları filtrele
    const durumLogs = [];
    let oncekiDurum = null;
    
    for (const log of allDurumLogs) {
      // İlk kayıt veya durum değişikliği varsa ekle
      if (oncekiDurum === null || oncekiDurum !== log.durum) {
        durumLogs.push(log);
        oncekiDurum = log.durum;
      } else {
        console.log(`Filtrelenen tekrarlı durum: ${log.durum} - ${log.timestamp}`);
      }
    }
    
    console.log(`Filtreleme sonrası ${durumLogs.length} adet geçerli durum logu kaldı.`);
    
    if (durumLogs.length === 0) {
      return res.status(200).json({
        baslangic_tarihi: null,
        bitis_tarihi: null,
        toplam_calisma_suresi: 0,
        toplam_durus_suresi: 0,
        toplam_uretilen: 0,
        ortalama_parca_suresi: 0,
        durus_detaylari: [],
        calisma_durus_dongu_sayisi: 0,
        cnc_setup_sayisi: 1 // 0 olan değerleri 1 olarak kabul et
      });
    }
    
    // İstatistikleri hesapla
    let baslangicTarihi = null;
    let bitisTarihi = null;
    let toplamCalisma = 0;
    let toplamDurus = 0;
    let toplamUretilen = 0;
    let sonDurum = null;
    let sonDurumZamani = null;
    const duruslar = [];
    let calismaDurusDonguSayisi = 0;
    
    // Durum loglarını analiz et
    let parcaDonguSayisi = 0; // Gerçek parça üretim döngüsü sayısı
    
    for (let i = 0; i < durumLogs.length; i++) {
      const log = durumLogs[i];
      const suankiZaman = new Date(log.timestamp);
      
      if (i === 0) {
        baslangicTarihi = suankiZaman;
        sonDurum = log.durum;
        sonDurumZamani = suankiZaman;
        continue; // İlk kayıt için süre hesaplama yapmayız
      }
      
      // Önceki durumdan şimdiki zamana kadar geçen süreyi hesapla
      const fark = (suankiZaman - sonDurumZamani) / (1000 * 60); // dakika cinsinden
      
      if (sonDurum === 1) { // önceki durum çalışıyor
        toplamCalisma += fark;
        console.log(`Çalışma süresi eklendi: ${fark.toFixed(2)} dk`);
      } else if (sonDurum === 0) { // önceki durum durdu
        toplamDurus += fark;
        
        duruslar.push({
          baslangic: sonDurumZamani,
          bitis: log.timestamp,
          sure: fark.toFixed(2),
          neden: log.durus_nedeni || 'Duruş',
          aciklama: log.durus_nedeni
        });
        console.log(`Duruş süresi eklendi: ${fark.toFixed(2)} dk`);
      }

      // Parça üretim döngüsü hesaplama: SADECE çalışıyor->durdu geçişlerinde sayı artırılır
      if (sonDurum === 1 && log.durum === 0) {
        // Çalışıyor durumundan durdu durumuna geçiş = 1 parça tamamlandı
        parcaDonguSayisi++;
        console.log(`Parça tamamlandı! Toplam parça sayısı: ${parcaDonguSayisi}`);
      }

      // Genel durum değişikliği sayısını da tut (eski mantık)
      calismaDurusDonguSayisi++;

      sonDurum = log.durum;
      sonDurumZamani = suankiZaman;
      bitisTarihi = suankiZaman;
    }
    
    // Son durum çalışıyor ise ve henüz bitmemişse, şimdiki zamana kadar çalışma süresi ekle
    if (sonDurum === 1) {
      const simdikiZaman = new Date();
      const fark = (simdikiZaman - sonDurumZamani) / (1000 * 60);
      if (fark > 0) {
        toplamCalisma += fark;
        console.log(`Son çalışma süresi eklendi: ${fark.toFixed(2)} dk`);
      }
      bitisTarihi = simdikiZaman;    }
    
    // Toplam üretileni varsayılan olarak 0 bırak (bu formda manuel girilecek)
    toplamUretilen = 0;
    
    // CNC 99 (Tezgah ID: 25) için özel hesaplama - üretim hızı: 4 parça/dakika
    let gercekParcaSayisi = parcaDonguSayisi; // Varsayılan olarak döngü sayısını kullan
    if (tezgahId && parseInt(tezgahId) === 25) {
      // CNC 99 için sabit üretim hızı kullan: 4 parça/dakika
      gercekParcaSayisi = Math.round(toplamCalisma * 4); // Toplam çalışma dakikası × 4 parça/dakika
      console.log(`CNC 99 özel hesaplama: ${toplamCalisma} dk × 4 parça/dk = ${gercekParcaSayisi} parça`);
      console.log(`Döngü tabanlı hesaplama: ${parcaDonguSayisi} parça (kullanılmıyor)`);
    }
    
    // Setup sayısı hesaplama - artık gerçek parça sayısını kullanıyoruz
    let cncSetupSayisi = Math.max(1, gercekParcaSayisi || 1); // Minimum 1 setup
    
    console.log(`Toplam durum değişikliği sayısı: ${calismaDurusDonguSayisi}`);
    console.log(`Döngü tabanlı parça sayısı (çalıştı->durdu): ${parcaDonguSayisi}`);
    console.log(`Gerçek kullanılan parça sayısı: ${gercekParcaSayisi}`);
    console.log(`CNC Setup sayısı: ${cncSetupSayisi}`);
    
    // İstatistikler
    const stats = {
      is_emri_id: parseInt(isEmriId),
      baslangic_tarihi: baslangicTarihi,
      bitis_tarihi: bitisTarihi,
      toplam_calisma_suresi: Math.round(toplamCalisma),
      toplam_durus_suresi: Math.round(toplamDurus),
      toplam_uretilen: toplamUretilen,
      calisma_durus_dongu_sayisi: gercekParcaSayisi, // Artık gerçek parça sayısı
      cnc_setup_sayisi: cncSetupSayisi,
      hurda_sayisi: 0, // Bu değer formda kullanıcı tarafından girilecek
      ortalama_parca_suresi: toplamUretilen > 0 ? (toplamCalisma / toplamUretilen).toFixed(2) : 0,
      durus_detaylari: duruslar,
      // Debug bilgileri
      ham_durum_degisikligi_sayisi: calismaDurusDonguSayisi,
      filtrelenmis_parca_dongu_sayisi: gercekParcaSayisi,
      dongu_tabanli_parca_sayisi: parcaDonguSayisi, // Döngü tabanlı hesaplama
      tezgah_id: tezgahId, // Hangi tezgah için hesaplama yapıldığını göster
      hesaplama_yontemi: tezgahId && parseInt(tezgahId) === 25 ? 'uretim_hizi_tabanli' : 'dongu_tabanli'
    };
    
    return res.status(200).json(stats);
  } catch (error) {
    console.error('İstatistik hesaplama hatası:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({ 
      error: 'İş emri istatistikleri hesaplanırken bir hata oluştu',
      message: error.message,
      stack: error.stack
    });
  }
};
