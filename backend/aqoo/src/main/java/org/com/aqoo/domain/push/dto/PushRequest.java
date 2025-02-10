package org.com.aqoo.domain.push.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class PushRequest {
    private String senderId;
    private String recipientId;
    private String type;
    private int data;
}
