package org.com.aqoo.domain.aquarium.dto;


import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class StatusResponseDto {
    private String status;
    private String message;
}
