package org.com.aqoo.domain.auth.service;

import lombok.RequiredArgsConstructor;
import org.com.aqoo.domain.auth.dto.*;
import org.com.aqoo.domain.auth.entity.User;
import org.com.aqoo.repository.UserFishRepository;
import org.com.aqoo.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Objects;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final UserFishRepository userFishRepository;

    // 회원정보 조회 서비스
    public UserInfoResponse getUserInfo(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        return UserInfoResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .nickname(user.getNickname())
                .mainFishId(Objects.requireNonNullElse(user.getMainFishId(), 0)) // 기본값 0
                .exp(user.getExp())
                .level(user.getLevel())
                .status(user.getStatus())
                .mainAquarium(Objects.requireNonNullElse(user.getMainAquarium(), 0)) // 기본값 0
                .build();
    }

    // 회원정보 수정 서비스
    @Transactional
    public UpdateUserResponse updateUser(UpdateUserRequest request) {
        // 1. 유저 조회
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        // 2. 닉네임 중복 확인
        if (!user.getNickname().equals(request.getUserNickName())) {
            boolean nicknameExists = userRepository.existsByNickname(request.getUserNickName());
            if (nicknameExists) {
                throw new IllegalArgumentException("Nickname is already taken.");
            }
            user.setNickname(request.getUserNickName());
        }

        // 3. mainFishId 보유 여부 확인
        boolean ownsFish = userFishRepository.existsByUserIdAndFishTypeId(request.getUserId(), request.getMainFishId());
        if (!ownsFish) {
            throw new IllegalArgumentException("You do not own this fish.");
        }

        // 4. mainFishId 업데이트
        user.setMainFishId(request.getMainFishId());

        // 5. 변경된 데이터 저장
        userRepository.save(user);

        // 6. 응답 반환
        return new UpdateUserResponse(
                user.getId(),
                user.getNickname(),
                user.getMainFishId(),
                "회원 정보 수정 성공!"
        );
    }


    // 경험치 증가 & 레벨업 서비스
    @Transactional
    public ExpUpResponse increaseUserExp(ExpUpRequest request) {
        // 1. 유저 조회
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        // 2. 경험치 추가
        int newExp = user.getExp() + request.getUserExp();
        int newLevel = user.getLevel();

        // 3. 레벨업 조건 확인 (예: 100 경험치마다 레벨업)
        while (newExp >= 100) {
            newExp -= 100; // 경험치 차감
            newLevel += 1; // 레벨 증가
        }

        // 4. 변경된 정보 저장
        user.setExp(newExp);
        user.setLevel(newLevel);
        userRepository.save(user);

        // 5. 응답 반환
        return new ExpUpResponse(newExp, newLevel);
    }
}
