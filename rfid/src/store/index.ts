import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import checkinReducer from './slices/checkinSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    checkin: checkinReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
