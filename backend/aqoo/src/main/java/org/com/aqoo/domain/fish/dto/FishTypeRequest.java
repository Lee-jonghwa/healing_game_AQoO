package org.com.aqoo.domain.fish.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class FishTypeRequest {
    private String fishName;
    private String imageUrl;
    private String rarity;
}
