import { useState, useEffect, useCallback, useMemo } from 'react';
import stokKartlariService from '../services/stokKartlariService';

const INITIAL_FILTERS = {
  q: '',
  malzeme_cinsi: '',
  firma: '',
  kritik_stok: false
};

const INITIAL_PAGINATION = {
  page: 0,
  pageSize: 20,
  total: 0
};

export const useStokKartlari = () => {
  // Ana state'ler
  const [stokKartlari, setStokKartlari] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Pagination
  const [pagination, setPagination] = useState(INITIAL_PAGINATION);
  
  // Filters
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  
  // Dropdown data
  const [dropdownData, setDropdownData] = useState({
    firmalar: [],
    malzemeCinsleri: [],
    loading: false
  });
  
  // İstatistikler
  const [istatistikler, setIstatistikler] = useState(null);

  // Ana veri yükleme fonksiyonu
  const fetchData = useCallback(async (customParams = {}) => {
    try {
      setLoading(true);
      setError(null);

      // API parametrelerini hazırla
      const params = {
        sayfa: pagination.page + 1,
        limit: pagination.pageSize,
        ...filters,
        ...customParams
      };

      console.log('API Parameters:', params);

      const response = await stokKartlariService.getStokKartlari(params);
      
      if (response.success) {
        setStokKartlari(response.data || []);
        setPagination(prev => ({
          ...prev,
          total: response.pagination?.total || 0
        }));
      } else {
        throw new Error(response.message || 'Veri yüklenemedi');
      }
    } catch (err) {
      console.error('Data fetch error:', err);
      setError(err.message || 'Stok kartları yüklenirken hata oluştu');
      setStokKartlari([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.pageSize, filters]);

  // Dropdown verilerini yükle
  const fetchDropdownData = useCallback(async () => {
    try {
      setDropdownData(prev => ({ ...prev, loading: true }));
      
      const [firmaResponse, malzemeResponse] = await Promise.all([
        stokKartlariService.getFirmalar(),
        stokKartlariService.getMalzemeCinsleri()
      ]);

      setDropdownData({
        firmalar: firmaResponse.success ? firmaResponse.data : [],
        malzemeCinsleri: malzemeResponse.success ? malzemeResponse.data : [],
        loading: false
      });
    } catch (err) {
      console.error('Dropdown data fetch error:', err);
      setDropdownData(prev => ({ ...prev, loading: false }));
    }
  }, []);

  // İstatistikleri yükle
  const fetchIstatistikler = useCallback(async () => {
    try {
      const response = await stokKartlariService.getIstatistikler();
      if (response.success) {
        setIstatistikler(response.data);
      }
    } catch (err) {
      console.error('İstatistik fetch error:', err);
    }
  }, []);

  // Filter değiştirme
  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    // Filtre değiştiğinde sayfa 0'a dön
    setPagination(prev => ({ ...prev, page: 0 }));
  }, []);

  // Pagination değiştirme
  const updatePagination = useCallback((newPagination) => {
    console.log('updatePagination called with:', newPagination);
    setPagination(prev => {
      const updated = { ...prev, ...newPagination };
      console.log('Pagination updated from:', prev, 'to:', updated);
      return updated;
    });
  }, []);

  // Filtreleri sıfırla
  const resetFilters = useCallback(() => {
    setFilters(INITIAL_FILTERS);
    setPagination(INITIAL_PAGINATION);
  }, []);

  // CRUD Operations
  const createStokKarti = useCallback(async (data) => {
    try {
      const response = await stokKartlariService.createStokKarti(data);
      if (response.success) {
        await fetchData();
        await fetchIstatistikler();
        return { success: true, data: response.data };
      }
      throw new Error(response.message);
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [fetchData, fetchIstatistikler]);

  const updateStokKarti = useCallback(async (id, data) => {
    try {
      const response = await stokKartlariService.updateStokKarti(id, data);
      if (response.success) {
        await fetchData();
        await fetchIstatistikler();
        return { success: true, data: response.data };
      }
      throw new Error(response.message);
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [fetchData, fetchIstatistikler]);

  const deleteStokKarti = useCallback(async (id) => {
    try {
      const response = await stokKartlariService.deleteStokKarti(id);
      if (response.success) {
        await fetchData();
        await fetchIstatistikler();
        return { success: true };
      }
      throw new Error(response.message);
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [fetchData, fetchIstatistikler]);

  // İlk yükleme
  useEffect(() => {
    fetchDropdownData();
    fetchIstatistikler();
  }, [fetchDropdownData, fetchIstatistikler]);

  // Veri yükleme trigger'ı
  useEffect(() => {
    console.log('Pagination or filters changed, fetching data:', { 
      page: pagination.page, 
      pageSize: pagination.pageSize, 
      filters 
    });
    fetchData();
  }, [pagination.page, pagination.pageSize, filters]);

  // Memoized değerler
  const hasFilters = useMemo(() => {
    return Object.values(filters).some(value => 
      value !== '' && value !== false && value !== 0
    );
  }, [filters]);

  const isEmpty = useMemo(() => {
    return !loading && stokKartlari.length === 0;
  }, [loading, stokKartlari.length]);

  return {
    // Data
    stokKartlari,
    loading,
    error,
    pagination,
    filters,
    dropdownData,
    istatistikler,
    
    // Computed
    hasFilters,
    isEmpty,
    
    // Actions
    updateFilters,
    updatePagination,
    resetFilters,
    fetchData,
    fetchIstatistikler,
    
    // CRUD
    createStokKarti,
    updateStokKarti,
    deleteStokKarti
  };
};

export default useStokKartlari;
