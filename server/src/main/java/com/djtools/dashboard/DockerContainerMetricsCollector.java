package com.djtools.dashboard;

import com.djtools.config.AppDockerProperties;
import com.github.dockerjava.api.DockerClient;
import com.github.dockerjava.api.async.ResultCallback;
import com.github.dockerjava.api.model.Container;
import com.github.dockerjava.api.model.Statistics;
import com.github.dockerjava.core.DefaultDockerClientConfig;
import com.github.dockerjava.core.DockerClientImpl;
import com.github.dockerjava.transport.DockerHttpClient;
import com.github.dockerjava.zerodep.ZerodepDockerHttpClient;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import org.springframework.stereotype.Service;

@Service
public class DockerContainerMetricsCollector implements ContainerMetricsCollector {

    private static final Path DOCKER_ENV_FILE = Path.of("/.dockerenv");
    private static final Path DOCKER_SOCKET_FILE = Path.of("/var/run/docker.sock");
    private static final int MAX_PARALLEL_COLLECTIONS = 4;
    private static final long STATS_TIMEOUT_MILLIS = 500;
    private final AppDockerProperties dockerProperties;

    public DockerContainerMetricsCollector(AppDockerProperties dockerProperties) {
        this.dockerProperties = dockerProperties;
    }

    @Override
    public boolean isAvailable() {
        return Files.exists(DOCKER_ENV_FILE) && Files.exists(DOCKER_SOCKET_FILE);
    }

    @Override
    public ContainerMetricsResponse collect() {
        try (DockerClient dockerClient = createDockerClient()) {
            List<Container> containers = dockerClient.listContainersCmd().withShowAll(true).exec();
            if (containers.isEmpty()) {
                return new ContainerMetricsResponse(true, "ok", List.of());
            }

            ExecutorService executor = Executors.newFixedThreadPool(Math.min(MAX_PARALLEL_COLLECTIONS, containers.size()));
            try {
                List<ContainerMetricsResponse.ContainerMetric> items = containers.stream()
                        .map(container -> CompletableFuture.supplyAsync(() -> collectContainerMetric(dockerClient, container), executor))
                        .map(CompletableFuture::join)
                        .toList();
                return new ContainerMetricsResponse(true, "ok", items);
            } finally {
                executor.shutdownNow();
            }
        } catch (RuntimeException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new IllegalStateException("Docker 容器监控不可用: " + exception.getMessage(), exception);
        }
    }

    private ContainerMetricsResponse.ContainerMetric collectContainerMetric(DockerClient dockerClient, Container container) {
        Statistics statistics = fetchStats(dockerClient, container.getId());
        double cpuUsage = 0;
        long memoryUsage = 0;
        if (statistics != null && statistics.getMemoryStats() != null) {
            memoryUsage = statistics.getMemoryStats().getUsage() == null ? 0 : statistics.getMemoryStats().getUsage();
        }
        if (statistics != null && statistics.getCpuStats() != null && statistics.getPreCpuStats() != null
                && statistics.getCpuStats().getCpuUsage() != null && statistics.getPreCpuStats().getCpuUsage() != null) {
            cpuUsage = DashboardService.calculateContainerCpuUsage(
                    statistics.getCpuStats().getCpuUsage().getTotalUsage(),
                    statistics.getPreCpuStats().getCpuUsage().getTotalUsage(),
                    statistics.getCpuStats().getSystemCpuUsage(),
                    statistics.getPreCpuStats().getSystemCpuUsage(),
                    statistics.getCpuStats().getOnlineCpus()
            );
        }
        String containerName = container.getNames() != null && container.getNames().length > 0
                ? container.getNames()[0].replaceFirst("^/", "")
                : container.getId();
        String state = container.getState() == null ? "unknown" : container.getState();
        return new ContainerMetricsResponse.ContainerMetric(
                container.getId(),
                containerName,
                container.getImage(),
                state,
                cpuUsage,
                memoryUsage
        );
    }

    private DockerClient createDockerClient() {
        DefaultDockerClientConfig config = DefaultDockerClientConfig.createDefaultConfigBuilder()
                .withDockerHost(dockerProperties.getHost())
                .build();
        DockerHttpClient httpClient = new ZerodepDockerHttpClient.Builder()
                .dockerHost(config.getDockerHost())
                .sslConfig(config.getSSLConfig())
                .build();
        return DockerClientImpl.getInstance(config, httpClient);
    }

    private Statistics fetchStats(DockerClient dockerClient, String containerId) {
        CountDownLatch latch = new CountDownLatch(1);
        StatsCallback callback = new StatsCallback(latch);
        dockerClient.statsCmd(containerId).exec(callback);
        try {
            latch.await(STATS_TIMEOUT_MILLIS, TimeUnit.MILLISECONDS);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
        } finally {
            try {
                callback.close();
            } catch (IOException ignored) {
                // 回调关闭失败不影响当前快照，直接返回已获取的数据。
            }
        }
        return callback.getStatistics();
    }

    private static class StatsCallback extends ResultCallback.Adapter<Statistics> {

        private final CountDownLatch latch;
        private Statistics statistics;

        private StatsCallback(CountDownLatch latch) {
            this.latch = latch;
        }

        @Override
        public void onNext(Statistics object) {
            this.statistics = object;
            latch.countDown();
        }

        public Statistics getStatistics() {
            return statistics;
        }
    }
}
