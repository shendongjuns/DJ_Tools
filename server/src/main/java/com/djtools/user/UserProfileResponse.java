package com.djtools.user;

public record UserProfileResponse(
        Long id,
        String nickname,
        String loginAccount,
        String themeId,
        boolean forcePasswordChange
) {
}

