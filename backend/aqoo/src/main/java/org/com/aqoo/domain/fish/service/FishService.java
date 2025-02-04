package org.com.aqoo.domain.fish.service;

import lombok.RequiredArgsConstructor;
import org.com.aqoo.domain.fish.dto.FishTypeResponseDto;
import org.com.aqoo.domain.fish.entity.FishType;
import org.com.aqoo.domain.fish.entity.UserFish;
import org.com.aqoo.repository.FishTypeRepository;
import org.com.aqoo.repository.UserFishRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FishService {
    private final FishTypeRepository fishTypeRepository;
    private final UserFishRepository userFishRepository;

    @Transactional(readOnly = true)
    public List<FishTypeResponseDto> getAllFishTypes() {
        List<FishType> fishTypes = fishTypeRepository.findAll();
        return fishTypes.stream()
                .map(fish -> new FishTypeResponseDto(fish.getId(), fish.getFishName(), fish.getImageUrl(), fish.getRarity()))
                .collect(Collectors.toList());
    }

}
