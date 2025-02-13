package org.com.aqoo.domain.aquarium.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AquariumDetailResponseDto {
    private Integer id;
    private String aquariumName;
    private LocalDateTime lastFedTime;
    private LocalDateTime lastWaterChangeTime;
    private LocalDateTime lastCleanedTime;
    private String userId;
    private String aquariumBackground;
    private int waterStatus;
    private int pollutionStatus;
    private int feedStatus;
    private List<FishCountDto> fishes;
}
