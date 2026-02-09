import axios from 'axios';

/**
 * Frontend İş Emri Durum Yönetimi Utility
 */
class StatusUtils {
  static durumlarCache = null;
  static lastCacheTime = null;
  static CACHE_DURATION = 5 * 60 * 1000; // 5 dakika

  /**
   * API'den tüm aktif durumları getir (cache ile)
   */
  static async getActiveDurumlar() {
    try {
      const now = Date.now();
      
      // Cache kontrolü
      if (this.durumlarCache && this.lastCacheTime && 
          (now - this.lastCacheTime) < this.CACHE_DURATION) {
        return this.durumlarCache;
      }

      const response = await axios.get('/api/is-emri-durumlari');
      this.durumlarCache = response.data;
      this.lastCacheTime = now;
      
      return this.durumlarCache;
    } catch (error) {
      console.error('Durumlar getirilemedi:', error);
      return [];
    }
  }

  /**
   * Cache'i temizle (yeni durum eklendiğinde çağrılır)
   */
  static clearCache() {
    this.durumlarCache = null;
    this.lastCacheTime = null;
  }

  /**
   * Durum kodunun geçerli olup olmadığını kontrol et
   */
  static async isValidDurum(durumKodu) {
    try {
      const durumlar = await this.getActiveDurumlar();
      return durumlar.some(d => d.durum_kodu === durumKodu);
    } catch (error) {
      console.error('Durum validasyon hatası:', error);
      return false;
    }
  }

  /**
   * Durum kodunu normalize et
   */
  static normalizeDurum(durumKodu) {
    if (!durumKodu) return null;
    return durumKodu.toString().trim().toLowerCase();
  }

  /**
   * İki durumun eşit olup olmadığını kontrol et
   */
  static isDurumEqual(durum1, durum2) {
    if (!durum1 || !durum2) return false;
    return this.normalizeDurum(durum1) === this.normalizeDurum(durum2);
  }

  /**
   * Durum için görüntü adını getir
   */
  static async getDurumDisplayName(durumKodu) {
    try {
      // durumKodu boş ise güvenli değer döndür
      if (!durumKodu) return 'Bilinmiyor';
      
      const durumlar = await this.getActiveDurumlar();
      const durum = durumlar.find(d => d.durum_kodu === durumKodu);
      return durum ? durum.durum_adi : String(durumKodu);
    } catch (error) {
      console.error('Durum görüntü adı alınamadı:', error);
      return durumKodu ? String(durumKodu) : 'Bilinmiyor';
    }
  }

  /**
   * Durum için renk kodunu getir
   */
  static async getDurumColor(durumKodu) {
    try {
      const durumlar = await this.getActiveDurumlar();
      const durum = durumlar.find(d => d.durum_kodu === durumKodu);
      
      // Hex kodunu Material-UI renk adına dönüştür
      if (durum && durum.renk_kodu) {
        return this.hexToMaterialUIColor(durum.renk_kodu);
      }
      return 'primary';
    } catch (error) {
      console.error('Durum rengi alınamadı:', error);
      return 'primary';
    }
  }

  /**
   * Hex renk kodunu Material-UI renk adına dönüştür
   */
  static hexToMaterialUIColor(hexColor) {
    const colorMap = {
      '#f44336': 'error',     // kırmızı
      '#ff9800': 'warning',   // turuncu  
      '#4caf50': 'success',   // yeşil
      '#2196f3': 'info',      // mavi
      '#9c27b0': 'secondary', // mor
      '#1976d2': 'primary',   // koyu mavi
      '#795548': 'default',   // kahverengi
      '#607d8b': 'default'    // gri
    };
    
    const normalizedHex = hexColor?.toLowerCase();
    return colorMap[normalizedHex] || 'default';
  }

  /**
   * Tüm kolonlar için stil bilgilerini getir
   */
  static async getKolonStyles() {
    try {
      const durumlar = await this.getActiveDurumlar();
      const styles = {};
      
      durumlar.forEach(durum => {
        const baseColor = durum.renk_kodu;
        styles[durum.durum_kodu] = {
          bgcolor: `${baseColor}20`, // %20 opacity
          color: baseColor,
          borderLeft: `4px solid ${baseColor}`
        };
      });
      
      return styles;
    } catch (error) {
      console.error('Kolon stilleri alınamadı:', error);
      return {};
    }
  }

