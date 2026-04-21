package com.djtools.notification;

import java.time.OffsetDateTime;

public record NotificationResponse(
        Long id,
        String type,
        String title,
        String content,
        String relatedType,
        Long relatedId,
        OffsetDateTime remindAt,
        boolean readFlag,
        OffsetDateTime createdAt
) {
}

