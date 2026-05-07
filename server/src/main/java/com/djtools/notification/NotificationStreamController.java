package com.djtools.notification;

import com.djtools.security.SecurityUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/notifications")
public class NotificationStreamController {

    private final NotificationStreamService notificationStreamService;

    public NotificationStreamController(NotificationStreamService notificationStreamService) {
        this.notificationStreamService = notificationStreamService;
    }

    @GetMapping("/stream")
    public SseEmitter stream() {
        return notificationStreamService.subscribe(SecurityUtils.currentUser().getId());
    }
}
