package org.com.aqoo.domain.aquarium.controller;

import lombok.RequiredArgsConstructor;
import org.com.aqoo.domain.aquarium.dto.AquariumBackgroundResponseDto;
import org.com.aqoo.domain.aquarium.service.AquariumBackgroundService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/aquariums/backgrounds")
@RequiredArgsConstructor
public class AquariumBackgroundController {

    private final AquariumBackgroundService aquariumBackgroundService;

    /**
     * ✅ 모든 어항 배경 조회 API
     */
    @GetMapping("/all")
    public ResponseEntity<List<AquariumBackgroundResponseDto>> getAllBackgrounds() {
        return ResponseEntity.ok(aquariumBackgroundService.getAllBackgrounds());
    }
}
