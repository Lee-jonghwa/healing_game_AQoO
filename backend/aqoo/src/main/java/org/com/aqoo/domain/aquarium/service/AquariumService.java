package org.com.aqoo.domain.aquarium.service;

import lombok.RequiredArgsConstructor;
import org.com.aqoo.domain.aquarium.dto.*;
import org.com.aqoo.domain.aquarium.entity.Aquarium;
import org.com.aqoo.domain.aquarium.entity.AquariumBackground;
import org.com.aqoo.domain.auth.entity.User;
import org.com.aqoo.domain.fish.entity.Fish;
import org.com.aqoo.domain.push.dto.PushRequest;
import org.com.aqoo.domain.push.service.PushService;
import org.com.aqoo.repository.*;
import org.com.aqoo.domain.fish.entity.UserFish;
import org.com.aqoo.util.ImageUrlUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
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
    private final AquariumBackgroundRepository aquariumBackgroundRepository;
    private final UserFishRepository userFishRepository;
    private final FishRepository fishRepository;
    private final UserRepository userRepository;
    private final ImageUrlUtils imageUtils;
    @Autowired
    private PushService pushService;

    // 각 상태 시간 주기
    @Value("${game.feed-interval}")
    private int feedInterval;

    @Value("${game.clean-interval}")
    private int cleanInterval;

    @Value("${game.water-interval}")
    private int waterInterval;


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
                aquarium.getAquariumName()
            );
        }).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public AquariumDetailResponseDto getAquariumDetails(Integer aquariumId) {
        // 어항 정보 조회
        Aquarium aquarium = aquariumRepository.findById(aquariumId)
                .orElseThrow(() -> new IllegalArgumentException("어항을 찾을 수 없습니다."));

        // 어항 속 물고기 개수 조회 (Object[] { fishTypeId, count })
        List<Object[]> fishCounts = userFishRepository.countFishesInAquarium(aquariumId);

        // N+1 문제 해결: fishTypeId 목록을 수집하여 한 번에 조회
        Set<Integer> fishTypeIds = fishCounts.stream()
                .map(row -> (Integer) row[0])
                .collect(Collectors.toSet());

        Map<Integer, Fish> fishMap = fishRepository.findByIdIn(new ArrayList<>(fishTypeIds))
                .stream()
                .collect(Collectors.toMap(Fish::getId, fish -> fish));

        List<FishCountDto> fishList = fishCounts.stream()
                .map(fishData -> {
                    Integer fishTypeId = (Integer) fishData[0];
                    Long count = (Long) fishData[1];
                    Fish fish = fishMap.get(fishTypeId);
                    if (fish == null) {
                        throw new IllegalArgumentException("해당하는 물고기 타입을 찾을 수 없습니다.");
                    }
                    return new FishCountDto(fish.getFishName(), count);
                })
                .collect(Collectors.toList());

        // 엔티티의 모든 정보를 DTO로 매핑
        AquariumDetailResponseDto dto = new AquariumDetailResponseDto();
        dto.setId(aquarium.getId());
        dto.setAquariumName(aquarium.getAquariumName());
        dto.setLastFedTime(aquarium.getLastFedTime());
        dto.setLastWaterChangeTime(aquarium.getLastWaterChangeTime());
        dto.setLastCleanedTime(aquarium.getLastCleanedTime());
        dto.setUserId(aquarium.getUserId());


        // Optional 처리 개선: 없을 경우 예외 발생
        String imageUrl = aquariumBackgroundRepository.findById(aquarium.getAquariumBackgroundId())
                .orElseThrow(() -> new IllegalArgumentException("해당 배경을 찾을 수 없습니다."))
                .getImageUrl();
        dto.setAquariumBackground(imageUrl);

        dto.setAquariumBackground(imageUrl);
        dto.setWaterStatus(getElapsedTimeScore(aquarium.getLastWaterChangeTime(), waterInterval));
        dto.setPollutionStatus(getElapsedTimeScore(aquarium.getLastCleanedTime(), cleanInterval));
        dto.setFeedStatus(getElapsedTimeScore(aquarium.getLastFedTime(), feedInterval));
        dto.setFishes(fishList);

        return dto;
    }

    // 마지막 어항 관리 시간 바탕으로 어항 상태 계산하기
    // 밥 먹기 : 30분, 물 갈기 : 120분, 청소하기 : 240분
    public static int getElapsedTimeScore(LocalDateTime savedTime, int timeInterval) {
        long minutesElapsed = Duration.between(savedTime, LocalDateTime.now()).toMinutes();

        if (minutesElapsed < timeInterval) {
            return 5;
        } else if (minutesElapsed < 2 * timeInterval) {
            return 4;
        } else if (minutesElapsed < 3 * timeInterval) {
            return 3;
        } else if (minutesElapsed < 4 * timeInterval) {
            return 2;
        } else if (minutesElapsed < 5 * timeInterval) {
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
        aquarium.setLastFedTime(LocalDateTime.now().minusMinutes(feedInterval * 2));
        aquarium.setLastWaterChangeTime(LocalDateTime.now().minusMinutes(waterInterval * 2));
        aquarium.setLastCleanedTime(LocalDateTime.now().minusMinutes(cleanInterval * 2));

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
        aquariumRepository.setAquariumIdToNullByAquariumId(aquariumId);

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

    @Transactional
    public GetFriendFishResponseDto getFriendFish(GetFriendFishRequestDto request) {
        // 대상 물고기 조회 (프록시 객체 반환 후 실제 필드 접근 시 DB 호출)
        Fish targetFish = fishRepository.getById(request.getFishTypeId());
        User user = userRepository.getById(request.getUserId());
        // 이미 해당 물고기가 있는지 검사
        if (userFishRepository.existsByUserIdAndFishName(request.getUserId(), request.getFishName())) {
            return new GetFriendFishResponseDto("이미 있는 물고기 입니다.", false);
        }

        if (user.getFishTicket()<=0) {
            return new GetFriendFishResponseDto("티켓이 부족합니다.(필요 티켓수 1개이상)", false);
        }

        String fishImageUrl = targetFish.getImageUrl();
        try {
            // 새로운 물고기 엔티티 생성 (빌더 사용 예시, 필요시 setter 사용)
            Fish newFish = Fish.builder()
                    .fishName(request.getFishName())
                    // rarity 값 설정: 만약 request.getUserId()가 아니라 targetFish.getRarity()를 원한다면 변경 필요
                    .rarity(request.getUserId())
                    .size(targetFish.getSize())
                    .imageUrl(fishImageUrl)
                    .build();

            int fishTypeId = fishRepository.save(newFish).getId();

            // user_fish 레코드 저장
            UserFish userFish = new UserFish();
            userFish.setFishTypeId(fishTypeId);
            userFish.setUserId(request.getUserId());
            userFishRepository.save(userFish);

            user.setFishTicket(user.getFishTicket()-1);
            userRepository.save(user);
            User friend = userRepository.getById(request.getFriendId());
            friend.setFishTicket(friend.getFishTicket()+1);
            userRepository.save(friend);

            //친구 물고기 가져왔음 알람 보내기
            //친구 요청 알람 보내기
            String sender = request.getUserId();
            String recipient = request.getFriendId();
            PushRequest pushRequest =
                    new PushRequest(sender, recipient, "FRIEND FISH", imageUtils.toAbsoluteUrl(fishImageUrl));
            pushService.sendPush(pushRequest);

            return new GetFriendFishResponseDto("가져오기 성공", true);
        } catch (Exception e) {
            // 예외 로그 기록 등 추가 작업 가능
            return new GetFriendFishResponseDto("실패", false);
        }
    }

    @Transactional
    public List<FriendAquariumFishResponse> getFriendAquariumFish(String friendId) {
        // getById 대신 findById를 사용하여 안전하게 조회
        User friend = userRepository.findById(friendId)
                .orElseThrow(() -> new IllegalArgumentException("해당 친구 유저가 존재하지 않습니다."));
        int mainAquariumId = friend.getMainAquarium();
        List<Object[]> fishData = userFishRepository.findFishDetailsByUserIdAndAquariumId(friendId, mainAquariumId);
        if (fishData.isEmpty()) {
            return Collections.emptyList();
        }
        List<Integer> fishTypeIds = fishData.stream()
                .map(row -> (Integer) row[1]) // fishTypeId 추출
                .distinct()
                .toList();
        List<Fish> fishList = fishRepository.findByIdIn(fishTypeIds);

        Map<Integer, Fish> fishTypeMap = fishList.stream()
                .collect(Collectors.toMap(Fish::getId, fish -> fish));

        return fishData.stream()
                .map(row -> new FriendAquariumFishResponse(
                        row[2] != null ? (Integer) row[2] : -1,  // aquariumId
                        (Integer) row[0], // fishId
                        (Integer) row[1], // fishTypeId
                        fishTypeMap.get((Integer) row[1]).getFishName(), // fishTypeName
                        imageUtils.toAbsoluteUrl(fishTypeMap.get((Integer) row[1]).getImageUrl()), // fishImage
                        fishTypeMap.get((Integer) row[1]).getSize(),
                        fishTypeMap.get((Integer) row[1]).getRarity()
                ))
                .sorted(Comparator.comparing(FriendAquariumFishResponse::getFishTypeId))
                .toList();
    }


    // 어항 속 물고기 조회
    @Transactional(readOnly = true)
    public List<AquariumFishResponse> getAquariumFish(String userId, int aquariumId) {
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
                        row[2] != null ? (Integer) row[2] : -1,  // aquariumId
                        (Integer) row[0], // fishId
                        (Integer) row[1], // fishTypeId
                        fishTypeMap.get((Integer) row[1]).getFishName(), // fishTypeName
                        imageUtils.toAbsoluteUrl(fishTypeMap.get((Integer) row[1]).getImageUrl()), // fishImage
                        fishTypeMap.get((Integer) row[1]).getSize()
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
                    aquarium.setAquariumBackgroundId(backgroundId);
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
}
