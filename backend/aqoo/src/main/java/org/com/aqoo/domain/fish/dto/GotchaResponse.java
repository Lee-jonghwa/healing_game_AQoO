package org.com.aqoo.domain.fish.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class GotchaResponse {
    private Integer userFishId;
    private Integer fishTypeId;
    private String fishName;
    private String imageUrl;
    private String rarity;
}
