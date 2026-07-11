import { apiClient } from './api-client';

export interface DestroyRequestData {
  EPC: string | null;
  Article: string | null;
  Model: string | null;
  Category: string | null;
  Stage: string | null;
  Size: string | null;
  Season: string | null;
  NoticeNo: string | null;
  FD: string | null;
  DeviceType: string | null;
  ShoesType: string | null;
  ConfirmDate: string | null;
  ConfirmUser: string | null;
  Status: string | null;
  Destroy: boolean | null;
  Reason: string | null;
}

export interface DestroyRequestDataWarehouses {
  data: DestroyRequestData[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface DestroyRequestFilters {
  epc?: string;
  modelName?: string[];
  stage?: string[];
  season?: string[];
  category?: string[];
  article?: string[];
  fd?: string[];
  location?: string[];
  status?: string[];
  noticeNo?: string[];
  page?: number;
  pageSize?: number;
}

export interface CancelDestroyRequestResult {
  success: boolean;
  requested: number;
}

export interface UpdateCheckExportResult {
  success: boolean;
  requested: number;
  updated: number;
}

export const destroyRequestService = {
  async getModelNames(): Promise<string[]> {
    const rows = await apiClient.get<{ ModelName: string }[]>(
      '/destroy-request/model-name',
    );
    return rows.map((r) => r.ModelName);
  },

  async getStages(): Promise<string[]> {
    const rows = await apiClient.get<{ Stage: string }[]>(
      '/destroy-request/stage',
    );
    return rows.map((r) => r.Stage);
  },

  async getSeasons(): Promise<string[]> {
    const rows = await apiClient.get<{ Season: string }[]>(
      '/destroy-request/season',
    );
    return rows.map((r) => r.Season);
  },

  async getCategories(): Promise<string[]> {
    const rows = await apiClient.get<{ Category: string }[]>(
      '/destroy-request/category',
    );
    return rows.map((r) => r.Category);
  },

  async getArticles(): Promise<string[]> {
    const rows = await apiClient.get<{ Article: string }[]>(
      '/destroy-request/article',
    );
    return rows.map((r) => r.Article);
  },

  async getFDs(): Promise<string[]> {
    const rows = await apiClient.get<{ FD: string }[]>('/destroy-request/fd');
    return rows.map((r) => r.FD);
  },

  async getNoticeNos(): Promise<string[]> {
    const rows = await apiClient.get<{ NoticeNo: string }[]>(
      '/destroy-request/notice-no',
    );
    return rows.map((r) => r.NoticeNo);
  },

  async getLocations(): Promise<{ label: string; value: string }[]> {
    return apiClient.get<{ label: string; value: string }[]>(
      '/destroy-request/location',
    );
  },

  async getDataWarehouses(
    filters: DestroyRequestFilters,
  ): Promise<DestroyRequestDataWarehouses> {
    return apiClient.post<DestroyRequestDataWarehouses>(
      '/destroy-request/data-warehouses',
      filters,
    );
  },

  async cancelDestroyRequests(
    epcs: string[],
  ): Promise<CancelDestroyRequestResult> {
    return apiClient.post<CancelDestroyRequestResult>(
      '/destroy-request/cancel',
      { epcs },
    );
  },

  async updateCheckExport(epcs: string[]): Promise<UpdateCheckExportResult> {
    return apiClient.post<UpdateCheckExportResult>(
      '/destroy-request/check-export',
      { epcs },
    );
  },
};
