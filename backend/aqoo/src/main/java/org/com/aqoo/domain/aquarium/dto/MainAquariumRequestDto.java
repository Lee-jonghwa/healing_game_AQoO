package org.com.aqoo.domain.aquarium.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MainAquariumRequestDto {

    @NotNull(message = "유저 ID는 필수입니다.")
    private String userId;

    @NotNull(message = "어항 ID는 필수입니다.")
    private Integer aquariumId;
}
