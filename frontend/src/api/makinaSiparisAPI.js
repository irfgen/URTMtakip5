import axios from 'axios';

const API_BASE_URL = '/api';

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
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
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
    console.log(`API Response [${response.config.url}]:`, response.status);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.status);
    return Promise.reject(error);
  }
);

/**
 * Tüm siparişleri getirir
 */
const getAllSiparisler = async (params = {}) => {
  try {
    const response = await api.get('/makina-siparisleri', { params });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Siparişler getirilirken hata oluştu');
  }
};

/**
 * Sipariş detayını getirir
 */
const getSiparisById = async (id) => {
  try {
    const response = await api.get(`/makina-siparisleri/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Sipariş detayı getirilirken hata oluştu');
  }
};

/**
 * Yeni sipariş oluşturur
 */
const createSiparis = async (siparisData) => {
  try {
    const response = await api.post('/makina-siparisleri', siparisData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Sipariş oluşturulurken hata oluştu');
  }
};

/**
 * Siparişi günceller
 */
const updateSiparis = async (id, siparisData) => {
  try {
    const response = await api.put(`/makina-siparisleri/${id}`, siparisData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Sipariş güncellenirken hata oluştu');
  }
};

/**
 * Siparişi siler
 */
const deleteSiparis = async (id) => {
  try {
    const response = await api.delete(`/makina-siparisleri/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Sipariş silinirken hata oluştu');
  }
};

/**
 * Sipariş durumunu günceller
 */
const updateSiparisDurum = async (id, durum) => {
  try {
    const response = await api.patch(`/makina-siparisleri/${id}/durum`, { durum });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Sipariş durumu güncellenirken hata oluştu');
  }
};

const makinaSiparisAPI = {
  getAllSiparisler,
  getSiparisById,
  createSiparis,
  updateSiparis,
  deleteSiparis,
  updateSiparisDurum,
};

export default makinaSiparisAPI;
