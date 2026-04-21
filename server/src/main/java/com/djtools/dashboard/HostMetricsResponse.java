package com.djtools.dashboard;

import java.util.List;

public record HostMetricsResponse(
        double cpuUsage,
        long totalMemory,
        long availableMemory,
        long totalSwap,
        long usedSwap,
        long uptimeSeconds,
        List<DiskMetric> disks,
        List<NetworkMetric> networks
) {
    public record DiskMetric(
            String name,
            long totalBytes,
            long usableBytes,
            long readBytes,
            long writeBytes
    ) {
    }

    public record NetworkMetric(
            String name,
            long bytesRecv,
            long bytesSent
    ) {
    }
}

