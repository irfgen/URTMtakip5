import { configureStore } from '@reduxjs/toolkit';
import makindexSlice from './slices/makindexSlice';
import uygunsuzluklarSlice from './slices/uygunsuzluklarSlice';
import personelReducer from './slices/personelSlice';

export const store = configureStore({
  reducer: {
    makindex: makindexSlice,
    uygunsuzluklar: uygunsuzluklarSlice,
    personel: personelReducer,
    // Diğer slice'lar buraya eklenebilir
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export default store;