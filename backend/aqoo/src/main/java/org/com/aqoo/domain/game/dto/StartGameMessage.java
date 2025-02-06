package org.com.aqoo.domain.game.dto;

import lombok.Data;

@Data
public class StartGameMessage {
    // 게임 시작 요청 시 사용할 방 아이디
    private String roomId;
}