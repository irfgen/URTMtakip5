import axios from 'axios';

class TeknikResimService {
  constructor() {
    this.baseURL = '/api/teknik-resim';
    this.uploadTimeout = 60000; // 60 saniye timeout
  }

  /**
   * Çekilen fotoğrafı teknik resim analiz API'sine gönderir
   * @param {Object} imageData - CameraCapture'dan gelen image data
   * @param {Function} onProgress - Upload progress callback
   * @returns {Promise<Object>} Analiz sonuçları
   */
  async analyzeFromCamera(imageData, onProgress = null) {
    try {
      if (!imageData || !imageData.blob) {
        throw new Error('Geçersiz resim verisi');
      }

      // FormData oluştur
      const formData = new FormData();
      
      // Blob'u file olarak ekle
      const fileName = `teknik_resim_${Date.now()}.jpg`;
      formData.append('teknik_resim', imageData.blob, fileName);
      
      // Metadata ekle (isteğe bağlı)
      formData.append('source', 'camera');
      formData.append('timestamp', imageData.timestamp || new Date().toISOString());
      formData.append('dimensions', JSON.stringify({
        width: imageData.width,
        height: imageData.height
      }));

      // Request konfigürasyonu
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: this.uploadTimeout,
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress(percentCompleted);
          }
        }
      };

      // API'ye gönder
      const response = await axios.post(`${this.baseURL}/analiz`, formData, config);
      
      if (!response.data) {
        throw new Error('API\'den geçersiz yanıt');
      }

      return {
        success: true,
        data: response.data,
        raw: response
      };

    } catch (error) {
      console.error('Teknik resim analiz hatası:', error);
      
      // Hata türüne göre mesaj belirle
      let errorMessage = 'Teknik resim analizi sırasında hata oluştu';
      
      if (error.code === 'ECONNABORTED') {
        errorMessage = 'İşlem zaman aşımına uğradı. Lütfen tekrar deneyin.';
      } else if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        
        switch (status) {
          case 400:
            errorMessage = data.message || 'Geçersiz resim dosyası';
            break;
          case 413:
            errorMessage = 'Resim dosyası çok büyük';
            break;
          case 429:
            errorMessage = 'Çok fazla istek gönderildi. Lütfen bekleyin.';
            break;
          case 500:
            errorMessage = 'Sunucu hatası. Lütfen tekrar deneyin.';
            break;
          default:
            errorMessage = data.message || `HTTP ${status} hatası`;
        }
      } else if (error.request) {
        errorMessage = 'Sunucuya erişilemiyor. İnternet bağlantınızı kontrol edin.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      return {
        success: false,
        error: errorMessage,
        originalError: error
      };
    }
  }

  /**
   * Mevcut dosya upload fonksiyonu (geriye dönük uyumluluk için)
   * @param {File} file - Dosya
   * @param {Function} onProgress - Progress callback
   * @returns {Promise<Object>} Analiz sonuçları
   */
  async analyzeFromFile(file, onProgress = null) {
    try {
      if (!file) {
        throw new Error('Dosya seçilmedi');
      }

      // File türü kontrolü
      if (!file.type.startsWith('image/')) {
        throw new Error('Sadece resim dosyaları desteklenir');
      }

      // Dosya boyutu kontrolü (10MB limit)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        throw new Error('Dosya boyutu 10MB\'dan büyük olamaz');
      }

      const formData = new FormData();
      formData.append('teknik_resim', file);
      formData.append('source', 'file');

      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: this.uploadTimeout,
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress(percentCompleted);
          }
        }
      };

      const response = await axios.post(`${this.baseURL}/analiz`, formData, config);
      
      return {
        success: true,
        data: response.data,
        raw: response
      };

    } catch (error) {
      console.error('Dosya analiz hatası:', error);
      return this._handleError(error);
    }
  }

  /**
   * API health check
   * @returns {Promise<Object>} Sağlık durumu
   */
  async healthCheck() {
    try {
      const response = await axios.get(`${this.baseURL}/health`);
      return {
        success: true,
        status: response.data.status || 'healthy',
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        status: 'unhealthy',
        error: error.message
      };
    }
  }

  /**
   * Test endpoint'i
   * @returns {Promise<Object>} Test sonucu
   */
  async testConnection() {
    try {
      const response = await axios.get(`${this.baseURL}/test`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Ortak hata yönetimi
   * @private
   */
  _handleError(error) {
    let errorMessage = 'İşlem sırasında hata oluştu';
    
    if (error.code === 'ECONNABORTED') {
      errorMessage = 'İşlem zaman aşımına uğradı';
    } else if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      
      switch (status) {
        case 400:
          errorMessage = data.message || 'Geçersiz istek';
          break;
        case 413:
          errorMessage = 'Dosya çok büyük';
          break;
        case 429:
          errorMessage = 'Çok fazla istek';
          break;
        case 500:
          errorMessage = 'Sunucu hatası';
          break;
        default:
          errorMessage = data.message || `HTTP ${status} hatası`;
      }
    } else if (error.request) {
      errorMessage = 'Sunucuya erişilemiyor';
    } else if (error.message) {
      errorMessage = error.message;
    }

    return {
      success: false,
      error: errorMessage,
      originalError: error
    };
  }

  /**
   * Upload progress'i formatla
   * @param {number} progress - 0-100 arası progress değeri
   * @returns {Object} Formatlanmış progress bilgisi
   */
  formatProgress(progress) {
    return {
      percentage: progress,
      text: `${progress}%`,
      isComplete: progress >= 100,
      isUploading: progress > 0 && progress < 100
    };
  }

  /**
   * Analiz sonuçlarını formatla ve validate et
   * @param {Object} analysisData - API'den gelen ham data
   * @returns {Object} Formatlanmış ve validate edilmiş sonuçlar
   */
  formatAnalysisResults(analysisData) {
    if (!analysisData) {
      return {
        isValid: false,
        error: 'Analiz sonucu boş'
      };
    }

    try {
      const {
        extractedData = {},
        processedImage = null,
        ocrText = '',
        analysisResults = {},
        metadata = {}
      } = analysisData;

      // Parça kodu çıkarma (birden fazla kaynaktan)
      const parcaKodu = extractedData.partName || 
                       extractedData.partCode || 
                       extractedData.parca_kodu || 
                       extractedData.parca_adi || 
                       null;

      // Diğer önemli bilgiler
      const parcaAdi = extractedData.partName || 
                      extractedData.description || 
                      extractedData.parca_adi || 
                      '';

      const malzemeCinsi = extractedData.material || 
                          extractedData.malzeme || 
                          extractedData.malzeme_cinsi || 
                          '';

      const projeAdi = extractedData.projectName || 
                      extractedData.proje || 
                      extractedData.proje_adi || 
                      '';

      const formatlanmisData = {
        isValid: true,
        parcaKodu,
        parcaAdi,
        malzemeCinsi,
        projeAdi,
        ham_malzeme_olculeri: extractedData.dimensions || '',
        aciklama: extractedData.notes || '',
        processedImage,
        ocrText,
        confidence: analysisResults.confidence || 0,
        metadata: {
          ...metadata,
          processedAt: new Date().toISOString(),
          source: 'camera'
        },
        rawData: analysisData
      };

      return formatlanmisData;

    } catch (error) {
      console.error('Analiz sonuçları formatlanırken hata:', error);
      return {
        isValid: false,
        error: 'Analiz sonuçları işlenirken hata oluştu',
        rawData: analysisData
      };
    }
  }
}

// Singleton instance oluştur
const teknikResimService = new TeknikResimService();

export default teknikResimService; 