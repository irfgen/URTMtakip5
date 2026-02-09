import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Tüm personeli getir
export const fetchPersonel = createAsyncThunk(
  'personel/fetchPersonel',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await axios.get('/api/personel', { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Tek personel getir
export const fetchPersonelById = createAsyncThunk(
  'personel/fetchPersonelById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/api/personel/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const personelSlice = createSlice({
  name: 'personel',
  initialState: {
    personelListesi: [],
    seciliPersonel: null,
    loading: false,
    error: null
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSeciliPersonel: (state) => {
      state.seciliPersonel = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Tüm personeli getir
      .addCase(fetchPersonel.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPersonel.fulfilled, (state, action) => {
        state.loading = false;
        state.personelListesi = action.payload;
      })
      .addCase(fetchPersonel.rejected, (state, action) => {
        state.loading = false;
        state.error = typeof action.payload === 'string'
          ? action.payload
          : action.payload?.error || action.payload?.message || 'Personel listesi yüklenirken bir hata oluştu';
      })

      // Tek personel getir
      .addCase(fetchPersonelById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPersonelById.fulfilled, (state, action) => {
        state.loading = false;
        state.seciliPersonel = action.payload;
      })
      .addCase(fetchPersonelById.rejected, (state, action) => {
        state.loading = false;
        state.error = typeof action.payload === 'string'
          ? action.payload
          : action.payload?.error || action.payload?.message || 'Personel bilgileri yüklenirken bir hata oluştu';
      });
  }
});

export const { clearError, clearSeciliPersonel } = personelSlice.actions;

export default personelSlice.reducer;
