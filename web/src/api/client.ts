import { storage } from '../utils/storage';
import type { ApiResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

interface ErrorPayload {
  message?: string;
  details?: unknown;
  detail?: unknown;
  reason?: unknown;
  error?: unknown;
  errors?: unknown;
}

function stringifyErrorDetail(value: unknown): string | null {
  if (!value) {
    return null;
  }
  if (typeof value === 'string') {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(stringifyErrorDetail).filter(Boolean).join('；');
  }
  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>)
      .map(([key, item]) => {
        const text = stringifyErrorDetail(item);
        return text ? `${key}：${text}` : null;
      })
      .filter(Boolean)
      .join('；');
  }
  return String(value);
}

function buildErrorMessage(payload?: ErrorPayload) {
  const message = payload?.message || '请求失败，请稍后重试';
  const detail =
    stringifyErrorDetail(payload?.details) ||
    stringifyErrorDetail(payload?.detail) ||
    stringifyErrorDetail(payload?.reason) ||
    stringifyErrorDetail(payload?.error) ||
    stringifyErrorDetail(payload?.errors);
  return detail && detail !== message ? `${message}：${detail}` : message;
}

function notifySystemError(message: string, status?: number, path?: string) {
  window.dispatchEvent(
    new CustomEvent('djtools:system-error', {
      detail: { message, status, path },
    }),
  );
}

async function parsePayload<T>(response: Response, path: string) {
  try {
    return (await response.json()) as ApiResponse<T> & ErrorPayload;
  } catch {
    const message = '响应解析失败，请稍后重试';
    notifySystemError(message, response.status, path);
    throw new Error(message);
  }
}

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

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers,
    });
  } catch {
    const message = '网络连接失败，请检查服务是否正常运行';
    notifySystemError(message, undefined, path);
    throw new Error(message);
  }

  if (response.status === 401) {
    const message = '认证失败，请重新登录';
    notifySystemError(message, response.status, path);
    storage.clearToken();
    storage.clearRefreshToken();
    storage.clearProfile();
    window.location.href = '/login';
    throw new Error(message);
  }

  const payload = await parsePayload<T>(response, path);
  if (!response.ok || !payload.success) {
    const message = buildErrorMessage(payload);
    notifySystemError(message, response.status, path);
    throw new Error(message);
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

