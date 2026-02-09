import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Tüm uygunsuzluk raporlarını getir
export const fetchUygunsuzluklar = createAsyncThunk(
  'uygunsuzluklar/fetchUygunsuzluklar',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const response = await axios.get('/api/uygunsuzluklar', { params: filters });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Tek bir rapor getir
export const fetchUygunsuzlukById = createAsyncThunk(
  'uygunsuzluklar/fetchUygunsuzlukById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/api/uygunsuzluklar/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Yeni rapor oluştur
export const createUygunsuzluk = createAsyncThunk(
  'uygunsuzluklar/createUygunsuzluk',
  async (raporData, { rejectWithValue }) => {
    try {
      // FormData için multipart/form-data header'ı gerekli
      const isFormData = raporData instanceof FormData;
      const config = isFormData
        ? { headers: { 'Content-Type': 'multipart/form-data' } }
        : {};

      const response = await axios.post('/api/uygunsuzluklar', raporData, config);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Rapor güncelle
export const updateUygunsuzluk = createAsyncThunk(
  'uygunsuzluklar/updateUygunsuzluk',
  async ({ id, raporData }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`/api/uygunsuzluklar/${id}`, raporData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Rapor sil (soft delete)
export const deleteUygunsuzluk = createAsyncThunk(
  'uygunsuzluklar/deleteUygunsuzluk',
  async (id, { rejectWithValue }) => {
    try {
      await axios.delete(`/api/uygunsuzluklar/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Sorumlu atama
export const atamaSorumlu = createAsyncThunk(
  'uygunsuzluklar/atamaSorumlu',
  async ({ id, sorumluId, hedefTarih }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`/api/uygunsuzluklar/${id}/atama`, {
        sorumlu_id: sorumluId,
        hedef_tarih: hedefTarih
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Durum güncelle
export const guncelleDurum = createAsyncThunk(
  'uygunsuzluklar/guncelleDurum',
  async ({ id, durum, not }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`/api/uygunsuzluklar/${id}/durum`, {
        durum,
        not
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Not ekle
export const notEkle = createAsyncThunk(
  'uygunsuzluklar/notEkle',
  async ({ id, not }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`/api/uygunsuzluklar/${id}/not`, { not });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Tedbir ekle
export const tedbirEkle = createAsyncThunk(
  'uygunsuzluklar/tedbirEkle',
  async ({ id, tedbirData }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`/api/uygunsuzluklar/${id}/tedbir`, tedbirData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Çoklu dosya yükle
export const dosyaYukle = createAsyncThunk(
  'uygunsuzluklar/dosyaYukle',
  async ({ id, files }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });
      const response = await axios.post(`/api/uygunsuzluklar/${id}/dosya`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return { rapor_id: id, dosyalar: response.data.dosyalar };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Dosya sil
export const dosyaSil = createAsyncThunk(
  'uygunsuzluklar/dosyaSil',
  async (dosyaId, { rejectWithValue }) => {
    try {
      await axios.delete(`/api/uygunsuzluklar/dosya/${dosyaId}`);
      return dosyaId;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Raporu kapat
export const kapatRapor = createAsyncThunk(
  'uygunsuzluklar/kapatRapor',
  async ({ id, maliyet, etkinlikPuan }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`/api/uygunsuzluklar/${id}/kapat`, {
        maliyet,
        etkinlik_puani: etkinlikPuan
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// İstatistikleri getir
export const fetchUygunsuzlukIstatistikleri = createAsyncThunk(
  'uygunsuzluklar/fetchUygunsuzlukIstatistikleri',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const response = await axios.get('/api/uygunsuzluklar/istatistik/ozet', { params: filters });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Personel bazlı raporlar
export const fetchPersonelRaporlari = createAsyncThunk(
  'uygunsuzluklar/fetchPersonelRaporlari',
  async (personelId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/api/uygunsuzluklar/personel/${personelId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Çözüm adımı ekle
export const cozumAdimEkle = createAsyncThunk(
  'uygunsuzluklar/cozumAdimEkle',
  async ({ id, adim }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`/api/uygunsuzluklar/${id}/cozum-adim`, { adim });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Çözüm adımını tamamlandı işaretle
export const cozumAdimTamamla = createAsyncThunk(
  'uygunsuzluklar/cozumAdimTamamla',
  async ({ id, adimIndex }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`/api/uygunsuzluklar/${id}/cozum-adim/${adimIndex}/tamamla`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Raporu onayla
export const onayVer = createAsyncThunk(
  'uygunsuzluklar/onayVer',
  async ({ id, onayNotu }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`/api/uygunsuzluklar/${id}/onay`, { onay_notu: onayNotu });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const uygunsuzluklarSlice = createSlice({
  name: 'uygunsuzluklar',
  initialState: {
    raporlar: [],
    currentRapor: null,
    istatistikler: null,
    personelRaporlari: [],
    filtreler: {
      durum: 'tumu',
      kategori: 'tumu',
      oncelik: 'tumu',
      sorumluId: null,
      tarihAraligi: null
    },
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
    },
    setFiltreler: (state, action) => {
      state.filtreler = { ...state.filtreler, ...action.payload };
    },
    clearFiltreler: (state) => {
      state.filtreler = {
        durum: 'tumu',
        kategori: 'tumu',
        oncelik: 'tumu',
        sorumluId: null,
        tarihAraligi: null
      };
    },
    clearCurrentRapor: (state) => {
      state.currentRapor = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Tüm raporları getir
      .addCase(fetchUygunsuzluklar.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUygunsuzluklar.fulfilled, (state, action) => {
        state.loading = false;
        state.raporlar = action.payload;
      })
      .addCase(fetchUygunsuzluklar.rejected, (state, action) => {
        state.loading = false;
        state.error = typeof action.payload === 'string'
          ? action.payload
          : action.payload?.error || action.payload?.message || 'Raporlar yüklenirken bir hata oluştu';
      })

      // Tek rapor getir
      .addCase(fetchUygunsuzlukById.pending, (state) => {
        state.detailLoading = true;
        state.error = null;
      })
      .addCase(fetchUygunsuzlukById.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.currentRapor = action.payload;
      })
      .addCase(fetchUygunsuzlukById.rejected, (state, action) => {
        state.detailLoading = false;
        state.error = typeof action.payload === 'string'
          ? action.payload
          : action.payload?.error || action.payload?.message || 'Rapor detayları yüklenirken bir hata oluştu';
      })

      // Yeni rapor oluştur
      .addCase(createUygunsuzluk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createUygunsuzluk.fulfilled, (state, action) => {
        state.loading = false;
        state.raporlar.unshift(action.payload);
        state.success = 'Uygunsuzluk raporu başarıyla oluşturuldu';
      })
      .addCase(createUygunsuzluk.rejected, (state, action) => {
        state.loading = false;
        state.error = typeof action.payload === 'string'
          ? action.payload
          : action.payload?.error || action.payload?.message || 'Rapor oluşturulurken bir hata oluştu';
      })

      // Rapor güncelle
      .addCase(updateUygunsuzluk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUygunsuzluk.fulfilled, (state, action) => {
        state.loading = false;
        state.raporlar = state.raporlar.map(rapor =>
          rapor.id === action.payload.id ? action.payload : rapor
        );
        if (state.currentRapor?.id === action.payload.id) {
          state.currentRapor = action.payload;
        }
        state.success = 'Rapor başarıyla güncellendi';
      })
      .addCase(updateUygunsuzluk.rejected, (state, action) => {
        state.loading = false;
        state.error = typeof action.payload === 'string'
          ? action.payload
          : action.payload?.error || action.payload?.message || 'Rapor güncellenirken bir hata oluştu';
      })

      // Rapor sil
      .addCase(deleteUygunsuzluk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteUygunsuzluk.fulfilled, (state, action) => {
        state.loading = false;
        state.raporlar = state.raporlar.filter(rapor => rapor.id !== action.payload);
        if (state.currentRapor?.id === action.payload) {
          state.currentRapor = null;
        }
        state.success = 'Rapor başarıyla silindi';
      })
      .addCase(deleteUygunsuzluk.rejected, (state, action) => {
        state.loading = false;
        state.error = typeof action.payload === 'string'
          ? action.payload
          : action.payload?.error || action.payload?.message || 'Rapor silinirken bir hata oluştu';
      })

      // Sorumlu atama
      .addCase(atamaSorumlu.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(atamaSorumlu.fulfilled, (state, action) => {
        state.loading = false;
        state.raporlar = state.raporlar.map(rapor =>
          rapor.id === action.payload.id ? action.payload : rapor
        );
        if (state.currentRapor?.id === action.payload.id) {
          state.currentRapor = action.payload;
        }
        state.success = 'Sorumlu başarıyla atandı';
      })
      .addCase(atamaSorumlu.rejected, (state, action) => {
        state.loading = false;
        state.error = typeof action.payload === 'string'
          ? action.payload
          : action.payload?.error || action.payload?.message || 'Sorumlu atanırken bir hata oluştu';
      })

      // Durum güncelle
      .addCase(guncelleDurum.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(guncelleDurum.fulfilled, (state, action) => {
        state.loading = false;
        state.raporlar = state.raporlar.map(rapor =>
          rapor.id === action.payload.id ? action.payload : rapor
        );
        if (state.currentRapor?.id === action.payload.id) {
          state.currentRapor = action.payload;
        }
        state.success = 'Durum başarıyla güncellendi';
      })
      .addCase(guncelleDurum.rejected, (state, action) => {
        state.loading = false;
        state.error = typeof action.payload === 'string'
          ? action.payload
          : action.payload?.error || action.payload?.message || 'Durum güncellenirken bir hata oluştu';
      })

      // Not ekle
      .addCase(notEkle.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(notEkle.fulfilled, (state, action) => {
        state.loading = false;
        if (state.currentRapor?.id === action.payload.rapor_id) {
          if (!state.currentRapor.notlar) {
            state.currentRapor.notlar = [];
          }
          state.currentRapor.notlar.push(action.payload);
        }
        state.success = 'Not başarıyla eklendi';
      })
      .addCase(notEkle.rejected, (state, action) => {
        state.loading = false;
        state.error = typeof action.payload === 'string'
          ? action.payload
          : action.payload?.error || action.payload?.message || 'Not eklenirken bir hata oluştu';
      })

      // Tedbir ekle
      .addCase(tedbirEkle.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(tedbirEkle.fulfilled, (state, action) => {
        state.loading = false;
        if (state.currentRapor?.id === action.payload.rapor_id) {
          if (!state.currentRapor.tedbirler) {
            state.currentRapor.tedbirler = [];
          }
          state.currentRapor.tedbirler.push(action.payload);
        }
        state.success = 'Tedbir başarıyla eklendi';
      })
      .addCase(tedbirEkle.rejected, (state, action) => {
        state.loading = false;
        state.error = typeof action.payload === 'string'
          ? action.payload
          : action.payload?.error || action.payload?.message || 'Tedbir eklenirken bir hata oluştu';
      })

      // Çoklu dosya yükle
      .addCase(dosyaYukle.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(dosyaYukle.fulfilled, (state, action) => {
        state.loading = false;
        const { rapor_id, dosyalar } = action.payload;
        if (state.currentRapor?.id === rapor_id) {
          if (!state.currentRapor.dosyalar) {
            state.currentRapor.dosyalar = [];
          }
          state.currentRapor.dosyalar.push(...dosyalar);
        }
        // Rapor listesindeki resim_yollar'ı güncelle
        state.raporlar = state.raporlar.map(rapor => {
          if (rapor.id === rapor_id) {
            const yeniResimler = dosyalar
              .filter(d => d.dosya_tipi === 'resim')
              .map(d => d.dosya_yolu);
            return {
              ...rapor,
              resim_yollar: [...(rapor.resim_yollar || []), ...yeniResimler]
            };
          }
          return rapor;
        });
        state.success = `${dosyalar.length} dosya başarıyla yüklendi`;
      })
      .addCase(dosyaYukle.rejected, (state, action) => {
        state.loading = false;
        state.error = typeof action.payload === 'string'
          ? action.payload
          : action.payload?.error || action.payload?.message || 'Dosyalar yüklenirken bir hata oluştu';
      })

      // Dosya sil
      .addCase(dosyaSil.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(dosyaSil.fulfilled, (state, action) => {
        state.loading = false;
        const dosyaId = action.payload;
        if (state.currentRapor?.dosyalar) {
          state.currentRapor.dosyalar = state.currentRapor.dosyalar.filter(d => d.id !== dosyaId);
        }
        // Rapor listesinden de sil
        state.raporlar.forEach(rapor => {
          if (rapor.dosyalar) {
            rapor.dosyalar = rapor.dosyalar.filter(d => d.id !== dosyaId);
          }
        });
        state.success = 'Dosya başarıyla silindi';
      })
      .addCase(dosyaSil.rejected, (state, action) => {
        state.loading = false;
        state.error = typeof action.payload === 'string'
          ? action.payload
          : action.payload?.error || action.payload?.message || 'Dosya silinirken bir hata oluştu';
      })

      // Raporu kapat
      .addCase(kapatRapor.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(kapatRapor.fulfilled, (state, action) => {
        state.loading = false;
        state.raporlar = state.raporlar.map(rapor =>
          rapor.id === action.payload.id ? action.payload : rapor
        );
        if (state.currentRapor?.id === action.payload.id) {
          state.currentRapor = action.payload;
        }
        state.success = 'Rapor başarıyla kapatıldı';
      })
      .addCase(kapatRapor.rejected, (state, action) => {
        state.loading = false;
        state.error = typeof action.payload === 'string'
          ? action.payload
          : action.payload?.error || action.payload?.message || 'Rapor kapatılırken bir hata oluştu';
      })

      // İstatistikler
      .addCase(fetchUygunsuzlukIstatistikleri.pending, (state) => {
        state.statisticsLoading = true;
        state.error = null;
      })
      .addCase(fetchUygunsuzlukIstatistikleri.fulfilled, (state, action) => {
        state.statisticsLoading = false;
        state.istatistikler = action.payload;
      })
      .addCase(fetchUygunsuzlukIstatistikleri.rejected, (state, action) => {
        state.statisticsLoading = false;
        state.error = typeof action.payload === 'string'
          ? action.payload
          : action.payload?.error || action.payload?.message || 'İstatistikler yüklenirken bir hata oluştu';
      })

      // Personel raporları
      .addCase(fetchPersonelRaporlari.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPersonelRaporlari.fulfilled, (state, action) => {
        state.loading = false;
        state.personelRaporlari = action.payload;
      })
      .addCase(fetchPersonelRaporlari.rejected, (state, action) => {
        state.loading = false;
        state.error = typeof action.payload === 'string'
          ? action.payload
          : action.payload?.error || action.payload?.message || 'Personel raporları yüklenirken bir hata oluştu';
      })

      // Çözüm adımı ekle
      .addCase(cozumAdimEkle.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(cozumAdimEkle.fulfilled, (state, action) => {
        state.loading = false;
        state.raporlar = state.raporlar.map(rapor =>
          rapor.id === action.payload.id ? action.payload : rapor
        );
        if (state.currentRapor?.id === action.payload.id) {
          state.currentRapor = action.payload;
        }
        state.success = 'Çözüm adımı başarıyla eklendi';
      })
      .addCase(cozumAdimEkle.rejected, (state, action) => {
        state.loading = false;
        state.error = typeof action.payload === 'string'
          ? action.payload
          : action.payload?.error || action.payload?.message || 'Çözüm adımı eklenirken bir hata oluştu';
      })

      // Çözüm adımını tamamlandı işaretle
      .addCase(cozumAdimTamamla.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(cozumAdimTamamla.fulfilled, (state, action) => {
        state.loading = false;
        state.raporlar = state.raporlar.map(rapor =>
          rapor.id === action.payload.id ? action.payload : rapor
        );
        if (state.currentRapor?.id === action.payload.id) {
          state.currentRapor = action.payload;
        }
        state.success = 'Çözüm adımı tamamlandı';
      })
      .addCase(cozumAdimTamamla.rejected, (state, action) => {
        state.loading = false;
        state.error = typeof action.payload === 'string'
          ? action.payload
          : action.payload?.error || action.payload?.message || 'Çözüm adımı tamamlanırken bir hata oluştu';
      })

      // Raporu onayla
      .addCase(onayVer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(onayVer.fulfilled, (state, action) => {
        state.loading = false;
        state.raporlar = state.raporlar.map(rapor =>
          rapor.id === action.payload.id ? action.payload : rapor
        );
        if (state.currentRapor?.id === action.payload.id) {
          state.currentRapor = action.payload;
        }
        state.success = 'Rapor başarıyla onaylandı ve tamamlandı';
      })
      .addCase(onayVer.rejected, (state, action) => {
        state.loading = false;
        state.error = typeof action.payload === 'string'
          ? action.payload
          : action.payload?.error || action.payload?.message || 'Rapor onaylanırken bir hata oluştu';
      });
  }
});

export const {
  clearError,
  clearSuccess,
  setFiltreler,
  clearFiltreler,
  clearCurrentRapor
} = uygunsuzluklarSlice.actions;

export default uygunsuzluklarSlice.reducer;
