/**
 * Günlük Vardiya Raporu Controller
 *
 * Bu controller, günlük vardiya raporu API endpoint'lerini yönetir.
 * Her tezgah için gündüz ve gece vardiyası bazında üretim raporu sunar.
 *
 * @author PM Agent
 * @version 1.0.0
 * @since 2026-01-06
 */

const vardiyaSuresiService = require('../services/vardiyaSuresiService');
const gunlukVardiyaQueries = require('../queries/gunlukVardiyaQueries');

/**
 * Günlük vardiya raporu endpoint'i
 *
 * GET /api/raporlar/gunluk-vardiya?tarih=YYYY-MM-DD
 *
 * Query Parameters:
 * - tarih (required): Rapor tarihi (YYYY-MM-DD format)
 * - tezgah_id (optional): Belirli tezgah filtreleme
 * - vardiya_id (optional): Belirli vardiya filtreleme
 */
const getGunlukVardiyaRaporu = async (req, res) => {
  try {
    const { tarih, tezgah_id, vardiya_id } = req.query;

    // Tarih validasyonu
    if (!tarih) {
      return res.status(400).json({
        success: false,
        error: 'Tarih parameteri gerekli (YYYY-MM-DD format)'
      });
    }

    // Tarih format validasyonu
    const tarihRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!tarihRegex.test(tarih)) {
      return res.status(400).json({
        success: false,
        error: 'Tarih formatı geçersiz. YYYY-MM-DD format kullanın'
      });
    }

    // Tarih geçerlilik kontrolü
    const tarihObj = new Date(tarih);
    if (isNaN(tarihObj.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Geçersiz tarih'
      });
    }

    console.log(`Günlük vardiya raporu istendi: ${tarih}`);

    // Tezgah listesini getir
    let tezgahlar;
    if (tezgah_id) {
      // Belirli tezgah filtreleme
      tezgahlar = await gunlukVardiyaQueries.getAktifTezgahlar();
      tezgahlar = tezgahlar.filter(t => t.tezgah_id == tezgah_id);
    } else {
      tezgahlar = await gunlukVardiyaQueries.getAktifTezgahlar();
    }

    if (!tezgahlar || tezgahlar.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Aktif tezgah bulunamadı'
      });
    }

    // Vardiya listesini getir
    let vardiyalar = await gunlukVardiyaQueries.getAktifVardiyalar();
    if (vardiya_id) {
      vardiyalar = vardiyalar.filter(v => v.id == vardiya_id);
    }

    if (!vardiyalar || vardiyalar.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Aktif vardiya bulunamadı'
      });
    }

    // Gündüz ve gece vardiyasını belirle
    const gunduzVardiya = vardiyalar.find(v => {
      const saat = parseInt(v.baslangic_saati.split(':')[0]);
      return saat >= 6 && saat < 18; // 06:00 - 18:00 arası gündüz
    });

    const geceVardiya = vardiyalar.find(v => {
      const saat = parseInt(v.baslangic_saati.split(':')[0]);
      return saat >= 18 || saat < 6; // 18:00 - 06:00 arası gece
    });

    // Her tezgah için rapor verisi hazırla
    const raporData = [];

    for (const tezgah of tezgahlar) {
      const tezgahData = {
        tezgah_id: tezgah.tezgah_id,
        tezgah_adi: tezgah.tezgah_tanimi,
        gunduz_vardiya: null,
        gece_vardiya: null
      };

      // Gündüz vardiyası verisi
      if (gunduzVardiya) {
        // İş emri bazlı süre hesaplama (YENİ: ParcaIslemeKayitlari tablosundan)
        const isEmriSuresi = await vardiyaSuresiService.calculateIsEmriCalismaSuresiFromParcaIsleme(
          tezgah.tezgah_id,
          tarih,
          gunduzVardiya
        );

        const isEmirleri = await gunlukVardiyaQueries.getIsEmirleriByTezgahTarih(
          tezgah.tezgah_id,
          tarih
        );

        // İş emirlerini tamamlanan miktar ile zenginleştir
        const isEmirleriWithTamamlanan = await Promise.all(
          isEmirleri.map(async (ie) => {
            const tamamlananAdet = await gunlukVardiyaQueries.getTamamlananMiktar(
              tezgah.tezgah_id,
              tarih,
              ie.is_emri_no
            );

            return {
              ...ie,
              tamamlanan_adet: tamamlananAdet
            };
          })
        );

        tezgahData.gunduz_vardiya = {
          vardiya_id: gunduzVardiya.id,
          vardiya_adi: gunduzVardiya.vardiya_adi,
          baslangic_saati: gunduzVardiya.baslangic_saati,
          bitis_saati: gunduzVardiya.bitis_saati,
          // YENİ: İş emri bazlı süre bilgileri
          toplam_calisma: isEmriSuresi.working,
          toplam_durus: isEmriSuresi.idle,
          verimlilik_orani: isEmriSuresi.verim,
          is_emri_calismalar: isEmriSuresi.is_emirleri,
          // MEVCUT: Geriye dönük uyumluluk için
          calisma_suresi_dakika: isEmriSuresi.working,
          calisma_suresi_formatli: vardiyaSuresiService.formatCalismaSuresi(isEmriSuresi.working),
          is_emirleri: isEmirleriWithTamamlanan
        };
      }

      // Gece vardiyası verisi
      if (geceVardiya) {
        // İş emri bazlı süre hesaplama (YENİ: ParcaIslemeKayitlari tablosundan)
        const isEmriSuresi = await vardiyaSuresiService.calculateIsEmriCalismaSuresiFromParcaIsleme(
          tezgah.tezgah_id,
          tarih,
          geceVardiya
        );

        const isEmirleri = await gunlukVardiyaQueries.getIsEmirleriByTezgahTarih(
          tezgah.tezgah_id,
          tarih
        );

        // İş emirlerini tamamlanan miktar ile zenginleştir
        const isEmirleriWithTamamlanan = await Promise.all(
          isEmirleri.map(async (ie) => {
            const tamamlananAdet = await gunlukVardiyaQueries.getTamamlananMiktar(
              tezgah.tezgah_id,
              tarih,
              ie.is_emri_no
            );

            return {
              ...ie,
              tamamlanan_adet: tamamlananAdet
            };
          })
        );

        tezgahData.gece_vardiya = {
          vardiya_id: geceVardiya.id,
          vardiya_adi: geceVardiya.vardiya_adi,
          baslangic_saati: geceVardiya.baslangic_saati,
          bitis_saati: geceVardiya.bitis_saati,
          // YENİ: İş emri bazlı süre bilgileri
          toplam_calisma: isEmriSuresi.working,
          toplam_durus: isEmriSuresi.idle,
          verimlilik_orani: isEmriSuresi.verim,
          is_emri_calismalar: isEmriSuresi.is_emirleri,
          // MEVCUT: Geriye dönük uyumluluk için
          calisma_suresi_dakika: isEmriSuresi.working,
          calisma_suresi_formatli: vardiyaSuresiService.formatCalismaSuresi(isEmriSuresi.working),
          is_emirleri: isEmirleriWithTamamlanan
        };
      }

      raporData.push(tezgahData);
    }

    // Özet rapor
    const ozetRapor = await gunlukVardiyaQueries.getOzetRapor(tarih);

    res.json({
      success: true,
      data: {
        tarih: tarih,
        ozet: ozetRapor,
        tezgahlar: raporData
      }
    });

  } catch (error) {
    console.error('getGunlukVardiyaRaporu hatası:', error);
    res.status(500).json({
      success: false,
      error: 'Rapor hazırlanamadı',
      message: error.message
    });
  }
};

/**
 * Özet istatistikler endpoint'i
 *
 * GET /api/raporlar/gunluk-vardiya/ozet?tarih=YYYY-MM-DD
 */
const getGunlukVardiyaOzet = async (req, res) => {
  try {
    const { tarih } = req.query;

    // Tarih validasyonu
    if (!tarih) {
      return res.status(400).json({
        success: false,
        error: 'Tarih parameteri gerekli'
      });
    }

    const ozetRapor = await gunlukVardiyaQueries.getOzetRapor(tarih);

    res.json({
      success: true,
      data: ozetRapor
    });

  } catch (error) {
    console.error('getGunlukVardiyaOzet hatası:', error);
    res.status(500).json({
      success: false,
      error: 'Özet rapor getirilemedi',
      message: error.message
    });
  }
};

module.exports = {
  getGunlukVardiyaRaporu,
  getGunlukVardiyaOzet
};
