package com.djtools.todo;

import jakarta.validation.constraints.NotNull;

public record TodoStatusUpdateRequest(
        @NotNull(message = "状态不能为空")
        TodoStatus status
) {
}

