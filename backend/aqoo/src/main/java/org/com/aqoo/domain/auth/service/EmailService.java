package org.com.aqoo.domain.auth.service;

import lombok.RequiredArgsConstructor;
import org.com.aqoo.domain.auth.dto.EmailResponse;
import org.com.aqoo.domain.auth.dto.EmailSendRequest;
import org.com.aqoo.domain.auth.dto.EmailVerifyRequest;
import org.com.aqoo.domain.auth.entity.User;
import org.com.aqoo.repository.UserRepository;
import org.com.aqoo.util.MailManager;
import org.com.aqoo.util.SHA256Util;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final MailManager mailManager;
    private final UserRepository userRepository;
    private final ConcurrentHashMap<String, Boolean> emailAuthMap = new ConcurrentHashMap<>();

    // ID 검증 후 이메일로 인증번호 전송 서비스
    @Transactional
    public EmailResponse sendVerificationMail(EmailSendRequest request) throws Exception {
        // ID를 기반으로 유저 유효성 확인 (이메일은 요청된 값 사용)
        boolean isUserValid = userRepository.existsById(request.getUserId());
        if (!isUserValid) {
            throw new IllegalArgumentException("Invalid User ID");
        }

        // 요청에서 받은 이메일 사용
        String email = request.getEmail();

        // 랜덤한 UUID 생성 후 인증번호로 사용 (7자리 추출)
        UUID uuid = UUID.randomUUID();
        String key = uuid.toString().substring(0, 7);

        // 📧 **이메일 제목 설정**
        String subject = "🐟 AQOO - 이메일 인증 코드";

        // 📩 **HTML 이메일 본문 생성**
        String content = "<div style='max-width: 500px; margin: auto; padding: 20px; border: 1px solid #ddd; "
                + "border-radius: 10px; text-align: center; font-family: Arial, sans-serif;'>"
                + "<h2 style='color: #1A1D81;'>이메일 인증 코드</h2>"
                + "<p>아래의 인증번호를 입력하여 본인 인증을 완료하세요.</p>"
                + "<br />"
                + "<div style='font-size: 24px; font-weight: bold; padding: 15px; background-color: #f8f8f8; "
                + "border-radius: 8px; border: 1px solid #ccc; display: inline-block;'>"
                + key
                + "</div>"
                + "<br><br>"
                + "<p style='font-size: 14px; color: #555;'>"
                + "인증번호를 직접 복사한 후, 본인 확인을 위해 입력해주세요.</p>"
                + "<p style='color: #777; font-size: 12px;'>이 인증번호는 일정 시간 후 만료됩니다.</p>"
                + "</div>";

        // 📤 **이메일 전송**
        mailManager.send(email, subject, content);

        // 인증번호 저장 (나중에 검증할 때 사용)
        emailAuthMap.put(key, true);

        return new EmailResponse("메일이 전송되었습니다.");
    }

    // 인증번호 확인 서비스
    @Transactional
    public EmailResponse verifyEmail(EmailVerifyRequest request) {

        // 저장된 인증번호 가져오기
        Boolean storedKey = emailAuthMap.get(request.getAuthPassword());
        if (storedKey == null) {
            throw new IllegalArgumentException("인증번호가 잘못되었습니다.");
        }

        // 인증 성공 시, 맵에서 해당 이메일 삭제
        emailAuthMap.remove(request.getAuthPassword());
        return new EmailResponse("인증 성공");
    }
}