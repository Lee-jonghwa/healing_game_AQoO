package org.com.aqoo.domain.game.entity;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class Player {
    private String userName;
    private int totalPressCount;
    private String mainFishImage;
    private String nickname;
}