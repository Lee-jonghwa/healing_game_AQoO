package org.com.aqoo.domain.game.dto;

import lombok.Data;

@Data
public class PressMessage {
    // 스페이스바 연타 이벤트 관련 데이터
    private String roomId;
    private String userName;
    private int pressCount;  // 이번 이벤트에서 증가한 횟수 (보통 1)
}