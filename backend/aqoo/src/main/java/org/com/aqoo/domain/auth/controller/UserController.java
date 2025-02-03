package org.com.aqoo.domain.auth.controller;

import lombok.RequiredArgsConstructor;
import org.com.aqoo.domain.auth.dto.UserInfoResponse;
import org.com.aqoo.domain.auth.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/users")
public class UserController {

    private final AuthService authService;

    // 회원정보 조회
    @GetMapping("/{userId}")
    public ResponseEntity<UserInfoResponse> getUserInfo(@PathVariable String userId) {
        UserInfoResponse userInfo = authService.getUserInfo(userId);
        return ResponseEntity.ok(userInfo);
    }


}