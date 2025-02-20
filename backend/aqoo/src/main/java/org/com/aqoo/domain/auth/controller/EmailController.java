package org.com.aqoo.domain.auth.controller;

import lombok.RequiredArgsConstructor;
import org.com.aqoo.domain.auth.dto.EmailResponse;
import org.com.aqoo.domain.auth.dto.EmailSendRequest;
import org.com.aqoo.domain.auth.dto.EmailVerifyRequest;
import org.com.aqoo.domain.auth.service.EmailService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/email")
public class EmailController {

	private final EmailService emailService;

	// ID 검증 후 요청된 이메일로 인증번호 전송 API
	@PostMapping("/send")
	public ResponseEntity<EmailResponse> sendMail(@RequestBody EmailSendRequest request) throws Exception {
		EmailResponse response = emailService.sendVerificationMail(request);
		return ResponseEntity.ok(response);
	}

	// 이메일 인증번호 확인 API
	@PostMapping("/verify")
	public ResponseEntity<EmailResponse> verifyEmail(@RequestBody EmailVerifyRequest request) {
		EmailResponse response = emailService.verifyEmail(request);
		return ResponseEntity.ok(response);
	}
}