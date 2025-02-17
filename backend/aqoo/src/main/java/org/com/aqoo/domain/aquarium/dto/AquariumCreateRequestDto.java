package org.com.aqoo.domain.aquarium.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AquariumCreateRequestDto {

    @NotBlank(message = "Aquarium name is required")
    private String aquariumName;

    @NotBlank(message = "User ID is required")
    private String userId;

    @NotNull(message = "Aquarium background ID is required")
    private Integer aquariumBack; // DB에 등록된 배경 ID (예: 1, 2, 3)
}
