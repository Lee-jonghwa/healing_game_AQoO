package org.com.aqoo.domain.aquarium.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@AllArgsConstructor
public class NonGroupedFishResponseDto {
    private List<FishCountDto> fishes;
}
