import * as Device from 'expo-device';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const DEVICE_ID_KEY = 'rfid_device_id';

function generateUuid(): string {
  // RFC4122-ish v4 UUID, đủ dùng làm device fingerprint (không cần crypto-grade)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// deviceId: tự sinh 1 lần duy nhất, lưu lại để ổn định qua các lần mở app
// (expo-device không cung cấp ID cố định sẵn nào dùng được cho việc này).
export async function getDeviceId(): Promise<string> {
  let id = await SecureStore.getItemAsync(DEVICE_ID_KEY);
  if (!id) {
    id = generateUuid();
    await SecureStore.setItemAsync(DEVICE_ID_KEY, id);
  }
  return id;
}

// deviceName: tên hiển thị để người dùng nhận diện thiết bị (vd "iPhone 15 của Stacky")
export function getDeviceName(): string {
  return Device.deviceName ?? Device.modelName ?? `${Platform.OS} device`;
}
