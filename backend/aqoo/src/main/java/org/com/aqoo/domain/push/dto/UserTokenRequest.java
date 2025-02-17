package org.com.aqoo.domain.push.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserTokenRequest {
    private String userId;
    private String token;
}
