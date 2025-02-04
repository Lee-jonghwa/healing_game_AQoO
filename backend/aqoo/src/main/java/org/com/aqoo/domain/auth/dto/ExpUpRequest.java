package org.com.aqoo.domain.auth.dto;

import lombok.Data;

@Data
public class ExpUpRequest {
    private String userId;
    private int earnedExp;
}