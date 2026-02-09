/**
 * Vardiya Süresi Hesaplama Servisi
 *
 * Bu servis, tezgahların belirli bir tarih ve vardiya için
 * çalışma süresini hesaplar. TezgahDurumLog tablosunu kullanarak
 * durum değişikliklerini analiz eder ve toplam çalışma süresini
 * dakika cinsinden döndürür.
 *
 * YENİ: ParcaIslemeKayitlari tablosunu kullanarak
 * iş emri bazlı süre ve işlem sayısı hesaplar.
 *
 * @author PM Agent
 * @version 2.0.0
 * @since 2026-01-06
 */

const { TezgahDurumLog, ParcaIslemeKayitlari } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * Vardiya süresi hesaplama servisi
 */
class VardiyaSuresiService {
  /**
   * Tezgahın belirli tarih ve vardiya için çalışma süresini hesaplar
   *
   * @param {number} tezgah_id - Tezgah ID
   * @param {string} tarih - Tarih (YYYY-MM-DD format)
   * @param {object} vardiya - Vardiya bilgisi { baslangic_saati, bitis_saati }
   * @returns {Promise<number>} Çalışma süresi (dakika)
   */
  async calculateCalismaSuresi(tezgah_id, tarih, vardiya) {
    try {
      const { baslangic_saati, bitis_saati } = vardiya;

      // Vardiya saatlerini parse et
      const [baslangicSaat, baslangicDakika] = baslangic_saati.split(':').map(Number);
      const [bitisSaat, bitisDakika] = bitis_saati.split(':').map(Number);

      // Tezgah durum loglarını getir (sıralı)
      const logs = await TezgahDurumLog.findAll({
        where: {
          tezgah_id,
          createdAt: {
            [Op.gte]: new Date(`${tarih} 00:00:00`),
            [Op.lt]: new Date(`${tarih} 23:59:59`)
          }
        },
        order: [['createdAt', 'ASC']],
        attributes: ['id', 'durum', 'createdAt', 'is_emri_id'],
        raw: true
      });

      // Log yoksa 0 dakika
      if (!logs || logs.length === 0) {
        return 0;
      }

      // Her log kaydını vardiya saatine göre filtrele
      const filtrelenmisLoglar = logs.filter(log => {
        const logSaati = new Date(log.createdAt);
        const logSaat = logSaati.getHours();
        const logDakika = logSaati.getMinutes();
        const logDakikaToplam = logSaat * 60 + logDakika;

        const baslangicDakikaToplam = baslangicSaat * 60 + baslangicDakika;
        const bitisDakikaToplam = bitisSaat * 60 + bitisDakika;

        // Gece yarısı geçişini kontrol et
        if (bitisDakikaToplam <= baslangicDakikaToplam) {
          // Gece yarısı geçişi (örn: 23:00 - 07:00)
          return logDakikaToplam >= baslangicDakikaToplam || logDakikaToplam < bitisDakikaToplam;
        } else {
          // Normal vardiya (örn: 08:00 - 16:00)
          return logDakikaToplam >= baslangicDakikaToplam && logDakikaToplam < bitisDakikaToplam;
        }
      });

      // Filtrelenmiş log yoksa 0 dakika
      if (filtrelenmisLoglar.length === 0) {
        return 0;
      }

      // Çalışma süresini hesapla
      let toplamCalismaDakika = 0;
      let oncekiDurum = null;
      let oncekiTimestamp = null;

      for (const log of filtrelenmisLoglar) {
        const mevcutDurum = log.durum;
        const mevcutTimestamp = new Date(log.createdAt);

        if (oncekiDurum !== null && oncekiTimestamp !== null) {
          // Önceki durum true (çalışıyor) ise, şu anki false (durdu) arasındaki süreyi ekle
          if (oncekiDurum === true && mevcutDurum === false) {
            const farkDakika = Math.floor((mevcutTimestamp - oncekiTimestamp) / (1000 * 60));
            toplamCalismaDakika += farkDakika;
          }
        }

        oncekiDurum = mevcutDurum;
        oncekiTimestamp = mevcutTimestamp;
      }

      // Son durum true ise (henüz durdurulmadı), son log zamanından vardiya bitişine kadar ekle
      if (oncekiDurum === true && oncekiTimestamp !== null) {
        const bitisTimestamp = this._calculateBitisTimestamp(tarih, bitis_saati);
        const farkDakika = Math.floor((bitisTimestamp - oncekiTimestamp) / (1000 * 60));
        toplamCalismaDakika += farkDakika;
      }

      return toplamCalismaDakika;

    } catch (error) {
      console.error('VardiyaSuresiService hatası:', error);
      throw new Error(`Çalışma süresi hesaplanamadı: ${error.message}`);
    }
  }

