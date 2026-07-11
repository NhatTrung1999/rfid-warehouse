import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  destroyRequestService,
  DestroyRequestData,
  DestroyRequestFilters,
} from '../../lib/destroy-request-service';

// ─── STATE ────────────────────────────────────────────────────

interface DestroyRequestState {
  modelNames: string[];
  loadingModelNames: boolean;

  stages: string[];
  loadingStages: boolean;

  seasons: string[];
  loadingSeasons: boolean;

  categories: string[];
  loadingCategories: boolean;

  articles: string[];
  loadingArticles: boolean;

  fds: string[];
  loadingFDs: boolean;

  noticeNos: string[];
  loadingNoticeNos: boolean;

  locations: { label: string; value: string }[];
  loadingLocations: boolean;

  tableRows: DestroyRequestData[];
  loadingTable: boolean;
  loadingMore: boolean;
  canceling: boolean;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;

  error: string | null;
}

const initialState: DestroyRequestState = {
  modelNames: [],
  loadingModelNames: false,

  stages: [],
  loadingStages: false,

  seasons: [],
  loadingSeasons: false,

  categories: [],
  loadingCategories: false,

  articles: [],
  loadingArticles: false,

  fds: [],
  loadingFDs: false,

  noticeNos: [],
  loadingNoticeNos: false,

  locations: [],
  loadingLocations: false,

  tableRows: [],
  loadingTable: false,
  loadingMore: false,
  canceling: false,
  total: 0,
  page: 1,
  pageSize: 50,
  totalPages: 0,

  error: null,
};

// ─── THUNKS ───────────────────────────────────────────────────

export const fetchModelNames = createAsyncThunk(
  'destroyRequest/fetchModelNames',
  async () => destroyRequestService.getModelNames(),
);

export const fetchStages = createAsyncThunk(
  'destroyRequest/fetchStages',
  async () => destroyRequestService.getStages(),
);

export const fetchSeasons = createAsyncThunk(
  'destroyRequest/fetchSeasons',
  async () => destroyRequestService.getSeasons(),
);

export const fetchCategories = createAsyncThunk(
  'destroyRequest/fetchCategories',
  async () => destroyRequestService.getCategories(),
);

export const fetchArticles = createAsyncThunk(
  'destroyRequest/fetchArticles',
  async () => destroyRequestService.getArticles(),
);

export const fetchFDs = createAsyncThunk('destroyRequest/fetchFDs', async () =>
  destroyRequestService.getFDs(),
);

export const fetchNoticeNos = createAsyncThunk(
  'destroyRequest/fetchNoticeNos',
  async () => destroyRequestService.getNoticeNos(),
);

export const fetchLocations = createAsyncThunk(
  'destroyRequest/fetchLocations',
  async () => destroyRequestService.getLocations(),
);

export const fetchDataWarehouses = createAsyncThunk(
  'destroyRequest/fetchDataWarehouses',
  async (filters: DestroyRequestFilters) =>
    destroyRequestService.getDataWarehouses(filters),
);

export const cancelDestroyRequests = createAsyncThunk(
  'destroyRequest/cancelDestroyRequests',
  async (epcs: string[]) => destroyRequestService.cancelDestroyRequests(epcs),
);

// ─── SLICE ────────────────────────────────────────────────────

