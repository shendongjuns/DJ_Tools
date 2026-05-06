package com.djtools.dashboard;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.djtools.note.NoteService;
import com.djtools.notification.NotificationMapper;
import com.djtools.todo.TodoMapper;
import com.djtools.todo.TodoService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

class DashboardServiceTests {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void appMetricsResponseExposesDeploymentAndDockerAvailabilityFlags() throws Exception {
        ContainerMetricsSnapshotService snapshotService = mock(ContainerMetricsSnapshotService.class);
        when(snapshotService.isAvailable()).thenReturn(true);

        DashboardService dashboardService = new DashboardService(
                mock(TodoMapper.class),
                mock(TodoService.class),
                mock(NoteService.class),
                mock(NotificationMapper.class),
                snapshotService
        );

        String json = objectMapper.writeValueAsString(dashboardService.appMetrics());

        assertTrue(json.contains("\"pid\""));
        assertTrue(json.contains("\"containerDeployment\""));
        assertTrue(json.contains("\"dockerMonitoringAvailable\""));
        assertFalse(json.contains("diskIoSupported"));
        assertFalse(json.contains("networkIoSupported"));
        assertFalse(json.contains("diskIoMessage"));
        assertFalse(json.contains("networkIoMessage"));
    }

    @Test
    void calculateContainerCpuUsageReturnsZeroWhenDockerStatsMissSystemCpuUsage() {
        double cpuUsage = DashboardService.calculateContainerCpuUsage(
                1000L,
                600L,
                null,
                300L,
                2L
        );

        assertEquals(0.0, cpuUsage);
    }

    @Test
    void calculateContainerCpuUsageUsesOnlineCpuCountWhenStatsAreComplete() {
        double cpuUsage = DashboardService.calculateContainerCpuUsage(
                1500L,
                500L,
                5000L,
                3000L,
                2L
        );

        assertEquals(100.0, cpuUsage);
    }
}
