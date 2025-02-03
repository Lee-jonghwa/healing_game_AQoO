package org.com.aqoo.domain.aquarium.service;

import lombok.RequiredArgsConstructor;
import org.com.aqoo.domain.aquarium.dto.AquariumCreateRequestDto;
import org.com.aqoo.domain.aquarium.dto.AquariumDetailResponseDto;
import org.com.aqoo.domain.aquarium.dto.AquariumResponseDto;
import org.com.aqoo.domain.aquarium.dto.FishCountDto;
import org.com.aqoo.domain.aquarium.entity.Aquarium;
import org.com.aqoo.domain.aquarium.repository.AquariumRepository;
import org.com.aqoo.domain.fish.entity.FishType;
import org.com.aqoo.domain.fish.repository.FishTypeRepository;
import org.com.aqoo.domain.fish.repository.UserFishRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
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

    public AquariumDetailResponseDto getAquariumDetails(Integer aquariumId) {
        Aquarium aquarium = aquariumRepository.findById(aquariumId)
                .orElseThrow(() -> new IllegalArgumentException("어항을 찾을 수 없습니다."));

        return new AquariumDetailResponseDto(aquarium.getAquariumBackgroundId(), new ArrayList<>());
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
