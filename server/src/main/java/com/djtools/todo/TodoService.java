package com.djtools.todo;

import com.djtools.common.ApiException;
import com.djtools.security.CurrentUser;
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

    public List<TodoResponse> list(CurrentUser currentUser, String keyword) {
        return todoMapper.findAllByUser(currentUser.getId(), keyword).stream().map(this::toResponse).toList();
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
        todoItem.setStatus(request.status() == null ? TodoStatus.PENDING : request.status());
        todoItem.setCompletedAt(todoItem.getStatus() == TodoStatus.COMPLETED ? OffsetDateTime.now() : null);
        todoMapper.update(todoItem);
        return toResponse(requireTodo(currentUser.getId(), id));
    }

    @Transactional
    public TodoResponse updateStatus(CurrentUser currentUser, Long id, TodoStatusUpdateRequest request) {
        TodoItem todoItem = requireTodo(currentUser.getId(), id);
        todoItem.setStatus(request.status());
        todoItem.setCompletedAt(request.status() == TodoStatus.COMPLETED ? OffsetDateTime.now() : null);
        todoMapper.updateStatus(todoItem);
        return toResponse(requireTodo(currentUser.getId(), id));
    }

    @Transactional
    public void delete(CurrentUser currentUser, Long id) {
        requireTodo(currentUser.getId(), id);
        todoMapper.softDelete(id, currentUser.getId());
    }

    public List<TodoResponse> latest(CurrentUser currentUser, int limit) {
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
        todoItem.setStatus(request.status() == null ? TodoStatus.PENDING : request.status());
        todoItem.setCompletedAt(todoItem.getStatus() == TodoStatus.COMPLETED ? OffsetDateTime.now() : null);
        return todoItem;
    }

    private TodoResponse toResponse(TodoItem todoItem) {
        boolean overdue = todoItem.getStatus() != TodoStatus.COMPLETED
                && todoItem.getDueAt() != null
                && todoItem.getDueAt().isBefore(OffsetDateTime.now());
        boolean unfinished = todoItem.getStatus() != TodoStatus.COMPLETED;
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
                todoItem.getCreatedAt(),
                todoItem.getUpdatedAt()
        );
    }
}

