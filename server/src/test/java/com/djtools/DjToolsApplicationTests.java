package com.djtools;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import com.djtools.config.JwtProperties;
import com.djtools.security.CurrentUser;
import com.djtools.security.JwtService;
import com.djtools.user.UserAccount;
import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.Test;

class DjToolsApplicationTests {

    @Test
    void jwtServiceCanCreateAndParseAccessToken() {
        JwtProperties jwtProperties = new JwtProperties();
        jwtProperties.setIssuer("dj-tools-test");
        jwtProperties.setSecret("change-me-please-change-me-please-change-me");
        jwtProperties.setAccessTokenExpireMinutes(60);
        jwtProperties.setRefreshTokenExpireDays(7);

        UserAccount userAccount = new UserAccount();
        userAccount.setId(1L);
        userAccount.setNickname("admin");
        userAccount.setLoginAccount("admin");
        userAccount.setPasswordHash("encoded");
        userAccount.setForcePasswordChange(false);
        userAccount.setThemeId("cartoon");

        JwtService jwtService = new JwtService(jwtProperties);
        String token = jwtService.createAccessToken(new CurrentUser(userAccount));
        Claims claims = jwtService.parse(token);

        assertNotNull(token);
        assertNotNull(claims);
        assertFalse(claims.getSubject().isBlank());
    }
}
