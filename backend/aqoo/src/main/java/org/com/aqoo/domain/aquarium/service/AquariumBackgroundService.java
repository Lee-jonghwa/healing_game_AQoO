package org.com.aqoo.domain.aquarium.service;

import lombok.RequiredArgsConstructor;
import org.com.aqoo.domain.aquarium.dto.AquariumBackgroundResponseDto;
import org.com.aqoo.domain.aquarium.entity.AquariumBackground;
import org.com.aqoo.repository.AquariumBackgroundRepository;
import org.com.aqoo.util.ImageUrlUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AquariumBackgroundService {
    private final AquariumBackgroundRepository aquariumBackgroundRepository;
    private final ImageUrlUtils imageUtils;

    /**
     * ✅ 모든 어항 배경 조회
     */
    @Transactional(readOnly = true)
    public List<AquariumBackgroundResponseDto> getAllBackgrounds() {
        List<AquariumBackground> backgrounds = aquariumBackgroundRepository.findAll();
        return backgrounds.stream()
                .map(bg -> new AquariumBackgroundResponseDto(bg.getId(), imageUtils.toAbsoluteUrl(bg.getImageUrl())))
                .collect(Collectors.toList());
    }
}
