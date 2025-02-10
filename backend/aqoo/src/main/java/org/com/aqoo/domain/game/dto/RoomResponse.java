package org.com.aqoo.domain.game.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;
import org.com.aqoo.domain.game.entity.Player;

import java.util.List;

@Getter
@Setter
@AllArgsConstructor
public class RoomResponse {
    private String roomId;
    private List<Player> players;
    private String message;
    // 필요 시 승리자를 명시하기 위한 필드를 추가할 수 있습니다.
    // private String winner;
}
