package org.com.aqoo.domain.auth.controller;

import lombok.RequiredArgsConstructor;
import org.com.aqoo.domain.auth.dto.*;
import org.com.aqoo.domain.auth.service.UserService;
import org.com.aqoo.util.JwtUtil;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/users")
public class UserController {

    private final UserService userService;
    private final JwtUtil jwtUtil;

    // 회원정보 조회
    @GetMapping("/{userId}")
    public ResponseEntity<UserInfoResponse> getUserInfo(@PathVariable String userId) {
        UserInfoResponse userInfo = userService.getUserInfo(userId);
        return ResponseEntity.ok(userInfo);
    }

    // 회원 정보 수정
    @PostMapping
    public ResponseEntity<UpdateUserResponse> updateUser(@RequestBody UpdateUserRequest request) {
        UpdateUserResponse response = userService.updateUser(request);
        return ResponseEntity.ok(response);
    }

    // 경험치 증가 & 레벨업
    @PostMapping("/exp-up")
    public ResponseEntity<ExpUpResponse> increaseExp(@RequestBody ExpUpRequest request) {
        ExpUpResponse response = userService.increaseUserExp(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/isActivate/{email}")
    public ResponseEntity<Boolean> getUserStatus(@PathVariable String email) {
        return ResponseEntity.ok(userService.getAccountStatus(email));
    }

    @GetMapping("/isJoined/{email}")
    public ResponseEntity<Boolean> isArleadyAccount(@PathVariable String email) {
        return ResponseEntity.ok(userService.isAlreadyJoin(email));
    }

    @DeleteMapping
    public ResponseEntity<String> withdraw (@RequestBody WithRawRequest request, @RequestHeader("Authorization") String authHeader){
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String jwt = authHeader.substring(7);
            try {
                // JWT 토큰에서 userId (또는 username) 추출
                String userId = jwtUtil.extractUsername(jwt);
                if(userId.equals(request.getUserId())){
                    userService.changeStatus(request.getUserId());
                }
                return ResponseEntity.ok("회원상태 변경 완료" + userId);
            } catch (Exception e) {
                return ResponseEntity.badRequest().body("JWT 파싱 오류: " + e.getMessage());
            }
        } else {
            return ResponseEntity.badRequest().body("Authorization 헤더가 없거나 유효하지 않습니다.");
        }
    }

    @GetMapping("/isFirst/{userId}")
    public ResponseEntity<Boolean> isFirstLogin(@PathVariable String userId){
        return ResponseEntity.ok(userService.isFirstLogin(userId));
    }

    @PostMapping("/tutorial-complete")
    public ResponseEntity<String> isFirstLogin(@RequestBody TutorialRequest request,@CookieValue(value = "refreshToken", required = false) String refreshToken){
        if (refreshToken == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("로그인 필요");
        }
        try {
            // 로그인된 사용자 ID 추출
            String userId = jwtUtil.extractUsername(refreshToken);
            userService.tutorialComplete(userId);
            return ResponseEntity.ok("튜토리얼이 완료 되었습니다.");
        }catch (Exception e){
            return ResponseEntity.ok("잘못된 요청입니다.");
        }
    }

}