  /**
   * Vardiya bitiş timestamp'ini hesaplar
   *
   * @private
   * @param {string} tarih - Tarih (YYYY-MM-DD format)
   * @param {string} bitis_saati - Bitiş saati (HH:mm format)
   * @returns {Date} Bitiş timestamp
   */
  _calculateBitisTimestamp(tarih, bitis_saati) {
    const [saat, dakika] = bitis_saati.split(':').map(Number);
    const bitisTimestamp = new Date(`${tarih} 00:00:00`);
    bitisTimestamp.setHours(saat, dakika, 0, 0);

    // Eğer bitiş saati başlangıç saatinden küçükse (gece yarısı geçişi),
    // bir sonraki günü kullan
    // Bu logic'i kullanım yerine göre ayarlayabiliriz

    return bitisTimestamp;
  }

  /**
   * Dakikayı "X saat Y dakika" formatına çevirir
   *
   * @param {number} dakika - Dakika
   * @returns {string} Formatlı süre
   */
  formatCalismaSuresi(dakika) {
    if (dakika === 0) {
      return '0 dakika';
    }

    const saat = Math.floor(dakika / 60);
    const kalanDakika = dakika % 60;

    if (saat > 0 && kalanDakika > 0) {
      return `${saat} saat ${kalanDakika} dakika`;
    } else if (saat > 0) {
      return `${saat} saat`;
    } else {
      return `${kalanDakika} dakika`;
    }
  }

  /**
   * Birden fazla tezgah için toplu çalışma süresi hesaplar
   *
   * @param {Array<number>} tezgah_ids - Tezgah ID'leri
   * @param {string} tarih - Tarih (YYYY-MM-DD format)
   * @param {Array<object>} vardiyalar - Vardiya listesi
   * @returns {Promise<object>} Tezgah bazlı çalışma süreleri
   */
  async calculateBatchCalismaSuresi(tezgah_ids, tarih, vardiyalar) {
    const results = {};

    for (const tezgah_id of tezgah_ids) {
      results[tezgah_id] = {};

      for (const vardiya of vardiyalar) {
        const calismaSuresi = await this.calculateCalismaSuresi(
          tezgah_id,
          tarih,
          vardiya
        );
        results[tezgah_id][vardiya.id] = {
          dakika: calismaSuresi,
          formatli: this.formatCalismaSuresi(calismaSuresi)
        };
      }
    }

    return results;
  }

