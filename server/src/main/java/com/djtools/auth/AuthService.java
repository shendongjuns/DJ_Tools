package com.djtools.auth;

import com.djtools.common.ApiException;
import com.djtools.config.JwtProperties;
import com.djtools.security.CurrentUser;
import com.djtools.security.JwtService;
import com.djtools.user.RefreshTokenMapper;
import com.djtools.user.RefreshTokenRecord;
import com.djtools.user.UserAccount;
import com.djtools.user.UserAccountMapper;
import com.djtools.user.UserProfileResponse;
import com.djtools.user.UserService;
import java.time.OffsetDateTime;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserAccountMapper userAccountMapper;
    private final RefreshTokenMapper refreshTokenMapper;
    private final UserService userService;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final JwtProperties jwtProperties;

    public AuthService(
            UserAccountMapper userAccountMapper,
            RefreshTokenMapper refreshTokenMapper,
            UserService userService,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            JwtProperties jwtProperties
    ) {
        this.userAccountMapper = userAccountMapper;
        this.refreshTokenMapper = refreshTokenMapper;
        this.userService = userService;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.jwtProperties = jwtProperties;
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        UserAccount userAccount = userAccountMapper.findByLoginAccount(request.loginAccount());
        if (userAccount == null || !passwordEncoder.matches(request.password(), userAccount.getPasswordHash())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "账号或密码错误");
        }
        refreshTokenMapper.revokeExpired(OffsetDateTime.now());
        return buildAuthResponse(userAccount);
    }

    @Transactional
    public AuthResponse refresh(RefreshTokenRequest request) {
        RefreshTokenRecord refreshTokenRecord = refreshTokenMapper.findActiveByToken(request.refreshToken());
        if (refreshTokenRecord == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "刷新令牌无效或已过期");
        }
        UserAccount userAccount = userAccountMapper.findById(refreshTokenRecord.getUserId());
        refreshTokenMapper.revokeByToken(request.refreshToken());
        return buildAuthResponse(userAccount);
    }

    @Transactional
    public void logout(LogoutRequest request) {
        refreshTokenMapper.revokeByToken(request.refreshToken());
    }

    @Transactional
    public AuthResponse initialPassword(CurrentUser currentUser, InitialPasswordRequest request) {
        UserAccount userAccount = userAccountMapper.findById(currentUser.getId());
        if (!passwordEncoder.matches(request.oldPassword(), userAccount.getPasswordHash())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "原始密码不正确");
        }
        userAccount.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userAccount.setPasswordChanged(true);
        userAccount.setForcePasswordChange(false);
        userAccountMapper.updatePassword(userAccount);
        refreshTokenMapper.revokeByUserId(userAccount.getId());
        return buildAuthResponse(userAccountMapper.findById(userAccount.getId()));
    }

    private AuthResponse buildAuthResponse(UserAccount userAccount) {
        CurrentUser currentUser = new CurrentUser(userAccount);
        String accessToken = jwtService.createAccessToken(currentUser);

        RefreshTokenRecord refreshTokenRecord = new RefreshTokenRecord();
        refreshTokenRecord.setUserId(userAccount.getId());
        refreshTokenRecord.setToken(UUID.randomUUID().toString().replace("-", ""));
        refreshTokenRecord.setRevoked(false);
        refreshTokenRecord.setExpiresAt(OffsetDateTime.now().plusDays(jwtProperties.getRefreshTokenExpireDays()));
        refreshTokenMapper.insert(refreshTokenRecord);

        UserProfileResponse profile = userService.toProfile(userAccount);
        return new AuthResponse(accessToken, refreshTokenRecord.getToken(), profile);
    }
}

