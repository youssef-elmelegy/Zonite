import axios, { type AxiosError, type AxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/auth.store';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL as string,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

let isRefreshing = false;
let pendingQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (err: unknown) => void;
}> = [];

function drainQueue() {
  pendingQueue.forEach((p) => p.resolve(undefined));
  pendingQueue = [];
}

function rejectQueue(err: unknown) {
  pendingQueue.forEach((p) => p.reject(err));
  pendingQueue = [];
}

api.interceptors.response.use(
  (response) => {
    const data = response.data as { data?: unknown };
    if (data && typeof data === 'object' && 'data' in data) {
      response.data = data.data;
    }
    return response;
  },
  async (error: AxiosError) => {
    const original = error.config as AxiosRequestConfig & { _retry?: boolean };
    const isRefreshUrl = (original.url ?? '').includes('/auth/refresh');

    if (error.response?.status !== 401 || original._retry || isRefreshUrl) {
      return Promise.reject(error);
    }

    const { clearAuth } = useAuthStore.getState();

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({ resolve: () => resolve(api(original)), reject });
      });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      // Cookie is sent automatically — no body needed
      await api.post('/auth/refresh');
      drainQueue();
      return api(original);
    } catch (refreshError) {
      rejectQueue(refreshError);
      clearAuth();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);
