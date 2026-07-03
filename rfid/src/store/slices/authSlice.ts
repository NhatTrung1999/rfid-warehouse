import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ApiError } from '../../lib/api-client';
import { authService } from '../../lib/auth-service';
import { StoredUser } from '../../lib/token-storage';

interface AuthState {
  user: StoredUser | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  isBootstrapping: boolean;
}

const initialState: AuthState = {
  user: null,
  status: 'idle',
  error: null,
  isBootstrapping: true,
};

export const bootstrapAuth = createAsyncThunk('auth/bootstrap', async () => {
  return authService.getCurrentUser();
});

export const login = createAsyncThunk(
  'auth/login',
  async (
    { username, password }: { username: string; password: string },
    { rejectWithValue },
  ) => {
    try {
      return await authService.login(username, password);
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : 'Không thể kết nối tới máy chủ';
      return rejectWithValue(message);
    }
  },
);

export const logout = createAsyncThunk('auth/logout', async () => {
  await authService.logout();
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // bootstrap
      .addCase(
        bootstrapAuth.fulfilled,
        (state, action: PayloadAction<StoredUser | null>) => {
          state.user = action.payload;
          state.isBootstrapping = false;
        },
      )
      .addCase(bootstrapAuth.rejected, (state) => {
        state.isBootstrapping = false;
      })
      // login
      .addCase(login.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action: PayloadAction<StoredUser>) => {
        state.status = 'succeeded';
        state.user = action.payload;
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'failed';
        state.error = (action.payload as string) ?? 'Đăng nhập thất bại';
      })
      // logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.status = 'idle';
      });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;
