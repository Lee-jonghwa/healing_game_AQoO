package org.com.aqoo.domain.auth.dto;

import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Data
@NoArgsConstructor
public class EmailVerifyRequest {
    private String authPassword;  // 인증번호 입력값
}