import type { TodoStatus } from '../types';

export const DEFAULT_TODO_FILTER_STATUSES: TodoStatus[] = ['PENDING', 'IN_PROGRESS'];

export const TODO_STATUS_OPTIONS: Array<{ label: string; value: TodoStatus }> = [
  { label: '待开始', value: 'PENDING' },
  { label: '进行中', value: 'IN_PROGRESS' },
  { label: '逾期', value: 'UNFINISHED' },
  { label: '已完成', value: 'COMPLETED' },
  { label: '取消', value: 'CANCELLED' },
];

export const TODO_FILTER_STATUS_OPTIONS: Array<{ label: string; value: TodoStatus }> = TODO_STATUS_OPTIONS;

export const TODO_STATUS_OPTIONS_WITH_UNFINISHED: Array<{ label: string; value: TodoStatus; disabled?: boolean }> =
  TODO_STATUS_OPTIONS;

export function getTodoStatusLabel(status: TodoStatus) {
  switch (status) {
    case 'PENDING':
      return '待开始';
    case 'IN_PROGRESS':
      return '进行中';
    case 'COMPLETED':
      return '已完成';
    case 'CANCELLED':
      return '取消';
    case 'UNFINISHED':
      return '逾期';
    default:
      return status;
  }
}

export function getTodoStatusColor(status: TodoStatus) {
  switch (status) {
    case 'PENDING':
      return 'blue';
    case 'IN_PROGRESS':
      return 'processing';
    case 'COMPLETED':
      return 'green';
    case 'CANCELLED':
      return 'default';
    case 'UNFINISHED':
      return 'red';
    default:
      return 'default';
  }
}
