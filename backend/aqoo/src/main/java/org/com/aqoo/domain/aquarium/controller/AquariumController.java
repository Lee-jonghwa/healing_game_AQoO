package org.com.aqoo.domain.aquarium.controller;

import lombok.RequiredArgsConstructor;
import org.com.aqoo.domain.aquarium.dto.*;
import org.com.aqoo.domain.aquarium.entity.Aquarium;
import org.com.aqoo.domain.aquarium.service.AquariumService;
import org.com.aqoo.domain.auth.entity.User;
import org.com.aqoo.domain.friend.dto.FindResponse;
import org.com.aqoo.repository.FishRepository;
import org.com.aqoo.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.com.aqoo.repository.UserFishRepository;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "http://localhost:3000")
@RestController
@RequestMapping("/api/v1/aquariums")
@RequiredArgsConstructor
public class AquariumController {

    private final AquariumService aquariumService;

    @Autowired
    private final JwtUtil util;

    @GetMapping("/all/{userId}")
    public ResponseEntity<Map<String, Object>> getUserAquariums(@PathVariable("userId") String userId) {
        List<AquariumResponseDto> aquariums = aquariumService.getAquariumsByUserId(userId);

        Map<String, Object> response = new HashMap<>();
        response.put("aquariums", aquariums);
        response.put("count", aquariums.size());

        return ResponseEntity.ok(response);
    }

    @PostMapping("/create")
    public ResponseEntity<Aquarium> createAquarium(@Validated @RequestBody AquariumCreateRequestDto requestDto) {
        Aquarium createdAquarium = aquariumService.createAquarium(requestDto);
        return ResponseEntity.ok(createdAquarium);
    }

    @DeleteMapping
    public ResponseEntity<DeleteAquariumResponseDto> deleteAquarium(@Validated @RequestBody DeleteAquariumRequestDto requestDto) {
        DeleteAquariumResponseDto response = aquariumService.deleteAquarium(requestDto);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{aquariumId}")
    public ResponseEntity<AquariumDetailResponseDto> getAquariumDetails(@PathVariable("aquariumId") Integer aquariumId) {
        AquariumDetailResponseDto response = aquariumService.getAquariumDetails(aquariumId);
        return ResponseEntity.ok(response);
    }

    /**
     * ✅ 물고기 추가
     */
    @PostMapping("/fish/add")
    public ResponseEntity<FishResponseDto> addFishToAquarium(@Validated @RequestBody FishRequestDto requestDto) {
        FishResponseDto response = aquariumService.addFishToAquarium(requestDto);
        return ResponseEntity.ok(response);
    }

    /**
     * ✅ 물고기 이동 (다른 어항으로 옮기기)
     */
    @PostMapping("/fish/move")
    public ResponseEntity<FishResponseDto> moveFish(@Validated @RequestBody FishRequestDto requestDto) {
        FishResponseDto response = aquariumService.moveFishToAnotherAquarium(requestDto);
        return ResponseEntity.ok(response);
    }

    /**
     * ✅ 물고기 제거 (어항에서 삭제)
     */
    @PostMapping("/fish/remove")
    public ResponseEntity<FishResponseDto> removeFish(@Validated @RequestBody FishRequestDto requestDto) {
        FishResponseDto response = aquariumService.removeFishFromAquarium(requestDto);
        return ResponseEntity.ok(response);
    }

    //어항 별 물고기 조회하기 (어항에 속하지 않은 경우 aquariumId : -1)
    @GetMapping("/fish/{aquariumId}")
    public ResponseEntity<?> getAquariumFish(@PathVariable("aquariumId") int aquariumId,
                                                                       @CookieValue(value = "refreshToken", required = false) String refreshToken) {

        if (refreshToken == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "로그인 필요"));
        }

        try{
            // 로그인된 사용자 ID 추출
            String userId = util.extractUsername(refreshToken);

            List<AquariumFishResponse> response = aquariumService.getAquariumFish(userId, aquariumId);

            if (response.isEmpty()) {
                return ResponseEntity.status(HttpStatus.OK).body(Map.of("message", "해당하는 물고기가 없습니다."));
            }

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "어항 물고기 검색에 실패했습니다."));
        }
    }

    @PostMapping("/update")
    public ResponseEntity<StatusResponseDto> updateStatus(@RequestBody StatusRequestDto request) {
        StatusResponseDto response = aquariumService.updateStatus(request.getAquariumId(),request.getType(),request.getData());
        return ResponseEntity.ok(response);
    }

    /**
     * ✅ 대표 어항 설정 API
     */
    @PostMapping("/main-aqua")
    public ResponseEntity<MainAquariumResponseDto> setMainAquarium(@Validated @RequestBody MainAquariumRequestDto requestDto) {
        MainAquariumResponseDto response = aquariumService.setMainAquarium(requestDto);
        return ResponseEntity.ok(response);
    }
}
