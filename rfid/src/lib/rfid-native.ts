import {
  DeviceEventEmitter,
  EmitterSubscription,
  NativeModules,
  Platform,
} from 'react-native';

export interface RfidTagEvent {
  epc: string;
  rssi: number;
  antId: number;
}

interface RfidNativeModule {
  connect: () => Promise<string>;
  disconnect: () => Promise<string>;
  startScan: () => void;
  stopScan: () => void;
}

const RFIDModule = NativeModules.RFIDModule as RfidNativeModule | undefined;

function getModule(): RfidNativeModule {
  if (Platform.OS !== 'android' || !RFIDModule) {
    throw new Error('RFID module is only available in the Android PDA build');
  }
  return RFIDModule;
}

export const rfidNative = {
  isAvailable() {
    return Platform.OS === 'android' && Boolean(RFIDModule);
  },

  connect() {
    return getModule().connect();
  },

  disconnect() {
    return getModule().disconnect();
  },

  startScan() {
    getModule().startScan();
  },

  stopScan() {
    getModule().stopScan();
  },

  addTagListener(callback: (event: RfidTagEvent) => void): EmitterSubscription {
    return DeviceEventEmitter.addListener('onTagRead', callback);
  },
};
