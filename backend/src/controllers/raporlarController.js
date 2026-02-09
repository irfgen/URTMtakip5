const { Op, QueryTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { Vardiya, Tezgah, TezgahDurumLog } = require('../models');

/**
 * Günlük tezgah çalışma raporu - Tek tarih için tüm vardiyalar
 * Her tezgah için gündüz ve gece vardiyası bilgileri ayrı ayrı gösterilir
 */
const getVardiyaTezgahRaporu = async (req, res) => {
  try {
    const { tarih } = req.query;

    // Varsayılan tarih: bugün
    const selectedDate = tarih || new Date().toISOString().split('T')[0];

    // Tüm aktif vardiyaları al
    const vardiyalarQuery = `
      SELECT id, vardiya_adi, baslangic_saati, bitis_saati, renk
      FROM vardiyalar
      WHERE aktif = 1
      ORDER BY baslangic_saati
    `;
    const vardiyalar = await sequelize.query(vardiyalarQuery, {
      type: QueryTypes.SELECT
    });

    if (vardiyalar.length === 0) {
      return res.status(404).json({ error: 'Aktif vardiya bulunamadı' });
    }

    // Tüm tezgahları al
    const tezgahlar = await Tezgah.findAll();
    const raporTezgahlar = [];

    // Her tezgah için tüm vardiyalardaki çalışma bilgilerini hesapla
    for (const tezgah of tezgahlar) {
      const tezgahData = {
        tezgah_id: tezgah.tezgah_id,
        tezgah_tanimi: tezgah.tezgah_tanimi,
        tezgah_tipi: 'CNC',
        vardiyalar: []
      };

      // Her vardiya için hesaplama yap
      for (const vardiya of vardiyalar) {
        const vardiyaSuresi = calculateShiftDuration(vardiya.baslangic_saati, vardiya.bitis_saati);

        // Vardiya saat aralığı için başlangıç ve bitiş timestamp oluştur
        const vardiyaBaslangic = new Date(`${selectedDate}T${vardiya.baslangic_saati}`);
        let vardiyaBitis = new Date(`${selectedDate}T${vardiya.bitis_saati}`);

        // Gece vardiyası kontrolü (bitiş saati başlangıçtan küçükse)
        if (vardiyaBitis <= vardiyaBaslangic) {
          vardiyaBitis.setDate(vardiyaBitis.getDate() + 1);
        }

        // Bu saat aralığındaki logları çek
        const logs = await TezgahDurumLog.findAll({
          where: {
            tezgah_id: tezgah.tezgah_id,
            timestamp: { [Op.between]: [vardiyaBaslangic, vardiyaBitis] }
          },
          order: [['timestamp', 'ASC']]
        });

        // Ardışık aynı durumları filtrele
        const filteredLogs = [];
        let prevDurum = null;
        for (const log of logs) {
          if (prevDurum === null || log.durum !== prevDurum) {
            filteredLogs.push(log);
            prevDurum = log.durum;
          }
        }

        // Çalışma süresi hesapla
        let calismaSuresi = 0;
        let islemSayisi = 0;

        let i = 0;
        while (i < filteredLogs.length) {
          if (filteredLogs[i].durum === true) {
            // Bir sonraki durdurmayı bul
            let j = i + 1;
            while (j < filteredLogs.length && filteredLogs[j].durum !== false) j++;

            if (j < filteredLogs.length && filteredLogs[j].durum === false) {
              const basla = new Date(filteredLogs[i].timestamp);
              const bitir = new Date(filteredLogs[j].timestamp);
              const sure = (bitir - basla) / (1000 * 60); // dakika
              if (sure > 0) calismaSuresi += sure;
              islemSayisi++;
              i = j + 1;
            } else {
              // Vardiya sonunda hala çalışıyorsa, vardiya bitimine kadar ekle
              const basla = new Date(filteredLogs[i].timestamp);
              const bitir = vardiyaBitis;
              const sure = (bitir - basla) / (1000 * 60);
              if (sure > 0) calismaSuresi += sure;
              islemSayisi++;
              break;
            }
          } else {
            i++;
          }
        }

        // Duruş süresi = vardiya süresi - çalışma süresi
        const durusSuresi = Math.max(0, vardiyaSuresi - calismaSuresi);
        const verimlilikOrani = vardiyaSuresi > 0 ? (calismaSuresi / vardiyaSuresi) * 100 : 0;

        tezgahData.vardiyalar.push({
          vardiya_id: vardiya.id,
          vardiya_adi: vardiya.vardiya_adi,
          baslangic_saati: vardiya.baslangic_saati.substring(0, 5),
          bitis_saati: vardiya.bitis_saati.substring(0, 5),
          renk: vardiya.renk,
          calisma_suresi: Math.round(calismaSuresi),
          durus_suresi: Math.round(durusSuresi),
          vardiya_suresi: vardiyaSuresi,
          verimlilik_orani: Math.round(verimlilikOrani * 10) / 10,
          islem_sayisi: islemSayisi,
          aktif_mi: calismaSuresi > 0
        });
      }

      raporTezgahlar.push(tezgahData);
    }

    // Özet istatistikler
    const toplamTezgah = raporTezgahlar.length;
    let aktifTezgahSayisi = 0;
    let toplamVerimlilik = 0;
    let aktifVardiyaSayisi = 0;

    for (const tezgah of raporTezgahlar) {
      const aktifVardiyalar = tezgah.vardiyalar.filter(v => v.aktif_mi);
      if (aktifVardiyalar.length > 0) {
        aktifTezgahSayisi++;
        aktifVardiyaSayisi += aktifVardiyalar.length;
        const tezgahOrtalama = aktifVardiyalar.reduce((sum, v) => sum + v.verimlilik_orani, 0) / aktifVardiyalar.length;
        toplamVerimlilik += tezgahOrtalama;
      }
    }

    const ortalamaVerimlilik = aktifTezgahSayisi > 0 ? toplamVerimlilik / aktifTezgahSayisi : 0;

    const raporData = {
      tarih: selectedDate,
      vardiyalar: vardiyalar,
      ozet: {
        toplam_tezgah: toplamTezgah,
        aktif_tezgah: aktifTezgahSayisi,
        toplam_vardiya: vardiyalar.length,
        aktif_vardiya: aktifVardiyaSayisi,
        ortalama_verimlilik: Math.round(ortalamaVerimlilik * 10) / 10
      },
      tezgahlar: raporTezgahlar
    };

    res.json(raporData);
  } catch (error) {
    console.error('Günlük tezgah raporu hatası:', error);
    res.status(500).json({ error: 'Rapor oluşturulamadı', details: error.message });
  }
};

/**
 * Vardiya süresi hesaplama (dakika cinsinden)
 */
const calculateShiftDuration = (startTime, endTime) => {
  try {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    let startMinutes = startHour * 60 + startMin;
    let endMinutes = endHour * 60 + endMin;
    
    // Gece vardiyası kontrolü (bitiş saati başlangıçtan küçükse)
    if (endMinutes < startMinutes) {
      endMinutes += 24 * 60; // Bir gün ekle
    }
    
    return endMinutes - startMinutes;
  } catch (error) {
    console.error('Vardiya süresi hesaplama hatası:', error);
    return 0;
  }
};

/**
 * Aktif vardiyaları getir
 */
const getAktifVardiyalar = async (req, res) => {
  try {
    console.log('Aktif vardiyalar isteniyor...');
    
    const query = `
      SELECT 
        id,
        vardiya_adi,
        baslangic_saati,
        bitis_saati,
        renk
      FROM vardiyalar 
      WHERE aktif = 1
      ORDER BY baslangic_saati
    `;

    const vardiyalar = await sequelize.query(query, {
      type: QueryTypes.SELECT
    });

    console.log('Bulunan vardiya sayısı:', vardiyalar.length);
    res.json(vardiyalar);
  } catch (error) {
    console.error('Aktif vardiyalar getirme hatası:', error);
    res.status(500).json({ 
      error: 'Vardiyalar getirilemedi',
      details: error.message
    });
  }
};

/**
 * Rapor export için veri hazırlama
 */
const prepareExportData = async (req, res) => {
  try {
    const { 
      vardiya_id, 
      baslangic_tarihi, 
      bitis_tarihi,
      format = 'excel'
    } = req.query;

    // Aynı rapor verisini al
    req.query = { vardiya_id, baslangic_tarihi, bitis_tarihi };
    
    // Mock response object to capture data
    let raporData;
    const mockRes = {
      json: (data) => { raporData = data; },
      status: () => mockRes
    };

    await getVardiyaTezgahRaporu(req, mockRes);

    if (!raporData) {
      return res.status(500).json({ error: 'Export verisi hazırlanamadı' });
    }

    // Export formatına göre veri hazırla
    if (format === 'excel') {
      const excelData = {
        sheetName: `Vardiya Raporu - ${raporData.vardiya_adi}`,
        headers: [
          'Tezgah No',
          'Tezgah Adı', 
          'Tezgah Tipi',
          'Çalışma Süresi (dk)',
          'Duruş Süresi (dk)',
          'Verimlilik (%)',
          'İşlem Sayısı',
          'Durum'
        ],
        data: raporData.tezgahlar.map(t => [
          t.tezgah_id,
          t.tezgah_tanimi,
          t.tezgah_tipi,
          t.calisma_suresi,
          t.durus_suresi,
          t.verimlilik_orani,
          t.toplam_islem_sayisi,
          t.aktif_mi ? 'Aktif' : 'Pasif'
        ]),
        metadata: {
          vardiya: raporData.vardiya_adi,
          tarihAraligi: `${raporData.tarih_araligi.baslangic} - ${raporData.tarih_araligi.bitis}`,
          toplamTezgah: raporData.ozet.toplam_tezgah,
          aktifTezgah: raporData.ozet.aktif_tezgah,
          ortalamaVerimlilik: raporData.ozet.ortalama_verimlilik
        }
      };
      
      res.json(excelData);
    } else {
      res.json(raporData);
    }

  } catch (error) {
    console.error('Export veri hazırlama hatası:', error);
    res.status(500).json({ 
      error: 'Export verisi hazırlanamadı' 
    });
  }
};

/**
 * Tezgah Bazlı Üretim Zaman Çizelgesi API
 * Her tezgah için, iş emirlerinin başlama/bitiş zamanları ve detayları
 */
const getTezgahUretimZamanCizelgesi = async (req, res) => {
  try {
    const { baslangic, bitis } = req.query;
    if (!baslangic || !bitis) {
      return res.status(400).json({ error: 'Başlangıç ve bitiş tarihi gereklidir' });
    }

    // Modelleri al
    const { Tezgah, IslemKaydi, IsEmri } = require('../models');
    // Burada IslemKaydi model adı büyük harfle ve doğru şekilde kullanılmalı

    // Tüm tezgahları al
    const tezgahlar = await Tezgah.findAll();
    // Sonuçları burada toplayacağız
    const sonuc = [];

    for (const tezgah of tezgahlar) {
      // Bu tezgaha ait, ilgili tarih aralığındaki işlem kayıtlarını çek
      const islemKayitlari = await IslemKaydi.findAll({
        where: {
          tezgah_id: tezgah.tezgah_id,
          islem_tarihi: { [Op.between]: [new Date(baslangic), new Date(bitis)] }
        },
        order: [['islem_tarihi', 'ASC']]
      });
      // İş emirlerine göre grupla
      const isEmriMap = {};
      for (const kayit of islemKayitlari) {
        const is_emri_no = kayit.is_emri_no;
        if (!isEmriMap[is_emri_no]) {
          isEmriMap[is_emri_no] = {
            is_emri_no,
            baslangic: null,
            bitis: null,
            islenen_adet: 0,
            is_adi: null,
            parca_kodu: null,
            durum: null
          };
        }
        // Başlangıç zamanı: ilk 'baslatma' veya 'devam'
        if ((kayit.islem_tipi === 'baslatma' || kayit.islem_tipi === 'devam') && !isEmriMap[is_emri_no].baslangic) {
          isEmriMap[is_emri_no].baslangic = kayit.islem_tarihi;
        }
        // Bitiş zamanı: son 'tamamlama'
        if (kayit.islem_tipi === 'tamamlama') {
          isEmriMap[is_emri_no].bitis = kayit.islem_tarihi;
        }
        // İşlenen adetleri topla
        if (kayit.islenen_adet) {
          isEmriMap[is_emri_no].islenen_adet += kayit.islenen_adet;
        }
      }
      // İş emri detaylarını çekmek için toplu sorgu
      const isEmriNos = Object.keys(isEmriMap);
      let isEmriDetaylari = [];
      if (isEmriNos.length > 0) {
        try {
          isEmriDetaylari = await IsEmri.findAll({
            where: { is_emri_no: isEmriNos },
            attributes: ['is_emri_no', 'is_adi', 'parca_kodu', 'durum']
          });
        } catch (detayErr) {
          console.error('İş emri detayları sorgusunda hata:', detayErr.message, detayErr.stack);
          isEmriDetaylari = [];
        }
      }
      // Detayları eşleştir
      for (const det of isEmriDetaylari) {
        if (isEmriMap[det.is_emri_no]) {
          isEmriMap[det.is_emri_no].is_adi = det.is_adi;
          isEmriMap[det.is_emri_no].parca_kodu = det.parca_kodu;
          isEmriMap[det.is_emri_no].durum = det.durum;
        }
      }
      // Sonuç dizisine ekle
      sonuc.push({
        tezgah_id: tezgah.tezgah_id,
        tezgah_adi: tezgah.tezgah_tanimi,
        is_emirleri: isEmriNos.length > 0 ? Object.values(isEmriMap) : []
      });
    }
    res.json(sonuc);
  } catch (error) {
    console.error('Tezgah üretim zaman çizelgesi hatası:', error.message, error.stack);
    res.status(500).json({ error: 'Rapor oluşturulamadı', details: error.message });
  }
};

module.exports = {
  getVardiyaTezgahRaporu,
  getAktifVardiyalar,
  prepareExportData,
  calculateShiftDuration,
  getTezgahUretimZamanCizelgesi
};