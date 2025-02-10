package org.com.aqoo.domain.notification.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class UserNotificationResponse {
    private Long id;
    private String userId;
    private String type;
    private String data;
    private String message;
    private boolean status;
    private LocalDateTime createdAt;

    public UserNotificationResponse(Long id, String userId, String type, String data, String message, boolean status, LocalDateTime createdAt) {
        this.id = id;
        this.userId = userId;
        this.type = type;
        this.data = data;
        this.message = message;
        this.status = status;
        this.createdAt = createdAt;
    }

    // Getters
}
