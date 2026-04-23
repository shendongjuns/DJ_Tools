export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  details?: unknown;
}

export interface UserProfile {
  id: number;
  nickname: string;
  loginAccount: string;
  themeId: string;
  forcePasswordChange: boolean;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  profile: UserProfile;
}

export type TodoStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'UNFINISHED';

export interface TodoItem {
  id: number;
  title: string;
  description?: string;
  dueAt?: string;
  remindAt?: string;
  status: TodoStatus;
  overdue: boolean;
  unfinished: boolean;
  completedAt?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationItem {
  id: number;
  type: string;
  title: string;
  content?: string;
  relatedType?: string;
  relatedId?: number;
  remindAt?: string;
  readFlag: boolean;
  createdAt: string;
}

export interface NotificationListResponse {
  unreadCount: number;
  items: NotificationItem[];
}

export interface NoteFolder {
  id: number;
  name: string;
  sortOrder: number;
}

export interface NoteAttachment {
  id: number;
  originalFilename: string;
  contentType?: string;
  sizeBytes: number;
  createdAt: string;
}

export interface NoteShare {
  id: number;
  shareToken: string;
  shareUrl: string;
  expiresAt?: string | null;
  disabled: boolean;
}

export interface NoteListItem {
  id: number;
  title: string;
  summary?: string;
  folderId?: number;
  folderName?: string;
  tags: string[];
  shared: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NoteDetail {
  id: number;
  title: string;
  summary?: string;
  content: string;
  folderId?: number;
  folderName?: string;
  tags: string[];
  attachments: NoteAttachment[];
  shares: NoteShare[];
  shared: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SharedNote {
  title: string;
  summary?: string;
  content: string;
  folderName?: string;
  tags: string[];
  updatedAt: string;
}

export interface SearchResult {
  scope: 'all' | 'todo' | 'note' | string;
  type: string;
  title: string;
  snippet: string;
  targetId: number;
  extraMeta: Record<string, unknown>;
}

export interface DashboardOverview {
  todoUnfinishedCount: number;
  noteCount: number;
  unreadNotificationCount: number;
  latestTodos: TodoItem[];
  latestNotes: NoteListItem[];
}

export interface HostMetrics {
  cpuUsage: number;
  totalMemory: number;
  availableMemory: number;
  totalSwap: number;
  usedSwap: number;
  uptimeSeconds: number;
  disks: Array<{
    name: string;
    totalBytes: number;
    usableBytes: number;
    readBytes: number;
    writeBytes: number;
  }>;
  networks: Array<{
    name: string;
    bytesRecv: number;
    bytesSent: number;
  }>;
}

export interface ContainerMetrics {
  available: boolean;
  message: string;
  items: Array<{
    id: string;
    name: string;
    image: string;
    state: string;
    cpuUsage: number;
    memoryUsage: number;
  }>;
}

export interface AppMetrics {
  pid: number;
  uptimeMillis: number;
  processCpuLoad: number;
  processMemoryBytes: number;
  heapMemory: { used: number; committed: number; max: number };
  nonHeapMemory: { used: number; committed: number; max: number };
  gcMetrics: Array<{ name: string; collectionCount: number; collectionTime: number }>;
}
