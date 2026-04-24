package com.djtools.dashboard;

public interface ContainerMetricsCollector {

    boolean isAvailable();

    ContainerMetricsResponse collect();
}
