import { apiClient } from './api-client';

export interface Warehouse {
  label: string;
  value: string;
}

export const warehousesService = {
  async getWarehouses(): Promise<Warehouse[]> {
    return apiClient.get<Warehouse[]>('/warehouse/warehouses');
  },
};
