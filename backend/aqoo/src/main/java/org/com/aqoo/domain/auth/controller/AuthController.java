package org.com.aqoo.domain.auth.controller;

import com.nimbusds.openid.connect.sdk.UserInfoResponse;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.com.aqoo.domain.auth.dto.*;
import org.com.aqoo.domain.auth.entity.User;
import org.com.aqoo.domain.auth.service.AuthService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;

    // 일반 로그인
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request) {
        // 로그인 처리
        LoginResponse response = authService.login(request);

        // RefreshToken을 DB에서 가져오기
        String refreshToken = authService.getRefreshToken(request.getId());

        // RefreshToken을 쿠키에 저장
        ResponseCookie refreshTokenCookie = ResponseCookie.from("refreshToken", refreshToken)
                .httpOnly(true)
          .secure(true) // HTTPS 사용 시 활성화
                .path("/")
                .maxAge(7 * 24 * 60 * 60) // 7일(단위: 초)
                .build();

        return ResponseEntity.ok()
                .header("Set-Cookie", refreshTokenCookie.toString())
                .body(response);
    }

    // 로그아웃
    @DeleteMapping("/logout/{userId}")
    public ResponseEntity<String> logout(@PathVariable String userId, HttpServletResponse response) {
        // 서비스 호출(해당 userId에 저장된 리프레시 토큰 삭제 로직)
        authService.deleteRefreshToken(userId);

        // 쿠키 날리기
        ResponseCookie deleteCookie = ResponseCookie.from("refreshToken", "")
                .httpOnly(true)
                .path("/")
                .maxAge(0)
                .build();
        response.addHeader("Set-Cookie", deleteCookie.toString());

        return ResponseEntity.ok("Logout successful");
    }


    // 회원가입
    @PostMapping("/register")
    public ResponseEntity<RegisterResponse> register(@RequestBody RegisterRequest request) {
        RegisterResponse response = authService.register(request);
        return ResponseEntity.ok(response);
    }

    // 엑세스 토큰 재발급
    @PostMapping("/refresh")
    public ResponseEntity<RefreshResponse> refreshAccessToken(
            @CookieValue(name = "refreshToken", required = false) String refreshToken) {

        if (refreshToken == null) {
            throw new IllegalArgumentException("Refresh Token is missing");
        }

        System.out.println("쿠키에 저장된 리프레시 토큰: " + refreshToken);

        try {
            // 새로운 액세스 토큰 발급
            String newAccessToken = authService.refreshToken(refreshToken);
            String message = "엑세스 토큰 갱신 성공";
            return ResponseEntity.ok(new RefreshResponse(newAccessToken, message));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(401).body(new RefreshResponse("","Invalid or expired refresh token"));
        }

    }

    // 아이디 유효성 검사 (중복 체크)
    @PostMapping("/validate-id")
    public ResponseEntity<Map<String, Boolean>> validateUserId(@RequestBody Map<String, String> request) {
        String userId = request.get("userId");
        boolean isValid = authService.isUserIdAvailable(userId);

        Map<String, Boolean> response = new HashMap<>();
        response.put("valid", isValid);
        return ResponseEntity.ok(response);
    }

    // 이메일 유효성 검사 (중복 체크)
    @PostMapping("/validate-email")
    public ResponseEntity<Map<String, Boolean>> validateEmail(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        boolean isValid = authService.isEmailAvailable(email);

        Map<String, Boolean> response = new HashMap<>();
        response.put("valid", isValid);
        return ResponseEntity.ok(response);
    }

    // 아이디 찾기
    @PostMapping("/find-id")
    public ResponseEntity<Map<String, String>> findUserId(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        User user = authService.findUserByEmail(email);

        Map<String, String> response = new HashMap<>();

        if(user != null){
            response.put("userId", user.getId());
            return ResponseEntity.ok(response);
        } else {
            response.put("message", "해당 이메일로 등록된 아이디가 없습니다.");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }
    }

    // 비밀번호 변경
    @PostMapping("/change-password")
    public ResponseEntity<Map<String, String>> changePassword(@RequestBody ChangePasswordRequest request) {
        authService.changePassword(request);
        return ResponseEntity.ok(Map.of("message", "비밀번호 변경이 완료되었습니다."));
    }

    // 비밀번호 재설정
    @PostMapping("/new-password")
    public ResponseEntity<Map<String, String>> newPassword(@RequestBody NewPasswordRequest request) {
        authService.newPassword(request);
        return ResponseEntity.ok(Map.of("message", "비밀번호 재설정이 완료되었습니다."));
    }
}