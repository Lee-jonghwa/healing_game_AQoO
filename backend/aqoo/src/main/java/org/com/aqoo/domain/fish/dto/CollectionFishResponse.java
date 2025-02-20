package org.com.aqoo.domain.fish.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class CollectionFishResponse {
    private Integer fishTypeId;
    private String fishTypeName;
    private String fishImage;
    private String rarity;
    private int cnt;
}
