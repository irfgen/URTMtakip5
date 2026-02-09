import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axiosConfig';

// Cache utility functions - DEVRE DIŞI
const isCacheValid = (cacheItem, cacheTTL) => {
  return false; // Cache'i tamamen devre dışı bırak
};

const setCache = (cache, key, data) => {
  // Cache'e yazma
};

const getCache = (cache, key) => {
  return null; // Cache'den okuma
};

// Async thunks with caching
export const fetchSiniflar = createAsyncThunk(
  'makindex/fetchSiniflar',
  async (_, { rejectWithValue, getState }) => {
    try {
      // Check cache first
      const state = getState();
      const cacheItem = state.makindex.cache.siniflar;

      // Cache devre dışı
      // if (isCacheValid(cacheItem, state.makindex.cacheTTL)) {
      //   return { data: cacheItem.data, fromCache: true };
      // }

      const response = await api.get('/makindex/siniflar?includeCount=true');
      return { data: response.data.data, fromCache: false };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Makina sınıfları alınamadı');
    }
  }
);

export const fetchMakinalarBySinifId = createAsyncThunk(
  'makindex/fetchMakinalarBySinifId',
  async (sinifId, { rejectWithValue, getState }) => {
    try {
      // Check cache first
      const state = getState();
      const cacheItem = state.makindex.cache.makinalar[sinifId];

      // Cache devre dışı
      // if (isCacheValid(cacheItem, state.makindex.cacheTTL)) {
      //   return { sinifId, makinalar: cacheItem.data, fromCache: true };
      // }

      const response = await api.get(`/makindex/makinalar/${sinifId}`);
      return { sinifId, makinalar: response.data.data, fromCache: false };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Makinalar alınamadı');
    }
  }
);

export const fetchGruplarByMakinaId = createAsyncThunk(
  'makindex/fetchGruplarByMakinaId',
  async (makinaId, { rejectWithValue, getState }) => {
    try {
      console.log('🔍 fetchGruplarByMakinaId çağrıldı, makinaId:', makinaId);

      // Check cache first
      const state = getState();
      const cacheItem = state.makindex.cache.gruplar[makinaId];

      // Cache'i geçici olarak devre dışı bırak
      // if (isCacheValid(cacheItem, state.makindex.cacheTTL)) {
      //   return { makinaId, gruplar: cacheItem.data, fromCache: true };
      // }

      console.log('📡 API çağrısı yapılıyor: /makindex/boms/${makinaId}');
      const response = await api.get(`/makindex/boms/${makinaId}`);
      console.log('📥 API yanıtı alındı:', response.data);
      console.log('📥 Grup sayısı:', response.data.data?.length || 0);

      return { makinaId, gruplar: response.data.data, fromCache: false };
    } catch (error) {
      console.error('❌ fetchGruplarByMakinaId hatası:', error);
      return rejectWithValue(error.response?.data?.message || 'Gruplar alınamadı');
    }
  }
);

export const fetchParcalarByGrupId = createAsyncThunk(
  'makindex/fetchParcalarByGrupId',
  async (grupId, { rejectWithValue, getState }) => {
    try {
      // Check cache first
      const state = getState();
      const cacheItem = state.makindex.cache.parcalar[grupId];

      // Cache devre dışı
      // if (isCacheValid(cacheItem, state.makindex.cacheTTL)) {
      //   return { grupId, parcalar: cacheItem.data, fromCache: true };
      // }

      const response = await api.get(`/makindex/parcalar/${grupId}`);
      return { grupId, parcalar: response.data.data, fromCache: false };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Parçalar alınamadı');
    }
  }
);

export const globalAra = createAsyncThunk(
  'makindex/globalAra',
  async ({ query, type }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams({ q: query });
      if (type) params.append('type', type);

      const response = await api.get(`/makindex/ara?${params}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Arama yapılamadı');
    }
  }
);

export const seedData = createAsyncThunk(
  'makindex/seedData',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.post('/makindex/seed');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Veriler yüklenemedi');
    }
  }
);

// CRUD operations for Makina Sınıfları
export const createSinif = createAsyncThunk(
  'makindex/createSinif',
  async (sinifData, { rejectWithValue }) => {
    try {
      const response = await api.post('/makindex/siniflar', sinifData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Sınıf oluşturulamadı');
    }
  }
);

export const updateSinif = createAsyncThunk(
  'makindex/updateSinif',
  async ({ id, ...sinifData }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/makindex/siniflar/${id}`, sinifData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Sınıf güncellenemedi');
    }
  }
);

