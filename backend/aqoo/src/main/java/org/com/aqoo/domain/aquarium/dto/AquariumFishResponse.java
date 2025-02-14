package org.com.aqoo.domain.aquarium.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Data
@AllArgsConstructor
public class AquariumFishResponse {
    private int aquariumId;
    private int fishId;
    private int fishTypeId;
    private String fishName;
    private String fishImage;
    private String size;
}
