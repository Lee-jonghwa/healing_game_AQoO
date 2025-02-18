package org.com.aqoo.domain.aquarium.dto;


import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class GetFriendFishResponseDto {
    String message;
    boolean success;
}
