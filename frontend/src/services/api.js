import axios from 'axios';

const api = axios.create({
  baseURL: '/api'
});

// Axios interceptors to log API requests and responses
api.interceptors.request.use(config => {
  console.log(`API Request:`, config.method.toUpperCase(), config.url, config.params || {});
  return config;
}, error => {
  console.error('API Request Error:', error);
  return Promise.reject(error);
});

api.interceptors.response.use(response => {
  console.log(`API Response [${response.config.url}]:`, response.status, response.data);
  return response;
}, error => {
  console.error('API Response Error:', error.response?.status, error.response?.data || error.message);
  
  // 413 Payload Too Large hatası için özel mesaj
  if (error.response?.status === 413) {
    const errorMessage = 'Dosya boyutu çok büyük. Lütfen daha küçük bir dosya yüklemeyi deneyin. (Maksimum: 100MB)';
    console.error('Dosya boyutu hatası:', errorMessage);
    // Hata mesajını error objesine ekle
    error.message = errorMessage;
    if (error.response.data) {
      error.response.data.error = errorMessage;
    }
  }
  
  return Promise.reject(error);
});

export const isEmirleriAPI = {
  getAll: (queryString = '') => api.get(`/is-emirleri${queryString}`),
  create: (isEmri) => api.post('/is-emirleri', isEmri),
  update: (id, isEmri) => api.put(`/is-emirleri/${id}`, isEmri),
  delete: (id) => api.delete(`/is-emirleri/${id}`),
  getById: (id) => api.get(`/is-emirleri/${id}`),
  getBekleyenIsEmirleri: () => api.get('/is-emirleri?durum=Beklemede&flat=true&showAssigned=true'),
  // Tezgah atanabilir iş emirleri (tamamlandı, iptal, sipariş verilecek, siparişte hariç)
  getAtanabilirIsEmirleri: () => api.get('/is-emirleri?excludeDurum=tamamlandi,iptal,siparis_verilecek,sipariste&flat=true'),
  // Fason dönüşümü onaylama
  confirmFasonConversion: (id, data) => api.post(`/is-emirleri/${id}/confirm-fason`, data)
};

export const tezgahAPI = {
  getAll: (params = {}) => api.get('/tezgahlar', { params: { ...params, includeArizaBakim: true } }),
  create: (tezgah) => api.post('/tezgahlar', tezgah),
  update: (id, tezgah) => api.put(`/tezgahlar/${id}`, tezgah),
  delete: (id) => api.delete(`/tezgahlar/${id}`),
  updatePozisyonlar: (pozisyonlar) => api.post('/tezgahlar/pozisyonlar', pozisyonlar),
  assignIsEmri: (tezgahId, isEmriId) =>
    api.post(`/tezgahlar/${tezgahId}/is-emri-ata`, { is_emri_id: isEmriId }),
  completeIsEmri: (tezgahId, isEmriId, notlar = '', islenenAdet = null) => {
    console.log(`API çağrısı - İş tamamlama: tezgahId=${tezgahId}, isEmriId=${isEmriId}, islenenAdet=${islenenAdet}`);
    // ID'lerin string olduğundan emin ol
    const safeIsEmriId = isEmriId ? String(isEmriId) : null;
    const safeTezgahId = tezgahId ? String(tezgahId) : null;

    if (!safeIsEmriId || !safeTezgahId) {
      console.error('Geçersiz parametreler:', { tezgahId, isEmriId });
      return Promise.reject(new Error('Geçersiz tezgah ID veya iş emri ID'));
    }

    return api.post(`/tezgahlar/${safeTezgahId}/is-emri-tamamla`, {
      is_emri_id: safeIsEmriId,
      notlar: notlar || '',
      islenen_adet: islenenAdet
    });
  },
  pauseIsEmri: (tezgahId) => api.post(`/tezgahlar/${tezgahId}/is-ara-ver`),
  startIsEmri: (tezgahId, isEmriId) => api.post(`/tezgahlar/${tezgahId}/is-emri-ata`, { is_emri_id: isEmriId }),
  getIsEmriGecmisi: (tezgahId) => api.get(`/tezgahlar/${tezgahId}/is-emirleri-gecmisi`),
  endArizaBakim: (tezgahId, arizaBakimId, yapilan_islemler = null, maliyet = null) =>
    api.post(`/tezgahlar/${tezgahId}/ariza-bakim-sonlandir`, { 
      ariza_bakim_id: arizaBakimId,
      yapilan_islemler,
      maliyet 
    })
};

