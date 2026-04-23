package com.djtools.dashboard;

import com.djtools.config.AppDockerProperties;
import com.djtools.note.NoteService;
import com.djtools.notification.NotificationMapper;
import com.djtools.security.CurrentUser;
import com.djtools.todo.TodoMapper;
import com.djtools.todo.TodoService;
import com.github.dockerjava.api.DockerClient;
import com.github.dockerjava.api.async.ResultCallback;
import com.github.dockerjava.api.command.InspectContainerResponse;
import com.github.dockerjava.api.model.Container;
import com.github.dockerjava.api.model.Statistics;
import com.github.dockerjava.core.DefaultDockerClientConfig;
import com.github.dockerjava.core.DockerClientImpl;
import com.github.dockerjava.transport.DockerHttpClient;
import com.github.dockerjava.zerodep.ZerodepDockerHttpClient;
import java.io.Closeable;
import java.io.IOException;
import java.lang.management.GarbageCollectorMXBean;
import java.lang.management.ManagementFactory;
import java.lang.management.MemoryMXBean;
import java.lang.management.MemoryUsage;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import oshi.SystemInfo;
import oshi.hardware.CentralProcessor;
import oshi.hardware.GlobalMemory;
import oshi.hardware.HardwareAbstractionLayer;
import oshi.hardware.NetworkIF;
import oshi.software.os.OSFileStore;
import oshi.software.os.OperatingSystem;
import org.springframework.stereotype.Service;

@Service
public class DashboardService {

    private static final Path DOCKER_ENV_FILE = Path.of("/.dockerenv");
    private static final Path DOCKER_SOCKET_FILE = Path.of("/var/run/docker.sock");
    private final TodoMapper todoMapper;
    private final TodoService todoService;
    private final NoteService noteService;
    private final NotificationMapper notificationMapper;
    private final AppDockerProperties dockerProperties;
    private final SystemInfo systemInfo = new SystemInfo();
    private long[] previousCpuTicks;

    public DashboardService(
            TodoMapper todoMapper,
            TodoService todoService,
            NoteService noteService,
            NotificationMapper notificationMapper,
            AppDockerProperties dockerProperties
    ) {
        this.todoMapper = todoMapper;
        this.todoService = todoService;
        this.noteService = noteService;
        this.notificationMapper = notificationMapper;
        this.dockerProperties = dockerProperties;
        this.previousCpuTicks = systemInfo.getHardware().getProcessor().getSystemCpuLoadTicks();
    }

    public DashboardOverviewResponse overview(CurrentUser currentUser) {
        return new DashboardOverviewResponse(
                todoMapper.countUnfinished(currentUser.getId()),
                noteService.count(currentUser),
                notificationMapper.countUnread(currentUser.getId()),
                todoService.latest(currentUser, 5),
                noteService.latest(currentUser, 5)
        );
    }

    public HostMetricsResponse hostMetrics() {
        HardwareAbstractionLayer hardware = systemInfo.getHardware();
        CentralProcessor processor = hardware.getProcessor();
        double cpuUsage = processor.getSystemCpuLoadBetweenTicks(previousCpuTicks) * 100;
        previousCpuTicks = processor.getSystemCpuLoadTicks();

        GlobalMemory memory = hardware.getMemory();
        OperatingSystem operatingSystem = systemInfo.getOperatingSystem();

        List<HostMetricsResponse.DiskMetric> disks = new ArrayList<>();
        for (OSFileStore fileStore : operatingSystem.getFileSystem().getFileStores()) {
            disks.add(new HostMetricsResponse.DiskMetric(
                    fileStore.getName(),
                    fileStore.getTotalSpace(),
                    fileStore.getUsableSpace(),
                    0,
                    0
            ));
        }

        List<HostMetricsResponse.NetworkMetric> networks = new ArrayList<>();
        for (NetworkIF networkIF : hardware.getNetworkIFs()) {
            networkIF.updateAttributes();
            networks.add(new HostMetricsResponse.NetworkMetric(
                    networkIF.getDisplayName(),
                    networkIF.getBytesRecv(),
                    networkIF.getBytesSent()
            ));
        }

        return new HostMetricsResponse(
                round(cpuUsage),
                memory.getTotal(),
                memory.getAvailable(),
                memory.getVirtualMemory().getSwapTotal(),
                memory.getVirtualMemory().getSwapUsed(),
                operatingSystem.getSystemUptime(),
                disks,
                networks
        );
    }

