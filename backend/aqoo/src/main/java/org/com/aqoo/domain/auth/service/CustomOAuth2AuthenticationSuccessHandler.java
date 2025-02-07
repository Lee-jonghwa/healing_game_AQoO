package org.com.aqoo.domain.auth.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.AllArgsConstructor;
import org.com.aqoo.domain.auth.dto.LoginResponse;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;

@Component
@AllArgsConstructor
public class CustomOAuth2AuthenticationSuccessHandler implements AuthenticationSuccessHandler {

    private final AuthService authService;
    private final ObjectMapper objectMapper;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        System.out.println("✅ OAuth2 SuccessHandler 동작");

        // 1. OAuth2User 추출
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();

        // 2. 사용자 이메일 추출 (구글/네이버 대응)
        String email = extractEmailFromOAuth2User(oAuth2User);
        System.out.println("📧 Extracted Email: " + email);

        // 3. JWT 토큰(AccessToken) 및 RefreshToken 생성
        LoginResponse loginResponse = authService.handleOAuthLogin(email);
        String refreshToken = authService.getRefreshToken(email);

        // 4. RefreshToken을 쿠키에 설정 (httpOnly, SameSite=None)
        ResponseCookie refreshTokenCookie = ResponseCookie.from("refreshToken", refreshToken)
                .httpOnly(true)
                 .secure(true) // HTTPS 환경에서 활성화
                .sameSite("None")
                .path("/")
                .maxAge(7 * 24 * 60 * 60)
                .build();

        response.addHeader("Set-Cookie", refreshTokenCookie.toString());

        // 5. 프론트엔드 최종 리다이렉트 URL 설정
        String frontendRedirectUrl = "https://i12e203.p.ssafy.io/login/social-login-callback";
        String redirectUrl = frontendRedirectUrl +
                "?accessToken=" + URLEncoder.encode(loginResponse.getAccessToken(), StandardCharsets.UTF_8) +
                "&userId=" + URLEncoder.encode(loginResponse.getUserId(), StandardCharsets.UTF_8) +
                "&nickName=" + URLEncoder.encode(loginResponse.getNickName(), StandardCharsets.UTF_8);
        response.sendRedirect(redirectUrl);
    }

    /**
     * OAuth2User에서 이메일 정보 추출 (구글/네이버 대응)
     */
    private String extractEmailFromOAuth2User(OAuth2User oAuth2User) {
        if (oAuth2User.getAttribute("email") != null) {
            return oAuth2User.getAttribute("email"); // 구글
        } else if (oAuth2User.getAttribute("response") != null) {
            Map<String, Object> responseMap = oAuth2User.getAttribute("response");
            return (String) responseMap.get("email"); // 네이버
        } else {
            throw new IllegalArgumentException("Email not found in OAuth2 response");
        }
    }
}
