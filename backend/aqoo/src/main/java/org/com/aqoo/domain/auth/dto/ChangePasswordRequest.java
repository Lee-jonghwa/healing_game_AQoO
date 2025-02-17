package org.com.aqoo.domain.auth.dto;

import lombok.Data;

@Data
public class ChangePasswordRequest {
    private String userId;
    private String currentPassword;
    private String newPassword;
}
