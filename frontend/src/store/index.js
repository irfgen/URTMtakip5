import { configureStore } from '@reduxjs/toolkit';
import { enableMapSet } from 'immer';
import arizaBakimReducer from './slices/arizaBakimSlice';
import isEmirleriReducer from './slices/isEmirleriSlice'; // İş emirleri reducer'ı import edildi
import uretimPlaniReducer from './slices/uretimPlaniSlice'; // Üretim planı reducer'ı import edildi
import timelineReducer from './slices/timelineSlice'; // Timeline reducer'ı import edildi
import schedulerReducer from './slices/schedulerSlice'; // Yeni scheduler reducer'ı import edildi
import makindexReducer from './slices/makindexSlice'; // MAKINDEX reducer'ı import edildi
import uygunsuzluklarReducer from './slices/uygunsuzluklarSlice'; // Uygunsuzluklar reducer'ı import edildi
import personelReducer from './slices/personelSlice'; // Personel reducer'ı import edildi

// Immer MapSet plugin'ini etkinleştir
enableMapSet();

// Diğer reducer'lar buraya eklenecek
// tezgahReducer, parcaReducer, vb.

export const store = configureStore({
  reducer: {
    arizaBakim: arizaBakimReducer,
    isEmirleri: isEmirleriReducer,  // İş emirleri reducer'ı eklendi
    uretimPlani: uretimPlaniReducer, // Üretim planı reducer'ı eklendi
    timeline: timelineReducer, // Timeline reducer'ı eklendi
    scheduler: schedulerReducer, // Yeni scheduler reducer'ı eklendi
    makindex: makindexReducer, // MAKINDEX reducer'ı eklendi
    uygunsuzluklar: uygunsuzluklarReducer, // Uygunsuzluklar reducer'ı eklendi
    personel: personelReducer, // Personel reducer'ı eklendi
    // Diğer reducer'lar buraya eklenecek
  },
  middleware: (getDefaultMiddleware) => 
    getDefaultMiddleware({
      serializableCheck: false
    })
});

export default store;