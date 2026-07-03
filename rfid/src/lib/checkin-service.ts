import { apiClient } from "./api-client";

export interface ShelfOption {
  label: string;
  value: string;
}

export interface DeliveryData {
  DeliverNO: string;
  From: string;
  To: string;
  DeliverPerson: string;
  Quant: number;
  Account: string;
  Date: string;
  Remark: string;
  Purpose: string;
}

export interface ScanData {
  Scan: string;
  EPC: string;
  PH: string;
  Note: string;
  Stage: string;
  SerialNo: number;
  NoticeNo: string;
  Carton: string;
  Article: string;
  FD: string;
  DevTp: string;
  Season: string;
  ShoeName: string;
  ShoesType: string;
  Size: string;
}

export interface CheckEpcData {
  DeliverNO: string;
  Qty: number;
  LocationTo: string;
}

export interface CartonNumberData {
  ShelfId: string;
  CartonNumberOnly: string;
  NoOnly: string;
  CartonNumber: string;
}
export const checkinService = {
  async getShelves(locationId: string): Promise<ShelfOption[]> {
    return apiClient.get<ShelfOption[]>(
      `/checkin/shelf?locationId=${encodeURIComponent(locationId)}`,
    );
  },

  async getCartons(shelfId: string): Promise<ShelfOption[]> {
    return apiClient.get<ShelfOption[]>(
      `/checkin/carton?shelfId=${encodeURIComponent(shelfId)}`,
    );
  },

  async getDeliveries(locationId: string): Promise<DeliveryData[]> {
    return apiClient.get<DeliveryData[]>(
      `/checkin/delivery?locationId=${encodeURIComponent(locationId)}`,
    );
  },

  async getScanData(deliveryNo: string): Promise<ScanData[]> {
    return apiClient.get<ScanData[]>(
      `/checkin/scan?deliveryNo=${encodeURIComponent(deliveryNo)}`,
    );
  },
  async checkEpc(epc: string): Promise<CheckEpcData | null> {
    return apiClient.get<CheckEpcData | null>(
      `/checkin/check-epc?epc=${encodeURIComponent(epc)}`,
    );
  },

  async getCartonNumber(epc: string): Promise<CartonNumberData | null> {
    return apiClient.get<CartonNumberData | null>(
      `/checkin/carton-number?epc=${encodeURIComponent(epc)}`,
    );
  },
};
