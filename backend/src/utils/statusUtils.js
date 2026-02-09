const IsEmriDurum = require('../models/IsEmriDurum');

/**
 * İş emri durum yönetimi utility fonksiyonları
 */
class StatusUtils {
  
  /**
   * Tüm aktif durumları getir
   */
  static async getActiveDurumlar() {
    try {
      const durumlar = await IsEmriDurum.findAll({
        where: { aktif: true },
        order: [['sira_no', 'ASC'], ['durum_adi', 'ASC']]
      });
      return durumlar;
    } catch (error) {
      console.error('Aktif durumlar getirilirken hata:', error);
      throw error;
    }
  }

  /**
   * Durum kodunun geçerli olup olmadığını kontrol et
   */
  static async isValidDurum(durumKodu) {
    try {
      const durum = await IsEmriDurum.findOne({
        where: { 
          durum_kodu: durumKodu,
          aktif: true 
        }
      });
      return !!durum;
    } catch (error) {
      console.error('Durum validasyonu hatası:', error);
      return false;
    }
  }

  /**
   * Durum kodunu normalize et (büyük küçük harf ve boşluk temizleme)
   */
  static normalizeDurum(durumKodu) {
    if (!durumKodu) return null;
    return durumKodu.toString().trim().toLowerCase();
  }

  /**
   * İki durumun eşit olup olmadığını kontrol et (büyük küçük harf duyarsız)
   */
  static isDurumEqual(durum1, durum2) {
    if (!durum1 || !durum2) return false;
    return this.normalizeDurum(durum1) === this.normalizeDurum(durum2);
  }

  /**
   * Durum listesini gruplama için normalize et
   */
  static async normalizeDurumForGrouping(durumKodu) {
    try {
      const normalizedInput = this.normalizeDurum(durumKodu);
      
      // Önce tam eşleşme ara
      const exactMatch = await IsEmriDurum.findOne({
        where: { durum_kodu: durumKodu, aktif: true }
      });
      
      if (exactMatch) {
        return exactMatch.durum_kodu;
      }
      
      // Büyük küçük harf duyarsız eşleşme ara
      const caseInsensitiveMatch = await IsEmriDurum.findOne({
        where: { 
          aktif: true 
        }
      });
      
      if (caseInsensitiveMatch) {
        const allDurumlar = await this.getActiveDurumlar();
        const match = allDurumlar.find(d => 
          this.normalizeDurum(d.durum_kodu) === normalizedInput
        );
        
        if (match) {
          return match.durum_kodu;
        }
      }
      
      // Hiç eşleşme yoksa orijinalini döndür
      return durumKodu;
    } catch (error) {
      console.error('Durum normalize hatası:', error);
      return durumKodu;
    }
  }

  /**
   * İş emirlerini durumlara göre grupla (dinamik)
   */
  static async groupIsEmirleriByDurum(isEmirleri) {
    try {
      const aktivDurumlar = await this.getActiveDurumlar();
      const grupluIsEmirleri = {};
      
      // Önce boş grupları oluştur
      aktivDurumlar.forEach(durum => {
        grupluIsEmirleri[durum.durum_kodu] = [];
      });
      
      // İş emirlerini gruplara ata
      for (const isEmri of isEmirleri) {
        if (isEmri.durum) {
          const normalizedDurum = await this.normalizeDurumForGrouping(isEmri.durum);
          
          if (grupluIsEmirleri[normalizedDurum]) {
            grupluIsEmirleri[normalizedDurum].push(isEmri);
          } else {
            // Bilinmeyen durum - beklemede grubuna ata
            const beklemedeDurum = aktivDurumlar.find(d => 
              this.normalizeDurum(d.durum_kodu).includes('beklemede')
            );
            
            if (beklemedeDurum && grupluIsEmirleri[beklemedeDurum.durum_kodu]) {
              grupluIsEmirleri[beklemedeDurum.durum_kodu].push(isEmri);
              console.warn(`Bilinmeyen durum "${isEmri.durum}" beklemede grubuna atandı`);
            }
          }
        }
      }
      
      return grupluIsEmirleri;
    } catch (error) {
      console.error('İş emirleri gruplama hatası:', error);
      throw error;
    }
  }
}

module.exports = StatusUtils;