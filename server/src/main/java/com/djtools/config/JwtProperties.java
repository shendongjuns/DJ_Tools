package com.djtools.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.jwt")
public class JwtProperties {

    private String issuer;
    private String secret;
    private long accessTokenExpireMinutes;
    private long refreshTokenExpireDays;

    public String getIssuer() {
        return issuer;
    }

    public void setIssuer(String issuer) {
        this.issuer = issuer;
    }

    public String getSecret() {
        return secret;
    }

    public void setSecret(String secret) {
        this.secret = secret;
    }

    public long getAccessTokenExpireMinutes() {
        return accessTokenExpireMinutes;
    }

    public void setAccessTokenExpireMinutes(long accessTokenExpireMinutes) {
        this.accessTokenExpireMinutes = accessTokenExpireMinutes;
    }

    public long getRefreshTokenExpireDays() {
        return refreshTokenExpireDays;
    }

    public void setRefreshTokenExpireDays(long refreshTokenExpireDays) {
        this.refreshTokenExpireDays = refreshTokenExpireDays;
    }
}

