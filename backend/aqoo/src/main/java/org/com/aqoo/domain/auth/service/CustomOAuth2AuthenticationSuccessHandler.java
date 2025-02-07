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

        // 1. Authentication 객체에서 OAuth2User 정보 가져오기
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();

        // 2. 사용자 이메일 추출 (구글 / 네이버 대응)
        String email = extractEmailFromOAuth2User(oAuth2User);
        System.out.println("📧 Extracted Email: " + email);

        // 3. JWT AccessToken & RefreshToken 생성
        LoginResponse loginResponse = authService.handleOAuthLogin(email);
        String refreshToken = authService.getRefreshToken(email);

        // 4. RefreshToken을 쿠키로 생성해서 담기
        ResponseCookie refreshTokenCookie = ResponseCookie.from("refreshToken", refreshToken)
                .httpOnly(true)
//                .secure(true) // HTTPS 사용 시 활성화
                .sameSite("None") // 크로스 도메인 쿠키 전송 허용
                .path("/")
                .maxAge(7 * 24 * 60 * 60)
                .build();
        response.addHeader("Set-Cookie", refreshTokenCookie.toString());

        // 5. JSON 응답으로 내려주기 (리다이렉트 X)
        response.setContentType("application/json;charset=UTF-8");
        objectMapper.writeValue(response.getWriter(), loginResponse);
    }

    /**
     * OAuth2User에서 이메일 정보 추출 (구글 / 네이버 대응)
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