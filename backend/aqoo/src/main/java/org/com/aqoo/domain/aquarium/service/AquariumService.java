package org.com.aqoo.domain.aquarium.service;

import lombok.RequiredArgsConstructor;
import org.com.aqoo.domain.aquarium.dto.*;
import org.com.aqoo.domain.aquarium.entity.Aquarium;
import org.com.aqoo.domain.aquarium.entity.AquariumBackground;
import org.com.aqoo.domain.auth.entity.User;
import org.com.aqoo.domain.fish.entity.Fish;
import org.com.aqoo.repository.AquariumRepository;
import org.com.aqoo.domain.fish.entity.UserFish;
import org.com.aqoo.repository.FishRepository;
import org.com.aqoo.repository.UserFishRepository;
import org.com.aqoo.repository.UserRepository;
import org.com.aqoo.util.ImageUrlUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AquariumService {

    private final AquariumRepository aquariumRepository;
    private final UserFishRepository userFishRepository;
    private final FishRepository fishRepository;
    private final UserRepository userRepository;
    private final ImageUrlUtils imageUtils;



    /**
     * ✅ 대표 어항 설정
     */
    @Transactional
    public MainAquariumResponseDto setMainAquarium(MainAquariumRequestDto requestDto) {
        User user = userRepository.findById(requestDto.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("해당 유저가 존재하지 않습니다."));

        user.setMainAquarium(requestDto.getAquariumId());
        userRepository.save(user);

        return new MainAquariumResponseDto("성공", "대표 어항이 설정되었습니다.");
    }

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
        Aquarium aquarium = aquariumRepository.findById(aquariumId)
                .orElseThrow(() -> new IllegalArgumentException("어항을 찾을 수 없습니다."));

        // 어항 속 물고기 개수 조회 (예시: Object[] { fishTypeId, count })
        List<Object[]> fishCounts = userFishRepository.countFishesInAquarium(aquariumId);

        List<FishCountDto> fishList = fishCounts.stream().map(fishData -> {
            Integer fishTypeId = (Integer) fishData[0];
            Long count = (Long) fishData[1];

            // 물고기 종류 조회
            Fish fish = fishRepository.findById(fishTypeId)
                    .orElseThrow(() -> new IllegalArgumentException("해당하는 물고기 타입을 찾을 수 없습니다."));

            return new FishCountDto(fish.getFishName(), count);
        }).collect(Collectors.toList());

        // 엔티티의 모든 정보를 DTO로 매핑
        AquariumDetailResponseDto dto = new AquariumDetailResponseDto();
        dto.setId(aquarium.getId());
        dto.setAquariumName(aquarium.getAquariumName());
        dto.setLastFedTime(aquarium.getLastFedTime());
        dto.setLastWaterChangeTime(aquarium.getLastWaterChangeTime());
        dto.setLastCleanedTime(aquarium.getLastCleanedTime());
        dto.setUserId(aquarium.getUserId());
        dto.setAquariumBackgroundId(aquarium.getAquariumBackgroundId());
        dto.setWaterStatus(getElapsedTimeScore(aquarium.getLastWaterChangeTime(), 24));
        dto.setPollutionStatus(getElapsedTimeScore(aquarium.getLastCleanedTime(), 12));
        dto.setFeedStatus(getElapsedTimeScore(aquarium.getLastFedTime(), 4));
        dto.setFishes(fishList);

        return dto;
    }

    // 마지막 어항 관리 시간 바탕으로 어항 상태 계산하기
    // 밥 먹기 : 4시간, 물 갈기 : 24시간, 청소하기 : 12시간
    public static int getElapsedTimeScore(LocalDateTime savedTime, int timeInterval) {
        long hoursElapsed = Duration.between(savedTime, LocalDateTime.now()).toHours();

        if (hoursElapsed < timeInterval) {
            return 5;
        } else if (hoursElapsed < 2 * timeInterval) {
            return 4;
        } else if (hoursElapsed < 3 * timeInterval) {
            return 3;
        } else if (hoursElapsed < 4 * timeInterval) {
            return 2;
        } else if (hoursElapsed < 5 * timeInterval) {
            return 1;
        } else {
            return 0;
        }
    }


    @Transactional
    public Aquarium createAquarium(AquariumCreateRequestDto requestDto) {
        Aquarium aquarium = new Aquarium();
        aquarium.setAquariumName(requestDto.getAquariumName());
        aquarium.setUserId(requestDto.getUserId());

        // 요청으로 전달받은 배경 ID 값을 그대로 사용하여 배경 엔티티의 프록시를 획득
        aquarium.setAquariumBackgroundId(requestDto.getAquariumBack());

        // 기본값 설정
        aquarium.setLastFedTime(LocalDateTime.now().minusHours(5));
        aquarium.setLastWaterChangeTime(LocalDateTime.now().minusHours(25));
        aquarium.setLastCleanedTime(LocalDateTime.now().minusHours(13));

        return aquariumRepository.save(aquarium);
    }

    @Transactional
    public DeleteAquariumResponseDto deleteAquarium(DeleteAquariumRequestDto requestDto) {
        Integer aquariumId = requestDto.getAquariumId();

        // 존재 여부 확인
        if (!aquariumRepository.existsById(aquariumId)) {
            throw new IllegalArgumentException("해당 ID의 어항이 존재하지 않습니다.");
        }

        // 해당 어항에 속한 물고기들의 어항 ID를 NULL로 설정
        userFishRepository.removeAllByAquariumId(aquariumId);

        // 어항 삭제
        aquariumRepository.deleteById(aquariumId);

        return new DeleteAquariumResponseDto("성공", "어항이 삭제되었습니다.");
    }


    /**
     * 어항에 물고기 추가
     */
    @Transactional
    public FishResponseDto addFishToAquarium(FishRequestDto requestDto) {
        UserFish userFish = userFishRepository.findById(requestDto.getUserFishId())
                .orElseThrow(() -> new IllegalArgumentException("해당 물고기가 존재하지 않습니다."));

        // 어항 ID 업데이트
        userFish.setAquariumId(requestDto.getAquariumId());
        userFishRepository.save(userFish);

        return new FishResponseDto("성공", "어항에 물고기 추가하기에 성공했습니다.");
    }

    /**
     * ✅ 물고기 이동 (다른 어항으로 옮기기)
     */
    @Transactional
    public FishResponseDto moveFishToAnotherAquarium(FishRequestDto requestDto) {
        UserFish userFish = userFishRepository.findById(requestDto.getUserFishId())
                .orElseThrow(() -> new IllegalArgumentException("해당 물고기가 존재하지 않습니다."));

        // 새로운 어항으로 이동
        userFish.setAquariumId(requestDto.getAquariumId());
        userFishRepository.save(userFish);

        return new FishResponseDto("성공", "물고기가 새로운 어항으로 이동되었습니다.");
    }

    /**
     * ✅ 물고기 제거 (어항에서 삭제, but 보유 유지)
     */
    @Transactional
    public FishResponseDto removeFishFromAquarium(FishRequestDto requestDto) {
        UserFish userFish = userFishRepository.findById(requestDto.getUserFishId())
                .orElseThrow(() -> new IllegalArgumentException("해당 물고기가 존재하지 않습니다."));

        // 물고기의 어항 ID를 NULL로 설정 (어항에서 제거)
        userFish.setAquariumId(null);
        userFishRepository.save(userFish);

        return new FishResponseDto("성공", "물고기가 어항에서 제거되었습니다.");
    }



    // 어항 속 물고기 조회
    @Transactional(readOnly = true)
    public List<AquariumFishResponse> getAquariumFish(String userId, int aquariumId) {

        // 1. 특정 사용자의 특정 어항 물고기 조회
        List<Object[]> fishData = userFishRepository.findFishDetailsByUserIdAndAquariumId(userId, aquariumId);

        if (fishData.isEmpty()) {
            return Collections.emptyList();
        }

        // 2. fishTypeId 리스트 생성
        List<Integer> fishTypeIds = fishData.stream()
                .map(row -> (Integer) row[1]) // fishTypeId 추출
                .distinct()
                .toList();

        // 3. fishTypeId에 해당하는 fish 정보 조회
        List<Fish> fishList = fishRepository.findByIdIn(fishTypeIds);

        // 4. fishTypeId -> Fish 매핑 (Map<Integer, Fish>)
        Map<Integer, Fish> fishTypeMap = fishList.stream()
                .collect(Collectors.toMap(Fish::getId, fish -> fish));

        // 5. 응답 객체 변환
        return fishData.stream()
                .map(row -> new AquariumFishResponse(
                        (Integer) row[2],  // aquariumId
                        (Integer) row[0], // fishId
                        (Integer) row[1], // fishTypeId
                        fishTypeMap.get((Integer) row[1]).getFishName(), // fishTypeName
                        imageUtils.toAbsoluteUrl(fishTypeMap.get((Integer) row[1]).getImageUrl()) // fishImage
                ))
                .sorted(Comparator.comparing(AquariumFishResponse::getFishTypeId)) // fishTypeId 기준 정렬
                .toList();
    }

    /**
     * ✅ 어항 상태 업데이트
     * @param aquariumId 업데이트할 어항 ID
     * @param type 업데이트할 항목 (name, background, feed, water, clean)
     * @param data 업데이트할 값
     */
    @Transactional
    public StatusResponseDto updateStatus(Integer aquariumId, String type, String data) {
        Aquarium aquarium = aquariumRepository.findById(aquariumId)
                .orElseThrow(() -> new IllegalArgumentException("해당 어항이 존재하지 않습니다."));

        switch (type.toLowerCase()) {
            case "name":
                aquarium.setAquariumName(data);
                break;
            case "background":
                try {
                    int backgroundId = Integer.parseInt(data);
                    aquarium.getAquariumBackground().setId(backgroundId);
                } catch (NumberFormatException e) {
                    throw new IllegalArgumentException("배경 ID는 숫자여야 합니다.");
                }
                break;
            case "feed":
                aquarium.setLastFedTime(LocalDateTime.now());
                break;
            case "water":
                aquarium.setLastWaterChangeTime(LocalDateTime.now());
                break;
            case "clean":
                aquarium.setLastCleanedTime(LocalDateTime.now());
                break;
            default:
                throw new IllegalArgumentException("유효하지 않은 상태 타입입니다. (name, background, feed, water, clean 중 선택)");
        }

        return new StatusResponseDto("성공", "어항 상태가 업데이트되었습니다.");
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
