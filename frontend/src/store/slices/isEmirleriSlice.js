import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { isEmirleriAPI } from '../../services/api';

// Async Thunks
export const fetchIsEmirleri = createAsyncThunk(
  'isEmirleri/fetchAll',
  async (params = {}, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams();
     if (params.excludeAssigned) {
       queryParams.append('excludeAssigned', 'true');
     }
     // `showAssigned` parametresini yönet
     if (params.showAssigned) {
       queryParams.append('showAssigned', 'true');
     }
     // `showCompleted` parametresini yönet
     if (params.showCompleted) {
       queryParams.append('showCompleted', 'true');
     } else {
       // Varsayılan olarak tamamlananları gösterme (false durumu)
       queryParams.append('showCompleted', 'false');
     }
      if (params.durum) {
        queryParams.append('durum', params.durum);
      }
      if (params.excludeDurum) {
        queryParams.append('excludeDurum', params.excludeDurum);
      }
      
      const url = queryParams.toString() ? `?${queryParams.toString()}` : '';
      const response = await isEmirleriAPI.getAll(url);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Veri yüklenirken bir hata oluştu');
    }
  }
);

export const createIsEmri = createAsyncThunk(
  'isEmirleri/create',
  async (isEmri, { rejectWithValue }) => {
    try {
      const response = await isEmirleriAPI.create(isEmri);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'İş emri oluşturulurken bir hata oluştu');
    }
  }
);

export const updateIsEmri = createAsyncThunk(
  'isEmirleri/update',
  async ({ id, isEmri }, { rejectWithValue }) => {
    try {
      const response = await isEmirleriAPI.update(id, isEmri);
      
      // Eğer fason dialog gerekiyorsa, özel response döndür
      if (response.status === 202 && response.data.requiresFasonDialog) {
        return {
          requiresFasonDialog: true,
          isEmri: response.data.isEmri,
          message: response.data.message
        };
      }
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'İş emri güncellenirken bir hata oluştu');
    }
  }
);

// Fason dönüşümü onaylama
export const confirmFasonConversion = createAsyncThunk(
  'isEmirleri/confirmFasonConversion',
  async ({ id, fasonData, confirm }, { rejectWithValue }) => {
    try {
      const response = await isEmirleriAPI.confirmFasonConversion(id, { fasonData, confirm });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Fason dönüşümü sırasında bir hata oluştu');
    }
  }
);

export const deleteIsEmri = createAsyncThunk(
  'isEmirleri/delete',
  async (id, { rejectWithValue }) => {
    try {
      await isEmirleriAPI.delete(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'İş emri silinirken bir hata oluştu');
    }
  }
);

export const updateIsEmriStatus = createAsyncThunk(
  'isEmirleri/updateStatus',
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const response = await isEmirleriAPI.update(id, { durum: status });
      
      // Eğer fason dialog gerekiyorsa, özel response döndür
      if (response.status === 202 && response.data.requiresFasonDialog) {
        return {
          requiresFasonDialog: true,
          isEmri: response.data.isEmri,
          message: response.data.message
        };
      }
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'İş emri durumu güncellenirken bir hata oluştu');
    }
  }
);

const initialState = {
  isEmirleri: {},
  loading: false,
  error: null
};

