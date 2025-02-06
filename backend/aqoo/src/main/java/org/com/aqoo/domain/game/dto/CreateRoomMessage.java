package org.com.aqoo.domain.game.dto;

import lombok.Data;

@Data
public class CreateRoomMessage {
    // 방 생성 시 요청에 사용될 플레이어 이름
    private String userName;
}