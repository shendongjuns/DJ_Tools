package com.djtools.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Set;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class InitialPasswordEnforcementFilter extends OncePerRequestFilter {

    private static final Set<String> ALLOW_PATHS = Set.of(
            "/api/auth/initial-password",
            "/api/auth/logout",
            "/api/auth/refresh",
            "/api/me",
            "/actuator/health"
    );

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof CurrentUser currentUser) {
            String path = request.getRequestURI();
            boolean allowed = ALLOW_PATHS.contains(path)
                    || ("PUT".equalsIgnoreCase(request.getMethod()) && "/api/me/password".equals(path));
            if (currentUser.isForcePasswordChange() && !allowed) {
                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                response.getWriter().write("""
                        {"success":false,"message":"首次登录后请先修改密码","details":null}
                        """.trim());
                return;
            }
        }

        filterChain.doFilter(request, response);
    }
}

