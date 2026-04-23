package com.djtools.dashboard;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;

import com.djtools.config.AppDockerProperties;
import com.djtools.note.NoteService;
import com.djtools.notification.NotificationMapper;
import com.djtools.todo.TodoMapper;
import com.djtools.todo.TodoService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

class DashboardServiceTests {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void appMetricsResponseDoesNotExposeDeprecatedIoFields() throws Exception {
        DashboardService dashboardService = new DashboardService(
                mock(TodoMapper.class),
                mock(TodoService.class),
                mock(NoteService.class),
                mock(NotificationMapper.class),
                new AppDockerProperties()
        );

        String json = objectMapper.writeValueAsString(dashboardService.appMetrics());

        assertTrue(json.contains("\"pid\""));
        assertFalse(json.contains("diskIoSupported"));
        assertFalse(json.contains("networkIoSupported"));
        assertFalse(json.contains("diskIoMessage"));
        assertFalse(json.contains("networkIoMessage"));
    }
}
