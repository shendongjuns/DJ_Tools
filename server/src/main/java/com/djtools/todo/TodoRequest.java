package com.djtools.todo;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.OffsetDateTime;

public record TodoRequest(
        @NotBlank(message = "任务标题不能为空")
        @Size(max = 128, message = "任务标题不能超过 128 个字符")
        String title,
        @Size(max = 2000, message = "任务描述不能超过 2000 个字符")
        String description,
        OffsetDateTime dueAt,
        OffsetDateTime remindAt,
        OffsetDateTime completedAt,
        OffsetDateTime cancelledAt,
        TodoStatus status
) {
}
