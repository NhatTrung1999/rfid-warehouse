import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { tokenStorage } from './token-storage';

const API_BASE_URL = 'http://192.168.18.42:3157';

export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}

export class ApiError extends Error {
  statusCode: number;
  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

// Đánh dấu riêng các request không cần đính access token (login, register, refresh)
interface RequestConfig extends InternalAxiosRequestConfig {
  skipAuth?: boolean;
  _retry?: boolean;
}

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Request interceptor: tự đính Authorization header nếu có token và không skipAuth
axiosClient.interceptors.request.use(async (config: RequestConfig) => {
  if (!config.skipAuth) {
    const accessToken = await tokenStorage.getAccessToken();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
  }
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

// Gọi /auth/refresh để lấy access token mới. Dùng chung 1 promise nếu nhiều
// request cùng lúc bị 401 — tránh gọi refresh nhiều lần song song.
async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const refreshToken = await tokenStorage.getRefreshToken();
      if (!refreshToken) return null;

      const res = await axios.post<
        ApiResponse<{
          accessToken: string;
          refreshToken: string;
          user: { id: string; username: string; role: string };
        }>
      >(`${API_BASE_URL}/auth/refresh`, { refreshToken });

      const {
        accessToken,
        refreshToken: newRefreshToken,
        user,
      } = res.data.data;
      await tokenStorage.saveSession(accessToken, newRefreshToken, user);

      return accessToken;
    } catch {
      await tokenStorage.clearSession();
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// Response interceptor: bóc data, tự refresh token khi gặp 401 rồi gọi lại
// request gốc đúng 1 lần (đánh dấu bằng _retry để tránh lặp vô hạn).
axiosClient.interceptors.response.use(
  (response) => response.data?.data,
  async (error: AxiosError<ApiResponse<unknown>>) => {
    const config = error.config as RequestConfig | undefined;

    if (
      error.response?.status === 401 &&
      config &&
      !config.skipAuth &&
      !config._retry
    ) {
      config._retry = true;
      const newAccessToken = await refreshAccessToken();
      if (newAccessToken) {
        config.headers.Authorization = `Bearer ${newAccessToken}`;
        return axiosClient(config);
      }
    }

    const responseData = error.response?.data;
    const rawMessage = responseData?.message;
    const message = Array.isArray(rawMessage) ? rawMessage[0] : rawMessage;

    throw new ApiError(
      responseData?.statusCode ?? error.response?.status ?? 0,
      message ?? error.message ?? 'Có lỗi xảy ra',
    );
  },
);

export const apiClient = {
  get: <T>(path: string, auth = true) =>
    axiosClient.get<T, T>(path, { skipAuth: !auth } as RequestConfig),
  post: <T>(path: string, body?: unknown, auth = true) =>
    axiosClient.post<T, T>(path, body, { skipAuth: !auth } as RequestConfig),
  put: <T>(path: string, body?: unknown, auth = true) =>
    axiosClient.put<T, T>(path, body, { skipAuth: !auth } as RequestConfig),
  delete: <T>(path: string, auth = true) =>
    axiosClient.delete<T, T>(path, { skipAuth: !auth } as RequestConfig),
};
