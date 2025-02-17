package org.com.aqoo.domain.fish.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class FishTypeRequest {
    private String fishName;
    private String imageUrl;
    private String rarity;
    private String size;
}