  /**
   * Durum kodunu alternatif isimlerle eşleştir
   */
  static async findDurumByAlternatives(durumKodu) {
    try {
      const durumlar = await this.getActiveDurumlar();
      const normalized = this.normalizeDurum(durumKodu);
      
      // Önce tam eşleşme ara
      let match = durumlar.find(d => d.durum_kodu === durumKodu);
      if (match) return match;
      
      // Sonra büyük küçük harf duyarsız eşleşme
      match = durumlar.find(d => 
        this.normalizeDurum(d.durum_kodu) === normalized
      );
      if (match) return match;
      
      // Alternative mapping sistemi
      const alternativeMappings = {
        'beklemede': ['beklemede', 'bekleyen', 'hazır'],
        'siparişte': ['siparişte', 'sparişte', 'siparis'],
        'sparişte': ['siparişte', 'sparişte', 'siparis'],
        'tamamlandı': ['tamamlandı', 'tamamlandi', 'bitti', 'bitmiş']
      };
      
      for (const [standardDurum, alternatives] of Object.entries(alternativeMappings)) {
        if (alternatives.includes(normalized)) {
          match = durumlar.find(d => 
            this.normalizeDurum(d.durum_kodu) === standardDurum
          );
          if (match) return match;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Durum eşleştirme hatası:', error);
      return null;
    }
  }

  /**
   * İş emirlerini kolonlara (durumlara) dinamik olarak ata
   */
  static async assignIsEmriToKolon(isEmri, kolonlar) {
    try {
      if (!isEmri.durum) return null;
      
      // Önce direkt eşleşme ara
      let bulunanKolon = kolonlar.find(k => k === isEmri.durum);
      if (bulunanKolon) return bulunanKolon;
      
      // Durum bilgisi ile eşleştirme yap
      const durumMatch = await this.findDurumByAlternatives(isEmri.durum);
      if (durumMatch) {
        bulunanKolon = kolonlar.find(k => k === durumMatch.durum_kodu);
        if (bulunanKolon) return bulunanKolon;
      }
      
      // Son çare: Beklemede kolonu
      const beklemedekiKolon = kolonlar.find(k => 
        this.normalizeDurum(k).includes('beklemede')
      );
      
      return beklemedekiKolon || kolonlar[0] || null;
    } catch (error) {
      console.error('İş emri kolon ataması hatası:', error);
      return kolonlar[0] || null;
    }
  }

  /**
   * Drag drop için durum geçiş mantığı
   */
  static async getDragDropTransitionLogic(sourceKolon, destKolon) {
    try {
      const durumlar = await this.getActiveDurumlar();
      const sourceDurum = durumlar.find(d => d.durum_kodu === sourceKolon);
      const destDurum = durumlar.find(d => d.durum_kodu === destKolon);
      
      if (!sourceDurum || !destDurum) {
        return { type: 'normal' };
      }
      
      const sourceNorm = this.normalizeDurum(sourceKolon);
      const destNorm = this.normalizeDurum(destKolon);
      
      // Beklemede -> Sipariş geçişi
      if (sourceNorm.includes('beklemede') && 
          (destNorm.includes('sparişte') || destNorm.includes('siparişte'))) {
        return { 
          type: 'siparis_verme',
          message: 'Malzeme siparişi verildi'
        };
      }
      
      // Sipariş -> Beklemede geçişi
      if ((sourceNorm.includes('sparişte') || sourceNorm.includes('siparişte')) && 
          sourceNorm.includes('beklemede')) {
        return { 
          type: 'malzeme_geldi',
          message: 'Malzeme geldi'
        };
      }
      
      return { type: 'normal' };
    } catch (error) {
      console.error('Drag drop mantığı hatası:', error);
      return { type: 'normal' };
    }
  }

  /**
   * Durumlar listesini sıraya göre getir
   */
  static async getSortedDurumlar() {
    try {
      const durumlar = await this.getActiveDurumlar();
      return durumlar.sort((a, b) => a.sira_no - b.sira_no);
    } catch (error) {
      console.error('Sıralı durumlar alınamadı:', error);
      return [];
    }
  }

  /**
   * Durumun tamamlanmış olup olmadığını kontrol et (eski API uyumluluğu)
   */
  static isStatusCompleted(durumKodu) {
    try {
      const normalized = this.normalizeDurum(durumKodu);
      const tamamlanmisDurumlar = ['tamamlandı', 'tamamlandi', 'iptal', 'cancelled'];
      return tamamlanmisDurumlar.includes(normalized);
    } catch (error) {
      console.error('Durum tamamlanma kontrolü hatası:', error);
      return false;
    }
  }

  /**
   * Durumun aktif olup olmadığını kontrol et (eski API uyumluluğu)
   */
  static isStatusActive(durumKodu) {
    try {
      const normalized = this.normalizeDurum(durumKodu);
      const aktifDurumlar = ['beklemede', 'freze', 'torna', 'sparişte', 'siparişte', 'tezgahta', 'kaynak'];
      return aktifDurumlar.includes(normalized);
    } catch (error) {
      console.error('Durum aktiflik kontrolü hatası:', error);
      return false;
    }
  }

  /**
   * Durum rengi getir (eski API uyumluluğu)
   */
  static async getStatusColor(durumKodu) {
    return await this.getDurumColor(durumKodu);
  }

  /**
   * Durum görüntü metni getir (eski API uyumluluğu)
   */
  static async getStatusDisplayText(durumKodu) {
    return await this.getDurumDisplayName(durumKodu);
  }
}

// Eski API uyumluluğu için named export'lar
export const isStatusCompleted = StatusUtils.isStatusCompleted.bind(StatusUtils);
export const isStatusActive = StatusUtils.isStatusActive.bind(StatusUtils);
export const getStatusColor = StatusUtils.getStatusColor.bind(StatusUtils);
export const getStatusDisplayText = StatusUtils.getStatusDisplayText.bind(StatusUtils);

export default StatusUtils;