    public ContainerMetricsResponse containerMetrics() {
        if (!isDockerMetricsAvailable()) {
            return new ContainerMetricsResponse(false, "当前环境不是带 Docker Socket 的容器部署，已自动跳过容器监控", List.of());
        }
        try (DockerClient dockerClient = createDockerClient()) {
            List<ContainerMetricsResponse.ContainerMetric> items = new ArrayList<>();
            for (Container container : dockerClient.listContainersCmd().withShowAll(true).exec()) {
                Statistics statistics = fetchStats(dockerClient, container.getId());
                InspectContainerResponse inspect = dockerClient.inspectContainerCmd(container.getId()).exec();
                double cpuUsage = 0;
                long memoryUsage = 0;
                if (statistics != null && statistics.getCpuStats() != null && statistics.getMemoryStats() != null) {
                    memoryUsage = statistics.getMemoryStats().getUsage() == null ? 0 : statistics.getMemoryStats().getUsage();
                    if (statistics.getCpuStats().getCpuUsage() != null && statistics.getPreCpuStats().getCpuUsage() != null) {
                        long cpuDelta = statistics.getCpuStats().getCpuUsage().getTotalUsage()
                                - statistics.getPreCpuStats().getCpuUsage().getTotalUsage();
                        long systemDelta = statistics.getCpuStats().getSystemCpuUsage()
                                - statistics.getPreCpuStats().getSystemCpuUsage();
                        if (cpuDelta > 0 && systemDelta > 0) {
                            long cpuCores = statistics.getCpuStats().getOnlineCpus() == null
                                    ? 1
                                    : statistics.getCpuStats().getOnlineCpus();
                            cpuUsage = (double) cpuDelta / systemDelta * cpuCores * 100;
                        }
                    }
                }
                String containerName = container.getNames() != null && container.getNames().length > 0
                        ? container.getNames()[0].replaceFirst("^/", "")
                        : container.getId();
                items.add(new ContainerMetricsResponse.ContainerMetric(
                        container.getId(),
                        containerName,
                        container.getImage(),
                        inspect.getState() == null ? "unknown" : inspect.getState().getStatus(),
                        round(cpuUsage),
                        memoryUsage
                ));
            }
            return new ContainerMetricsResponse(true, "ok", items);
        } catch (Exception exception) {
            return new ContainerMetricsResponse(false, "Docker 容器监控不可用: " + exception.getMessage(), List.of());
        }
    }

    public AppMetricsResponse appMetrics() {
        com.sun.management.OperatingSystemMXBean osBean =
                (com.sun.management.OperatingSystemMXBean) ManagementFactory.getOperatingSystemMXBean();
        MemoryMXBean memoryMXBean = ManagementFactory.getMemoryMXBean();
        MemoryUsage heap = memoryMXBean.getHeapMemoryUsage();
        MemoryUsage nonHeap = memoryMXBean.getNonHeapMemoryUsage();
        List<AppMetricsResponse.GcMetric> gcMetrics = ManagementFactory.getGarbageCollectorMXBeans()
                .stream()
                .map(this::toGcMetric)
                .toList();
        return new AppMetricsResponse(
                ProcessHandle.current().pid(),
                ManagementFactory.getRuntimeMXBean().getUptime(),
                round(osBean.getProcessCpuLoad() * 100),
                osBean.getCommittedVirtualMemorySize(),
                new AppMetricsResponse.MemoryMetric(heap.getUsed(), heap.getCommitted(), heap.getMax()),
                new AppMetricsResponse.MemoryMetric(nonHeap.getUsed(), nonHeap.getCommitted(), nonHeap.getMax()),
                gcMetrics
        );
    }

    private AppMetricsResponse.GcMetric toGcMetric(GarbageCollectorMXBean gcBean) {
        return new AppMetricsResponse.GcMetric(
                gcBean.getName(),
                gcBean.getCollectionCount(),
                gcBean.getCollectionTime()
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

    private boolean isDockerMetricsAvailable() {
        return Files.exists(DOCKER_ENV_FILE) && Files.exists(DOCKER_SOCKET_FILE);
    }

    private Statistics fetchStats(DockerClient dockerClient, String containerId) throws InterruptedException {
        CountDownLatch latch = new CountDownLatch(1);
        StatsCallback callback = new StatsCallback(latch);
        dockerClient.statsCmd(containerId).exec(callback);
        latch.await(3, TimeUnit.SECONDS);
        try {
            callback.close();
        } catch (IOException ignored) {
            // 统计回调关闭失败不影响主流程，直接返回已采集到的数据即可。
        }
        return callback.getStatistics();
    }

    private double round(double value) {
        return Math.round(value * 100.0) / 100.0;
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
