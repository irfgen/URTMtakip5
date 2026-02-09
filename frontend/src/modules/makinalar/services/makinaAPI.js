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
 * Tüm makinaları getirir
 * @param {object} params - Arama ve sıralama parametreleri
 * @returns {Promise<object>} - Makina listesi
 */
const getAllMakinalar = async (params = {}) => {
  try {
    const response = await api.get('/makinalar', { params });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error?.message || 'Makinalar getirilirken hata oluştu');
  }
};

/**
 * ID'ye göre bir makina getirir
 * @param {string} id - Makina ID'si
 * @returns {Promise<object>} - Makina detayı
 */
const getMakinaById = async (id) => {
  try {
    const response = await api.get(`/makinalar/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error?.message || 'Makina detayı getirilirken hata oluştu');
  }
};

/**
 * Yeni bir makina oluşturur
 * @param {object} makinaData - Yeni makina verileri
 * @returns {Promise<object>} - Oluşturulan makina
 */
const createMakina = async (makinaData) => {
  try {
    const response = await api.post('/makinalar', makinaData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error?.message || 'Makina oluşturulurken hata oluştu');
  }
};

/**
 * Bir makinayı günceller
 * @param {string} id - Makina ID'si
 * @param {object} makinaData - Güncellenecek makina verileri
 * @returns {Promise<object>} - Güncellenen makina
 */
const updateMakina = async (id, makinaData) => {
  try {
    const response = await api.put(`/makinalar/${id}`, makinaData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error?.message || 'Makina güncellenirken hata oluştu');
  }
};

/**
 * Bir makinayı siler
 * @param {string} id - Makina ID'si
 * @returns {Promise<object>} - Silme işlemi sonucu
 */
const deleteMakina = async (id) => {
  try {
    const response = await api.delete(`/makinalar/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error?.message || 'Makina silinirken hata oluştu');
  }
};

/**
 * Parça arama (Makina formunda kullanılacak)
 * @param {string} search - Arama metni
 * @returns {Promise<object>} - Parça listesi
 */
const searchParts = async (search) => {
  try {
    const response = await api.get('/search/parts', { params: { search } });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error?.message || 'Parça aranırken hata oluştu');
  }
};

/**
 * BOM (grupları) arama (Makina formunda kullanılacak)
 * @param {string} search - Arama metni
 * @returns {Promise<object>} - BOM listesi
 */
const searchBoms = async (search) => {
  try {
    const response = await api.get('/search/boms', { params: { search } });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error?.message || 'BOM aranırken hata oluştu');
  }
};

const makinaAPI = {
  getAllMakinalar,
  getMakinaById,
  createMakina,
  updateMakina,
  deleteMakina,
  searchParts,
  searchBoms,
};

export default makinaAPI;