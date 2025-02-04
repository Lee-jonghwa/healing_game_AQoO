package org.com.aqoo.domain.fish.service;

import lombok.RequiredArgsConstructor;
import org.com.aqoo.domain.fish.dto.CustomFishResponse;
import org.com.aqoo.domain.fish.dto.UserFishResponse;
import org.com.aqoo.domain.fish.dto.FishTypeResponseDto;
import org.com.aqoo.domain.fish.entity.Fish;
import org.com.aqoo.domain.fish.entity.UserFish;
import org.com.aqoo.repository.FishRepository;
import org.com.aqoo.repository.UserFishRepository;
import org.com.aqoo.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FishService {
    private final FishRepository fishRepository;
    private final UserFishRepository userFishRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<FishTypeResponseDto> getAllFishTypes() {
        List<Fish> fishTypes = fishRepository.findAll();
        return fishTypes.stream()
                .map(fish -> new FishTypeResponseDto(fish.getId(), fish.getFishName(), fish.getImageUrl(), fish.getRarity()))
                .collect(Collectors.toList());
    }

    public List<UserFishResponse> getUserFish(String userId) {
        // 유효한 사용자 확인
        userRepository.findById(userId).orElseThrow(() -> new RuntimeException("존재하지 않는 사용자입니다."));

        // 1. user_fish 테이블에서 중복되지 않은 fishTypeId 목록 가져오기
        List<Integer> uniqueFishTypeIds = userFishRepository.findDistinctFishTypeIdsByUserId(userId);

        // 2. fish_type 테이블에서 해당 fishTypeId 목록에 속하는 물고기 정보 가져오기
        List<Fish> list = fishRepository.findByIdIn(uniqueFishTypeIds);

        // 3. UserFishResponse 객체로 변환하여 반환
        return list.stream()
                .map(item -> new UserFishResponse(
                        item.getId(),        // fishTypeId
                        item.getFishName(),  // 물고기 이름
                        item.getImageUrl()
                ))
                .toList();
    }

    public List<CustomFishResponse> getCustomFish(String userId) {
        // 유효한 사용자 확인
        userRepository.findById(userId).orElseThrow(() -> new RuntimeException("존재하지 않는 사용자입니다."));

        // 1. fish_type 테이블에서 rarity가 해당 사용자 ID와 같은 물고기 목록 가져오기
        List<Fish> customFishTypes = fishRepository.findByRarity(userId);

        // 2. CustomFishResponse 객체로 변환하여 반환
        return customFishTypes.stream()
                .map(fishType -> new CustomFishResponse(
                        fishType.getId(),        // fishTypeId
                        fishType.getFishName(),  // 물고기 이름
                        fishType.getImageUrl()   // 물고기 이미지
                ))
                .toList();
    }
}
