/**
 * Günlük Vardiya Raporu API Service
 *
 * Bu servis, günlük vardiya raporu API endpoint'leri ile
 * iletişim kurar.
 *
 * @author PM Agent
 * @version 1.0.0
 * @since 2026-01-06
 */

import axios from 'axios';
import getApiBaseUrl from '../utils/getApiBaseUrl';

const API_BASE_URL = getApiBaseUrl();

/**
 * Günlük vardiya raporunu getirir
 *
 * @param {string} tarih - Rapor tarihi (YYYY-MM-DD format)
 * @param {number} tezgahId - Opsiyonel tezgah filtresi
 * @param {number} vardiyaId - Opsiyonel vardiya filtresi
 * @returns {Promise<object>} Rapor verisi
 */
export const getGunlukVardiyaRaporu = async (tarih, tezgahId = null, vardiyaId = null) => {
  try {
    const params = { tarih };
    if (tezgahId) params.tezgah_id = tezgahId;
    if (vardiyaId) params.vardiya_id = vardiyaId;

    const response = await axios.get(`${API_BASE_URL}/raporlar/gunluk-vardiya`, {
      params
    });

    return response.data;
  } catch (error) {
    console.error('getGunlukVardiyaRaporu hatası:', error);
    throw new Error(error.response?.data?.error || 'Rapor getirilemedi');
  }
};

/**
 * Günlük vardiya özet istatistiklerini getirir
 *
 * @param {string} tarih - Rapor tarihi (YYYY-MM-DD format)
 * @returns {Promise<object>} Özet verisi
 */
export const getGunlukVardiyaOzet = async (tarih) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/raporlar/gunluk-vardiya/ozet`, {
      params: { tarih }
    });

    return response.data;
  } catch (error) {
    console.error('getGunlukVardiyaOzet hatası:', error);
    throw new Error(error.response?.data?.error || 'Özet getirilemedi');
  }
};
