package com.djtools.auth;

import com.djtools.common.ApiResponse;
import com.djtools.security.SecurityUtils;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ApiResponse<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ApiResponse.success(authService.login(request), "登录成功");
    }

    @PostMapping("/refresh")
    public ApiResponse<AuthResponse> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        return ApiResponse.success(authService.refresh(request), "刷新成功");
    }

    @PostMapping("/logout")
    public ApiResponse<Void> logout(@Valid @RequestBody LogoutRequest request) {
        authService.logout(request);
        return ApiResponse.success(null, "已退出登录");
    }

    @PostMapping("/initial-password")
    public ApiResponse<AuthResponse> changeInitialPassword(@Valid @RequestBody InitialPasswordRequest request) {
        return ApiResponse.success(authService.initialPassword(SecurityUtils.currentUser(), request), "初始密码已修改");
    }
}