  /**
   * İş emri bazlı çalışma süresi hesaplar
   * Her iş emrinin ne kadar süre çalıştığını ve toplam çalışma/duruş sürelerini döndürür
   *
   * @param {number} tezgah_id - Tezgah ID
   * @param {string} tarih - Tarih (YYYY-MM-DD format)
   * @param {object} vardiya - Vardiya bilgisi { baslangic_saati, bitis_saati }
   * @returns {Promise<object>} İş emri bazlı süre dağılımı
   */
  async calculateIsEmriCalismaSuresi(tezgah_id, tarih, vardiya) {
    try {
      const { baslangic_saati, bitis_saati } = vardiya;

      // Vardiya saatlerini parse et
      const [baslangicSaat, baslangicDakika] = baslangic_saati.split(':').map(Number);
      const [bitisSaat, bitisDakika] = bitis_saati.split(':').map(Number);

      // Vardiya başlangıç ve bitiş timestamp'leri
      const vardiyaBaslangic = new Date(`${tarih} 00:00:00`);
      vardiyaBaslangic.setHours(baslangicSaat, baslangicDakika, 0, 0);

      const vardiyaBitis = new Date(`${tarih} 00:00:00`);
      vardiyaBitis.setHours(bitisSaat, bitisDakika, 0, 0);

      // Gece yarısı geçişini kontrol et
      if (vardiyaBitis <= vardiyaBaslangic) {
        vardiyaBitis.setDate(vardiyaBitis.getDate() + 1);
      }

      // Vardiya toplam süresi (dakika)
      const vardiyaToplamDakika = Math.floor((vardiyaBitis - vardiyaBaslangic) / (1000 * 60));

      // Tezgah durum loglarını getir (sıralı)
      const logs = await TezgahDurumLog.findAll({
        where: {
          tezgah_id,
          createdAt: {
            [Op.gte]: vardiyaBaslangic,
            [Op.lt]: vardiyaBitis
          }
        },
        order: [['createdAt', 'ASC']],
        attributes: ['id', 'durum', 'createdAt', 'is_emri_id'],
        raw: true
      });

      // Log yoksa boş sonuç dön
      if (!logs || logs.length === 0) {
        return {
          toplam: vardiyaToplamDakika,
          working: 0,
          idle: vardiyaToplamDakika,
          verim: 0,
          is_emirleri: []
        };
      }

      // İş emri bazlı süre hesaplama
      const isEmriSuresiMap = new Map(); // is_emri_id -> dakika
      let toplamCalismaDakika = 0;
      let oncekiDurum = null;
      let oncekiTimestamp = null;
      let mevcutIsEmriId = null;

      for (const log of logs) {
        const mevcutDurum = log.durum;
        const mevcutTimestamp = new Date(log.createdAt);
        const logIsEmriId = log.is_emri_id;

        // Durum değişikliği analiz et
        if (oncekiDurum !== null && oncekiTimestamp !== null) {
          // Önceki durum true (çalışıyor) ise, şu anki false (durdu) arasındaki süreyi hesapla
          if (oncekiDurum === true && mevcutDurum === false) {
            const farkDakika = Math.floor((mevcutTimestamp - oncekiTimestamp) / (1000 * 60));

            if (mevcutIsEmriId !== null) {
              // İş emri ile ilgili çalışma
              const anahtar = mevcutIsEmriId || 'bilinmeyen';
              if (!isEmriSuresiMap.has(anahtar)) {
                isEmriSuresiMap.set(anahtar, {
                  is_emri_id: mevcutIsEmriId,
                  sure_dakika: 0,
                  is_emri_no: null
                });
              }
              isEmriSuresiMap.get(anahtar).sure_dakika += farkDakika;
            }

            toplamCalismaDakika += farkDakika;
          }
        }

        oncekiDurum = mevcutDurum;
        oncekiTimestamp = mevcutTimestamp;
        if (mevcutDurum === true) {
          mevcutIsEmriId = logIsEmriId;
        }
      }

      // Son durum true ise (henüz durdurulmadı)
      if (oncekiDurum === true && oncekiTimestamp !== null) {
        const farkDakika = Math.floor((vardiyaBitis - oncekiTimestamp) / (1000 * 60));

        if (mevcutIsEmriId !== null) {
          const anahtar = mevcutIsEmriId || 'bilinmeyen';
          if (!isEmriSuresiMap.has(anahtar)) {
            isEmriSuresiMap.set(anahtar, {
              is_emri_id: mevcutIsEmriId,
              sure_dakika: 0,
              is_emri_no: null
            });
          }
          isEmriSuresiMap.get(anahtar).sure_dakika += farkDakika;
        }

        toplamCalismaDakika += farkDakika;
      }

      // Duruş süresi
      const durusDakika = Math.max(0, vardiyaToplamDakika - toplamCalismaDakika);

      // İş emri bilgilerini getir (is_emri_no için)
      const isEmirleri = [];
      for (const [anahtar, data] of isEmriSuresiMap) {
        let isEmriNo = 'Bilinmeyen';

        if (data.is_emri_id) {
          try {
            const { IsEmri } = require('../models');
            const isEmri = await IsEmri.findByPk(data.is_emri_id, {
              attributes: ['is_emri_no'],
              raw: true
            });
            if (isEmri) {
              isEmriNo = isEmri.is_emri_no;
            }
          } catch (error) {
            console.error(`İş emri bilgisi alınamadı (ID: ${data.is_emri_id}):`, error);
          }
        }

        const oran = toplamCalismaDakika > 0 ? (data.sure_dakika / toplamCalismaDakika) * 100 : 0;

        isEmirleri.push({
          is_emri_id: data.is_emri_id,
          is_emri_no: isEmriNo,
          sure_dakika: data.sure_dakika,
          oran: Math.round(oran * 10) / 10 // 1 decimal
        });
      }

      // İş emirlerini süreye göre sırala (büyükten küçüğe)
      isEmirleri.sort((a, b) => b.sure_dakika - a.sure_dakika);

      // Verimlilik oranı
      const verimlilikOrani = vardiyaToplamDakika > 0
        ? (toplamCalismaDakika / vardiyaToplamDakika) * 100
        : 0;

      return {
        toplam: vardiyaToplamDakika,
        working: toplamCalismaDakika,
        idle: durusDakika,
        verim: Math.round(verimlilikOrani * 10) / 10, // 1 decimal
        is_emirleri: isEmirleri
      };

    } catch (error) {
      console.error('calculateIsEmriCalismaSuresi hatası:', error);
      throw new Error(`İş emri bazlı süre hesaplanamadı: ${error.message}`);
    }
  }

