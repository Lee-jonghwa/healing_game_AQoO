package org.com.aqoo.domain.fish.service;

import lombok.RequiredArgsConstructor;
import org.com.aqoo.domain.auth.entity.User;
import org.com.aqoo.domain.fish.dto.*;
import org.com.aqoo.domain.fish.entity.Fish;
import org.com.aqoo.domain.fish.entity.UserFish;
import org.com.aqoo.repository.FishRepository;
import org.com.aqoo.repository.UserFishRepository;
import org.com.aqoo.repository.UserRepository;
import org.com.aqoo.util.ImageUrlUtils;
import org.im4java.core.ConvertCmd;
import org.im4java.core.IMOperation;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FishService {
    private final FishRepository fishRepository;
    private final UserFishRepository userFishRepository;
    private final UserRepository userRepository;
    private final ImageUrlUtils imageUtils;
    private final Random random = new Random();

    @Transactional(readOnly = true)
    public List<FishTypeResponseDto> getAllFishTypes() {
        List<Fish> fishTypes = fishRepository.findByRarityInIgnoreCase();
        return fishTypes.stream()
                .map(fish -> new FishTypeResponseDto(fish.getId(), fish.getFishName(), imageUtils.toAbsoluteUrl(fish.getImageUrl()), fish.getRarity(), fish.getSize()))
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
                        imageUtils.toAbsoluteUrl(item.getImageUrl())
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
                        imageUtils.toAbsoluteUrl(fishType.getImageUrl())   // 물고기 이미지
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
                        imageUtils.toAbsoluteUrl(fishType.getImageUrl()),  // 물고기 이미지
                        fishType.getRarity(),
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
        UserFish userFish = saveUserFish(user.getId(), selectedFish.getId());
        Integer userFishId = userFish.getId(); // 저장 후 ID 바로 가져오기

        // 5. 물고기 티켓 차감
        int curFishTicket = user.getFishTicket() - 1;
        user.setFishTicket(curFishTicket);
        // 변경된 user 객체를 DB에 저장
        userRepository.save(user);

        // 6. 결과 응답
        return new GotchaResponse(
                userFishId,
                selectedFish.getId(),
                selectedFish.getFishName(),
                imageUtils.toAbsoluteUrl(selectedFish.getImageUrl()),
                selectedFish.getRarity());
    }

    public UserFish saveUserFish(String userId, Integer fishId){

        UserFish newone = new UserFish();
        newone.setUserId(userId);
        newone.setFishTypeId(fishId);
        return userFishRepository.save(newone);
    }

    public FishTicketResponse getFishTicket(String userId){

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자가 존재하지 않습니다."));

        int curFishTicket = user.getFishTicket() + 3;
        user.setFishTicket(curFishTicket);
        userRepository.save(user);

        return new FishTicketResponse(userId, user.getFishTicket());
    }

    @Transactional
    public Fish saveFishType(FishTypeRequest request) {
        Fish fishType = Fish.builder()
                .fishName(request.getFishName())
                .imageUrl(request.getImageUrl())
                .rarity(request.getRarity())
                .size(request.getSize())
                .build();

        // EC2 이미지 저장 로직
        // 예: "/var/www/fish-images" 경로로 파일 복사

        fishRepository.save(fishType);
        return fishType;
    }


    public String paintFish(String userId, String fishName, String size, MultipartFile imageFile) throws Exception {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자가 존재하지 않습니다."));

        String imagePath = imageFile.getOriginalFilename();

        // 중복 검사 (이미 해당 이미지 URL이 존재하는 경우 예외 발생)
        String imageUrl = "/" + imagePath;
        if (fishRepository.existsByImageUrl(imageUrl)) {
            return "이미 존재하는 이름입니다.";
        }


        // 이미지 저장 경로 설정
        String uploadDir = "/home/ubuntu/images/";
        File dir = new File(uploadDir);
        if (!dir.exists()) {
            dir.mkdirs(); // 경로가 없으면 생성
        }

        // 원본 이미지 저장
        String originalFilePath = uploadDir + "ori_" + imagePath;
        File originalFile = new File(originalFilePath);
        imageFile.transferTo(originalFile);  // 원본 이미지 저장

        // 변환된 이미지 파일명
        String processedFilePath = uploadDir + imagePath;

        // 이미지 변환 처리
        File processedFile = processImage(originalFile, processedFilePath);

        //물고기 타입에 추가
        FishTypeRequest request = new FishTypeRequest(fishName,
                "/" + imagePath,
                userId, size);
        Fish newType = saveFishType(request);

        //유저 물고기에 추가
        saveUserFish(userId, newType.getId());

        //물고기 티켓 차감
        int curFishTicket = user.getFishTicket() - 1;
        user.setFishTicket(curFishTicket);
        // 변경된 user 객체를 DB에 저장
        userRepository.save(user);

        return fishName + "을 저장했습니다.";

    }
    public File processImage(File inputFile, String outputFilePath) throws Exception {
        // 이미지 변환을 위한 ProcessBuilder 객체 생성
        ProcessBuilder processBuilder = new ProcessBuilder("/usr/bin/convert",
                inputFile.getAbsolutePath(),  // 원본 이미지 파일 경로
                "-filter", "point",           // 필터 적용 (point 필터)
                "-resize", "75x75",           // 첫 번째 리사이즈 (70x70)
                "-colors", "12",
                "+dither",
                "-resize", "1000x1000",       // 두 번째 리사이즈 (1000x1000)
                outputFilePath);                // 출력 파일 경로

        // 환경 변수 설정 (명시적으로 /usr/bin 경로를 PATH에 추가)
        processBuilder.environment().put("PATH", "/usr/bin:" + System.getenv("PATH"));

        try {
            // 프로세스를 실행
            Process process = processBuilder.start();
            // 프로세스가 끝날 때까지 기다림
            process.waitFor();

            // 이미지 변환 성공 메시지 출력
            System.out.println("✅ 이미지 변환 성공: " + outputFilePath);
            return new File(outputFilePath);  // 변환된 파일 반환
        } catch (Exception e) {
            // 실패 시 오류 메시지 출력
            System.err.println("❌ 이미지 변환 실패: " + e.getMessage());
            e.printStackTrace();  // 상세한 오류 메시지 출력
            throw e;  // 예외를 다시 던져 호출자에게 알림
        }
    }



}
