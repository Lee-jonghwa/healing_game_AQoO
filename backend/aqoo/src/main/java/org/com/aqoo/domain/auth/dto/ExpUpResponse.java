package org.com.aqoo.domain.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ExpUpResponse {
    private int userExp;
    private int userLevel;
}
