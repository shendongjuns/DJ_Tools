import dayjs from 'dayjs';

export function formatDateTime(value?: string | null) {
  if (!value) {
    return '-';
  }
  return dayjs(value).format('YYYY-MM-DD HH:mm');
}

export function formatBytes(bytes?: number | null) {
  if (!bytes && bytes !== 0) {
    return '-';
  }
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(value >= 10 ? 0 : 2)} ${units[unitIndex]}`;
}

export function formatDuration(seconds: number) {
  const day = Math.floor(seconds / 86400);
  const hour = Math.floor((seconds % 86400) / 3600);
  const minute = Math.floor((seconds % 3600) / 60);
  return `${day}天 ${hour}小时 ${minute}分钟`;
}

