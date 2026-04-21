package com.djtools.notification;

import java.util.List;

public record NotificationListResponse(
        long unreadCount,
        List<NotificationResponse> items
) {
}

