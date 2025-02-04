package org.com.aqoo.domain.aquarium.controller;

import lombok.RequiredArgsConstructor;
import org.com.aqoo.domain.aquarium.dto.*;
import org.com.aqoo.domain.aquarium.entity.Aquarium;
import org.com.aqoo.domain.aquarium.service.AquariumService;
import org.com.aqoo.repository.FishRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.com.aqoo.repository.UserFishRepository;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/aquariums")
@RequiredArgsConstructor
public class AquariumController {

    private final AquariumService aquariumService;
    private final UserFishRepository userFishRepository;
    private final FishRepository fishRepository;

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

//    물고기 추가
    @PostMapping("/fish")
    public ResponseEntity<FishAddResponseDto> addFishToAquarium(@Validated @RequestBody FishAddRequestDto requestDto) {
        FishAddResponseDto response = aquariumService.addFishToAquarium(requestDto);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/non-group/{userId}")
    public ResponseEntity<NonGroupedFishResponseDto> getNonGroupedFishes(@PathVariable("userId") String userId) {
        NonGroupedFishResponseDto response = aquariumService.getNonGroupedFishes(userId);
        return ResponseEntity.ok(response);
    }

}
