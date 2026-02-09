import { useState, useEffect, useCallback } from 'react';
import tezgahAPI from '../services/tezgahAPI';

/**
 * Tezgah verilerini yönetmek için custom hook
 * @returns {object} - Tezgah state'i ve ilgili fonksiyonlar
 */
const useTezgahlar = () => {
  const [tezgahlar, setTezgahlar] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Tüm tezgahları getirir
   */
  const fetchTezgahlar = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await tezgahAPI.getAllTezgahlar();
      setTezgahlar(response.data || []);
    } catch (err) {
      setError(err.message);
      console.error('Tezgahlar getirme hatası:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * ID'ye göre tezgah getirir
   * @param {number} id - Tezgah ID'si
   * @returns {Promise<object>} - Tezgah detayı
   */
  const getTezgahById = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await tezgahAPI.getTezgahById(id);
      return response.data;
    } catch (err) {
      setError(err.message);
      console.error('Tezgah detayı getirme hatası:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Yeni tezgah oluşturur
   * @param {object} tezgahData - Yeni tezgah verileri
   * @returns {Promise<object>} - Oluşturulan tezgah
   */
  const createTezgah = useCallback(async (tezgahData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await tezgahAPI.createTezgah(tezgahData);
      setTezgahlar(prev => [...prev, response.data]);
      return response.data;
    } catch (err) {
      setError(err.message);
      console.error('Tezgah oluşturma hatası:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Tezgah günceller
   * @param {number} id - Tezgah ID'si
   * @param {object} tezgahData - Güncellenecek tezgah verileri
   * @returns {Promise<object>} - Güncellenen tezgah
   */
  const updateTezgah = useCallback(async (id, tezgahData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await tezgahAPI.updateTezgah(id, tezgahData);
      setTezgahlar(prev => 
        prev.map(tezgah => 
          tezgah.tezgah_id === id ? response.data : tezgah
        )
      );
      return response.data;
    } catch (err) {
      setError(err.message);
      console.error('Tezgah güncelleme hatası:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Tezgah siler
   * @param {number} id - Tezgah ID'si
   * @returns {Promise<boolean>} - Silme işlemi başarılı mı
   */
  const deleteTezgah = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    
    try {
      await tezgahAPI.deleteTezgah(id);
      setTezgahlar(prev => prev.filter(tezgah => tezgah.tezgah_id !== id));
      return true;
    } catch (err) {
      setError(err.message);
      console.error('Tezgah silme hatası:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Tezgah pozisyonlarını günceller
   * @param {Array<object>} pozisyonlar - Pozisyon verileri
   * @returns {Promise<object>} - Güncelleme işlemi sonucu
   */
  const updatePozisyonlar = useCallback(async (pozisyonlar) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await tezgahAPI.updateTezgahPositions(pozisyonlar);
      // Pozisyon güncellemesi sonrası tezgah listesini yeniden fetch et
      await fetchTezgahlar();
      return response.data;
    } catch (err) {
      setError(err.message);
      console.error('Pozisyon güncelleme hatası:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchTezgahlar]);

  /**
   * Tezgaha iş emri atar
   * @param {number} tezgahId - Tezgah ID'si
   * @param {string} isEmriId - İş emri ID'si
   * @returns {Promise<object>} - Atama işlemi sonucu
   */
  const assignIsEmri = useCallback(async (tezgahId, isEmriId) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await tezgahAPI.assignIsEmri(tezgahId, isEmriId);
      // İş emri ataması sonrası tezgah listesini yeniden fetch et
      await fetchTezgahlar();
      return response.data;
    } catch (err) {
      setError(err.message);
      console.error('İş emri atama hatası:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchTezgahlar]);

  /**
   * Tezgahtan iş emrini tamamlar
   * @param {number} tezgahId - Tezgah ID'si
   * @param {string} isEmriId - İş emri ID'si
   * @param {object} data - Tamamlama verileri
   * @returns {Promise<object>} - Tamamlama işlemi sonucu
   */
  const completeIsEmri = useCallback(async (tezgahId, isEmriId, data = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await tezgahAPI.completeIsEmri(tezgahId, isEmriId, data);
      // İş emri tamamlanması sonrası tezgah listesini yeniden fetch et
      await fetchTezgahlar();
      return response.data;
    } catch (err) {
      setError(err.message);
      console.error('İş emri tamamlama hatası:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchTezgahlar]);

  /**
   * Tezgahtan işe ara verir
   * @param {number} tezgahId - Tezgah ID'si
   * @param {string} aciklama - Açıklama
   * @returns {Promise<object>} - İşe ara verme işlemi sonucu
   */
  const pauseIsEmri = useCallback(async (tezgahId, aciklama = '') => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await tezgahAPI.pauseIsEmri(tezgahId, aciklama);
      // İşe ara verme sonrası tezgah listesini yeniden fetch et
      await fetchTezgahlar();
      return response.data;
    } catch (err) {
      setError(err.message);
      console.error('İşe ara verme hatası:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchTezgahlar]);

  /**
   * Tezgahın iş emirleri geçmişini getirir
   * @param {number} tezgahId - Tezgah ID'si
   * @returns {Promise<object>} - İş emirleri geçmişi
   */
  const getIsEmriGecmisi = useCallback(async (tezgahId) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await tezgahAPI.getIsEmriGecmisi(tezgahId);
      return response.data;
    } catch (err) {
      setError(err.message);
      console.error('İş emri geçmişi getirme hatası:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Arıza/Bakım kaydını sonlandırır
   * @param {number} tezgahId - Tezgah ID'si
   * @param {string} arizaBakimId - Arıza/Bakım ID'si
   * @param {object} data - Sonlandırma verileri
   * @returns {Promise<object>} - Sonlandırma işlemi sonucu
   */
  const endArizaBakim = useCallback(async (tezgahId, arizaBakimId, data = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await tezgahAPI.endArizaBakim(tezgahId, arizaBakimId, data);
      // Arıza/Bakım sonlandırması sonrası tezgah listesini yeniden fetch et
      await fetchTezgahlar();
      return response.data;
    } catch (err) {
      setError(err.message);
      console.error('Arıza/Bakım sonlandırma hatası:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchTezgahlar]);

  /**
   * Error state'ini temizler
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Component mount olduğunda tezgahları getir
   */
  useEffect(() => {
    fetchTezgahlar();
  }, [fetchTezgahlar]);

  return {
    // State
    tezgahlar,
    loading,
    error,
    
    // Actions
    fetchTezgahlar,
    getTezgahById,
    createTezgah,
    updateTezgah,
    deleteTezgah,
    updatePozisyonlar,
    assignIsEmri,
    completeIsEmri,
    pauseIsEmri,
    getIsEmriGecmisi,
    endArizaBakim,
    clearError,
  };
};

export default useTezgahlar;