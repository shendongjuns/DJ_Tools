package com.djtools.security;

import com.djtools.user.UserAccount;
import java.util.Collection;
import java.util.List;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

public class CurrentUser implements UserDetails {

    private final UserAccount userAccount;

    public CurrentUser(UserAccount userAccount) {
        this.userAccount = userAccount;
    }

    public Long getId() {
        return userAccount.getId();
    }

    public String getNickname() {
        return userAccount.getNickname();
    }

    public boolean isForcePasswordChange() {
        return userAccount.isForcePasswordChange();
    }

    public String getThemeId() {
        return userAccount.getThemeId();
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_USER"));
    }

    @Override
    public String getPassword() {
        return userAccount.getPasswordHash();
    }

    @Override
    public String getUsername() {
        return userAccount.getLoginAccount();
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}

