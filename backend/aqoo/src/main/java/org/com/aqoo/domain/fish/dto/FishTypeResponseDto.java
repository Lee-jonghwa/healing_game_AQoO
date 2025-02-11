package org.com.aqoo.domain.fish.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class FishTypeResponseDto {
    private Integer id;
    private String fishName;
    private String imageUrl;
    private String rarity;
}
