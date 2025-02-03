package org.com.aqoo.domain.aquarium.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@AllArgsConstructor
public class AquariumDetailResponseDto {
    private Integer background;
    private List<FishCountDto> fishes;
}
