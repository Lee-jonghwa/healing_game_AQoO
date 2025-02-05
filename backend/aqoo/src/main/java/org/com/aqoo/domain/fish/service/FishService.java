package org.com.aqoo.domain.fish.service;

import lombok.RequiredArgsConstructor;
import org.com.aqoo.domain.auth.entity.User;
import org.com.aqoo.domain.fish.dto.*;
import org.com.aqoo.domain.fish.entity.Fish;
import org.com.aqoo.domain.fish.entity.UserFish;
import org.com.aqoo.repository.FishRepository;
import org.com.aqoo.repository.UserFishRepository;
import org.com.aqoo.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FishService {
    private final FishRepository fishRepository;
    private final UserFishRepository userFishRepository;
    private final UserRepository userRepository;
    private final Random random = new Random();

    @Transactional(readOnly = true)
    public List<FishTypeResponseDto> getAllFishTypes() {
        List<Fish> fishTypes = fishRepository.findByRarityInIgnoreCase();
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

    public List<CollectionFishResponse> getCollectionFish(String userId) {
        // 유효한 사용자 확인
        userRepository.findById(userId).orElseThrow(() -> new RuntimeException("존재하지 않는 사용자입니다."));

        // 1. user_fish 테이블에서 사용자의 물고기 목록을 가져오고 fishTypeId 별로 개수를 센다.
        List<Object[]> fishCountList = userFishRepository.countFishByUserId(userId);

        Map<Integer, Integer> fishCountMap = new HashMap<>();

        for (Object[] row : fishCountList) {
            Integer fishTypeId = (Integer) row[0]; // fishTypeId
            Integer count = ((Number) row[1]).intValue(); // count 값 변환
            fishCountMap.put(fishTypeId, count);
        }

        // 2. fish_type 테이블에서 해당 fishTypeId 목록을 가져온다.
        List<Integer> fishTypeIds = new ArrayList<>(fishCountMap.keySet()); // Set -> List 변환
        List<Fish> fishTypes = fishRepository.findByIdInAndRarityIgnoreCase(fishTypeIds);

        // 3. 응답 객체로 변환하여 반환
        return fishTypes.stream()
                .map(fishType -> new CollectionFishResponse(
                        fishType.getId(),        // fishTypeId
                        fishType.getFishName(),  // 물고기 이름
                        fishType.getImageUrl(),  // 물고기 이미지
                        fishCountMap.getOrDefault(fishType.getId(), 0) // 해당 타입의 물고기 개수
                ))
                .toList();
    }

    public GotchaResponse gotchaFish(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자가 존재하지 않습니다."));

        // 1. 난수 생성 (0~99)
        int chance = random.nextInt(100);

        // 2. 확률에 따라 rarity 결정
        String rarity;
        if (chance < 60) {
            rarity = "COMMON";
        } else if (chance < 90) {
            rarity = "RARE";
        } else {
            rarity = "EPIC";
        }

        // 3. 해당 rarity의 물고기 중 랜덤 선택
        List<Fish> fishList = fishRepository.findByRarity(rarity);
        if (fishList.isEmpty()) {
            throw new IllegalStateException("해당 희귀도의 물고기가 존재하지 않습니다.");
        }
        Fish selectedFish = fishList.get(random.nextInt(fishList.size()));

        // 4. 물고기 저장
        UserFish newone = new UserFish();
        newone.setUserId(user.getId());
        newone.setFishTypeId(selectedFish.getId());
        UserFish userFish = userFishRepository.save(newone);

        Integer userFishId = userFish.getId(); // 저장 후 ID 바로 가져오기


        // 5. 결과 응답
        return new GotchaResponse(
                userFishId,
                selectedFish.getId(),
                selectedFish.getFishName(),
                selectedFish.getRarity(),
                selectedFish.getImageUrl());
    }

}
