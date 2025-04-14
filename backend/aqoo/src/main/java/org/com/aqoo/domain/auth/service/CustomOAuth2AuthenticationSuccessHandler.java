package org.com.aqoo.domain.auth.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.com.aqoo.domain.auth.dto.LoginResponse;
import org.com.aqoo.domain.auth.entity.User;
import org.com.aqoo.repository.UserRepository;
import org.com.aqoo.util.JwtUtil;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;

@Slf4j
@Component
@AllArgsConstructor
public class CustomOAuth2AuthenticationSuccessHandler implements AuthenticationSuccessHandler {

    private final AuthService authService;
    private final UserService userService;
    private final ObjectMapper objectMapper;
    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        // 1. OAuth2User 추출
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();

        // 2. 사용자 이메일 추출 (구글/네이버 대응)
        String email = extractEmailFromOAuth2User(oAuth2User);
        log.info("OAuth2 authentication success for email: {}", email);

        // 3. 회원 상태 확인 (기존 회원/신규 회원/탈퇴 회원 처리)
        Boolean isNewUser = checkUserStatus(email, response);
        if (isNewUser == null) {
            // 탈퇴 회원의 경우 이미 리다이렉트 되었으므로 추가 처리를 중단
            return;
        }

        LoginResponse loginResponse = null;
        if (isNewUser == false) { // 기존 회원인 경우
            String refreshToken = jwtUtil.generateToken(email, "REFRESH");
            String accessToken = jwtUtil.generateToken(email, "ACCESS");
            User user = userRepository.findById(email).get();
            String nickName = user.getNickname();

            loginResponse = new LoginResponse(accessToken, email, nickName,"기존 회원");
            log.info("Generated refresh token for existing user {}: {}", email, refreshToken);

            // RefreshToken 쿠키 설정
            setRefreshTokenCookie(response, refreshToken);

        } else if (isNewUser == true) { // 신규 회원인 경우
            // 신규 회원인 경우 accessToken, nickName은 빈 문자열로 설정합니다.
            loginResponse = new LoginResponse("", email, "","신규 회원");
        }

        log.info("LoginResponse - accessToken: {}, userId: {}, nickName: {}, userStatus: {}",
                loginResponse.getAccessToken(),
                loginResponse.getUserId(),
                loginResponse.getNickName(),
                loginResponse.getMessage());

        // 6. 최종 프론트엔드 리다이렉트 URL 생성 및 리다이렉트
        String redirectUrl = loginFrontendRedirectUrl(loginResponse, isNewUser);
        log.info("Redirecting to URL: {}", redirectUrl);
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

    /**
     * 회원 상태 확인 메서드
     * - 기존 회원인 경우 false 리턴
     * - 신규 회원인 경우 true 리턴
     * - 탈퇴 회원인 경우 탈퇴 안내 페이지로 리다이렉트 후 null 리턴하여 추가 처리를 중단함
     */
    private Boolean checkUserStatus(String email, HttpServletResponse response) throws IOException {
        if (userService.isAlreadyJoin(email)) { // 이미 가입된 회원인 경우
            if (!userService.getAccountStatus(email)) { // 탈퇴한 회원인 경우
                String withdrawnRedirectUrl = "https://{domain}/user/login/account-withdrawn"
                        + "?email=" + URLEncoder.encode(email, StandardCharsets.UTF_8);
                log.info("User {} is withdrawn. Redirecting to {}", email, withdrawnRedirectUrl);
                response.sendRedirect(withdrawnRedirectUrl);
                return null; // 탈퇴 회원이므로 추가 로직 실행 중단
            }
            return false; // 기존 회원
        }
        return true; // 신규 회원
    }

    /**
     * Refresh Token을 httpOnly, SameSite=None 쿠키로 설정하는 메서드
     */
    private void setRefreshTokenCookie(HttpServletResponse response, String refreshToken) {
        ResponseCookie refreshTokenCookie = ResponseCookie.from("refreshToken", refreshToken)
                .httpOnly(true)
                .secure(true) // HTTPS 환경에서 활성화
                .sameSite("None")
                .path("/")
                .maxAge(7 * 24 * 60 * 60) // 7일
                .build();
        response.addHeader("Set-Cookie", refreshTokenCookie.toString());
        log.info("Set refresh token cookie: {}", refreshTokenCookie.toString());
    }

    /**
     * 프론트엔드 리다이렉트 URL을 생성하는 메서드
     */
    private String loginFrontendRedirectUrl(LoginResponse loginResponse, boolean isNewUser) {
        String frontendRedirectUrl = "https://{domain}/user/login/social-login-callback";

        // 안전하게 인코딩하기 위한 헬퍼 메서드 사용
        String accessToken = safeEncode(loginResponse.getAccessToken());
        String userId = safeEncode(loginResponse.getUserId());
        String nickName = safeEncode(loginResponse.getNickName());

        return frontendRedirectUrl +
                "?accessToken=" + accessToken +
                "&userId=" + userId +
                "&nickName=" + nickName +
                "&isNewUser=" + isNewUser;
    }

    /**
     * 안전하게 문자열을 인코딩하는 헬퍼 메서드.
     * 입력이 null인 경우 빈 문자열로 대체합니다.
     */
    private String safeEncode(String s) {
        return URLEncoder.encode(s == null ? "" : s, StandardCharsets.UTF_8);
    }
}
