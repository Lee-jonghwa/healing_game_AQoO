package org.com.aqoo.domain.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class UpdateUserResponse {
    private String userId;
    private String userNickName;
    private String mainFishImage;
    private String message;
}
