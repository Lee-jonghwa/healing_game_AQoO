package org.com.aqoo.domain.aquarium.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class FriendAquariumFishResponse {
    private int aquariumId;
    private int fishId;
    private int fishTypeId;
    private String fishName;
    private String fishImage;
    private String size;
    private String rarity;
}
