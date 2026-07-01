import { apiClient } from './api-client';

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
};
