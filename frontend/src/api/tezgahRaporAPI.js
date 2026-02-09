import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

export const tezgahRaporAPI = {
  getTimeline: (tezgahId, tarih) =>
    api.get('/tezgah/rapor/timeline', { params: { tezgah_id: tezgahId, tarih } })
};

export default tezgahRaporAPI;


