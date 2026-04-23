package com.djtools.todo;

import java.time.OffsetDateTime;

public record TodoResponse(
        Long id,
        String title,
        String description,
        OffsetDateTime dueAt,
        OffsetDateTime remindAt,
        TodoStatus status,
        boolean overdue,
        boolean unfinished,
        OffsetDateTime completedAt,
        OffsetDateTime cancelledAt,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
}
