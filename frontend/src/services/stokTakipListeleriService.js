import api from './api';

const base = '/stok-takip-listeleri';

const stokTakipListeleriService = {
  list: () => api.get(base).then(r => r.data),
  getById: (id) => api.get(`${base}/${id}`).then(r => r.data),
  create: (payload) => api.post(base, payload).then(r => r.data),
  update: (id, payload) => api.put(`${base}/${id}`, payload).then(r => r.data),
  remove: (id) => api.delete(`${base}/${id}`).then(r => r.data),

  addItem: (id, item) => api.post(`${base}/${encodeURIComponent(id)}/kalemler`, item).then(r => r.data),
  removeItem: (id, stokKartiId) => api.delete(`${base}/${encodeURIComponent(id)}/kalemler/${encodeURIComponent(stokKartiId)}`).then(r => r.data),
  getMembershipForIds: (ids = []) => {
    const p = Array.isArray(ids) ? ids : [];
    if (!p.length) return Promise.resolve({});
    const qs = encodeURIComponent(p.join(','));
    return api.get(`${base}/membership?ids=${qs}`).then(r => r.data);
  },
  getListsForStokKarti: (stokKartiId) => api.get(`${base}/by-stok-karti/${stokKartiId}`).then(r => r.data)
};

export default stokTakipListeleriService;


