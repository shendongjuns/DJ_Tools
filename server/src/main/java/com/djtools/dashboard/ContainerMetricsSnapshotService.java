package com.djtools.dashboard;

import java.util.List;
import java.util.concurrent.atomic.AtomicReference;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class ContainerMetricsSnapshotService {

    private static final String UNAVAILABLE_MESSAGE = "当前环境不是带 Docker Socket 的容器部署，已自动跳过容器监控";
    private static final String INITIALIZING_MESSAGE = "Docker 容器监控尚未查询";
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

    public boolean isAvailable() {
        return collector.isAvailable();
    }

    public ContainerMetricsResponse refreshSnapshot() {
        if (!collector.isAvailable()) {
            SnapshotState unavailableState = new SnapshotState(
                    new ContainerMetricsResponse(false, UNAVAILABLE_MESSAGE, List.of()),
                    false
            );
            snapshotState.set(unavailableState);
            return unavailableState.response();
        }

        try {
            ContainerMetricsResponse collected = collector.collect();
            SnapshotState refreshedState = new SnapshotState(
                    new ContainerMetricsResponse(true, collected.message(), List.copyOf(collected.items())),
                    true
            );
            snapshotState.set(refreshedState);
            return refreshedState.response();
        } catch (RuntimeException exception) {
            return snapshotState.updateAndGet(previous -> {
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
            }).response();
        }
    }

    public ContainerMetricsResponse currentMetrics() {
        return refreshSnapshot();
    }

    private record SnapshotState(ContainerMetricsResponse response, boolean hasSuccessfulSnapshot) {
    }
}
