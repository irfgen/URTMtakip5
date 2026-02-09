import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Üretim planlarını getir
export const fetchUretimPlanlari = createAsyncThunk(
  'uretimPlani/fetchUretimPlanlari',
  async (params = {}, { rejectWithValue }) => {
    try {
      let url = '/api/uretim-plani';
      if (params.ozel_liste_adi) {
        url += `?ozel_liste_adi=${encodeURIComponent(params.ozel_liste_adi)}`;
      }
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Tek bir üretim planını getir
export const fetchUretimPlaniById = createAsyncThunk(
  'uretimPlani/fetchUretimPlaniById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/api/uretim-plani/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Yeni üretim planı oluştur
export const createUretimPlani = createAsyncThunk(
  'uretimPlani/createUretimPlani',
  async (uretimPlaniData, { rejectWithValue }) => {
    try {
      const response = await axios.post('/api/uretim-plani', uretimPlaniData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Üretim planını güncelle
export const updateUretimPlani = createAsyncThunk(
  'uretimPlani/updateUretimPlani',
  async ({ id, uretimPlaniData }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`/api/uretim-plani/${id}`, uretimPlaniData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Üretim planını sil
export const deleteUretimPlani = createAsyncThunk(
  'uretimPlani/deleteUretimPlani',
  async (id, { rejectWithValue }) => {
    try {
      await axios.delete(`/api/uretim-plani/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Kritik stok için iş emri oluştur
export const kritikStokIsEmriOlustur = createAsyncThunk(
  'uretimPlani/kritikStokIsEmriOlustur',
  async (parcaBilgisi, { rejectWithValue }) => {
    try {
      const response = await axios.post('/api/uretim-plani/kritik-stok/is-emri', parcaBilgisi);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// BOM Analizi yap
export const bomAnaliziYap = createAsyncThunk(
  'uretimPlani/bomAnaliziYap',
  async ({ makina_id, miktar }, { rejectWithValue }) => {
    try {
      const response = await axios.post('/api/uretim-plani/bom-analizi', {
        makina_id,
        miktar
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const uretimPlaniSlice = createSlice({
  name: 'uretimPlani',
  initialState: {
    uretimPlanlari: [],
    currentUretimPlani: null,
    parcaListesi: [],
    kritikStokParcalari: [],
    bomAnalysisData: null,
    bomAnalysisLoading: false,
    loading: false,
    detailLoading: false,
    error: null,
    success: null
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.success = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Üretim planlarını getir
      .addCase(fetchUretimPlanlari.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUretimPlanlari.fulfilled, (state, action) => {
        state.loading = false;
        state.uretimPlanlari = action.payload;
      })
      .addCase(fetchUretimPlanlari.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Üretim planları getirilirken bir hata oluştu';
      })
      
      // Tek bir üretim planını getir
      .addCase(fetchUretimPlaniById.pending, (state) => {
        state.detailLoading = true;
        state.error = null;
      })
      .addCase(fetchUretimPlaniById.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.currentUretimPlani = action.payload;
        state.parcaListesi = action.payload.bom_snapshot || [];
        state.kritikStokParcalari = action.payload.kritik_stok_uyarisi || [];
      })
      .addCase(fetchUretimPlaniById.rejected, (state, action) => {
        state.detailLoading = false;
        state.error = action.payload || 'Üretim planı getirilirken bir hata oluştu';
      })
      
      // Yeni üretim planı oluştur
      .addCase(createUretimPlani.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createUretimPlani.fulfilled, (state, action) => {
        state.loading = false;
        state.uretimPlanlari.push(action.payload.uretimPlani);
        state.currentUretimPlani = action.payload.uretimPlani;
        // Parça listelerini açık bir şekilde dışarıdan gelen veriden alıyoruz
        state.parcaListesi = action.payload.parcaListesi || 
                           action.payload.uretimPlani.bom_snapshot || [];
        state.kritikStokParcalari = action.payload.kritikStokParcalari || 
                                   action.payload.uretimPlani.kritik_stok_uyarisi || [];
        state.success = 'Üretim planı başarıyla oluşturuldu';
      })
      .addCase(createUretimPlani.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Üretim planı oluşturulurken bir hata oluştu';
      })
      
      // Üretim planını güncelle
      .addCase(updateUretimPlani.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUretimPlani.fulfilled, (state, action) => {
        state.loading = false;
        state.uretimPlanlari = state.uretimPlanlari.map(plan => 
          plan.id === action.payload.uretimPlani.id ? action.payload.uretimPlani : plan
        );
        state.currentUretimPlani = action.payload.uretimPlani;
        state.success = 'Üretim planı başarıyla güncellendi';
      })
      .addCase(updateUretimPlani.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Üretim planı güncellenirken bir hata oluştu';
      })
      
      // Üretim planını sil
      .addCase(deleteUretimPlani.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteUretimPlani.fulfilled, (state, action) => {
        state.loading = false;
        state.uretimPlanlari = state.uretimPlanlari.filter(plan => plan.id !== action.payload);
        state.currentUretimPlani = null;
        state.success = 'Üretim planı başarıyla silindi';
      })
      .addCase(deleteUretimPlani.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Üretim planı silinirken bir hata oluştu';
      })
      
      // Kritik stok için iş emri oluştur
      .addCase(kritikStokIsEmriOlustur.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(kritikStokIsEmriOlustur.fulfilled, (state, action) => {
        state.loading = false;
        state.success = 'Parça için iş emri başarıyla oluşturuldu';
      })
      .addCase(kritikStokIsEmriOlustur.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'İş emri oluşturulurken bir hata oluştu';
      })
      
      // BOM Analizi yap
      .addCase(bomAnaliziYap.pending, (state) => {
        state.bomAnalysisLoading = true;
        state.error = null;
      })
      .addCase(bomAnaliziYap.fulfilled, (state, action) => {
        state.bomAnalysisLoading = false;
        state.bomAnalysisData = action.payload;
        state.parcaListesi = action.payload.parcaListesi || [];
        state.kritikStokParcalari = action.payload.kritikStokParcalari || [];
        state.success = 'BOM analizi başarıyla yapıldı';
      })
      .addCase(bomAnaliziYap.rejected, (state, action) => {
        state.bomAnalysisLoading = false;
        state.error = action.payload || 'BOM analizi yapılırken bir hata oluştu';
      });
  }
});

export const { clearError, clearSuccess } = uretimPlaniSlice.actions;
export default uretimPlaniSlice.reducer;