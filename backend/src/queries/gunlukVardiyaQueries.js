/**
 * Günlük Vardiya Raporu Sorgu Fonksiyonları
 *
 * Bu modül, günlük vardiya raporu için gerekli veritabanı sorgularını
 * içerir. Her fonksiyon belirli bir veri setini döndürür.
 *
 * @author PM Agent
 * @version 1.0.1
 * @since 2026-01-06
 */

const { Op, QueryTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { Tezgah, Vardiya, IsEmri, Parca, IslemKaydi } = require('../models');

/**
 * Günlük vardiya raporu sorgu fonksiyonları
 */
class GunlukVardiyaQueries {
  /**
   * Aktif tezgah listesini getirir
   *
   * @returns {Promise<Array>} Aktif tezgah listesi
   */
  async getAktifTezgahlar() {
    try {
      const tezgahlar = await Tezgah.findAll({
        where: {
          calisma_durumu: { [Op.ne]: 'pasif' } // Pasif olmayan tezgahlar
        },
        order: [['tezgah_tanimi', 'ASC']],
        attributes: ['tezgah_id', 'tezgah_tanimi', 'calisma_durumu'],
        raw: true
      });

      return tezgahlar;
    } catch (error) {
      console.error('getAktifTezgahlar hatası:', error);
      throw new Error(`Aktif tezgahlar getirilemedi: ${error.message}`);
    }
  }

  /**
   * Aktif vardiya tanımlarını getirir
   *
   * @returns {Promise<Array>} Aktif vardiya listesi
   */
  async getAktifVardiyalar() {
    try {
      const vardiyalar = await Vardiya.findAll({
        where: {
          aktif: true
        },
        order: [['baslangic_saati', 'ASC']],
        attributes: ['id', 'vardiya_adi', 'baslangic_saati', 'bitis_saati', 'renk'],
        raw: true
      });

      return vardiyalar;
    } catch (error) {
      console.error('getAktifVardiyalar hatası:', error);
      throw new Error(`Aktif vardiyalar getirilemedi: ${error.message}`);
    }
  }

  /**
   * Belirli tezgah ve tarih için iş emirlerini getirir
   * Tezgah'ın is_emirleri_gecmisi JSON field'ini kullanarak geçmiş tarihlerdeki işleri getirir
   *
   * @param {number} tezgah_id - Tezgah ID
   * @param {string} tarih - Tarih (YYYY-MM-DD format)
   * @returns {Promise<Array>} İş emri listesi
   */
  async getIsEmirleriByTezgahTarih(tezgah_id, tarih) {
    try {
      // Tezgah'ın hem şu anki hem geçmiş iş emirlerini al
      const tezgah = await Tezgah.findByPk(tezgah_id, {
        attributes: ['tezgah_id', 'is_emirleri', 'is_emirleri_gecmisi']
      });

      if (!tezgah) {
        return [];
      }

      // Seçilen tarihteki iş emirlerini bul
      // Önce geçmişte o tarihte aktif olan iş emirlerini ara
      let gecmisIsEmirleri = tezgah.is_emirleri_gecmisi || [];

      if (typeof gecmisIsEmirleri === 'string') {
        try {
          gecmisIsEmirleri = JSON.parse(gecmisIsEmirleri);
        } catch (e) {
          console.error('JSON parse hatası (geçmiş):', e);
          gecmisIsEmirleri = [];
        }
      }

      if (!Array.isArray(gecmisIsEmirleri)) {
        gecmisIsEmirleri = [];
      }

      // Seçilen tarihte aktif olan geçmiş iş emirlerini filtrele
      const tarihObj = new Date(tarih);
      tarihObj.setHours(0, 0, 0, 0);

      // O tarihte aktif olan işleri bul
      const aktifGecmisIsEmirleri = gecmisIsEmirleri.filter(isEmri => {
        const baslangicTarihi = isEmri.baslangic_tarihi || isEmri.atama_tarihi || isEmri.olusturma_tarihi;
        const bitisTarihi = isEmri.bitis_tarihi || isEmri.tamamlanma_tarihi;

        if (!baslangicTarihi) return false;

        const baslangic = new Date(baslangicTarihi);
        const bitis = bitisTarihi ? new Date(bitisTarihi) : null;

        // İş emri seçilen tarihten önce başlamış VE henüz bitmemiş (veya seçilen tarihten sonra bitecek)
        if (baslangic > tarihObj) return false; // Henüz başlamamış
        if (bitis && bitis < tarihObj) return false; // Zaten bitmiş

        return true;
      });

      // Şu anki atanmış iş emirlerini de al
      let suAnkiIsEmirleri = tezgah.is_emirleri || [];

      if (typeof suAnkiIsEmirleri === 'string') {
        try {
          suAnkiIsEmirleri = JSON.parse(suAnkiIsEmirleri);
        } catch (e) {
          console.error('JSON parse hatası (şu anki):', e);
          suAnkiIsEmirleri = [];
        }
      }

      if (!Array.isArray(suAnkiIsEmirleri)) {
        suAnkiIsEmirleri = [];
      }

      // İki listeyi birleştir, duplicate'ları kaldır
      const birlesenIsEmirleri = [...aktifGecmisIsEmirleri];

      suAnkiIsEmirleri.forEach(suAnki => {
        const zatenVar = birlesenIsEmirleri.find(gecmis =>
          gecmis.is_emri_id === suAnki.is_emri_id ||
          gecmis.is_emri_no === suAnki.is_emri_no
        );
        if (!zatenVar) {
          birlesenIsEmirleri.push(suAnki);
        }
      });

      // Her iş emri için parça bilgilerini getir
      const isEmirleriWithParca = await Promise.all(
        birlesenIsEmirleri.map(async (isEmri) => {
          try {
            // Parça bilgilerini getir
            // Önce foto_path varsa onu kullan, yoksa teknik_resim_path
            const parcalar = await Parca.findAll({
              where: {
                [Op.or]: [
                  { parca_kodu: isEmri.parca_kodu },
                  { parca_adi: { [Op.like]: `%${isEmri.is_adi}%` } }
                ]
              },
              attributes: ['parca_kodu', 'parca_adi', 'teknik_resim_path', 'foto_path'],
              limit: 1
            });

            const parca = parcalar.length > 0 ? parcalar[0].get({ plain: true }) : null;

            // Tamamlanan adet bilgisini getir (işlem kayıtlarından)
            const tamamlananQuery = `
              SELECT SUM(islenen_adet) as tamamlanan_adet
              FROM islem_kayitlari
              WHERE tezgah_id = :tezgah_id
                AND is_emri_no = :is_emri_no
                AND DATE(islem_tarihi) = :tarih
            `;

            const tamamlananResult = await sequelize.query(tamamlananQuery, {
              replacements: {
                tezgah_id: tezgah_id,
                is_emri_no: isEmri.is_emri_no,
                tarih: tarih
              },
              type: QueryTypes.SELECT
            });

            const tamamlanan_adet = tamamlananResult[0]?.tamamlanan_adet || 0;

            return {
              is_emri_id: isEmri.is_emri_id,
              is_emri_no: isEmri.is_emri_no,
              parca_kodu: isEmri.parca_kodu,
              is_adi: isEmri.is_adi,
              adet: isEmri.adet,
              durum: isEmri.durum,
              tamamlanan_adet: tamamlanan_adet,
              atama_tarihi: isEmri.atama_tarihi || isEmri.olusturma_tarihi || isEmri.baslangic_tarihi,
              parca_adi: parca ? parca.parca_adi : null,
              teknik_resim: parca ? (parca.foto_path || parca.teknik_resim_path || '') : ''
            };
          } catch (error) {
            console.error(`Parça bilgisi hatası (iş emri: ${isEmri.is_emri_no}):`, error);
            // Parça bilgisi alınamazsa bile iş emrini dön
            return {
              is_emri_id: isEmri.is_emri_id,
              is_emri_no: isEmri.is_emri_no,
              parca_kodu: isEmri.parca_kodu,
              is_adi: isEmri.is_adi,
              adet: isEmri.adet,
              durum: isEmri.durum,
              tamamlanan_adet: 0,
              atama_tarihi: isEmri.atama_tarihi || isEmri.olusturma_tarihi || isEmri.baslangic_tarihi,
              parca_adi: null,
              teknik_resim: null
            };
          }
        })
      );

      return isEmirleriWithParca;
    } catch (error) {
      console.error('getIsEmirleriByTezgahTarih hatası:', error);
      throw new Error(`İş emirleri getirilemedi: ${error.message}`);
    }
  }

  /**
   * Belirli tezgah, tarih ve iş emri için tamamlanan miktarı hesaplar
   *
   * @param {number} tezgah_id - Tezgah ID
   * @param {string} tarih - Tarih (YYYY-MM-DD format)
   * @param {string} is_emri_no - İş emri numarası
   * @returns {Promise<number>} Tamamlanan miktar
   */
  async getTamamlananMiktar(tezgah_id, tarih, is_emri_no) {
    try {
      const result = await IslemKaydi.findAll({
        where: {
          tezgah_id,
          is_emri_no,
          islem_tarihi: {
            [Op.gte]: new Date(`${tarih} 00:00:00`),
            [Op.lt]: new Date(`${tarih} 23:59:59`)
          }
        },
        attributes: [[sequelize.fn('SUM', sequelize.col('islenen_adet')), 'toplam_tamamlanan']],
        raw: true
      });

      const toplam = result[0]?.toplam_tamamlanan || 0;
      return toplam;
    } catch (error) {
      console.error('getTamamlananMiktar hatası:', error);
      // Hata durumunda 0 dön, log kaydı tut
      console.warn(`Tamamlanan miktar hesaplanamadı: tezgah_id=${tezgah_id}, is_emri_no=${is_emri_no}`);
      return 0;
    }
  }

  /**
   * Belirli tarih için tüm tezgahların özet raporunu getirir
   * parca_isleme_kayitlari tablosunu kullanarak gerçek üretim kayıtlarını kullanır
   *
   * @param {string} tarih - Tarih (YYYY-MM-DD format)
   * @returns {Promise<object>} Özet rapor
   */
  async getOzetRapor(tarih) {
    try {
      // Toplam tezgah sayısı
      const toplamTezgah = await Tezgah.count({
        where: {
          calisma_durumu: { [Op.ne]: 'pasif' }
        }
      });

      // Tüm tezgahları getir ve is_emirleri JSON field'inden iş emri sayısını hesapla
      const tezgahlar = await Tezgah.findAll({
        where: {
          calisma_durumu: { [Op.ne]: 'pasif' }
        },
        attributes: ['tezgah_id', 'is_emirleri'],
        raw: true
      });

      let toplamIsEmri = 0;
      let tamamlananIsEmri = 0;

      tezgahlar.forEach(tezgah => {
        // is_emirleri JSON string veya array olabilir
        let isEmirleri = tezgah.is_emirleri || [];

        // Eğer JSON string ise parse et
        if (typeof isEmirleri === 'string') {
          try {
            isEmirleri = JSON.parse(isEmirleri);
          } catch (e) {
            console.error('JSON parse hatası:', e);
            isEmirleri = [];
          }
        }

        // Array olduğundan emin ol
        if (!Array.isArray(isEmirleri)) {
          isEmirleri = [];
        }

        toplamIsEmri += isEmirleri.length;

        // Tamamlanan iş emirlerini say (durum: 'tamamlandi')
        isEmirleri.forEach(isEmri => {
          if (isEmri.durum === 'tamamlandi') {
            tamamlananIsEmri++;
          }
        });
      });

      return {
        toplam_tezgah: toplamTezgah,
        toplam_is_emri: toplamIsEmri,
        tamamlanan_is_emri: tamamlananIsEmri,
        aktif_is_emri: toplamIsEmri - tamamlananIsEmri
      };
    } catch (error) {
      console.error('getOzetRapor hatası:', error);
      throw new Error(`Özet rapor getirilemedi: ${error.message}`);
    }
  }
}

module.exports = new GunlukVardiyaQueries();
