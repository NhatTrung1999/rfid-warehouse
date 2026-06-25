import { apiClient } from './api-client';

export interface DropdownOption {
  label: string;
  value: string;
}

export interface EpcData {
  EPC: string;
  Category: string;
  NoticeNo: string;
  CartonNumber: string;
  Action: string;
  Article: string;
  PH: string;
  FD: string;
  DevTp: string;
  Stage: string;
  Season: string;
  ShoeName: string;
  Size: string;
  ShoesType: string;
}

export const checkoutService = {
  async getFrom(locationId: string): Promise<DropdownOption[]> {
    return apiClient.get<DropdownOption[]>(
      `/checkout/from?locationId=${encodeURIComponent(locationId)}`,
    );
  },

  async getTo(locationFrom: string): Promise<DropdownOption[]> {
    return apiClient.get<DropdownOption[]>(
      `/checkout/to?locationFrom=${encodeURIComponent(locationFrom)}`,
    );
  },

  async getShelf(locationId: string): Promise<DropdownOption[]> {
    return apiClient.get<DropdownOption[]>(
      `/checkout/shelf?locationId=${encodeURIComponent(locationId)}`,
    );
  },

  async getCheckOutEPC(epc: string): Promise<EpcData[]> {
    return apiClient.get<EpcData[]>(
      `/checkout/epc?epc=${encodeURIComponent(epc)}`,
    );
  },
};
