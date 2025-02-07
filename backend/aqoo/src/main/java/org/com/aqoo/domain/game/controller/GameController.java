package org.com.aqoo.domain.game.controller;

import lombok.RequiredArgsConstructor;
import org.com.aqoo.domain.game.dto.*;
import org.com.aqoo.domain.game.entity.GameRoom;
import org.com.aqoo.domain.game.service.GameService;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.annotation.SendToUser;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
public class GameController {

    private final GameService gameService;

    /**
     * 방 생성 요청 처리
     * 클라이언트는 /app/room.create 로 메시지를 전송
     * 개인 응답으로 방 정보를 전달 (/user/queue/room)
     */
    @MessageMapping("/room.create")
    @SendToUser("/queue/room")
    public RoomResponse createRoom(@Payload CreateRoomMessage message,
                                   SimpMessageHeaderAccessor headerAccessor) {
        System.out.println("room.create 수신");
        GameRoom room = gameService.createRoom(message.getUserName());
        // 세션에 roomId 저장 (필요 시 사용)
        headerAccessor.getSessionAttributes().put("roomId", room.getRoomId());
        return new RoomResponse(room.getRoomId(), room.getPlayers(), "ROOM_CREATED");
    }

    /**
     * 방 입장 요청 처리
     * 클라이언트는 /app/room.join 로 메시지를 전송
     */
    @MessageMapping("/room.join")
    public void joinRoom(@Payload JoinRoomMessage message,
                         SimpMessageHeaderAccessor headerAccessor) {
        System.out.println("room.join 수신");
        GameRoom room = gameService.joinRoom(message.getRoomId(), message.getUserName());
        if (room != null) {
            headerAccessor.getSessionAttributes().put("roomId", room.getRoomId());
            // 방 상태를 업데이트(게임이 시작되지 않은 상태로 초기화)
            // processPress 메서드를 이용해 업데이트 메시지를 보낼 수 있음 (pressCount 0)
            gameService.processPress(new PressMessage() {{
                setRoomId(message.getRoomId());
                setUserName(message.getUserName());
                setPressCount(0);
            }});
        }
    }

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