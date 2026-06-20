import { apiClient } from './api-client';
import { getDeviceId, getDeviceName } from './device-info';
import { StoredUser, tokenStorage } from './token-storage';

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: StoredUser;
}

export const authService = {
  async login(username: string, password: string): Promise<StoredUser> {
    const deviceId = await getDeviceId();
    const deviceName = getDeviceName();

    const data = await apiClient.post<AuthResponse>(
      '/auth/login',
      { username, password, deviceId, deviceName },
      false,
    );

    await tokenStorage.saveSession(
      data.accessToken,
      data.refreshToken,
      data.user,
    );
    return data.user;
  },

  async register(
    username: string,
    password: string,
    name?: string,
  ): Promise<void> {
    await apiClient.post('/auth/register', { username, password, name }, false);
  },

  async logout(): Promise<void> {
    const refreshToken = await tokenStorage.getRefreshToken();
    if (refreshToken) {
      try {
        await apiClient.post('/auth/logout', { refreshToken }, false);
      } catch {
        // Dù gọi API logout thất bại (vd mất mạng), vẫn xóa session local
        // để người dùng thoát được khỏi app.
      }
    }
    await tokenStorage.clearSession();
  },

  async getCurrentUser(): Promise<StoredUser | null> {
    return tokenStorage.getUser();
  },

  async isAuthenticated(): Promise<boolean> {
    const token = await tokenStorage.getAccessToken();
    return !!token;
  },
};
