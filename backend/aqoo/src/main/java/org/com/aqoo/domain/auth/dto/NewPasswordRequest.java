package org.com.aqoo.domain.auth.dto;

import lombok.Data;

@Data
public class NewPasswordRequest {
    private String userId;
    private String newPassword;
}