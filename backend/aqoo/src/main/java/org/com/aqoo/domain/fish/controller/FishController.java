package org.com.aqoo.domain.fish.controller;

import com.nimbusds.oauth2.sdk.http.HTTPResponse;
import lombok.RequiredArgsConstructor;
import org.com.aqoo.domain.fish.dto.CustomFishResponse;
import org.com.aqoo.domain.fish.dto.FishTypeResponseDto;
import org.com.aqoo.domain.fish.dto.UserFishResponse;
import org.com.aqoo.domain.fish.service.FishService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;

@RestController
@RequestMapping("/api/v1/fish")
@RequiredArgsConstructor
public class FishController {
    private final FishService fishService;

    @GetMapping("/all-type")
    public ResponseEntity<List<FishTypeResponseDto>> getAllFishTypes() {
        List<FishTypeResponseDto> response = fishService.getAllFishTypes();
        return ResponseEntity.ok(response);
    }

    //나의 모든 물고기 조회하기 -> 대표 물고기 선택에 사용
    @GetMapping("/my-fish/{userId}")
    public ResponseEntity<?> getUserFish(@PathVariable String userId) {
        try {
            List<UserFishResponse> fishList = fishService.getUserFish(userId);
            return ResponseEntity.ok(fishList);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Collections.singletonMap("error", "유저 물고기 조회하기에 실패했습니다."));
        }
    }

    //커스텀 물고기 조회하기
    @GetMapping("/custom/{userId}")
    public ResponseEntity<?> getCustomFish(@PathVariable String userId) {
        try {
            List<CustomFishResponse> fishList = fishService.getCustomFish(userId);
            return ResponseEntity.ok(fishList);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Collections.singletonMap("error", "커스텀 물고기 조회하기에 실패했습니다."));
        }
    }


}
