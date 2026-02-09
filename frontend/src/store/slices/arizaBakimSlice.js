import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Tüm arıza ve bakımları getir
export const fetchArizaBakimKayitlari = createAsyncThunk(
  'arizaBakim/fetchArizaBakimKayitlari',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const response = await axios.get('/api/ariza-bakim', { params: filters });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Tek bir arıza/bakım kaydını getir
export const fetchArizaBakimById = createAsyncThunk(
  'arizaBakim/fetchArizaBakimById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/api/ariza-bakim/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Yeni arıza/bakım kaydı oluştur
export const createArizaBakim = createAsyncThunk(
  'arizaBakim/createArizaBakim',
  async (kayitData, { rejectWithValue }) => {
    try {
      const response = await axios.post('/api/ariza-bakim', kayitData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Arıza/bakım kaydını güncelle
export const updateArizaBakim = createAsyncThunk(
  'arizaBakim/updateArizaBakim',
  async ({ id, kayitData }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`/api/ariza-bakim/${id}`, kayitData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Arıza/bakım kaydını sil
export const deleteArizaBakim = createAsyncThunk(
  'arizaBakim/deleteArizaBakim',
  async (id, { rejectWithValue }) => {
    try {
      await axios.delete(`/api/ariza-bakim/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// İstatistikleri getir
export const fetchArizaBakimIstatistikleri = createAsyncThunk(
  'arizaBakim/fetchArizaBakimIstatistikleri',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const response = await axios.get('/api/ariza-bakim/istatistikler', { params: filters });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const arizaBakimSlice = createSlice({
  name: 'arizaBakim',
  initialState: {
    kayitlar: [],
    currentKayit: null,
    istatistikler: null,
    loading: false,
    detailLoading: false,
    statisticsLoading: false,
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
      // Tüm kayıtları getir
      .addCase(fetchArizaBakimKayitlari.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchArizaBakimKayitlari.fulfilled, (state, action) => {
        state.loading = false;
        state.kayitlar = action.payload;
      })
      .addCase(fetchArizaBakimKayitlari.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Kayıtlar yüklenirken bir hata oluştu';
      })
      
      // Tek kayıt getir
      .addCase(fetchArizaBakimById.pending, (state) => {
        state.detailLoading = true;
        state.error = null;
      })
      .addCase(fetchArizaBakimById.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.currentKayit = action.payload;
      })
      .addCase(fetchArizaBakimById.rejected, (state, action) => {
        state.detailLoading = false;
        state.error = action.payload || 'Kayıt detayları yüklenirken bir hata oluştu';
      })
      
      // Yeni kayıt oluştur
      .addCase(createArizaBakim.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createArizaBakim.fulfilled, (state, action) => {
        state.loading = false;
        state.kayitlar.unshift(action.payload);
        state.success = 'Arıza/Bakım kaydı başarıyla oluşturuldu';
      })
      .addCase(createArizaBakim.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Kayıt oluşturulurken bir hata oluştu';
      })
      
      // Kayıt güncelle
      .addCase(updateArizaBakim.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateArizaBakim.fulfilled, (state, action) => {
        state.loading = false;
        state.kayitlar = state.kayitlar.map(kayit => 
          kayit.id === action.payload.id ? action.payload : kayit
        );
        state.currentKayit = action.payload;
        state.success = 'Arıza/Bakım kaydı başarıyla güncellendi';
      })
      .addCase(updateArizaBakim.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Kayıt güncellenirken bir hata oluştu';
      })
      
      // Kayıt sil
      .addCase(deleteArizaBakim.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteArizaBakim.fulfilled, (state, action) => {
        state.loading = false;
        state.kayitlar = state.kayitlar.filter(kayit => kayit.id !== action.payload);
        state.success = 'Arıza/Bakım kaydı başarıyla silindi';
      })
      .addCase(deleteArizaBakim.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Kayıt silinirken bir hata oluştu';
      })
      
      // İstatistikler
      .addCase(fetchArizaBakimIstatistikleri.pending, (state) => {
        state.statisticsLoading = true;
        state.error = null;
      })
      .addCase(fetchArizaBakimIstatistikleri.fulfilled, (state, action) => {
        state.statisticsLoading = false;
        state.istatistikler = action.payload;
      })
      .addCase(fetchArizaBakimIstatistikleri.rejected, (state, action) => {
        state.statisticsLoading = false;
        state.error = action.payload || 'İstatistikler yüklenirken bir hata oluştu';
      })
  }
});

export const { clearError, clearSuccess } = arizaBakimSlice.actions;
export default arizaBakimSlice.reducer;