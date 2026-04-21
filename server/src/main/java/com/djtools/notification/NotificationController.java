package com.djtools.notification;

import com.djtools.common.ApiResponse;
import com.djtools.security.SecurityUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public ApiResponse<NotificationListResponse> list() {
        return ApiResponse.success(notificationService.list(SecurityUtils.currentUser()));
    }

    @PutMapping("/{id}/read")
    public ApiResponse<Void> markRead(@PathVariable Long id) {
        notificationService.markRead(SecurityUtils.currentUser(), id);
        return ApiResponse.success(null, "提醒已标记为已读");
    }
}
