package org.com.aqoo.util;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class MailManager {

	private final JavaMailSender mailSender;

	public void send(String to, String subject, String content) throws MessagingException {
		// 1. MimeMessage 생성
		MimeMessage message = mailSender.createMimeMessage();

		// 2. MimeMessageHelper 사용 (true: 멀티파트 메시지 허용)
		MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

		helper.setTo(to); // 받는 사람
		helper.setSubject(subject); // 제목
		helper.setText(content, true); // 본문 (HTML 설정)

		// 3. 이메일 전송
		mailSender.send(message);
	}
}