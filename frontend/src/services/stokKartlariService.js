import axios from 'axios';

const api = axios.create({
  baseURL: '/api'
});

const stokKartlariService = {
  // Stok kartları listesi (sayfalama, arama, filtreleme ile)
  async getStokKartlari(params = {}) {
    try {
      const response = await api.get('/stok-kartlari', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Tek stok kartı detayı
  async getStokKarti(id) {
    try {
      const response = await api.get(`/stok-kartlari/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Yeni stok kartı oluştur
  async createStokKarti(data) {
    try {
      const response = await api.post('/stok-kartlari', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Stok kartı güncelle
  async updateStokKarti(id, data) {
    try {
      const response = await api.put(`/stok-kartlari/${id}`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Stok kartı sil
  async deleteStokKarti(id) {
    try {
      const response = await api.delete(`/stok-kartlari/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Kritik stoklar
  async getKritikStoklar() {
    try {
      const response = await api.get('/stok-kartlari/kritik-stok');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // İstatistikler
  async getIstatistikler() {
    try {
      const response = await api.get('/stok-kartlari/istatistikler');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Firma listesi
  async getFirmalar() {
    try {
      const response = await api.get('/stok-kartlari/firmalar');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Malzeme cinsi listesi
  async getMalzemeCinsleri() {
    try {
      const response = await api.get('/stok-kartlari/malzeme-cinsleri');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Gelişmiş arama
  async searchStokKartlari(params) {
    try {
      const response = await api.get('/stok-kartlari/search', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

export default stokKartlariService;
