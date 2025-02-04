package org.com.aqoo.domain.fish.controller;

import com.nimbusds.oauth2.sdk.http.HTTPResponse;
import lombok.RequiredArgsConstructor;
import org.com.aqoo.domain.fish.dto.FishTypeResponseDto;
import org.com.aqoo.domain.fish.service.FishService;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/aquariums")
@RequiredArgsConstructor
public class FishController {
    private final FishService fishService;

    @GetMapping("/all-type")
    public ResponseEntity<List<FishTypeResponseDto>> getAllFishTypes() {
        List<FishTypeResponseDto> response = fishService.getAllFishTypes();
        return ResponseEntity.ok(response);
    }

}
