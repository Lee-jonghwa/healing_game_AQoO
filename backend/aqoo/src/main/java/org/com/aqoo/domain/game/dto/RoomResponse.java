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
    // 승리자를 명시하기 위한 필드
    private String winner;
    // 전체 순위(100에 도달한 순서대로의 사용자 목록)를 전달하기 위한 필드
    private List<String> finishOrder;
}