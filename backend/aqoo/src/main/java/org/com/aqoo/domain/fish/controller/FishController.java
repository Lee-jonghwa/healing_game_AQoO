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
    public ResponseEntity<?> gotchaFish(@CookieValue(value = "refreshToken", required = false) String refreshToken) {
        if (refreshToken == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "로그인 필요"));
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

            // 이미지 저장 (예: EC2 /home/ubuntu/images/ 폴더에 저장)
            String uploadDir = "/home/ubuntu/images/";
            String filePath = uploadDir + imageFile.getOriginalFilename();
            File destFile = new File(filePath);
            imageFile.transferTo(destFile);

            // 원본 파일 저장
            File originalFile = new File(uploadDir + "processed_" + imageFile.getOriginalFilename());
            imageFile.transferTo(originalFile);

            // 변환된 이미지 저장 경로
            String outputFilePath = uploadDir + imageFile.getOriginalFilename();

            FishService.processImage(originalFile, outputFilePath);

            return ResponseEntity.ok("Upload successful: " + fishData.getFishName());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Upload failed" + e.getMessage());
        }
    }


}
