package com.djtools.dashboard;

import com.djtools.note.NoteService;
import com.djtools.notification.NotificationMapper;
import com.djtools.security.CurrentUser;
import com.djtools.todo.TodoMapper;
import com.djtools.todo.TodoService;
import java.lang.management.GarbageCollectorMXBean;
import java.lang.management.ManagementFactory;
import java.lang.management.MemoryMXBean;
import java.lang.management.MemoryUsage;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
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
    private final ContainerMetricsSnapshotService containerMetricsSnapshotService;
    private final SystemInfo systemInfo = new SystemInfo();
    private long[] previousCpuTicks;

    public DashboardService(
            TodoMapper todoMapper,
            TodoService todoService,
            NoteService noteService,
            NotificationMapper notificationMapper,
            ContainerMetricsSnapshotService containerMetricsSnapshotService
    ) {
        this.todoMapper = todoMapper;
        this.todoService = todoService;
        this.noteService = noteService;
        this.notificationMapper = notificationMapper;
        this.containerMetricsSnapshotService = containerMetricsSnapshotService;
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
        return containerMetricsSnapshotService.currentMetrics();
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
                gcMetrics,
                isContainerDeployment()
        );
    }

    private AppMetricsResponse.GcMetric toGcMetric(GarbageCollectorMXBean gcBean) {
        return new AppMetricsResponse.GcMetric(
                gcBean.getName(),
                gcBean.getCollectionCount(),
                gcBean.getCollectionTime()
        );
    }

    private boolean isContainerDeployment() {
        return Files.exists(DOCKER_ENV_FILE);
    }

    static double calculateContainerCpuUsage(
            Long totalUsage,
            Long previousTotalUsage,
            Long systemCpuUsage,
            Long previousSystemCpuUsage,
            Long onlineCpus
    ) {
        if (totalUsage == null || previousTotalUsage == null || systemCpuUsage == null || previousSystemCpuUsage == null) {
            return 0;
        }
        long cpuDelta = totalUsage - previousTotalUsage;
        long systemDelta = systemCpuUsage - previousSystemCpuUsage;
        if (cpuDelta <= 0 || systemDelta <= 0) {
            return 0;
        }
        long cpuCores = onlineCpus == null || onlineCpus <= 0 ? 1 : onlineCpus;
        return round((double) cpuDelta / systemDelta * cpuCores * 100);
    }

    private static double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}