const destroyRequestSlice = createSlice({
  name: 'destroyRequest',
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // fetchDataWarehouses
    builder
      .addCase(fetchDataWarehouses.pending, (state, action) => {
        const requestedPage = action.meta.arg.page ?? 1;
        if (requestedPage > 1) {
          state.loadingMore = true;
        } else {
          state.loadingTable = true;
          state.tableRows = [];
          state.total = 0;
          state.page = 1;
          state.totalPages = 0;
        }
        state.error = null;
      })
      .addCase(
        fetchDataWarehouses.fulfilled,
        (state, action) => {
          const requestedPage = action.meta.arg.page ?? 1;
          if (requestedPage > 1) {
            state.tableRows = [...state.tableRows, ...action.payload.data];
          } else {
            state.tableRows = action.payload.data;
          }
          state.total = action.payload.total;
          state.page = action.payload.page;
          state.pageSize = action.payload.pageSize;
          state.totalPages = action.payload.totalPages;
          state.loadingTable = false;
          state.loadingMore = false;
        },
      )
      .addCase(fetchDataWarehouses.rejected, (state, action) => {
        state.loadingTable = false;
        state.loadingMore = false;
        if ((action.meta.arg.page ?? 1) <= 1) {
          state.tableRows = [];
          state.total = 0;
          state.page = 1;
          state.totalPages = 0;
        }
        state.error =
          action.error.message ?? 'KhÃ´ng thá»ƒ táº£i dá»¯ liá»‡u Destroy Request';
      });

    // cancelDestroyRequests
    builder
      .addCase(cancelDestroyRequests.pending, (state) => {
        state.canceling = true;
        state.error = null;
      })
      .addCase(cancelDestroyRequests.fulfilled, (state) => {
        state.canceling = false;
      })
      .addCase(cancelDestroyRequests.rejected, (state, action) => {
        state.canceling = false;
        state.error =
          action.error.message ?? 'KhÃ´ng thá»ƒ há»§y Destroy Request';
      });

    // fetchModelNames
    builder
      .addCase(fetchModelNames.pending, (state) => {
        state.loadingModelNames = true;
        state.error = null;
      })
      .addCase(
        fetchModelNames.fulfilled,
        (state, action: PayloadAction<string[]>) => {
          state.modelNames = action.payload;
          state.loadingModelNames = false;
        },
      )
      .addCase(fetchModelNames.rejected, (state, action) => {
        state.loadingModelNames = false;
        state.error = action.error.message ?? 'Không thể tải Model Name';
      });

    // fetchStages
    builder
      .addCase(fetchStages.pending, (state) => {
        state.loadingStages = true;
        state.error = null;
      })
      .addCase(
        fetchStages.fulfilled,
        (state, action: PayloadAction<string[]>) => {
          state.stages = action.payload;
          state.loadingStages = false;
        },
      )
      .addCase(fetchStages.rejected, (state, action) => {
        state.loadingStages = false;
        state.error = action.error.message ?? 'Không thể tải Stage';
      });

    // fetchSeasons
    builder
      .addCase(fetchSeasons.pending, (state) => {
        state.loadingSeasons = true;
        state.error = null;
      })
      .addCase(
        fetchSeasons.fulfilled,
        (state, action: PayloadAction<string[]>) => {
          state.seasons = action.payload;
          state.loadingSeasons = false;
        },
      )
      .addCase(fetchSeasons.rejected, (state, action) => {
        state.loadingSeasons = false;
        state.error = action.error.message ?? 'Không thể tải Season';
      });

    // fetchCategories
    builder
      .addCase(fetchCategories.pending, (state) => {
        state.loadingCategories = true;
        state.error = null;
      })
      .addCase(
        fetchCategories.fulfilled,
        (state, action: PayloadAction<string[]>) => {
          state.categories = action.payload;
          state.loadingCategories = false;
        },
      )
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loadingCategories = false;
        state.error = action.error.message ?? 'Không thể tải Category';
      });

    // fetchArticles
    builder
      .addCase(fetchArticles.pending, (state) => {
        state.loadingArticles = true;
        state.error = null;
      })
      .addCase(
        fetchArticles.fulfilled,
        (state, action: PayloadAction<string[]>) => {
          state.articles = action.payload;
          state.loadingArticles = false;
        },
      )
      .addCase(fetchArticles.rejected, (state, action) => {
        state.loadingArticles = false;
        state.error = action.error.message ?? 'Không thể tải Article';
      });

    // fetchFDs
    builder
      .addCase(fetchFDs.pending, (state) => {
        state.loadingFDs = true;
        state.error = null;
      })
      .addCase(fetchFDs.fulfilled, (state, action: PayloadAction<string[]>) => {
        state.fds = action.payload;
        state.loadingFDs = false;
      })
      .addCase(fetchFDs.rejected, (state, action) => {
        state.loadingFDs = false;
        state.error = action.error.message ?? 'Không thể tải FD';
      });

    // fetchNoticeNos
    builder
      .addCase(fetchNoticeNos.pending, (state) => {
        state.loadingNoticeNos = true;
        state.error = null;
      })
      .addCase(
        fetchNoticeNos.fulfilled,
        (state, action: PayloadAction<string[]>) => {
          state.noticeNos = action.payload;
          state.loadingNoticeNos = false;
        },
      )
      .addCase(fetchNoticeNos.rejected, (state, action) => {
        state.loadingNoticeNos = false;
        state.error = action.error.message ?? 'Không thể tải Notice No';
      });

    // fetchLocations
    builder
      .addCase(fetchLocations.pending, (state) => {
        state.loadingLocations = true;
        state.error = null;
      })
      .addCase(
        fetchLocations.fulfilled,
        (state, action: PayloadAction<{ label: string; value: string }[]>) => {
          state.locations = action.payload;
          state.loadingLocations = false;
        },
      )
      .addCase(fetchLocations.rejected, (state, action) => {
        state.loadingLocations = false;
        state.error = action.error.message ?? 'Không thể tải Location';
      });
  },
});

export const { clearError } = destroyRequestSlice.actions;
export default destroyRequestSlice.reducer;
