package org.com.aqoo.domain.friend.controller;

import lombok.RequiredArgsConstructor;
import org.com.aqoo.domain.auth.dto.UserInfoResponse;
import org.com.aqoo.domain.friend.dto.FriendInfo;
import org.com.aqoo.domain.friend.dto.FriendRequest;
import org.com.aqoo.domain.friend.dto.FriendResponse;
import org.com.aqoo.domain.friend.dto.RelationshipIdRequest;
import org.com.aqoo.domain.friend.service.FriendRelationshipService;
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
    private FriendRelationshipService friendRelationshipService;

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
            List<FriendInfo> friends = friendRelationshipService.getFriends(userId);
            Map<String, Object> response = new HashMap<>();
            response.put("friends", friends);
            response.put("count", friends.size());
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.singletonMap("error", e.getMessage()));
        }
    }
}
