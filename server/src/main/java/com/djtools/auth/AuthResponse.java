package com.djtools.auth;

import com.djtools.user.UserProfileResponse;

public record AuthResponse(
        String accessToken,
        String refreshToken,
        UserProfileResponse profile
) {
}

