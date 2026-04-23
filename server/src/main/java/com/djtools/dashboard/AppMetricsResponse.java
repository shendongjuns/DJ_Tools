package com.djtools.dashboard;

import java.util.List;

public record AppMetricsResponse(
        long pid,
        long uptimeMillis,
        double processCpuLoad,
        long processMemoryBytes,
        MemoryMetric heapMemory,
        MemoryMetric nonHeapMemory,
        List<GcMetric> gcMetrics
) {
    public record MemoryMetric(long used, long committed, long max) {
    }

    public record GcMetric(String name, long collectionCount, long collectionTime) {
    }
}
