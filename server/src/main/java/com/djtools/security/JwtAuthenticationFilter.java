package com.djtools.security;

import com.djtools.user.UserAccount;
import com.djtools.user.UserAccountMapper;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserAccountMapper userAccountMapper;

    public JwtAuthenticationFilter(JwtService jwtService, UserAccountMapper userAccountMapper) {
        this.jwtService = jwtService;
        this.userAccountMapper = userAccountMapper;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        String authorization = request.getHeader(HttpHeaders.AUTHORIZATION);
        String token = null;
        if (authorization != null && authorization.startsWith("Bearer ")) {
            token = authorization.substring(7);
        } else if ("/api/notifications/stream".equals(request.getRequestURI()) || isAttachmentContentRequest(request)) {
            token = request.getParameter("access_token");
        }
        if (token == null || token.isBlank()) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            Claims claims = jwtService.parse(token);
            Long userId = Long.parseLong(claims.getSubject());
            UserAccount userAccount = userAccountMapper.findById(userId);
            if (userAccount != null) {
                CurrentUser currentUser = new CurrentUser(userAccount);
                UsernamePasswordAuthenticationToken authenticationToken =
                        new UsernamePasswordAuthenticationToken(currentUser, null, currentUser.getAuthorities());
                authenticationToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authenticationToken);
            }
        } catch (Exception ignored) {
            SecurityContextHolder.clearContext();
        }

        filterChain.doFilter(request, response);
    }

    private boolean isAttachmentContentRequest(HttpServletRequest request) {
        return "GET".equals(request.getMethod())
                && request.getRequestURI().matches("/api/note-attachments/\\d+/content")
                && request.getParameter("access_token") != null;
    }
}

