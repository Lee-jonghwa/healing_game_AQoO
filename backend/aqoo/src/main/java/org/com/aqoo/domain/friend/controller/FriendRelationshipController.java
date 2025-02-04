package org.com.aqoo.domain.friend.controller;

import lombok.RequiredArgsConstructor;
import org.com.aqoo.domain.auth.dto.UserInfoResponse;
import org.com.aqoo.domain.friend.dto.*;
import org.com.aqoo.domain.friend.service.FriendRelationshipService;
import org.com.aqoo.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/friends")
public class FriendRelationshipController {

    @Autowired
    private final FriendRelationshipService friendRelationshipService;

    @Autowired
    private final JwtUtil util;

    //친구 요청 보내기
    @PostMapping("/request")
    public ResponseEntity<Map<String, String>> createFriendRequest(@RequestBody FriendRequest request) {
        String message = friendRelationshipService.createFriendRelationship(request);

        if (message.equals("친구 요청이 실패하였습니다.")) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", message));
        } else {
            return ResponseEntity.ok(Map.of("message", message));
        }
    }

    //친구 요청 수락하기
    @PostMapping("/accept")
    public ResponseEntity<Map<String, String>> acceptFriendRequest(@RequestBody RelationshipIdRequest request) {
        String message = friendRelationshipService.acceptFriendRequest(request.getRelationshipId());

        if (message.equals("친구 요청 수락에 실패하였습니다.")) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", message));
        } else {
            return ResponseEntity.ok(Map.of("message", message));
        }
    }

    //친구 요청 거절하기 / 친구 삭제하기
    @DeleteMapping("/delete")
    public ResponseEntity<Map<String, String>> deleteFriendRelationship(@RequestBody Map<String, Long> request) {
        Long relationshipId = request.get("relationshipId");
        String message = friendRelationshipService.deleteFriendRelationship(relationshipId);

        if (message.equals("친구 삭제하기에 성공했습니다.")) {
            return ResponseEntity.ok().body(Map.of("message", message));
        } else {
            return ResponseEntity.status(400).body(Map.of("error", message));
        }
    }

    //친구 정보 조회
    @GetMapping("/{userId}")
    public ResponseEntity<?> getFriendList(@PathVariable String userId) {
        try {
            List<FriendInfo> friends = friendRelationshipService.getFriendList(userId);
            Map<String, Object> response = new HashMap<>();
            response.put("friends", friends);
            response.put("count", friends.size());
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.singletonMap("error", e.getMessage()));
        }
    }

    //키워드로 사용자 검색하기
    @GetMapping("/find-users/{keyword}")
    public ResponseEntity<?> findUsers(@PathVariable String keyword, @CookieValue(value = "refreshToken", required = false) String refreshToken) {
        if (refreshToken == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "로그인 필요"));
        }

        try {
            // 로그인된 사용자 ID 추출
            String userId = util.extractUsername(refreshToken);

            // 친구 검색
            List<FindResponse> friends = friendRelationshipService.findUsers(userId, keyword);

            if (friends.isEmpty()) {
                return ResponseEntity.status(HttpStatus.OK).body(Map.of("message", "검색된 사용자가 없습니다."));
            }

            return ResponseEntity.ok(friends);
        } catch (Exception e) {
           e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "사용자 검색에 실패했습니다."));
        }
    }
}
