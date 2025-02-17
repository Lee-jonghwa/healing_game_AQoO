package org.com.aqoo.domain.auth.dto;

import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Data
@NoArgsConstructor
public class EmailSendRequest {
    private String userId;  // 사용자 ID (유효한지 검증)
    private String email;   // 요청에서 넘어온 이메일로 인증번호 전송
}