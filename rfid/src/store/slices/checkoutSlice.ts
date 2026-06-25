import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  checkoutService,
  DropdownOption,
  EpcData,
} from '../../lib/checkout-service';

// ─── STATE ────────────────────────────────────────────────────

interface CheckoutState {
  fromOptions: DropdownOption[];
  loadingFrom: boolean;

  toOptions: DropdownOption[];
  loadingTo: boolean;

  shelfOptions: DropdownOption[];
  loadingShelf: boolean;

  epcs: EpcData[];
  loadingEpcs: boolean;

  error: string | null;
}

const initialState: CheckoutState = {
  fromOptions: [],
  loadingFrom: false,

  toOptions: [],
  loadingTo: false,

  shelfOptions: [],
  loadingShelf: false,

  epcs: [],
  loadingEpcs: false,

  error: null,
};

// ─── THUNKS ───────────────────────────────────────────────────

export const fetchFrom = createAsyncThunk(
  'checkout/fetchFrom',
  async (locationId: string) => checkoutService.getFrom(locationId),
);

export const fetchTo = createAsyncThunk(
  'checkout/fetchTo',
  async (locationFrom: string) => checkoutService.getTo(locationFrom),
);

export const fetchShelf = createAsyncThunk(
  'checkout/fetchShelf',
  async (locationId: string) => checkoutService.getShelf(locationId),
);

export const fetchEPC = createAsyncThunk(
  'checkout/fetchEPC',
  async (epc: string) => checkoutService.getCheckOutEPC(epc),
);

// ─── SLICE ────────────────────────────────────────────────────

const checkoutSlice = createSlice({
  name: 'checkout',
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
    clearEpcs(state) {
      state.epcs = [];
    },
  },
  extraReducers: (builder) => {
    // fetchFrom
    builder
      .addCase(fetchFrom.pending, (state) => {
        state.loadingFrom = true;
        state.error = null;
      })
      .addCase(
        fetchFrom.fulfilled,
        (state, action: PayloadAction<DropdownOption[]>) => {
          state.fromOptions = action.payload;
          state.loadingFrom = false;
        },
      )
      .addCase(fetchFrom.rejected, (state, action) => {
        state.loadingFrom = false;
        state.error = action.error.message ?? 'Không thể tải danh sách From';
      });

    // fetchTo
    builder
      .addCase(fetchTo.pending, (state) => {
        state.loadingTo = true;
        state.error = null;
      })
      .addCase(
        fetchTo.fulfilled,
        (state, action: PayloadAction<DropdownOption[]>) => {
          state.toOptions = action.payload;
          state.loadingTo = false;
        },
      )
      .addCase(fetchTo.rejected, (state, action) => {
        state.loadingTo = false;
        state.error = action.error.message ?? 'Không thể tải danh sách To';
      });

    // fetchShelf
    builder
      .addCase(fetchShelf.pending, (state) => {
        state.loadingShelf = true;
        state.error = null;
      })
      .addCase(
        fetchShelf.fulfilled,
        (state, action: PayloadAction<DropdownOption[]>) => {
          state.shelfOptions = action.payload;
          state.loadingShelf = false;
        },
      )
      .addCase(fetchShelf.rejected, (state, action) => {
        state.loadingShelf = false;
        state.error = action.error.message ?? 'Không thể tải danh sách Shelf';
      });

    // fetchEPC
    builder
      .addCase(fetchEPC.pending, (state) => {
        state.loadingEpcs = true;
        state.error = null;
      })
      .addCase(
        fetchEPC.fulfilled,
        (state, action: PayloadAction<EpcData[]>) => {
          state.epcs = action.payload;
          state.loadingEpcs = false;
        },
      )
      .addCase(fetchEPC.rejected, (state, action) => {
        state.loadingEpcs = false;
        state.error = action.error.message ?? 'Không thể tải dữ liệu EPC';
      });
  },
});

export const { clearError, clearEpcs } = checkoutSlice.actions;
export default checkoutSlice.reducer;
