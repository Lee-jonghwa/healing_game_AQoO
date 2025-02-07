package org.com.aqoo.domain.game.dto;

import lombok.Data;

@Data
public class JoinRoomMessage {
    // 방 입장 시 필요한 방 아이디와 플레이어 이름
    private String roomId;
    private String userName;
}