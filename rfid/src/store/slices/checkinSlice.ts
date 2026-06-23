import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  checkinService,
  DeliveryData,
  ScanData,
  ShelfOption,
} from '../../lib/checkin-service';

// ─── STATE ────────────────────────────────────────────────────

interface CheckinState {
  shelves: ShelfOption[];
  loadingShelves: boolean;

  cartons: ShelfOption[];
  loadingCartons: boolean;

  deliveries: DeliveryData[];
  loadingDeliveries: boolean;

  tags: ScanData[];
  loadingTags: boolean;

  error: string | null;
}

const initialState: CheckinState = {
  shelves: [],
  loadingShelves: false,

  cartons: [],
  loadingCartons: false,

  deliveries: [],
  loadingDeliveries: false,

  tags: [],
  loadingTags: false,

  error: null,
};

// ─── THUNKS ───────────────────────────────────────────────────

export const fetchShelves = createAsyncThunk(
  'checkin/fetchShelves',
  async (locationId: string) => checkinService.getShelves(locationId),
);

export const fetchCartons = createAsyncThunk(
  'checkin/fetchCartons',
  async (shelfId: string) => checkinService.getCartons(shelfId),
);

export const fetchDeliveries = createAsyncThunk(
  'checkin/fetchDeliveries',
  async (locationId: string) => checkinService.getDeliveries(locationId),
);

export const fetchTags = createAsyncThunk(
  'checkin/fetchTags',
  async (deliveryNo: string) => checkinService.getScanData(deliveryNo),
);

// ─── SLICE ────────────────────────────────────────────────────

const checkinSlice = createSlice({
  name: 'checkin',
  initialState,
  reducers: {
    clearTags(state) {
      state.tags = [];
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // fetchShelves
    builder
      .addCase(fetchShelves.pending, (state) => {
        state.loadingShelves = true;
        state.error = null;
      })
      .addCase(
        fetchShelves.fulfilled,
        (state, action: PayloadAction<ShelfOption[]>) => {
          state.shelves = action.payload;
          state.loadingShelves = false;
        },
      )
      .addCase(fetchShelves.rejected, (state, action) => {
        state.loadingShelves = false;
        state.error = action.error.message ?? 'Không thể tải danh sách shelf';
      });

    // fetchCartons
    builder
      .addCase(fetchCartons.pending, (state) => {
        state.loadingCartons = true;
        state.error = null;
      })
      .addCase(
        fetchCartons.fulfilled,
        (state, action: PayloadAction<ShelfOption[]>) => {
          state.cartons = action.payload;
          state.loadingCartons = false;
        },
      )
      .addCase(fetchCartons.rejected, (state, action) => {
        state.loadingCartons = false;
        state.error = action.error.message ?? 'Không thể tải danh sách carton';
      });

    // fetchDeliveries
    builder
      .addCase(fetchDeliveries.pending, (state) => {
        state.loadingDeliveries = true;
        state.error = null;
      })
      .addCase(
        fetchDeliveries.fulfilled,
        (state, action: PayloadAction<DeliveryData[]>) => {
          state.deliveries = action.payload;
          state.loadingDeliveries = false;
        },
      )
      .addCase(fetchDeliveries.rejected, (state, action) => {
        state.loadingDeliveries = false;
        state.error =
          action.error.message ?? 'Không thể tải danh sách delivery';
      });

    // fetchTags
    builder
      .addCase(fetchTags.pending, (state) => {
        state.loadingTags = true;
        state.error = null;
      })
      .addCase(
        fetchTags.fulfilled,
        (state, action: PayloadAction<ScanData[]>) => {
          state.tags = action.payload;
          state.loadingTags = false;
        },
      )
      .addCase(fetchTags.rejected, (state, action) => {
        state.loadingTags = false;
        state.error = action.error.message ?? 'Không thể tải dữ liệu scan';
      });
  },
});

export const { clearTags, clearError } = checkinSlice.actions;
export default checkinSlice.reducer;
