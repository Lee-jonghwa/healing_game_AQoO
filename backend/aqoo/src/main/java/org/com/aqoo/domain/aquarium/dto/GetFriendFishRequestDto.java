package org.com.aqoo.domain.aquarium.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class GetFriendFishRequestDto {
    String userId;
    String friendId;
    int fishTypeId;
    String fishName;
}
