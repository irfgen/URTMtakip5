import api from './api';

const base = '/parca-takip-listeleri';

const parcaTakipListeleriService = {
  list: () => api.get(base).then(r => r.data),
  getById: (id) => api.get(`${base}/${id}`).then(r => r.data),
  create: (payload) => api.post(base, payload).then(r => r.data),
  update: (id, payload) => api.put(`${base}/${id}`, payload).then(r => r.data),
  remove: (id) => api.delete(`${base}/${id}`).then(r => r.data),

  addItem: (id, item) => api.post(`${base}/${encodeURIComponent(id)}/kalemler`, item).then(r => r.data),
  removeItem: (id, parcaKodu) => api.delete(`${base}/${encodeURIComponent(id)}/kalemler/${encodeURIComponent(parcaKodu)}`).then(r => r.data),
  getMembershipForKodlar: (kodlar = []) => {
    const p = Array.isArray(kodlar) ? kodlar : [];
    if (!p.length) return Promise.resolve({});
    const qs = encodeURIComponent(p.join(','));
    return api.get(`${base}/membership?kodlar=${qs}`).then(r => r.data);
  },
  getListsForParca: (parcaKodu) => api.get(`${base}/by-parca/${encodeURIComponent(parcaKodu)}`).then(r => r.data)
};

export default parcaTakipListeleriService;



