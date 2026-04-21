import { storage } from '../utils/storage';
import type { ApiResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = storage.getToken();
  const headers = new Headers(init?.headers);
  headers.set('Content-Type', init?.body instanceof FormData ? '' : 'application/json');
  if (init?.body instanceof FormData) {
    headers.delete('Content-Type');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  if (response.status === 401) {
    storage.clearToken();
    storage.clearRefreshToken();
    storage.clearProfile();
    window.location.href = '/login';
    throw new Error('认证失败，请重新登录');
  }

  const payload = (await response.json()) as ApiResponse<T> & { message?: string };
  if (!response.ok || !payload.success) {
    throw new Error(payload.message || '请求失败');
  }
  return payload.data;
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body instanceof FormData ? body : JSON.stringify(body) }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PUT', body: body instanceof FormData ? body : JSON.stringify(body) }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};

