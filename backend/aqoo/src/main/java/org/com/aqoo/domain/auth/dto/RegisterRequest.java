package org.com.aqoo.domain.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
public class RegisterRequest {
    private String id;
    private String pw;
    private String email;
    private String nickname;
    private boolean isSocialJoin;
}