export const deleteSinif = createAsyncThunk(
  'makindex/deleteSinif',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/makindex/siniflar/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Sınıf silinemedi');
    }
  }
);

export const getSinifById = createAsyncThunk(
  'makindex/getSinifById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(`/makindex/siniflar/${id}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Sınıf detayları alınamadı');
    }
  }
);

// Additional convenience thunks
export const fetchMakinalar = createAsyncThunk(
  'makindex/fetchMakinalar',
  async (sinifId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/makindex/makinalar/${sinifId}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Makinalar alınamadı');
    }
  }
);

export const fetchGrupGroups = createAsyncThunk(
  'makindex/fetchGrupGroups',
  async (makinaId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/makindex/boms/${makinaId}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Gruplar alınamadı');
    }
  }
);

export const fetchParcalar = createAsyncThunk(
  'makindex/fetchParcalar',
  async (grupId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/makindex/parcalar/${grupId}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Parçalar alınamadı');
    }
  }
);

const initialState = {
  // Data
  siniflar: [],
  makinalar: {}, // { sinifId: [makinalar] }
  gruplar: {}, // { makinaId: [gruplar] }
  parcalar: {}, // { grupId: [parcalar] }

  // UI State
  expandedNodes: new Set(),
  selectedNode: null,

  // Search
  searchResults: {},
  searchQuery: '',
  searchType: null,
  recentSearches: JSON.parse(localStorage.getItem('makindexRecentSearches') || '[]'),

  // Filters
  filters: {
    stokDurumu: 'hepsi', // 'hepsi', 'stokta', 'kritik'
    makinaSinifi: 'hepsi',
  },

  // Loading states
  loading: {
    siniflar: false,
    makinalar: {},
    gruplar: {},
    parcalar: {},
    search: false,
    seed: false,
    createSinif: false,
    updateSinif: false,
    deleteSinif: false,
    sinifDetail: false,
  },

  // Error states
  error: {
    siniflar: null,
    makinalar: {},
    gruplar: {},
    parcalar: {},
    search: null,
    seed: null,
    createSinif: null,
    updateSinif: null,
    deleteSinif: null,
    sinifDetail: null,
  },

  // View mode
  viewMode: 'tree', // 'tree' or 'search'

  // Cache settings
  cache: {
    siniflar: null, // { data, timestamp }
    makinalar: {}, // { sinifId: { data, timestamp } }
    gruplar: {}, // { makinaId: { data, timestamp } }
    parcalar: {}, // { grupId: { data, timestamp } }
    search: {}, // { query: { data, timestamp } }
  },

  // Cache TTL in milliseconds (5 minutes)
  cacheTTL: 5 * 60 * 1000,
};

