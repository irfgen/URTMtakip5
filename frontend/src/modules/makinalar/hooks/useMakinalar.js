import { useState, useEffect, useCallback } from 'react';
import makinaAPI from '../services/makinaAPI';

/**
 * Makinalar verilerini yönetmek için custom hook
 * @returns {object} - Makinalar state'i ve ilgili fonksiyonlar
 */
const useMakinalar = () => {
  const [makinalar, setMakinalar] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
  });

  /**
   * Tüm makinaları getirir
   * @param {object} params - Arama ve sıralama parametreleri
   */
  const fetchMakinalar = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await makinaAPI.getAllMakinalar(params);
      setMakinalar(response.data || []);
      setPagination(prev => ({
        ...prev,
        ...response.meta?.pagination,
      }));
    } catch (err) {
      setError(err.message);
      console.error('Makinalar getirme hatası:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * ID'ye göre makina getirir
   * @param {string} id - Makina ID'si
   * @returns {Promise<object>} - Makina detayı
   */
  const getMakinaById = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await makinaAPI.getMakinaById(id);
      return response.data;
    } catch (err) {
      setError(err.message);
      console.error('Makina detayı getirme hatası:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Yeni makina oluşturur
   * @param {object} makinaData - Yeni makina verileri
   * @returns {Promise<object>} - Oluşturulan makina
   */
  const createMakina = useCallback(async (makinaData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await makinaAPI.createMakina(makinaData);
      setMakinalar(prev => [...prev, response.data]);
      return response.data;
    } catch (err) {
      setError(err.message);
      console.error('Makina oluşturma hatası:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Makina günceller
   * @param {string} id - Makina ID'si
   * @param {object} makinaData - Güncellenecek makina verileri
   * @returns {Promise<object>} - Güncellenen makina
   */
  const updateMakina = useCallback(async (id, makinaData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await makinaAPI.updateMakina(id, makinaData);
      setMakinalar(prev => 
        prev.map(makina => 
          makina.makina_id === id ? response.data : makina
        )
      );
      return response.data;
    } catch (err) {
      setError(err.message);
      console.error('Makina güncelleme hatası:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Makina siler
   * @param {string} id - Makina ID'si
   * @returns {Promise<boolean>} - Silme işlemi başarılı mı
   */
  const deleteMakina = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    
    try {
      await makinaAPI.deleteMakina(id);
      setMakinalar(prev => prev.filter(makina => makina.makina_id !== id));
      return true;
    } catch (err) {
      setError(err.message);
      console.error('Makina silme hatası:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Parça arar
   * @param {string} search - Arama metni
   * @returns {Promise<object>} - Arama sonuçları
   */
  const searchParts = useCallback(async (search) => {
    try {
      const response = await makinaAPI.searchParts(search);
      return response.data;
    } catch (err) {
      setError(err.message);
      console.error('Parça arama hatası:', err);
      throw err;
    }
  }, []);

  /**
   * BOM arar
   * @param {string} search - Arama metni
   * @returns {Promise<object>} - Arama sonuçları
   */
  const searchBoms = useCallback(async (search) => {
    try {
      const response = await makinaAPI.searchBoms(search);
      return response.data;
    } catch (err) {
      setError(err.message);
      console.error('BOM arama hatası:', err);
      throw err;
    }
  }, []);

  /**
   * Error state'ini temizler
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Component mount olduğunda makinaları getir
   */
  useEffect(() => {
    fetchMakinalar();
  }, [fetchMakinalar]);

  return {
    // State
    makinalar,
    loading,
    error,
    pagination,
    
    // Actions
    fetchMakinalar,
    getMakinaById,
    createMakina,
    updateMakina,
    deleteMakina,
    searchParts,
    searchBoms,
    clearError,
  };
};

export default useMakinalar;