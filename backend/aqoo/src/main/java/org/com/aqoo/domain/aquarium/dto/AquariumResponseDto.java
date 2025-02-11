package org.com.aqoo.domain.aquarium.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
public class AquariumResponseDto {
    private Integer id;
    private String aquariumName;
    private LocalDateTime lastFedTime;
    private LocalDateTime lastWaterChangeTime;
    private int waterCondition;
    private LocalDateTime lastCleanedTime;
    private int pollutionStatus;
}
