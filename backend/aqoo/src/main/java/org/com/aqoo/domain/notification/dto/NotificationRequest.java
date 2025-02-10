package org.com.aqoo.domain.notification.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class NotificationRequest {

    private String userId;
    private String type;
    private String data;
    private String message;
}