const isEmirleriSlice = createSlice({
  name: 'isEmirleri',
  initialState,
  reducers: {
    setIsEmirleri: (state, action) => {
      state.isEmirleri = action.payload;
    },
    addIsEmri: (state, action) => {
      const yeniIsEmri = action.payload;
      const durum = yeniIsEmri.durum;
      if (state.isEmirleri[durum]) {
        state.isEmirleri[durum].push(yeniIsEmri);
      }
    },
    updateIsEmriInState: (state, action) => {
      const { id, guncelIsEmri } = action.payload;
      // Eski durumu bul ve çıkar
      for (const kolon in state.isEmirleri) {
        const index = state.isEmirleri[kolon].findIndex(
          isEmri => isEmri.is_emri_id === id
        );
        if (index !== -1) {
          state.isEmirleri[kolon][index] = {
            ...state.isEmirleri[kolon][index],
            ...guncelIsEmri
          };
          break;
        }
      }
    },
    deleteIsEmriFromState: (state, action) => {
      const id = action.payload;
      for (const kolon in state.isEmirleri) {
        state.isEmirleri[kolon] = state.isEmirleri[kolon].filter(
          isEmri => isEmri.is_emri_id !== id
        );
      }
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    moveIsEmri: (state, action) => {
      const { sourceKolon, destKolon, yeniKaynakKolonIsEmirleri, yeniHedefKolonIsEmirleri } = action.payload;
      // Kaynak ve hedef kolonları güncelle
      state.isEmirleri[sourceKolon] = yeniKaynakKolonIsEmirleri;
      state.isEmirleri[destKolon] = yeniHedefKolonIsEmirleri;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch İş Emirleri
      .addCase(fetchIsEmirleri.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchIsEmirleri.fulfilled, (state, action) => {
        state.loading = false;
        
        // Backend'den gelen veri zaten gruplandırılmış obje formatında
        // Dinamik durumları destekle - tüm gelen durumları olduğu gibi kullan
        const gruplandirilimsIsEmirleri = action.payload;
        
        state.isEmirleri = gruplandirilimsIsEmirleri;
        state.error = null;
      })
      .addCase(fetchIsEmirleri.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
        console.error('İş emirleri yüklenirken hata:', action.payload);
      })
      // Create İş Emri
      .addCase(createIsEmri.fulfilled, (state, action) => {
        const yeniIsEmri = action.payload;
        const durum = yeniIsEmri.durum;
        if (state.isEmirleri[durum]) {
          state.isEmirleri[durum].push(yeniIsEmri);
        }
      })
      // Update İş Emri
      .addCase(updateIsEmri.fulfilled, (state, action) => {
        const guncelIsEmri = action.payload;
        // Eski durumu bul ve çıkar, yeni duruma ekle
        for (const kolon in state.isEmirleri) {
          const index = state.isEmirleri[kolon].findIndex(
            isEmri => isEmri.is_emri_id === guncelIsEmri.is_emri_id
          );
          if (index !== -1) {
            state.isEmirleri[kolon].splice(index, 1);
            break;
          }
        }
        // Yeni durumuna ekle
        if (state.isEmirleri[guncelIsEmri.durum]) {
          state.isEmirleri[guncelIsEmri.durum].push(guncelIsEmri);
        }
      })
      // Delete İş Emri
      .addCase(deleteIsEmri.fulfilled, (state, action) => {
        const silinecekId = action.payload;
        for (const kolon in state.isEmirleri) {
          state.isEmirleri[kolon] = state.isEmirleri[kolon].filter(
            isEmri => isEmri.is_emri_id !== silinecekId
          );
        }
      })
      // Update İş Emri Status
      .addCase(updateIsEmriStatus.fulfilled, (state, action) => {
        const guncelIsEmri = action.payload;
        // Eski durumu bul ve çıkar, yeni duruma ekle
        for (const kolon in state.isEmirleri) {
          const index = state.isEmirleri[kolon].findIndex(
            isEmri => isEmri.is_emri_id === guncelIsEmri.is_emri_id
          );
          if (index !== -1) {
            state.isEmirleri[kolon].splice(index, 1);
            break;
          }
        }
        // Yeni durumuna ekle
        if (state.isEmirleri[guncelIsEmri.durum]) {
          state.isEmirleri[guncelIsEmri.durum].push(guncelIsEmri);
        }
      });
  }
});

export const {
  setIsEmirleri,
  addIsEmri,
  updateIsEmriInState,
  deleteIsEmriFromState,
  setLoading,
  setError,
  moveIsEmri
} = isEmirleriSlice.actions;


export default isEmirleriSlice.reducer;