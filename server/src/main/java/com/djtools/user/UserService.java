package com.djtools.user;

import com.djtools.common.ApiException;
import com.djtools.security.CurrentUser;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private final UserAccountMapper userAccountMapper;
    private final RefreshTokenMapper refreshTokenMapper;
    private final PasswordEncoder passwordEncoder;

    public UserService(
            UserAccountMapper userAccountMapper,
            RefreshTokenMapper refreshTokenMapper,
            PasswordEncoder passwordEncoder
    ) {
        this.userAccountMapper = userAccountMapper;
        this.refreshTokenMapper = refreshTokenMapper;
        this.passwordEncoder = passwordEncoder;
    }

    public UserProfileResponse getProfile(CurrentUser currentUser) {
        UserAccount userAccount = userAccountMapper.findById(currentUser.getId());
        return toProfile(userAccount);
    }

    @Transactional
    public UserProfileResponse updateProfile(CurrentUser currentUser, UpdateProfileRequest request) {
        UserAccount exists = userAccountMapper.findByLoginAccount(request.loginAccount());
        if (exists != null && !exists.getId().equals(currentUser.getId())) {
            throw new ApiException(HttpStatus.CONFLICT, "登录账号已存在");
        }

        UserAccount userAccount = userAccountMapper.findById(currentUser.getId());
        userAccount.setNickname(request.nickname());
        userAccount.setLoginAccount(request.loginAccount());
        if (request.themeId() != null && !request.themeId().isBlank()) {
            userAccount.setThemeId(request.themeId());
        }
        userAccountMapper.updateProfile(userAccount);
        refreshTokenMapper.revokeByUserId(currentUser.getId());
        return toProfile(userAccountMapper.findById(currentUser.getId()));
    }

    @Transactional
    public void changePassword(CurrentUser currentUser, ChangePasswordRequest request) {
        UserAccount userAccount = userAccountMapper.findById(currentUser.getId());
        if (!passwordEncoder.matches(request.oldPassword(), userAccount.getPasswordHash())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "原密码不正确");
        }
        userAccount.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userAccount.setPasswordChanged(true);
        userAccount.setForcePasswordChange(false);
        userAccountMapper.updatePassword(userAccount);
        refreshTokenMapper.revokeByUserId(currentUser.getId());
    }

    public UserProfileResponse toProfile(UserAccount userAccount) {
        return new UserProfileResponse(
                userAccount.getId(),
                userAccount.getNickname(),
                userAccount.getLoginAccount(),
                userAccount.getThemeId(),
                userAccount.isForcePasswordChange()
        );
    }
}
