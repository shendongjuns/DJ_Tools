package com.djtools.user;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
        @NotBlank(message = "昵称不能为空")
        @Size(max = 64, message = "昵称长度不能超过 64")
        String nickname,
        @NotBlank(message = "登录账号不能为空")
        @Size(max = 64, message = "登录账号长度不能超过 64")
        String loginAccount,
        String themeId
) {
}
