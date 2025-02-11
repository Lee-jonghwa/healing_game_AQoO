package org.com.aqoo.domain.notification.dto;

import lombok.Data;

@Data
public class NotificationResponse {

    private String message;
    private Long noticeId;

    // Constructor
    public NotificationResponse(String message, Long noticeId) {
        this.message = message;
        this.noticeId = noticeId;
    }

    // Getters and setters
}
