package org.com.aqoo.domain.game.controller;

import lombok.RequiredArgsConstructor;
import org.com.aqoo.domain.game.dto.EndGameMessage;
import org.com.aqoo.domain.game.dto.PressMessage;
import org.com.aqoo.domain.game.dto.StartGameMessage;
import org.com.aqoo.domain.game.dto.RoomResponse;
import org.com.aqoo.domain.game.service.GameService;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
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
        System.out.println("game.start received: " + message);
        gameService.startGame(message.getRoomId());
    }

    /**
     * 스페이스바 탭 이벤트 처리
     * 클라이언트는 /app/game.press 로 메시지를 전송
     */
    @MessageMapping("/game.press")
    public void press(@Payload PressMessage message) {
        System.out.println("game.press received: " + message);
        gameService.processPress(message);
    }

    /**
     * 타임아웃 등으로 게임 종료 요청 처리
     * 클라이언트는 /app/game.end 로 메시지를 전송
     */
    @MessageMapping("/game.end")
    public void endGame(@Payload EndGameMessage message) {
        System.out.println("game.end received: " + message);
        gameService.endGame(message.getRoomId());
    }
}