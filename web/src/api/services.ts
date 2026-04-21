import { apiClient } from './client';
import type {
  AppMetrics,
  AuthResponse,
  ContainerMetrics,
  DashboardOverview,
  HostMetrics,
  NoteAttachment,
  NoteDetail,
  NoteFolder,
  NoteListItem,
  NoteShare,
  NotificationListResponse,
  SearchResult,
  SharedNote,
  TodoItem,
  UserProfile,
} from '../types';

export const authApi = {
  login: (payload: { loginAccount: string; password: string }) =>
    apiClient.post<AuthResponse>('/api/auth/login', payload),
  refresh: (payload: { refreshToken: string }) =>
    apiClient.post<AuthResponse>('/api/auth/refresh', payload),
  logout: (payload: { refreshToken: string }) =>
    apiClient.post<void>('/api/auth/logout', payload),
  initialPassword: (payload: { oldPassword: string; newPassword: string }) =>
    apiClient.post<AuthResponse>('/api/auth/initial-password', payload),
};

export const userApi = {
  me: () => apiClient.get<UserProfile>('/api/me'),
  updateProfile: (payload: { nickname: string; loginAccount: string; themeId: string }) =>
    apiClient.put<UserProfile>('/api/me/profile', payload),
  changePassword: (payload: { oldPassword: string; newPassword: string }) =>
    apiClient.put<void>('/api/me/password', payload),
};

export const dashboardApi = {
  overview: () => apiClient.get<DashboardOverview>('/api/dashboard/overview'),
  hostMetrics: () => apiClient.get<HostMetrics>('/api/dashboard/host-metrics'),
  containerMetrics: () => apiClient.get<ContainerMetrics>('/api/dashboard/container-metrics'),
  appMetrics: () => apiClient.get<AppMetrics>('/api/dashboard/app-metrics'),
};

export const notificationApi = {
  list: () => apiClient.get<NotificationListResponse>('/api/notifications'),
  read: (id: number) => apiClient.put<void>(`/api/notifications/${id}/read`),
};

export const todoApi = {
  list: (keyword = '') => apiClient.get<TodoItem[]>(`/api/todos${keyword ? `?keyword=${encodeURIComponent(keyword)}` : ''}`),
  create: (payload: Record<string, unknown>) => apiClient.post<TodoItem>('/api/todos', payload),
  update: (id: number, payload: Record<string, unknown>) => apiClient.put<TodoItem>(`/api/todos/${id}`, payload),
  updateStatus: (id: number, status: string) => apiClient.patch<TodoItem>(`/api/todos/${id}/status`, { status }),
  remove: (id: number) => apiClient.delete<void>(`/api/todos/${id}`),
};

export const noteApi = {
  folders: () => apiClient.get<NoteFolder[]>('/api/note-folders'),
  createFolder: (payload: { name: string; sortOrder: number }) => apiClient.post<NoteFolder>('/api/note-folders', payload),
  tags: () => apiClient.get<string[]>('/api/note-tags'),
  list: (params: { folderId?: number; tag?: string; keyword?: string }) => {
    const searchParams = new URLSearchParams();
    if (params.folderId) searchParams.set('folderId', String(params.folderId));
    if (params.tag) searchParams.set('tag', params.tag);
    if (params.keyword) searchParams.set('keyword', params.keyword);
    return apiClient.get<NoteListItem[]>(`/api/notes${searchParams.size ? `?${searchParams.toString()}` : ''}`);
  },
  create: (payload: Record<string, unknown>) => apiClient.post<NoteDetail>('/api/notes', payload),
  detail: (id: number) => apiClient.get<NoteDetail>(`/api/notes/${id}`),
  update: (id: number, payload: Record<string, unknown>) => apiClient.put<NoteDetail>(`/api/notes/${id}`, payload),
  remove: (id: number) => apiClient.delete<void>(`/api/notes/${id}`),
  attachments: (id: number) => apiClient.get<NoteAttachment[]>(`/api/notes/${id}/attachments`),
  uploadAttachment: (id: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post<NoteAttachment>(`/api/notes/${id}/attachments`, formData);
  },
  deleteAttachment: (id: number) => apiClient.delete<void>(`/api/note-attachments/${id}`),
  createShare: (id: number, expireOption: string) => apiClient.post<NoteShare>(`/api/notes/${id}/share`, { expireOption }),
  closeShare: (id: number) => apiClient.delete<void>(`/api/note-shares/${id}`),
  sharedDetail: (token: string) => apiClient.get<SharedNote>(`/share/notes/${token}`),
};

export const searchApi = {
  search: (scope: string, keyword: string) =>
    apiClient.get<SearchResult[]>(`/api/search?scope=${scope}&keyword=${encodeURIComponent(keyword)}`),
};

