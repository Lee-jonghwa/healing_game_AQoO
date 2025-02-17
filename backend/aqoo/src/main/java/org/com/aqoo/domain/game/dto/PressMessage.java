package org.com.aqoo.domain.game.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PressMessage {
    private String roomId;
    private String userName;
    private int pressCount;
}
