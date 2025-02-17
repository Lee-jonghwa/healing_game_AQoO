package org.com.aqoo.domain.aquarium.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class StatusRequestDto {

    @NotNull(message = "어항 ID는 필수입니다.")
    private Integer aquariumId;

    //name, background, feed, water, clean
    private String type;

    private String data;

}
