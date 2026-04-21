package com.djtools.auth;

import jakarta.validation.constraints.NotBlank;

public record LogoutRequest(
        @NotBlank(message = "刷新令牌不能为空")
        String refreshToken
) {
}

