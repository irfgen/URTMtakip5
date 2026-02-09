import axios from 'axios';

const api = axios.create({
  baseURL: '/api'
});

const tedarikService = {
  // Tedarik talepleri listesi (sayfalama, arama, filtreleme ile)
  async getTedarikTalepleri(params = {}) {
    try {
      const response = await api.get('/tedarik', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Tek tedarik talebi detayı
  async getTedarikTalebi(id) {
    try {
      const response = await api.get(`/tedarik/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Yeni tedarik talebi oluştur
  async createTedarikTalebi(data) {
    try {
      const response = await api.post('/tedarik', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Tedarik talebini güncelle
  async updateTedarikTalebi(id, data) {
    try {
      const response = await api.put(`/tedarik/${id}`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Tedarik talebini sil
  async deleteTedarikTalebi(id) {
    try {
      const response = await api.delete(`/tedarik/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Tedarik talebini onayla
  async onaylaTedarikTalebi(id, data) {
    try {
      const response = await api.post(`/tedarik/${id}/onayla`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Tedarik talebini reddet
  async reddetTedarikTalebi(id, data) {
    try {
      const response = await api.post(`/tedarik/${id}/reddet`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Tedarik talebini siparişte güncelle
  async siparisteGuncelle(id, data) {
    try {
      const response = await api.post(`/tedarik/${id}/sipariste`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // İrsaliye ekle ve talebi tamamla
  async irsaliyeEkleVeTamamla(id, data) {
    try {
      const response = await api.post(`/tedarik/${id}/irsaliye-tamamla`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // İstatistikler
  async getIstatistikler(params = {}) {
    try {
      const response = await api.get('/tedarik/istatistikler', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Kaynağa göre talepler
  async getByKaynak(kaynakTipi, kaynakId) {
    try {
      const response = await api.get(`/tedarik/kaynak/${kaynakTipi}/${kaynakId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // İş emrinden talep oluştur
  async createFromIsEmri(isEmriId, data) {
    try {
      const response = await api.post('/tedarik', {
        kaynak_tipi: 'is_emri',
        kaynak_id: isEmriId,
        is_emri_id: isEmriId,
        ...data
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Parçadan talep oluştur
  async createFromParca(parcaKodu, data) {
    try {
      const response = await api.post('/tedarik', {
        kaynak_tipi: 'parca',
        kaynak_id: null,
        parca_kodu: parcaKodu,
        ...data
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Stok kartından talep oluştur
  async createFromStokKarti(stokKartiId, data) {
    try {
      const response = await api.post('/tedarik', {
        kaynak_tipi: 'stok_karti',
        kaynak_id: stokKartiId,
        stok_karti_id: stokKartiId,
        ...data
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Firma listesini al
  async getFirmalar(params = {}) {
    try {
      const response = await api.get('/firmalar', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Firma detayı al
  async getFirma(id) {
    try {
      const response = await api.get(`/firmalar/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Yeni firma oluştur
  async createFirma(data) {
    try {
      const response = await api.post('/firmalar', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Firma güncelle
  async updateFirma(id, data) {
    try {
      const response = await api.put(`/firmalar/${id}`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Firma sil
  async deleteFirma(id) {
    try {
      const response = await api.delete(`/firmalar/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Firma durum değiştir
  async changeFirmaDurum(id, durum) {
    try {
      const response = await api.patch(`/firmalar/${id}/durum`, { durum });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Firma istatistikleri
  async getFirmaIstatistikler() {
    try {
      const response = await api.get('/firmalar/istatistikler');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Firma ara
  async searchFirma(arama) {
    try {
      const response = await api.get(`/firmalar/search/${encodeURIComponent(arama)}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

export default tedarikService;