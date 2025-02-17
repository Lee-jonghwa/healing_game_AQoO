package org.com.aqoo.domain.aquarium.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class FishRequestDto {

    @NotNull(message = "물고기 ID는 필수입니다.")
    private Integer userFishId;

    @NotNull(message = "어항 ID는 필수입니다.")
    private Integer aquariumId;
}