const makindexSlice = createSlice({
  name: 'makindex',
  initialState,
  reducers: {
    // Node expansion/collapse
    toggleNodeExpansion: (state, action) => {
      const nodeId = action.payload;
      if (state.expandedNodes.has(nodeId)) {
        state.expandedNodes.delete(nodeId);
      } else {
        state.expandedNodes.add(nodeId);
      }
      // Expanded nodes'ları localStorage'a kaydet
      localStorage.setItem('makindexExpandedNodes', JSON.stringify([...state.expandedNodes]));
    },

    expandNode: (state, action) => {
      state.expandedNodes.add(action.payload);
      localStorage.setItem('makindexExpandedNodes', JSON.stringify([...state.expandedNodes]));
    },

    collapseNode: (state, action) => {
      state.expandedNodes.delete(action.payload);
      localStorage.setItem('makindexExpandedNodes', JSON.stringify([...state.expandedNodes]));
    },

    collapseAllNodes: (state) => {
      state.expandedNodes.clear();
      localStorage.setItem('makindexExpandedNodes', JSON.stringify([]));
    },

    // Node selection
    selectNode: (state, action) => {
      state.selectedNode = action.payload;
    },

    clearSelection: (state) => {
      state.selectedNode = null;
    },

    // Search
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },

    setSearchType: (state, action) => {
      state.searchType = action.payload;
    },

    addRecentSearch: (state, action) => {
      const search = action.payload;
      if (!state.recentSearches.includes(search)) {
        state.recentSearches.unshift(search);
        // Keep only last 10 searches
        if (state.recentSearches.length > 10) {
          state.recentSearches = state.recentSearches.slice(0, 10);
        }
        localStorage.setItem('makindexRecentSearches', JSON.stringify(state.recentSearches));
      }
    },

    clearRecentSearches: (state) => {
      state.recentSearches = [];
      localStorage.removeItem('makindexRecentSearches');
    },

    // Filters
    setStokDurumuFilter: (state, action) => {
      state.filters.stokDurumu = action.payload;
    },

    setMakinaSinifiFilter: (state, action) => {
      state.filters.makinaSinifi = action.payload;
    },

    clearFilters: (state) => {
      state.filters = {
        stokDurumu: 'hepsi',
        makinaSinifi: 'hepsi',
      };
    },

    // Restore expanded nodes from localStorage
    restoreExpandedNodes: (state) => {
      try {
        const saved = localStorage.getItem('makindexExpandedNodes');
        if (saved) {
          state.expandedNodes = new Set(JSON.parse(saved));
        }
      } catch (error) {
        console.warn('Expanded nodes restore failed:', error);
      }
    },

    // Clear all data (logout)
    clearAllData: (state) => {
      state.siniflar = [];
      state.makinalar = {};
      state.gruplar = {};
      state.parcalar = {};
      state.expandedNodes.clear();
      state.selectedNode = null;
      state.searchResults = {};
      state.searchQuery = '';
      state.searchType = null;
      state.filters = {
        stokDurumu: 'hepsi',
        makinaSinifi: 'hepsi',
      };
    },

    // Clear expanded nodes
    clearExpandedNodes: (state) => {
      state.expandedNodes.clear();
      localStorage.setItem('makindexExpandedNodes', JSON.stringify([]));
    },

    // Clear search results
    clearSearchResults: (state) => {
      state.searchResults = {};
      state.searchQuery = '';
      state.searchType = null;
    },

    // Set view mode
    setViewMode: (state, action) => {
      state.viewMode = action.payload;
    },

    // Real-time update reducers
    updateStok: (state, action) => {
      const { parcaKodu, yeniStok, oncekiStok } = action.payload;

      // Update parcalar in all BOMs that contain this parca
      Object.keys(state.parcalar).forEach(bomId => {
        const parcalarInBom = state.parcalar[bomId];
        const updatedParca = parcalarInBom.find(p => p.parcaKodu === parcaKodu);
        if (updatedParca) {
          updatedParca.stokAdeti = yeniStok;
          updatedParca.kritikStok = yeniStok <= 0; // Update kritik status
        }
      });

      // Update search results if they contain this parca
      if (state.searchResults.data) {
        state.searchResults.data.forEach(result => {
          if (result.type === 'parca' && result.parcaKodu === parcaKodu) {
            result.stokAdeti = yeniStok;
            result.kritikStok = yeniStok <= 0;
          }
        });
      }
    },

    updateParcaEklendi: (state, action) => {
      const { grupId, parcaKodu, parcaAdi } = action.payload;

      // Add new parca to the grup if it's loaded
      if (state.parcalar[grupId]) {
        const existingParca = state.parcalar[grupId].find(p => p.parcaKodu === parcaKodu);
        if (!existingParca) {
          state.parcalar[grupId].push({
            parcaKodu,
            parcaAdi,
            stokAdeti: 0,
            kritikStok: true,
            teknik_resim_path: null
          });
        }
      }
    },

    updateGrupGuncellendi: (state, action) => {
      const { grupId, makinaId, degisiklik } = action.payload;

      // Force refresh of grup data
      if (state.gruplar[makinaId]) {
        delete state.gruplar[makinaId]; // Will trigger re-fetch
      }
      if (state.parcalar[grupId]) {
        delete state.parcalar[grupId]; // Will trigger re-fetch
      }
    },

    // Cache management
    clearCache: (state) => {
      state.cache.siniflar = null;
      state.cache.makinalar = {};
      state.cache.gruplar = {};
      state.cache.parcalar = {};
      state.cache.search = {};
    },

    // Test data management (performance testing)
    setTestData: (state, action) => {
      const { siniflar, makinalar, gruplar, parcalar } = action.payload;

      // Replace existing data with test data
      state.siniflar = siniflar;

      // Organize makinalar by sinif ID
      const makinalarBySinif = {};
      makinalar.forEach(makina => {
        const sinifId = makina.makina_sinifi_id;
        if (!makinalarBySinif[sinifId]) {
          makinalarBySinif[sinifId] = [];
        }
        makinalarBySinif[sinifId].push(makina);
      });
      state.makinalar = makinalarBySinif;

      // Organize gruplar by makina ID (simulate relationships)
      const gruplarByMakina = {};
      gruplar.forEach((grup, index) => {
        const makinaId = (index % Math.max(Object.keys(makinalarBySinif).length, 1)) + 1;
        if (!gruplarByMakina[makinaId]) {
          gruplarByMakina[makinaId] = [];
        }
        gruplarByMakina[makinaId].push(grup);
      });
      state.gruplar = gruplarByMakina;

      // Organize parçalar by grup ID (simulate relationships)
      const parcalarByGrup = {};
      parcalar.forEach((parca, index) => {
        const grupId = (index % Math.max(Object.keys(gruplarByMakina).length, 1)) + 1;
        if (!parcalarByGrup[grupId]) {
          parcalarByGrup[grupId] = [];
        }
        parcalarByGrup[grupId].push(parca);
      });
      state.parcalar = parcalarByGrup;

      // Clear cache for test data
      state.cache.siniflar = null;
      state.cache.makinalar = {};
      state.cache.gruplar = {};
      state.cache.parcalar = {};
    },

    // Set loading state for tests
    setLoading: (state, action) => {
      const { key, value } = action.payload;
      state.loading[key] = value;
    },

    clearSiniflarCache: (state) => {
      state.cache.siniflar = null;
    },

    clearMakinalarCache: (state, action) => {
      const sinifId = action.payload;
      if (state.cache.makinalar[sinifId]) {
        delete state.cache.makinalar[sinifId];
      }
    },

    clearGruplarCache: (state, action) => {
      const makinaId = action.payload;
      if (state.cache.gruplar[makinaId]) {
        delete state.cache.gruplar[makinaId];
      }
    },

    clearParcalarCache: (state, action) => {
      const grupId = action.payload;
      if (state.cache.parcalar[grupId]) {
        delete state.cache.parcalar[grupId];
      }
    },

    clearSearchCache: (state) => {
      state.cache.search = {};
    },

    // Clear CRUD errors
    clearSinifError: (state) => {
      state.error.createSinif = null;
      state.error.updateSinif = null;
      state.error.deleteSinif = null;
      state.error.sinifDetail = null;
    },
  },
  extraReducers: (builder) => {
    // fetchSiniflar
    builder
      .addCase(fetchSiniflar.pending, (state) => {
        state.loading.siniflar = true;
        state.error.siniflar = null;
      })
      .addCase(fetchSiniflar.fulfilled, (state, action) => {
        state.loading.siniflar = false;
        state.siniflar = action.payload.data;

        // Cache the result if not from cache
        if (!action.payload.fromCache) {
          setCache(state.cache, 'siniflar', action.payload.data);
        }
      })
      .addCase(fetchSiniflar.rejected, (state, action) => {
        state.loading.siniflar = false;
        state.error.siniflar = action.payload;
      });

    // fetchMakinalarBySinifId
    builder
      .addCase(fetchMakinalarBySinifId.pending, (state, action) => {
        const sinifId = action.meta.arg;
        state.loading.makinalar[sinifId] = true;
        state.error.makinalar[sinifId] = null;
      })
      .addCase(fetchMakinalarBySinifId.fulfilled, (state, action) => {
        const { sinifId, makinalar } = action.payload;
        state.loading.makinalar[sinifId] = false;
        state.makinalar[sinifId] = makinalar;

        // Cache the result if not from cache
        if (!action.payload.fromCache) {
          setCache(state.cache.makinalar, sinifId, makinalar);
        }
      })
      .addCase(fetchMakinalarBySinifId.rejected, (state, action) => {
        const sinifId = action.meta.arg;
        state.loading.makinalar[sinifId] = false;
        state.error.makinalar[sinifId] = action.payload;
      });

    // fetchGruplarByMakinaId
    builder
      .addCase(fetchGruplarByMakinaId.pending, (state, action) => {
        const makinaId = action.meta.arg;
        state.loading.gruplar[makinaId] = true;
        state.error.gruplar[makinaId] = null;
      })
      .addCase(fetchGruplarByMakinaId.fulfilled, (state, action) => {
        const { makinaId, gruplar } = action.payload;
        console.log('✅ fetchGruplarByMakinaId fulfilled, makinaId:', makinaId);
        console.log('✅ Gelen grup sayısı:', gruplar?.length || 0);
        console.log('✅ Gelen gruplar:', gruplar);

        // BOM verilerini GrupNode formatına dönüştür
        const transformedGruplar = gruplar.map(bom => ({
          ...bom,
          ad: bom.name, // name -> ad
          grup_kodu: bom.bom_kodu, // zaten doğru
          aciklama: bom.bom_aciklamasi, // bom_aciklamasi -> aciklama
          grup_tipi: bom.grup_tipi || 'standard',
          marka: bom.marka,
          ozel_etiket: bom.ozel_etiket,
          gorsel_ikon: bom.gorsel_ikon,
          versiyon: bom.versiyon,
          aktif: bom.aktif
        }));

        console.log('🔄 Dönüştürülmüş gruplar:', transformedGruplar);

        state.loading.gruplar[makinaId] = false;
        state.gruplar[makinaId] = transformedGruplar;

        // Cache the result if not from cache
        if (!action.payload.fromCache) {
          setCache(state.cache.gruplar, makinaId, gruplar);
        }
      })
      .addCase(fetchGruplarByMakinaId.rejected, (state, action) => {
        const makinaId = action.meta.arg;
        console.error('❌ fetchGruplarByMakinaId rejected, makinaId:', makinaId);
        console.error('❌ Hata mesajı:', action.payload);
        state.loading.gruplar[makinaId] = false;
        state.error.gruplar[makinaId] = action.payload;
      });

    // fetchParcalarByGrupId
    builder
      .addCase(fetchParcalarByGrupId.pending, (state, action) => {
        const grupId = action.meta.arg;
        state.loading.parcalar[grupId] = true;
        state.error.parcalar[grupId] = null;
      })
      .addCase(fetchParcalarByGrupId.fulfilled, (state, action) => {
        const { grupId, parcalar } = action.payload;
        state.loading.parcalar[grupId] = false;

        // Filter out null/undefined parçalar and validate structure
        const validParcalar = Array.isArray(parcalar)
          ? parcalar.filter(p => p && typeof p === 'object' && p.id)
          : [];

        // Log RFRO_BASKI for debugging
        if (validParcalar.length !== (parcalar?.length || 0)) {
          console.warn(`⚠️ Filtered ${parcalar?.length - validParcalar.length} invalid parçalar from grup ${grupId}`);
        }

        state.parcalar[grupId] = validParcalar;

        // Cache the result if not from cache
        if (!action.payload.fromCache) {
          setCache(state.cache.parcalar, grupId, validParcalar);
        }
      })
      .addCase(fetchParcalarByGrupId.rejected, (state, action) => {
        const grupId = action.meta.arg;
        state.loading.parcalar[grupId] = false;
        state.error.parcalar[grupId] = action.payload;
      });

    // globalAra
    builder
      .addCase(globalAra.pending, (state) => {
        state.loading.search = true;
        state.error.search = null;
      })
      .addCase(globalAra.fulfilled, (state, action) => {
        state.loading.search = false;
        state.searchResults = action.payload.data;
        state.searchQuery = action.meta.arg.query; // Set search query

        // Add to recent searches
        if (action.meta.arg.query && action.meta.arg.query.trim().length >= 2) {
          state.recentSearches.unshift(action.meta.arg.query);
          if (state.recentSearches.length > 10) {
            state.recentSearches = state.recentSearches.slice(0, 10);
          }
          localStorage.setItem('makindexRecentSearches', JSON.stringify(state.recentSearches));
        }
      })
      .addCase(globalAra.rejected, (state, action) => {
        state.loading.search = false;
        state.error.search = action.payload;
      });

    // seedData
    builder
      .addCase(seedData.pending, (state) => {
        state.loading.seed = true;
        state.error.seed = null;
      })
      .addCase(seedData.fulfilled, (state) => {
        state.loading.seed = false;
      })
      .addCase(seedData.rejected, (state, action) => {
        state.loading.seed = false;
        state.error.seed = action.payload;
      })

    // createSinif
    .addCase(createSinif.pending, (state) => {
      state.loading.createSinif = true;
      state.error.createSinif = null;
    })
    .addCase(createSinif.fulfilled, (state, action) => {
      state.loading.createSinif = false;
      // Add new sinif to the list and clear cache
      state.siniflar.push(action.payload);
      state.cache.siniflar = null;
    })
    .addCase(createSinif.rejected, (state, action) => {
      state.loading.createSinif = false;
      state.error.createSinif = action.payload;
    })

    // updateSinif
    .addCase(updateSinif.pending, (state) => {
      state.loading.updateSinif = true;
      state.error.updateSinif = null;
    })
    .addCase(updateSinif.fulfilled, (state, action) => {
      state.loading.updateSinif = false;
      // Update sinif in the list and clear cache
      const index = state.siniflar.findIndex(s => s.id === action.payload.id);
      if (index !== -1) {
        state.siniflar[index] = action.payload;
      }
      state.cache.siniflar = null;
    })
    .addCase(updateSinif.rejected, (state, action) => {
      state.loading.updateSinif = false;
      state.error.updateSinif = action.payload;
    })

    // deleteSinif
    .addCase(deleteSinif.pending, (state) => {
      state.loading.deleteSinif = true;
      state.error.deleteSinif = null;
    })
    .addCase(deleteSinif.fulfilled, (state, action) => {
      state.loading.deleteSinif = false;
      // Remove sinif from the list and clear cache
      state.siniflar = state.siniflar.filter(s => s.id !== action.payload);
      state.cache.siniflar = null;
    })
    .addCase(deleteSinif.rejected, (state, action) => {
      state.loading.deleteSinif = false;
      state.error.deleteSinif = action.payload;
    })

    // getSinifById
    .addCase(getSinifById.pending, (state) => {
      state.loading.sinifDetail = true;
      state.error.sinifDetail = null;
    })
    .addCase(getSinifById.fulfilled, (state, action) => {
      state.loading.sinifDetail = false;
      // Store the detailed sinif data for editing
      // (could be stored in a separate state for selected sinif)
    })
    .addCase(getSinifById.rejected, (state, action) => {
      state.loading.sinifDetail = false;
      state.error.sinifDetail = action.payload;
    });
  },
});

export const {
  toggleNodeExpansion,
  expandNode,
  collapseNode,
  collapseAllNodes,
  selectNode,
  clearSelection,
  setSearchQuery,
  setSearchType,
  addRecentSearch,
  clearRecentSearches,
  setStokDurumuFilter,
  setMakinaSinifiFilter,
  clearFilters,
  restoreExpandedNodes,
  clearAllData,
  clearExpandedNodes,
  clearSearchResults,
  setViewMode,
  updateStok,
  updateParcaEklendi,
  updateGrupGuncellendi,
  clearCache,
  clearSiniflarCache,
  clearMakinalarCache,
  clearGruplarCache,
  clearParcalarCache,
  clearSearchCache,
  clearSinifError,
  setTestData,
  setLoading,
} = makindexSlice.actions;

export default makindexSlice.reducer;