  /**
   * YENİ: Parça İşleme Kayıtlarından İş Emri Süreleri
   *
   * Bu fonksiyon, parca_isleme_kayitlari tablosunu kullanarak
   * iş emirlerinin çalışma sürelerini ve işlem sayılarını hesaplar.
   *
   * @param {number} tezgah_id - Tezgah ID
   * @param {string} tarih - Tarih (YYYY-MM-DD format)
   * @param {object} vardiya - Vardiya bilgisi { baslangic_saati, bitis_saati }
   * @returns {Promise<object>} İş emri süreleri ve işlem sayıları
   */
  async calculateIsEmriCalismaSuresiFromParcaIsleme(tezgah_id, tarih, vardiya) {
    try {
      const { baslangic_saati, bitis_saati } = vardiya;

      // Vardiya saatlerini parse et
      const [baslangicSaat, baslangicDakika] = baslangic_saati.split(':').map(Number);
      const [bitisSaat, bitisDakika] = bitis_saati.split(':').map(Number);

      // Vardiya başlangıç ve bitiş timestamp'leri
      // Yerel saat dilimini kullan (Türkiye saati UTC+3)
      // Tarih parçalarını ayır
      const [yil, ay, gun] = tarih.split('-').map(Number);
      const vardiyaBaslangic = new Date(yil, ay - 1, gun, baslangicSaat, baslangicDakika, 0, 0);
      const vardiyaBitis = new Date(yil, ay - 1, gun, bitisSaat, bitisDakika, 0, 0);

      // Gece yarısı geçişini kontrol et
      if (vardiyaBitis <= vardiyaBaslangic) {
        vardiyaBitis.setDate(vardiyaBitis.getDate() + 1);
      }

      console.log(`[ParcaIsleme] Tezgah: ${tezgah_id}, Tarih: ${tarih}, Vardiya: ${vardiyaBaslangic.toISOString()} - ${vardiyaBitis.toISOString()}`);

      // Vardiya toplam süresi (dakika)
      const vardiyaToplamDakika = Math.floor((vardiyaBitis - vardiyaBaslangic) / (1000 * 60));

      // Parça işleme kayıtlarını getir - RAW QUERY kullanıyoruz çünkü Sequelize timezone sorunları yaşıyor
      // Veritabanındaki saatler UTC formatında (2025-12-23T05:17:03Z) saklanmış
      const vardiyaBaslangicUTC = vardiyaBaslangic.toISOString(); // 2025-12-23T04:30:00.000Z
      const vardiyaBitisUTC = vardiyaBitis.toISOString();       // 2025-12-23T14:10:00.000Z

      const kayitlar = await sequelize.query(`
        SELECT is_emri_id, baslangic_zamani, bitis_zamani, isleme_suresi_dakika
        FROM parca_isleme_kayitlari
        WHERE tezgah_id = :tezgah_id
          AND baslangic_zamani >= :vardiyaBaslangic
          AND baslangic_zamani < :vardiyaBitis
        ORDER BY baslangic_zamani ASC
      `, {
        replacements: {
          tezgah_id,
          vardiyaBaslangic: vardiyaBaslangicUTC,
          vardiyaBitis: vardiyaBitisUTC
        },
        type: sequelize.QueryTypes.SELECT
      });

      console.log(`[ParcaIsleme] Kayıt sayısı: ${kayitlar.length}`);

      // Kayıt yoksa boş sonuç dön
      if (!kayitlar || kayitlar.length === 0) {
        return {
          toplam: vardiyaToplamDakika,
          working: 0,
          idle: vardiyaToplamDakika,
          verim: 0,
          is_emirleri: []
        };
      }

      // İş emri bazlı gruplama
      const isEmriMap = new Map(); // is_emri_id -> { sure_dakika, islem_sayisi }

      for (const kayit of kayitlar) {
        const isEmriId = kayit.is_emri_id;
        const sureDakika = kayit.isleme_suresi_dakika;

        if (!isEmriMap.has(isEmriId)) {
          isEmriMap.set(isEmriId, {
            is_emri_id: isEmriId,
            sure_dakika: 0,
            islem_sayisi: 0,
            is_emri_no: null
          });
        }

        const data = isEmriMap.get(isEmriId);
        data.sure_dakika += sureDakika;
        data.islem_sayisi += 1;
      }

      // Toplam çalışma süresi
      const toplamCalismaDakika = Array.from(isEmriMap.values())
        .reduce((sum, data) => sum + data.sure_dakika, 0);

      // Duruş süresi
      const durusDakika = Math.max(0, vardiyaToplamDakika - toplamCalismaDakika);

      // İş emri bilgilerini getir (is_emri_no için)
      const isEmirleri = [];
      for (const [isEmriId, data] of isEmriMap) {
        let isEmriNo = 'Bilinmeyen';

        try {
          const { IsEmri } = require('../models');
          const isEmri = await IsEmri.findByPk(isEmriId, {
            attributes: ['is_emri_no'],
            raw: true
          });
          if (isEmri) {
            isEmriNo = isEmri.is_emri_no;
          }
        } catch (error) {
          console.error(`İş emri bilgisi alınamadı (ID: ${isEmriId}):`, error);
        }

        const oran = toplamCalismaDakika > 0 ? (data.sure_dakika / toplamCalismaDakika) * 100 : 0;

        isEmirleri.push({
          is_emri_id: data.is_emri_id,
          is_emri_no: isEmriNo,
          sure_dakika: data.sure_dakika,
          islem_sayisi: data.islem_sayisi,
          oran: Math.round(oran * 10) / 10 // 1 decimal
        });
      }

      // İş emirlerini süreye göre sırala (büyükten küçüğe)
      isEmirleri.sort((a, b) => b.sure_dakika - a.sure_dakika);

      // Verimlilik oranı
      const verimlilikOrani = vardiyaToplamDakika > 0
        ? (toplamCalismaDakika / vardiyaToplamDakika) * 100
        : 0;

      return {
        toplam: vardiyaToplamDakika,
        working: toplamCalismaDakika,
        idle: durusDakika,
        verim: Math.round(verimlilikOrani * 10) / 10, // 1 decimal
        is_emirleri: isEmirleri
      };

    } catch (error) {
      console.error('calculateIsEmriCalismaSuresiFromParcaIsleme hatası:', error);
      throw new Error(`Parça işleme kayıtlarından süre hesaplanamadı: ${error.message}`);
    }
  }
}

module.exports = new VardiyaSuresiService();
