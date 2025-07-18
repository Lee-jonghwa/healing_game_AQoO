package org.com.aqoo.domain.auth.service;

import lombok.RequiredArgsConstructor;
import org.com.aqoo.domain.aquarium.dto.AquariumCreateRequestDto;
import org.com.aqoo.domain.aquarium.entity.Aquarium;
import org.com.aqoo.domain.aquarium.service.AquariumService;
import org.com.aqoo.domain.auth.dto.*;
import org.com.aqoo.domain.auth.entity.User;
import org.com.aqoo.repository.UserRepository;
import org.com.aqoo.util.JwtUtil;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuthService {

    // 임의 비밀번호 만들기 함수
    private static class PasswordGenerator {
        private static final String CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&*!";
        private static final int RANDOM_PART_LENGTH = 8; // 랜덤 문자열 길이
        private static final SecureRandom random = new SecureRandom();

        public static String generateRandomString() {
            StringBuilder sb = new StringBuilder(RANDOM_PART_LENGTH);
            for (int i = 0; i < RANDOM_PART_LENGTH; i++) {
                sb.append(CHARACTERS.charAt(random.nextInt(CHARACTERS.length())));
            }
            return sb.toString();
        }

        public static String generatePasswordWithDateTime() {
            // 현재 날짜와 시간 가져오기
            LocalDateTime now = LocalDateTime.now();
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
            String dateTime = now.format(formatter);

            // 랜덤 문자열 생성
            String randomString = generateRandomString();

            // 날짜 시간과 랜덤 문자열 결합
            return "social-login-" + dateTime + "-" + randomString;
        }
    }

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;
    private final AquariumService aquariumService;

    //로그인 요청 서비스
    public LoginResponse login(LoginRequest request) {
        // ID로 사용자 조회
        User user = userRepository.findById(request.getId())
                .orElseThrow(() -> new IllegalArgumentException("Invalid ID"));

        // 비밀번호 확인
        if (!passwordEncoder.matches(request.getPw(), user.getPw())) {
            throw new IllegalArgumentException("Invalid Password");
        }

        // AccessToken, RefreshToken 생성
        String accessToken = jwtUtil.generateToken(user.getId(), "ACCESS");
        String refreshToken = jwtUtil.generateToken(user.getId(), "REFRESH");

        System.out.println("Generating Token for user: " + user.getId());
        System.out.println("accessToken: " + accessToken);
        System.out.println("refreshToken: " + refreshToken);

        // 리프레시 토큰을 DB에 저장
        user.setRefreshToken(refreshToken);
        userRepository.save(user);

        String message = "accessToken 발급 성공";
        // 응답 생성
        return new LoginResponse(accessToken, user.getId() , user.getNickname(), message);
    }

    public String getRandomPassword(){
        return PasswordGenerator.generatePasswordWithDateTime();
    }


    // db에 저장된 리프레시 토큰 불러오기
    public String getRefreshToken(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        return user.getRefreshToken(); // DB에 저장된 리프레시 토큰 반환
    }

    // ID 기반으로 유저의 리프레시 토큰 삭제
    public void deleteRefreshToken(String userId) {
        userRepository.findById(userId).ifPresent(user -> {
            user.setRefreshToken(null);
            userRepository.save(user);
        });
    }

    //회원가입 요청 서비스
    @Transactional
    public RegisterResponse register(RegisterRequest request) {
        // 1. 사용자 존재 여부 확인 (동시성 문제는 DB의 유니크 제약조건으로 보완)
        if (userRepository.existsById(request.getId())) {
            throw new IllegalArgumentException("User ID already exists");
        }

        // 2. 새 사용자 생성 (아직 어항 ID는 미설정)
        User newUser = User.builder()
                .id(request.getId())
                .pw(passwordEncoder.encode(request.getPw()))
                .email(request.getEmail())
                .nickname(request.getNickName())
                .build();

        // 3. 사용자 먼저 저장 (DB에 영속화)
        newUser = userRepository.save(newUser);
        // (필요하다면 flush()를 통해 DB에 즉시 반영: userRepository.flush();)

        // 4. 어항 생성 요청 DTO 작성
        AquariumCreateRequestDto aquariumCreateRequestDto = new AquariumCreateRequestDto();
        aquariumCreateRequestDto.setUserId(request.getId());
        aquariumCreateRequestDto.setAquariumName(request.getId() + " 의 어항");
        aquariumCreateRequestDto.setAquariumBack(1);

        // 5. 어항 생성 및 반환값 활용
        Aquarium createdAquarium = aquariumService.createAquarium(aquariumCreateRequestDto);
        if (createdAquarium == null) {
            throw new IllegalStateException("Aquarium creation failed");
        }

        // 6. 새 사용자에 메인 어항 ID 설정
        newUser.setMainAquarium(createdAquarium.getId());

        // 7. 변경된 사용자 정보 업데이트 (영속성 컨텍스트가 있으므로 트랜잭션 커밋 시 반영됨)
        userRepository.save(newUser);

        return new RegisterResponse("User registered successfully");
    }



//    토큰 재발급 요청 서비스
    public String refreshToken(String refreshToken) throws Exception {
        System.out.println("쿠키에 저장된 refreshToken으로 엑세스 토큰 재요청");

        // 토큰 유효성 확인
        if (!jwtUtil.validateToken(refreshToken)) {
            throw new IllegalArgumentException("Invalid Refresh Token");
        }

        // 토큰에서 사용자 ID 추출
        String userId = jwtUtil.extractUsername(refreshToken);
        System.out.println("추출한 ID: " + userId);

        // 데이터베이스에서 저장된 리프레시 토큰 확인
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (!refreshToken.equals(user.getRefreshToken())) {
            throw new IllegalArgumentException("Invalid Refresh Token");
        }

        return jwtUtil.generateToken(userId, "ACCESS");
    }

    // 소셜 로그인 서비스
    @Transactional
    public LoginResponse handleOAuthLogin(String email) {
        Optional<User> optionalUser = userRepository.findByEmail(email);
        User user;
        boolean isNewUser = false;

        if (optionalUser.isPresent()) {
            user = optionalUser.get();
        } else {
            isNewUser = true;
            System.out.println("소셜 로그인 시도한 유저 회원가입");

            // 임의 비밀번호 생성 및 암호화
            String rawPassword = PasswordGenerator.generatePasswordWithDateTime();
            String hashedPassword = passwordEncoder.encode(rawPassword);

            // 신규 유저 생성 (아직 mainAquarium 설정 전)
            User newUser = User.builder()
                    .id(email)                     // ID는 email과 동일
                    .email(email)
                    .pw(hashedPassword)             // 소셜 로그인 사용자는 임의 비밀번호 부여
                    .nickname(email.split("@")[0])  // 기본 닉네임 설정
                    .build();

            // 1. 먼저 사용자 저장하여 DB에 반영 (외래키 제약조건 충족)
            newUser = userRepository.save(newUser);

            // 2. 어항 생성 요청 DTO 작성
            AquariumCreateRequestDto aquariumCreateRequestDto = new AquariumCreateRequestDto();
            aquariumCreateRequestDto.setUserId(email);
            aquariumCreateRequestDto.setAquariumName(email.split("@")[0] + "의 어항");
            aquariumCreateRequestDto.setAquariumBack(1);

            // 3. 어항 생성 및 반환값 활용
            Aquarium createdAquarium = aquariumService.createAquarium(aquariumCreateRequestDto);
            if (createdAquarium == null) {
                throw new IllegalStateException("Aquarium creation failed");
            }

            // 4. 신규 유저에 메인 어항 ID 설정 후 다시 저장
            newUser.setMainAquarium(createdAquarium.getId());
            user = userRepository.save(newUser);
        }

        // JWT 토큰 생성
        String accessToken = jwtUtil.generateToken(user.getId(), "ACCESS");
        String refreshToken = jwtUtil.generateToken(user.getId(), "REFRESH");

        // 리프레시 토큰 업데이트 (영속 상태인 user의 변경은 트랜잭션 커밋 시 반영됨)
        user.setRefreshToken(refreshToken);
        userRepository.save(user);

        String message = isNewUser ? "소셜 로그인 및 신규 회원가입 성공" : "소셜 로그인 성공";
        return new LoginResponse(accessToken, user.getId(), user.getNickname(), message);
    }

    // 아이디 중복 체크
    public boolean isUserIdAvailable(String userId) {
        return !userRepository.existsById(userId); // 아이디가 존재하지 않으면 true 반환
    }

    // 이메일 중복 체크
    public boolean isEmailAvailable(String email) {
        return !userRepository.existsByEmail(email); // 이메일이 존재하지 않으면 true 반환
    }

    // 이메일을 기반으로 아이디 찾기
    public User findUserByEmail(String email) {
        return userRepository.findByEmail(email).orElse(null);
    }

    // 비밀번호 변경 로직
    public void changePassword(ChangePasswordRequest request) {
        // 1. 사용자 조회
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        // 2. 기존 비밀번호 검증
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPw())) {
            throw new RuntimeException("현재 비밀번호가 일치하지 않습니다.");
        }

        // 3. 기존 비밀번호와 새로운 비밀번호가 동일한지 체크 (보안 권장)
        if (passwordEncoder.matches(request.getNewPassword(), user.getPw())) {
            throw new RuntimeException("새로운 비밀번호는 기존 비밀번호와 달라야 합니다.");
        }

        // 4. 새로운 비밀번호 암호화 후 저장
        user.setPw(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    // 비밀번호 재설정 서비스
    public void newPassword(NewPasswordRequest request) {
        // 1. 사용자 조회
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        // 2. 새로운 비밀번호 암호화 후 저장
        user.setPw(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }
}