package org.com.aqoo.domain.notification.dto;

import lombok.Data;

@Data
public class NotificationRequest {

    private String userId;
    private String type;
    private int data;
    private String message;
}