export const tezgahPlanAPI = {
  getPlanlananIsler: (tezgahId) => api.get(`/tezgah-plan/${tezgahId}/planlanan-isler`),
  addPlanlananIs: (tezgahId, is_emri_id) => api.post(`/tezgah-plan/${tezgahId}/planla`, { is_emri_id }),
  removePlanlananIs: (isEmriId) => api.delete(`/tezgah-plan/planlanan-isler/${isEmriId}`),
  siralariGuncelle: (tezgahId, data) => api.put(`/tezgah-plan/${tezgahId}/siralari-guncelle`, data),
  planlananIsleriSil: (isEmriId) => api.delete(`/tezgah-plan/planlanan-isler/${isEmriId}`)
};

export const parcalarAPI = {
  getAll: (params = {}) => api.get('/parcalar', { params }),
  create: (parca) => api.post('/parcalar', parca),
  update: (parcaKodu, parca) => api.put(`/parcalar/${encodeURIComponent(parcaKodu?.trim() || '')}`, parca),
  delete: (parcaKodu) => api.delete(`/parcalar/${encodeURIComponent(parcaKodu?.trim() || '')}`)
};

export const arizaBakimAPI = {
  getAll: () => api.get('/ariza-bakim'),
  getById: (id) => api.get(`/ariza-bakim/${id}`),
  create: (arizaBakim) => api.post('/ariza-bakim', arizaBakim),
  update: (id, arizaBakim) => api.put(`/ariza-bakim/${id}`, arizaBakim),
  delete: (id) => api.delete(`/ariza-bakim/${id}`)
};

export const raporlarAPI = {
  getIsEmriOzet: (params = {}) => api.get('/raporlar/is-emri-ozet', { params }),
  getTezgahPerformans: (params = {}) => api.get('/raporlar/tezgah-performans', { params }),
  getPlanlamaGerceklesme: (params = {}) => api.get('/raporlar/planlama-gerceklesme', { params }),
  getParcaPerformans: (params = {}) => api.get('/raporlar/parca-performans', { params }),
  getParcaBazliIsEmirleri: (params = {}) => api.get('/raporlar/parca-is-emirleri', { params })
};

export const notlarAPI = {
  getAll: (params = {}) => api.get('/notlar', { params }),
  getById: (id) => api.get(`/notlar/${id}`),
  create: (formData) => api.post('/notlar', formData),
  update: (id, formData) => api.put(`/notlar/${id}`, formData),
  delete: (id) => api.delete(`/notlar/${id}`),
  deleteImage: (id) => api.delete(`/notlar/${id}/resim`)
};

export const kategorilerAPI = {
  getAll: (params = {}) => api.get('/kategoriler', { params }),
  getById: (id) => api.get(`/kategoriler/${id}`),
  create: (kategoriData) => api.post('/kategoriler', kategoriData),
  update: (id, kategoriData) => api.put(`/kategoriler/${id}`, kategoriData),
  delete: (id) => api.delete(`/kategoriler/${id}`)
};

export const uretimPlaniAPI = {
  getAll: (params = {}) => api.get('/uretim-plani', { params }),
  getById: (id) => api.get(`/uretim-plani/${id}`),
  create: (uretimPlaniData) => api.post('/uretim-plani', uretimPlaniData),
  createKarma: (uretimPlaniData) => api.post('/uretim-plani/karma', uretimPlaniData),
  createIsEmriTabanli: (uretimPlaniData) => api.post('/uretim-plani/is-emri-tabanli', uretimPlaniData),
  update: (id, uretimPlaniData) => api.put(`/uretim-plani/${id}`, uretimPlaniData),
  delete: (id) => api.delete(`/uretim-plani/${id}`),
  addIsEmri: (uretimPlaniId, isEmriId) => api.post(`/uretim-plani/${uretimPlaniId}/is-emri`, { is_emri_id: isEmriId }),
  removeIsEmri: (uretimPlaniId, isEmriId) => api.delete(`/uretim-plani/${uretimPlaniId}/is-emri/${isEmriId}`)
};

