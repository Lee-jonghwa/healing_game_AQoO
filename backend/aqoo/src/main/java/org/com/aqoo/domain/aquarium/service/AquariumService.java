package org.com.aqoo.domain.aquarium.service;

import lombok.RequiredArgsConstructor;
import org.com.aqoo.domain.aquarium.dto.*;
import org.com.aqoo.domain.aquarium.entity.Aquarium;
import org.com.aqoo.repository.AquariumRepository;
import org.com.aqoo.domain.fish.entity.FishType;
import org.com.aqoo.domain.fish.entity.UserFish;
import org.com.aqoo.repository.FishTypeRepository;
import org.com.aqoo.repository.UserFishRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AquariumService {

    private final AquariumRepository aquariumRepository;
    private final UserFishRepository userFishRepository;
    private final FishTypeRepository fishTypeRepository;

    public List<AquariumResponseDto> getAquariumsByUserId(String userId) {
        List<Aquarium> aquariums = aquariumRepository.findByUserId(userId);

        return aquariums.stream().map(aquarium -> {
            return new AquariumResponseDto(
                aquarium.getId(),
                aquarium.getAquariumName(),
                aquarium.getLastFedTime(),
                aquarium.getLastWaterChangeTime(),
                calculateWaterCondition(aquarium),
                aquarium.getLastCleanedTime(),
                calculatePollutionStatus(aquarium)
            );
        }).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public AquariumDetailResponseDto getAquariumDetails(Integer aquariumId) {
        // 어항 정보 조회
        Optional<Aquarium> aquariumOpt = aquariumRepository.findById(aquariumId);
        if (aquariumOpt.isEmpty()) {
            throw new IllegalArgumentException("어항을 찾을 수 없습니다.");
        }
        Aquarium aquarium = aquariumOpt.get();

        // 어항 속 물고기 개수 조회
        List<Object[]> fishCounts = userFishRepository.countFishesInAquarium(aquariumId);

        List<FishCountDto> fishList = fishCounts.stream().map(fishData -> {
            Integer fishTypeId = (Integer) fishData[0];
            Long count = (Long) fishData[1];

            // 물고기 종류 조회
            FishType fishType = fishTypeRepository.findById(fishTypeId)
                    .orElseThrow(() -> new IllegalArgumentException("해당하는 물고기 타입을 찾을 수 없습니다."));

            return new FishCountDto(fishType.getFishName(), count);
        }).collect(Collectors.toList());

        return new AquariumDetailResponseDto(aquarium.getAquariumBackgroundId(), fishList);
    }


    @Transactional
    public Aquarium createAquarium(AquariumCreateRequestDto requestDto) {
        Aquarium aquarium = new Aquarium();
        aquarium.setAquariumName(requestDto.getAquariumName());
        aquarium.setUserId(requestDto.getUserId());
        aquarium.setAquariumBackgroundId(Integer.parseInt(requestDto.getAquariumBack())); // 숫자로 변환

        // 기본값 설정
        aquarium.setLastFedTime(LocalDateTime.now());
        aquarium.setLastWaterChangeTime(LocalDateTime.now());
        aquarium.setLastCleanedTime(LocalDateTime.now());

        return aquariumRepository.save(aquarium);
    }

    @Transactional
    public FishAddResponseDto addFishToAquarium(FishAddRequestDto requestDto) {
        UserFish userFish = userFishRepository.findById(requestDto.getId())
                .orElseThrow(() -> new IllegalArgumentException("해당 물고기가 존재하지 않습니다."));

        // 어항 ID 업데이트
        userFish.setAquariumId(requestDto.getAquariumId());
        userFishRepository.save(userFish);

        return new FishAddResponseDto("성공", "어항에 물고기 추가하기에 성공했습니다.");
    }

    @Transactional(readOnly = true)
    public NonGroupedFishResponseDto getNonGroupedFishes(String userId) {
        // 어항에 속하지 않은 물고기 개수 조회
        List<Object[]> fishCounts = userFishRepository.countNonGroupedFishes(userId);

        List<FishCountDto> fishList = fishCounts.stream().map(fishData -> {
            Integer fishTypeId = (Integer) fishData[0];
            Long count = (Long) fishData[1];

            // 물고기 타입 조회
            FishType fishType = fishTypeRepository.findById(fishTypeId)
                    .orElseThrow(() -> new IllegalArgumentException("해당하는 물고기 타입을 찾을 수 없습니다."));

            return new FishCountDto(fishType.getFishName(), count);
        }).collect(Collectors.toList());

        return new NonGroupedFishResponseDto(fishList);
    }



    /**
     * 물 상태 계산 (5가 최적, 1이 최악)
     */
    private int calculateWaterCondition(Aquarium aquarium) {
        if (aquarium.getLastWaterChangeTime() == null) {
            return 1; // 물을 한 번도 갈지 않은 경우 최악의 상태
        }

        long hoursSinceWaterChange = Duration.between(aquarium.getLastWaterChangeTime(), LocalDateTime.now()).toHours();

        if (hoursSinceWaterChange <= 6) {
            return 5; // 6시간 이내 → 최적의 상태
        } else if (hoursSinceWaterChange <= 12) {
            return 4; // 6~12시간 → 양호
        } else if (hoursSinceWaterChange <= 24) {
            return 3; // 12~24시간 → 보통
        } else if (hoursSinceWaterChange <= 36) {
            return 2; // 24~36시간 → 나쁨
        } else {
            return 1; // 36시간 이상 → 최악
        }
    }

    /**
     * 오염 상태 계산 (1이 최적, 5가 최악)
     */
    private int calculatePollutionStatus(Aquarium aquarium) {
        if (aquarium.getLastCleanedTime() == null) {
            return 5; // 한 번도 청소하지 않은 경우 최악의 상태
        }

        long hoursSinceClean = Duration.between(aquarium.getLastCleanedTime(), LocalDateTime.now()).toHours();

        if (hoursSinceClean <= 6) {
            return 1; // 6시간 이내 → 최적의 상태
        } else if (hoursSinceClean <= 12) {
            return 2; // 6~12시간 → 양호
        } else if (hoursSinceClean <= 24) {
            return 3; // 12~24시간 → 보통
        } else if (hoursSinceClean <= 36) {
            return 4; // 24~36시간 → 나쁨
        } else {
            return 5; // 36시간 이상 → 최악
        }
    }
}
