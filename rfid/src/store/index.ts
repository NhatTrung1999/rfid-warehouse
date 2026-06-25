import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import checkinReducer from './slices/checkinSlice';
import checkoutReducer from './slices/checkoutSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    checkin: checkinReducer,
    checkout: checkoutReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
