package com.djtools.todo;

import com.djtools.common.ApiException;
import com.djtools.security.CurrentUser;
import java.util.Arrays;
import java.time.OffsetDateTime;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TodoService {

    private final TodoMapper todoMapper;

    public TodoService(TodoMapper todoMapper) {
        this.todoMapper = todoMapper;
    }

    @Transactional
    public List<TodoResponse> list(CurrentUser currentUser, String keyword, String statuses) {
        normalizeExpiredTodos(currentUser.getId());
        return todoMapper.findAllByUser(currentUser.getId(), keyword, parseStatuses(statuses))
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public TodoResponse create(CurrentUser currentUser, TodoRequest request) {
        TodoItem todoItem = toEntity(currentUser.getId(), request);
        todoMapper.insert(todoItem);
        return toResponse(todoMapper.findById(todoItem.getId(), currentUser.getId()));
    }

    @Transactional
    public TodoResponse update(CurrentUser currentUser, Long id, TodoRequest request) {
        TodoItem todoItem = requireTodo(currentUser.getId(), id);
        todoItem.setTitle(request.title());
        todoItem.setDescription(request.description());
        todoItem.setDueAt(request.dueAt());
        todoItem.setRemindAt(request.remindAt());
        applyStatusTimes(
                todoItem,
                request.status() == null ? TodoStatus.PENDING : request.status(),
                request.completedAt(),
                request.cancelledAt()
        );
        todoMapper.update(todoItem);
        return toResponse(requireTodo(currentUser.getId(), id));
    }

    @Transactional
    public TodoResponse updateStatus(CurrentUser currentUser, Long id, TodoStatusUpdateRequest request) {
        TodoItem todoItem = requireTodo(currentUser.getId(), id);
        applyStatusTimes(todoItem, request.status(), request.completedAt(), request.cancelledAt());
        todoMapper.updateStatus(todoItem);
        return toResponse(requireTodo(currentUser.getId(), id));
    }

    @Transactional
    public void delete(CurrentUser currentUser, Long id) {
        requireTodo(currentUser.getId(), id);
        todoMapper.softDelete(id, currentUser.getId());
    }

    public List<TodoResponse> latest(CurrentUser currentUser, int limit) {
        normalizeExpiredTodos(currentUser.getId());
        return todoMapper.findLatest(currentUser.getId(), limit).stream().map(this::toResponse).toList();
    }

    public TodoItem requireTodo(Long userId, Long id) {
        TodoItem todoItem = todoMapper.findById(id, userId);
        if (todoItem == null) {
            throw new ApiException(HttpStatus.NOT_FOUND, "任务不存在");
        }
        return todoItem;
    }

    private TodoItem toEntity(Long userId, TodoRequest request) {
        TodoItem todoItem = new TodoItem();
        todoItem.setUserId(userId);
        todoItem.setTitle(request.title());
        todoItem.setDescription(request.description());
        todoItem.setDueAt(request.dueAt());
        todoItem.setRemindAt(request.remindAt());
        applyStatusTimes(
                todoItem,
                request.status() == null ? TodoStatus.PENDING : request.status(),
                request.completedAt(),
                request.cancelledAt()
        );
        return todoItem;
    }

    private TodoResponse toResponse(TodoItem todoItem) {
        boolean overdue = todoItem.getStatus() == TodoStatus.UNFINISHED;
        boolean unfinished = todoItem.getStatus() != TodoStatus.COMPLETED && todoItem.getStatus() != TodoStatus.CANCELLED;
        return new TodoResponse(
                todoItem.getId(),
                todoItem.getTitle(),
                todoItem.getDescription(),
                todoItem.getDueAt(),
                todoItem.getRemindAt(),
                todoItem.getStatus(),
                overdue,
                unfinished,
                todoItem.getCompletedAt(),
                todoItem.getCancelledAt(),
                todoItem.getCreatedAt(),
                todoItem.getUpdatedAt()
        );
    }

    private void applyStatusTimes(
            TodoItem todoItem,
            TodoStatus status,
            OffsetDateTime completedAt,
            OffsetDateTime cancelledAt
    ) {
        todoItem.setStatus(status);
        switch (status) {
            case COMPLETED -> {
                todoItem.setCompletedAt(completedAt != null ? completedAt : OffsetDateTime.now());
                todoItem.setCancelledAt(null);
            }
            case CANCELLED -> {
                todoItem.setCompletedAt(null);
                todoItem.setCancelledAt(cancelledAt != null ? cancelledAt : OffsetDateTime.now());
            }
            default -> {
                todoItem.setCompletedAt(null);
                todoItem.setCancelledAt(null);
            }
        }
    }

    private void normalizeExpiredTodos(Long userId) {
        todoMapper.updateExpiredStatuses(userId);
    }

    private List<TodoStatus> parseStatuses(String statuses) {
        if (statuses == null || statuses.isBlank()) {
            return List.of();
        }
        List<TodoStatus> parsedStatuses = Arrays.stream(statuses.split(","))
                .map(String::trim)
                .filter(value -> !value.isEmpty())
                .map(this::parseStatus)
                .distinct()
                .toList();
        return parsedStatuses;
    }

    private TodoStatus parseStatus(String value) {
        try {
            return TodoStatus.valueOf(value);
        } catch (IllegalArgumentException exception) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "存在不支持的任务状态: " + value);
        }
    }
}
