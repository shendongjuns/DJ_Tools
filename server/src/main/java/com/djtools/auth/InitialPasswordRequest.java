package com.djtools.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record InitialPasswordRequest(
        @NotBlank(message = "原始密码不能为空")
        String oldPassword,
        @NotBlank(message = "新密码不能为空")
        @Size(min = 6, max = 32, message = "新密码长度需要在 6 到 32 个字符之间")
        String newPassword
) {
}

