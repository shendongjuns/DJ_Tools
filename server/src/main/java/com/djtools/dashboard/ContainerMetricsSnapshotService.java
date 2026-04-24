package com.djtools.dashboard;

import jakarta.annotation.PostConstruct;
import java.util.List;
import java.util.concurrent.atomic.AtomicReference;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
public class ContainerMetricsSnapshotService {

    private static final long SNAPSHOT_REFRESH_INTERVAL_MILLIS = 5000;
    private static final String UNAVAILABLE_MESSAGE = "当前环境不是带 Docker Socket 的容器部署，已自动跳过容器监控";
    private static final String INITIALIZING_MESSAGE = "Docker 容器监控快照准备中";
    private final ContainerMetricsCollector collector;
    private final AtomicReference<SnapshotState> snapshotState = new AtomicReference<>(
            new SnapshotState(
                    new ContainerMetricsResponse(false, INITIALIZING_MESSAGE, List.of()),
                    false
            )
    );

    @Autowired
    public ContainerMetricsSnapshotService(DockerContainerMetricsCollector collector) {
        this.collector = collector;
    }

    static ContainerMetricsSnapshotService forTesting(ContainerMetricsCollector collector) {
        return new ContainerMetricsSnapshotService(collector);
    }

    private ContainerMetricsSnapshotService(ContainerMetricsCollector collector) {
        this.collector = collector;
    }

    @PostConstruct
    public void warmUp() {
        refreshSnapshot();
    }

    @Scheduled(fixedDelay = SNAPSHOT_REFRESH_INTERVAL_MILLIS)
    public void refreshSnapshot() {
        if (!collector.isAvailable()) {
            snapshotState.set(new SnapshotState(
                    new ContainerMetricsResponse(false, UNAVAILABLE_MESSAGE, List.of()),
                    false
            ));
            return;
        }

        try {
            ContainerMetricsResponse collected = collector.collect();
            snapshotState.set(new SnapshotState(
                    new ContainerMetricsResponse(true, collected.message(), List.copyOf(collected.items())),
                    true
            ));
        } catch (RuntimeException exception) {
            snapshotState.updateAndGet(previous -> {
                if (previous.hasSuccessfulSnapshot()) {
                    return new SnapshotState(
                            new ContainerMetricsResponse(
                                    true,
                                    "Docker 容器监控采样失败，继续展示上一份快照: " + exception.getMessage(),
                                    previous.response().items()
                            ),
                            true
                    );
                }
                return new SnapshotState(
                        new ContainerMetricsResponse(false, "Docker 容器监控采样失败: " + exception.getMessage(), List.of()),
                        false
                );
            });
        }
    }

    public ContainerMetricsResponse currentMetrics() {
        if (!collector.isAvailable()) {
            return new ContainerMetricsResponse(false, UNAVAILABLE_MESSAGE, List.of());
        }
        return snapshotState.get().response();
    }

    private record SnapshotState(ContainerMetricsResponse response, boolean hasSuccessfulSnapshot) {
    }
}
