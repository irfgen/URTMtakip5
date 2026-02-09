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
 * Tüm stokları getirir
 */
const getAllStok = async (params = {}) => {
  try {
    const response = await api.get('/makina-stok', { params });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Stoklar getirilirken hata oluştu');
  }
};

/**
 * Stok detayını getirir
 */
const getStokById = async (id) => {
  try {
    const response = await api.get(`/makina-stok/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Stok detayı getirilirken hata oluştu');
  }
};

/**
 * Yeni stok girişi oluşturur
 */
const createStok = async (stokData) => {
  try {
    const response = await api.post('/makina-stok', stokData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Stok oluşturulurken hata oluştu');
  }
};

/**
 * Stoğu günceller
 */
const updateStok = async (id, stokData) => {
  try {
    const response = await api.put(`/makina-stok/${id}`, stokData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Stok güncellenirken hata oluştu');
  }
};

/**
 * Stoğu siler
 */
const deleteStok = async (id) => {
  try {
    const response = await api.delete(`/makina-stok/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Stok silinirken hata oluştu');
  }
};

/**
 * Stoktan düşer (satış için)
 */
const stoktanDus = async (data) => {
  try {
    const response = await api.post('/makina-stok/stoktan-dus', data);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Stoktan düşme işlemi başarısız');
  }
};

const makinaStokAPI = {
  getAllStok,
  getStokById,
  createStok,
  updateStok,
  deleteStok,
  stoktanDus,
};

export default makinaStokAPI;
