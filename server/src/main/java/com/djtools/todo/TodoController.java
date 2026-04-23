package com.djtools.todo;

import com.djtools.common.ApiResponse;
import com.djtools.security.SecurityUtils;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/todos")
public class TodoController {

    private final TodoService todoService;

    public TodoController(TodoService todoService) {
        this.todoService = todoService;
    }

    @GetMapping
    public ApiResponse<List<TodoResponse>> list(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String statuses
    ) {
        return ApiResponse.success(todoService.list(SecurityUtils.currentUser(), keyword, statuses));
    }

    @PostMapping
    public ApiResponse<TodoResponse> create(@Valid @RequestBody TodoRequest request) {
        return ApiResponse.success(todoService.create(SecurityUtils.currentUser(), request), "任务已创建");
    }

    @PutMapping("/{id}")
    public ApiResponse<TodoResponse> update(@PathVariable Long id, @Valid @RequestBody TodoRequest request) {
        return ApiResponse.success(todoService.update(SecurityUtils.currentUser(), id, request), "任务已更新");
    }

    @PatchMapping("/{id}/status")
    public ApiResponse<TodoResponse> updateStatus(@PathVariable Long id, @Valid @RequestBody TodoStatusUpdateRequest request) {
        return ApiResponse.success(todoService.updateStatus(SecurityUtils.currentUser(), id, request), "任务状态已更新");
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        todoService.delete(SecurityUtils.currentUser(), id);
        return ApiResponse.success(null, "任务已删除");
    }
}
