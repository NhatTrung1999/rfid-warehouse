import { apiClient } from './api-client';

export interface DestroyScanOverview {
  ScannedCount: number | null;
  NotScannedCount: number | null;
  Total: number | null;
}

export interface DestroyScanData {
  BatchNo: string | null;
  STT: string | null;
  DateScan: string | null;
  EPC: string | null;
  ShoesType: string | null;
  Note: string | null;
  NoticeNo: string | null;
  SerialNo: number | null;
  UserScan: string | null;
  Article: string | null;
  FD: string | null;
  DevTp: string | null;
  Stage: string | null;
  Season: string | null;
  ShoeName: string | null;
  Size: string | null;
  CartonNumber: string | null;
  ExportTime: string | null;
  Remark: string | null;
  Carton: string | null;
}

export interface DestroyScanFilters {
  locationId?: string;
  page?: number;
  pageSize?: number;
}

export interface DestroyScanDataResponse {
  data: DestroyScanData[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const destroyScanService = {
  async getOverview(locationId: string): Promise<DestroyScanOverview> {
    const rows = await apiClient.get<DestroyScanOverview[]>(
      `/destroy-scan/overview-destroy-scan?locationId=${encodeURIComponent(locationId)}`,
    );
    return rows[0] ?? { ScannedCount: 0, NotScannedCount: 0, Total: 0 };
  },

  async getData(filters: DestroyScanFilters): Promise<DestroyScanDataResponse> {
    return apiClient.post<DestroyScanDataResponse>(
      '/destroy-scan/data-destroy-scan',
      filters,
    );
  },
};
