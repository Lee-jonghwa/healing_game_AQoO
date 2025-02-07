package org.com.aqoo.domain.fish.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class UserFishResponse {
    private Integer fishTypeId;
    private String fishTypeName;
    private String fishImage;
}