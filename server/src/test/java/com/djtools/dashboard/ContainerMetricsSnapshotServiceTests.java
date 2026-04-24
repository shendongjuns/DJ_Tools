package com.djtools.dashboard;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import org.junit.jupiter.api.Test;

class ContainerMetricsSnapshotServiceTests {

    @Test
    void currentMetricsReturnsUnavailableWhenDockerMonitoringIsNotAvailable() {
        FakeContainerMetricsCollector collector = new FakeContainerMetricsCollector(false);
        ContainerMetricsSnapshotService snapshotService = ContainerMetricsSnapshotService.forTesting(collector);

        ContainerMetricsResponse response = snapshotService.currentMetrics();

        assertFalse(response.available());
        assertTrue(response.message().contains("自动跳过容器监控"));
        assertEquals(0, collector.collectCalls);
    }

    @Test
    void refreshSnapshotCachesCollectedMetricsForSubsequentReads() {
        FakeContainerMetricsCollector collector = new FakeContainerMetricsCollector(true);
        ContainerMetricsResponse collected = new ContainerMetricsResponse(
                true,
                "ok",
                List.of(new ContainerMetricsResponse.ContainerMetric(
                        "container-1",
                        "web",
                        "dj-tools/web:1.0.0",
                        "running",
                        12.5,
                        1024
                ))
        );
        collector.nextResponse = collected;
        ContainerMetricsSnapshotService snapshotService = ContainerMetricsSnapshotService.forTesting(collector);

        snapshotService.refreshSnapshot();
        ContainerMetricsResponse response = snapshotService.currentMetrics();

        assertTrue(response.available());
        assertEquals(collected.items(), response.items());
        assertEquals(1, collector.collectCalls);
    }

    @Test
    void refreshSnapshotKeepsPreviousSuccessfulSnapshotWhenCollectionFails() {
        FakeContainerMetricsCollector collector = new FakeContainerMetricsCollector(true);
        ContainerMetricsResponse collected = new ContainerMetricsResponse(
                true,
                "ok",
                List.of(new ContainerMetricsResponse.ContainerMetric(
                        "container-1",
                        "server",
                        "dj-tools/server:1.0.0",
                        "running",
                        8.2,
                        2048
                ))
        );
        collector.nextResponse = collected;
        ContainerMetricsSnapshotService snapshotService = ContainerMetricsSnapshotService.forTesting(collector);

        snapshotService.refreshSnapshot();
        collector.throwOnCollect = true;

        snapshotService.refreshSnapshot();
        ContainerMetricsResponse response = snapshotService.currentMetrics();

        assertTrue(response.available());
        assertEquals(collected.items(), response.items());
        assertTrue(response.message().contains("上一份"));
        assertEquals(2, collector.collectCalls);
    }

    private static final class FakeContainerMetricsCollector implements ContainerMetricsCollector {

        private final boolean available;
        private int collectCalls;
        private boolean throwOnCollect;
        private ContainerMetricsResponse nextResponse = new ContainerMetricsResponse(true, "ok", List.of());

        private FakeContainerMetricsCollector(boolean available) {
            this.available = available;
        }

        @Override
        public boolean isAvailable() {
            return available;
        }

        @Override
        public ContainerMetricsResponse collect() {
            collectCalls += 1;
            if (throwOnCollect) {
                throw new IllegalStateException("collector boom");
            }
            return nextResponse;
        }
    }
}
