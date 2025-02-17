package org.com.aqoo.domain.auth.dto;

import lombok.Data;

@Data
public class UpdateUserRequest {
    private String userId;
    private String userNickName;
    private String mainFishImage;
}
