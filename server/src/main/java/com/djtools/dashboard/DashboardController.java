package com.djtools.dashboard;

import com.djtools.common.ApiResponse;
import com.djtools.security.SecurityUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/overview")
    public ApiResponse<DashboardOverviewResponse> overview() {
        return ApiResponse.success(dashboardService.overview(SecurityUtils.currentUser()));
    }

    @GetMapping("/host-metrics")
    public ApiResponse<HostMetricsResponse> hostMetrics() {
        return ApiResponse.success(dashboardService.hostMetrics());
    }

    @GetMapping("/container-metrics")
    public ApiResponse<ContainerMetricsResponse> containerMetrics() {
        return ApiResponse.success(dashboardService.containerMetrics());
    }

    @GetMapping("/app-metrics")
    public ApiResponse<AppMetricsResponse> appMetrics() {
        return ApiResponse.success(dashboardService.appMetrics());
    }
}
