package org.com.aqoo.domain.fish.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nimbusds.oauth2.sdk.http.HTTPResponse;
import lombok.RequiredArgsConstructor;
import org.com.aqoo.domain.fish.dto.*;
import org.com.aqoo.domain.fish.entity.Fish;
import org.com.aqoo.domain.fish.service.FishService;
import org.com.aqoo.util.JwtUtil;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
@RestController
@RequestMapping("/api/v1/fish")
@RequiredArgsConstructor
public class FishController {
    private final FishService fishService;
    private final JwtUtil util;

    @GetMapping("/all-collection")
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

    @GetMapping("/collection/{userId}")
    public ResponseEntity<?> getCollectionFish(@PathVariable String userId) {
        try {
            List<CollectionFishResponse> fishList = fishService.getCollectionFish(userId);
            return ResponseEntity.ok(fishList);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Collections.singletonMap("error", "커스텀 물고기 조회하기에 실패했습니다."));
        }
    }

    @GetMapping("/gotcha")
    public ResponseEntity<?> gotchaFish(@RequestHeader(value = "Cookie", required = false) String cookieHeader) {
        if (cookieHeader == null || !cookieHeader.contains("refreshToken")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "헤더가 없거나 쿠키가 없거나"));
        }

        // refreshToken 추출
        String refreshToken = extractRefreshToken(cookieHeader);
        if (refreshToken == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "리프레시 토큰 안넘어옴"));
        }

        try {
            // 로그인된 사용자 ID 추출
            String userId = util.extractUsername(refreshToken);
            GotchaResponse response = fishService.gotchaFish(userId);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // 쿠키에서 refreshToken 값을 추출하는 유틸리티 함수
    private String extractRefreshToken(String cookieHeader) {
        for (String cookie : cookieHeader.split("; ")) {
            if (cookie.startsWith("refreshToken=")) {
                return cookie.substring("refreshToken=".length());
            }
        }
        return null;
    }


    @PostMapping("/newtype")
    public ResponseEntity<?> addFishType(@RequestBody FishTypeRequest request) {
        try {
            Fish newType = fishService.saveFishType(request);
            return ResponseEntity.ok(newType);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "새로운 물고기 타입 추가에 실패했습니다."));
        }
    }

    @PostMapping("/painting")
    public ResponseEntity<String> uploadFish(
            @RequestPart("fishData") String fishDataJson,
            @RequestPart("image") MultipartFile imageFile) {

        try {
            // JSON 데이터 파싱
            ObjectMapper objectMapper = new ObjectMapper();
            FishPaintingRequest fishData = objectMapper.readValue(fishDataJson, FishPaintingRequest.class);
            String imagePath = imageFile.getOriginalFilename();

            // 이미지 저장 경로 설정
            String uploadDir = "/home/ubuntu/images/";
            File dir = new File(uploadDir);
            if (!dir.exists()) {
                dir.mkdirs(); // 경로가 없으면 생성
            }

            // 원본 이미지 저장
            String originalFilePath = uploadDir + "ori_" + imagePath;
            File originalFile = new File(originalFilePath);
            imageFile.transferTo(originalFile);  // 원본 이미지 저장

            // 변환된 이미지 파일명
            String processedFilePath = uploadDir + imagePath;

            // 이미지 변환 처리
            File processedFile = FishService.processImage(originalFile, processedFilePath);

            //물고기 타입에 추가
            FishTypeRequest request = new FishTypeRequest(fishData.getFishName(),
                    "/" + imagePath,
                    fishData.getUserId());
            Fish newType = fishService.saveFishType(request);

            //유저 물고기에 추가
            fishService.saveUserFish(fishData.getUserId(), newType.getId());

            // 결과 반환
            return ResponseEntity.ok("Upload successful: " + fishData.getFishName());
        } catch (Exception e) {
            // 예외 발생 시, 상세 오류 메시지 포함하여 응답
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Upload failed: " + e.getMessage());
        }
    }



}
