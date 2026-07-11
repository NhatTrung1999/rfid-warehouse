import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  destroyScanService,
  DestroyScanData,
  DestroyScanFilters,
  DestroyScanOverview,
} from '../../lib/destroy-scan-service';

interface DestroyScanState {
  rows: DestroyScanData[];
  overview: DestroyScanOverview;
  loadingRows: boolean;
  loadingMore: boolean;
  loadingPage: number | null;
  loadingOverview: boolean;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  error: string | null;
}

const initialState: DestroyScanState = {
  rows: [],
  overview: { ScannedCount: 0, NotScannedCount: 0, Total: 0 },
  loadingRows: false,
  loadingMore: false,
  loadingPage: null,
  loadingOverview: false,
  total: 0,
  page: 1,
  pageSize: 50,
  totalPages: 0,
  error: null,
};

export const fetchDestroyScanOverview = createAsyncThunk(
  'destroyScan/fetchOverview',
  async (locationId: string) => destroyScanService.getOverview(locationId),
);

export const fetchDestroyScanData = createAsyncThunk(
  'destroyScan/fetchData',
  async (filters: DestroyScanFilters) => destroyScanService.getData(filters),
);

const destroyScanSlice = createSlice({
  name: 'destroyScan',
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDestroyScanOverview.pending, (state) => {
        state.loadingOverview = true;
        state.error = null;
      })
      .addCase(
        fetchDestroyScanOverview.fulfilled,
        (state, action: PayloadAction<DestroyScanOverview>) => {
          state.overview = action.payload;
          state.loadingOverview = false;
        },
      )
      .addCase(fetchDestroyScanOverview.rejected, (state, action) => {
        state.loadingOverview = false;
        state.error = action.error.message ?? 'Cannot load destroy scan overview';
      });

    builder
      .addCase(fetchDestroyScanData.pending, (state, action) => {
        const requestedPage = action.meta.arg.page ?? 1;
        state.loadingPage = requestedPage;
        if (requestedPage > 1) {
          state.loadingMore = true;
        } else {
          state.loadingRows = true;
          state.rows = [];
          state.total = 0;
          state.page = 1;
          state.totalPages = 0;
        }
        state.error = null;
      })
      .addCase(fetchDestroyScanData.fulfilled, (state, action) => {
        const requestedPage = action.meta.arg.page ?? 1;
        if (requestedPage > 1) {
          const existingKeys = new Set(
            state.rows.map(
              (row) =>
                `${row.EPC ?? ''}|${row.BatchNo ?? ''}|${row.STT ?? ''}|${row.SerialNo ?? ''}|${row.CartonNumber ?? ''}`,
            ),
          );
          const nextRows = action.payload.data.filter((row) => {
            const key = `${row.EPC ?? ''}|${row.BatchNo ?? ''}|${row.STT ?? ''}|${row.SerialNo ?? ''}|${row.CartonNumber ?? ''}`;
            if (existingKeys.has(key)) return false;
            existingKeys.add(key);
            return true;
          });
          state.rows = [...state.rows, ...nextRows].slice(0, action.payload.total);
        } else {
          state.rows = action.payload.data;
        }
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.pageSize = action.payload.pageSize;
        state.totalPages = action.payload.totalPages;
        state.loadingRows = false;
        state.loadingMore = false;
        state.loadingPage = null;
      })
      .addCase(fetchDestroyScanData.rejected, (state, action) => {
        state.loadingRows = false;
        state.loadingMore = false;
        state.loadingPage = null;
        if ((action.meta.arg.page ?? 1) <= 1) {
          state.rows = [];
          state.total = 0;
          state.page = 1;
          state.totalPages = 0;
        }
        state.error = action.error.message ?? 'Cannot load destroy scan data';
      });
  },
});

export const { clearError } = destroyScanSlice.actions;
export default destroyScanSlice.reducer;
