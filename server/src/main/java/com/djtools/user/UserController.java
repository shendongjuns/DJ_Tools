package com.djtools.user;

import com.djtools.common.ApiResponse;
import com.djtools.security.SecurityUtils;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/me")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public ApiResponse<UserProfileResponse> getProfile() {
        return ApiResponse.success(userService.getProfile(SecurityUtils.currentUser()));
    }

    @PutMapping("/profile")
    public ApiResponse<UserProfileResponse> updateProfile(@Valid @RequestBody UpdateProfileRequest request) {
        return ApiResponse.success(userService.updateProfile(SecurityUtils.currentUser(), request), "个人信息已更新");
    }

    @PutMapping("/password")
    public ApiResponse<Void> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        userService.changePassword(SecurityUtils.currentUser(), request);
        return ApiResponse.success(null, "密码已更新，请重新登录");
    }
}

