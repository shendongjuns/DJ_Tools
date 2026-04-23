package com.djtools.todo;

import jakarta.validation.constraints.NotNull;
import java.time.OffsetDateTime;

public record TodoStatusUpdateRequest(
        @NotNull(message = "状态不能为空")
        TodoStatus status,
        OffsetDateTime completedAt,
        OffsetDateTime cancelledAt
) {
}