export const isEmriDurumAPI = {
  getAll: () => api.get('/is-emri-durumlari'),
  create: (durum) => api.post('/is-emri-durumlari', durum),
  update: (id, durum) => api.put(`/is-emri-durumlari/${id}`, durum),
  delete: (id) => api.delete(`/is-emri-durumlari/${id}`),
  reorder: (durumlar) => api.post('/is-emri-durumlari/reorder', { durumlar }),
  createDefaults: () => api.post('/is-emri-durumlari/create-defaults')
};

// Fatura & İrsaliye API
export const faturaAPI = {
  getAll: (params = {}) => api.get('/faturalar', { params }),
  getById: (id) => api.get(`/faturalar/${id}`),
  create: (data) => api.post('/faturalar', data),
  update: (id, data) => api.put(`/faturalar/${id}`, data),
  delete: (id) => api.delete(`/faturalar/${id}`),
  getKalemler: (faturaId) => api.get(`/faturalar/${faturaId}/kalemler`),
  addKalem: (faturaId, kalem) => api.post(`/faturalar/${faturaId}/kalemler`, kalem),
  acquireLock: (id) => api.post(`/faturalar/${id}/lock`),
  releaseLock: (id) => api.delete(`/faturalar/${id}/lock`)
};

export const irsaliyeAPI = {
  getAll: (params = {}) => api.get('/irsaliyeler', { params }),
  getById: (id) => api.get(`/irsaliyeler/${id}`),
  create: (data) => api.post('/irsaliyeler', data),
  update: (id, data) => api.put(`/irsaliyeler/${id}`, data),
  delete: (id) => api.delete(`/irsaliyeler/${id}`),
  getKalemler: (irsaliyeId) => api.get(`/irsaliyeler/${irsaliyeId}/kalemler`),
  addKalem: (irsaliyeId, kalem) => api.post(`/irsaliyeler/${irsaliyeId}/kalemler`, kalem),
  acquireLock: (id) => api.post(`/irsaliyeler/${id}/lock`),
  releaseLock: (id) => api.delete(`/irsaliyeler/${id}/lock`),
  forceUnlock: (id, reason) => api.post(`/irsaliyeler/${id}/force-unlock`, { reason }),

  // Hibrit irsaliye analizi (v2 - Rule-based + AI)
  analyzeV2: (imageData, options = {}) => api.post('/irsaliyeler/analiz/v2', {
    image: imageData,
    strategy: options.strategy,
    force_ai: options.forceAI,
    context: options.context
  }),

  // Analiz servisi health check
  analyzeHealthCheck: () => api.get('/irsaliyeler/analiz/health'),

  // Analiz servisi metrikleri
  analyzeMetrics: () => api.get('/irsaliyeler/analiz/metrics')
};

export const eslestirmeAPI = {
  getOneriler: (faturaId) => api.get(`/eslestirme/oneler/${faturaId}`),
  getGrupluOneriler: (faturaId) => api.get(`/eslestirme/gruplu-oneler/${faturaId}`),
  onayla: (faturaId, eslestirmeler) => api.post('/eslestirme/onayla', {
    fatura_id: parseInt(faturaId),
    eslestirmeler
  }),
  reddet: (faturaKalemId, irsaliyeKalemId, neden) => api.post('/eslestirme/reddet', {
    fatura_kalem_id: faturaKalemId,
    irsaliye_kalem_id: irsaliyeKalemId,
    neden
  }),
  manuelEslestirme: (faturaKalemId, irsaliyeKalemId, neden) => api.post('/eslestirme/manuel', {
    fatura_kalem_id: faturaKalemId,
    irsaliye_kalem_id: irsaliyeKalemId,
    neden
  }),
  eslestirmeKaldir: (faturaKalemId, neden) => api.post(`/eslestirme/eslestirme-kaldir/${faturaKalemId}`, {
    neden
  }),
  getDurum: (faturaId) => api.get(`/eslestirme/durum/${faturaId}`)
};

export default api;