import axios from 'axios';

const API_BASE_URL = '/api';

// Axios interceptor'ları yapılandır
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`, config.params || {});
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`API Response [${response.config.url}]:`, response.status, response.data);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.status, error.response?.data || error.message);
    return Promise.reject(error);
  }
);

/**
 * Tüm tezgahları getirir
 * @returns {Promise<object>} - Tezgah listesi
 */
const getAllTezgahlar = async () => {
  try {
    const response = await api.get('/tezgahlar');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error?.message || 'Tezgahlar getirilirken hata oluştu');
  }
};

/**
 * ID'ye göre bir tezgah getirir
 * @param {number} id - Tezgah ID'si
 * @returns {Promise<object>} - Tezgah detayı
 */
const getTezgahById = async (id) => {
  try {
    const response = await api.get(`/tezgahlar/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error?.message || 'Tezgah detayı getirilirken hata oluştu');
  }
};

/**
 * Yeni bir tezgah oluşturur
 * @param {object} tezgahData - Yeni tezgah verileri
 * @returns {Promise<object>} - Oluşturulan tezgah
 */
const createTezgah = async (tezgahData) => {
  try {
    const response = await api.post('/tezgahlar', tezgahData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error?.message || 'Tezgah oluşturulurken hata oluştu');
  }
};

/**
 * Bir tezgahı günceller
 * @param {number} id - Tezgah ID'si
 * @param {object} tezgahData - Güncellenecek tezgah verileri
 * @returns {Promise<object>} - Güncellenen tezgah
 */
const updateTezgah = async (id, tezgahData) => {
  try {
    const response = await api.put(`/tezgahlar/${id}`, tezgahData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error?.message || 'Tezgah güncellenirken hata oluştu');
  }
};

/**
 * Bir tezgahı siler
 * @param {number} id - Tezgah ID'si
 * @returns {Promise<object>} - Silme işlemi sonucu
 */
const deleteTezgah = async (id) => {
  try {
    const response = await api.delete(`/tezgahlar/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error?.message || 'Tezgah silinirken hata oluştu');
  }
};

/**
 * Tezgah pozisyonlarını toplu olarak günceller
 * @param {Array<object>} pozisyonlar - Pozisyon verileri
 * @returns {Promise<object>} - Güncelleme işlemi sonucu
 */
const updateTezgahPositions = async (pozisyonlar) => {
  try {
    const response = await api.post('/tezgahlar/pozisyonlar', pozisyonlar);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error?.message || 'Tezgah pozisyonları güncellenirken hata oluştu');
  }
};

/**
 * Tezgaha iş emri atar
 * @param {number} tezgahId - Tezgah ID'si
 * @param {string} isEmriId - İş emri ID'si
 * @returns {Promise<object>} - Atama işlemi sonucu
 */
const assignIsEmri = async (tezgahId, isEmriId) => {
  try {
    const response = await api.post(`/tezgahlar/${tezgahId}/is-emri-ata`, { is_emri_id: isEmriId });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error?.message || 'İş emri atanırken hata oluştu');
  }
};

/**
 * Tezgahtan iş emrini tamamlar
 * @param {number} tezgahId - Tezgah ID'si
 * @param {string} isEmriId - İş emri ID'si
 * @param {object} data - Tamamlama verileri (notlar, işlenen_adet vb.)
 * @returns {Promise<object>} - Tamamlama işlemi sonucu
 */
const completeIsEmri = async (tezgahId, isEmriId, data = {}) => {
  try {
    const response = await api.post(`/tezgahlar/${tezgahId}/is-emri-tamamla`, {
      is_emri_id: isEmriId,
      ...data
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error?.message || 'İş emri tamamlanırken hata oluştu');
  }
};

/**
 * Tezgahtan işe ara verir
 * @param {number} tezgahId - Tezgah ID'si
 * @param {string} aciklama - Açıklama
 * @returns {Promise<object>} - İşe ara verme işlemi sonucu
 */
const pauseIsEmri = async (tezgahId, aciklama = '') => {
  try {
    const response = await api.post(`/tezgahlar/${tezgahId}/is-ara-ver`, { aciklama });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error?.message || 'İşe ara verilirken hata oluştu');
  }
};

/**
 * Tezgahın iş emirleri geçmişini getirir
 * @param {number} tezgahId - Tezgah ID'si
 * @returns {Promise<object>} - İş emirleri geçmişi
 */
const getIsEmriGecmisi = async (tezgahId) => {
  try {
    const response = await api.get(`/tezgahlar/${tezgahId}/is-emirleri-gecmisi`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error?.message || 'İş emri geçmişi getirilirken hata oluştu');
  }
};

/**
 * Arıza/Bakım kaydını sonlandırır
 * @param {number} tezgahId - Tezgah ID'si
 * @param {string} arizaBakimId - Arıza/Bakım ID'si
 * @param {object} data - Sonlandırma verileri
 * @returns {Promise<object>} - Sonlandırma işlemi sonucu
 */
const endArizaBakim = async (tezgahId, arizaBakimId, data = {}) => {
  try {
    const response = await api.post(`/tezgahlar/${tezgahId}/ariza-bakim-sonlandir`, {
      ariza_bakim_id: arizaBakimId,
      ...data
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error?.message || 'Arıza/Bakım sonlandırılırken hata oluştu');
  }
};

const tezgahAPI = {
  getAllTezgahlar,
  getTezgahById,
  createTezgah,
  updateTezgah,
  deleteTezgah,
  updateTezgahPositions,
  assignIsEmri,
  completeIsEmri,
  pauseIsEmri,
  getIsEmriGecmisi,
  endArizaBakim,
};

export default tezgahAPI;