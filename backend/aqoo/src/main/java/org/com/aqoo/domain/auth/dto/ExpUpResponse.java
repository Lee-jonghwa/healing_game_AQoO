package org.com.aqoo.domain.auth.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import lombok.AllArgsConstructor;
import lombok.Data;
import org.com.aqoo.util.CustomDoubleSerializer;

@Data
@AllArgsConstructor
public class ExpUpResponse {
    private int curExp;
    private int expToNextLevel;

    @JsonSerialize(using = CustomDoubleSerializer.class) // 커스텀 직렬화 적용
    private double expProgress;

    private int userLevel;
    private String message;
}