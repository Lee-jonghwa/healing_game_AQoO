package org.com.aqoo.domain.auth.service;

import lombok.RequiredArgsConstructor;
import org.com.aqoo.domain.auth.dto.*;
import org.com.aqoo.domain.auth.entity.User;
import org.com.aqoo.repository.UserRepository;
import org.com.aqoo.util.ImageUrlUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Objects;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final ImageUrlUtils imageUtils;

    // 회원정보 조회 서비스
    public UserInfoResponse getUserInfo(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        return UserInfoResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .nickname(user.getNickname())
                .mainFishImage(imageUtils.toAbsoluteUrl(user.getMainFishImage()))
                .exp(user.getExp())
                .level(user.getLevel())
                .status(user.getStatus())
                .mainAquarium(Objects.requireNonNullElse(user.getMainAquarium(), 0)) // 기본값 0
                .fishTicket(user.getFishTicket())
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

        // 3. mainFishId 업데이트
        user.setMainFishImage(request.getMainFishImage());

        // 4. 변경된 데이터 저장
        userRepository.save(user);

        // 5. 응답 반환
        return new UpdateUserResponse(
                user.getId(),
                user.getNickname(),
                imageUtils.toAbsoluteUrl(user.getMainFishImage()),
                "회원 정보 수정 성공!"
        );
    }

    // 경험치 증가 & 레벨업 서비스
    @Transactional
    public ExpUpResponse increaseUserExp(ExpUpRequest request) {
        // 1. 유저 조회
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        int level = user.getLevel();
        int expToNextLevel = level * 20;  // 현재 레벨업을 위한 경험치 필요량

        // 2. 경험치 추가
        int newExp = user.getExp() + request.getEarnedExp();

        // 3. 레벨업 조건 확인
        while (true) {
            if (newExp < expToNextLevel) break;
            newExp -= expToNextLevel; // 경험치 차감
            level++; // 레벨 증가
            expToNextLevel = level * 20;  // 경험치 필요량 갱신
        }

        // 4. 변경된 정보 저장
        user.setExp(newExp);
        user.setLevel(level);
        userRepository.save(user);

        // 경험치 퍼센트 계산
        double expProgress = (newExp*100.0) / (double) expToNextLevel;
        expProgress = Math.round(expProgress * 100) / 100.00;

        // 5. 응답 반환
        return new ExpUpResponse(newExp, expToNextLevel, expProgress, level, "경험치 상승 반영 완료");
    }

    public boolean isAlreadyJoin(String email) {
        return userRepository.existsById(email) || userRepository.existsByEmail(email); // 이미 존재하는 이메일이면 true 리턴
    }

    public boolean getAccountStatus(String userId){
        return userRepository.findById(userId).get().getStatus(); // 회원탈퇴시 false 리턴
    }

    public void changeStatus(String userId){
        User user = userRepository.findById(userId).get();
        user.setStatus(!user.getStatus());
        userRepository.save(user);
    }

    public boolean isFirstLogin(String userId){
        User user = userRepository.findById(userId).get();
        return user.getIsFirstLogin()==1?true:false;
    }

    public void tutorialComplete(String userId){
        User user = userRepository.findById(userId).get();
        user.setIsFirstLogin(0);
        userRepository.save(user);
    }

}