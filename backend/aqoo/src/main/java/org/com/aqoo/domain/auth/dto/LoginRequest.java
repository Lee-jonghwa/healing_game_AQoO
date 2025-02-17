package org.com.aqoo.domain.auth.dto;

import lombok.Data;
import lombok.Getter;
import lombok.Setter;

@Data
public class LoginRequest {
    private String id;
    private String pw;
}
