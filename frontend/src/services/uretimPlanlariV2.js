import api from './api';

export const uretimPlanlariV2 = {
	list: (params) => api.get('/uretim-planlari', { params }).then(r => r.data),
	get: (id) => api.get(`/uretim-planlari/${id}`).then(r => r.data),
	create: (data) => api.post('/uretim-planlari', data).then(r => r.data),
	update: (id, data) => api.put(`/uretim-planlari/${id}`, data).then(r => r.data),
	remove: (id) => api.delete(`/uretim-planlari/${id}`).then(r => r.data),
	updateItems: (id, is_emirleri_listesi) => api.put(`/uretim-planlari/${id}/kalemler`, { is_emirleri_listesi }).then(r => r.data)
};

export default uretimPlanlariV2;


