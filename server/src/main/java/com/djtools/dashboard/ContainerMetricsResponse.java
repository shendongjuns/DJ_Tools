package com.djtools.dashboard;

import java.util.List;

public record ContainerMetricsResponse(
        boolean available,
        String message,
        List<ContainerMetric> items
) {
    public record ContainerMetric(
            String id,
            String name,
            String image,
            String state,
            double cpuUsage,
            long memoryUsage
    ) {
    }
}

