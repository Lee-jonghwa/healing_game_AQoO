package org.com.aqoo.domain.game.controller;

import lombok.RequiredArgsConstructor;
import org.com.aqoo.domain.game.dto.*;
import org.com.aqoo.domain.game.entity.GameRoom;
import org.com.aqoo.domain.game.service.GameService;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
public class GameController {

    private final GameService gameService;

    /**
     * 게임 시작 요청 처리
     * 클라이언트는 /app/game.start 로 메시지를 전송
     */
    @MessageMapping("/game.start")
    public void startGame(@Payload StartGameMessage message) {
        System.out.println("game.start 수신");
        gameService.startGame(message.getRoomId());
    }

    /**
     * 스페이스바 연타 이벤트 처리
     * 클라이언트는 /app/game.press 로 메시지를 전송
     */
    @MessageMapping("/game.press")
    public void press(@Payload PressMessage message) {
        System.out.println("game.press 수신");
        gameService.processPress(message);
    }
}
