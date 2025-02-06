package org.com.aqoo.domain.game.service;

import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.com.aqoo.domain.game.dto.PressMessage;
import org.com.aqoo.domain.game.dto.RoomResponse;
import org.com.aqoo.domain.game.entity.GameRoom;
import org.com.aqoo.domain.game.entity.Player;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
@AllArgsConstructor
public class GameService {

    // 메모리 내에서 게임방을 관리 (roomId를 키로 사용하는 ConcurrentHashMap)
    private final Map<String, GameRoom> roomMap = new ConcurrentHashMap<>();

    private final SimpMessagingTemplate messagingTemplate;

    /**
     * 방 생성: 고유 roomId를 생성하고, 최초 생성한 플레이어를 추가 후 메모리에 저장
     */
    @Transactional
    public GameRoom createRoom(String userName) {
        String roomId = UUID.randomUUID().toString().substring(0, 8);  // 간단한 8자리 roomId 생성
        GameRoom room = new GameRoom(roomId, false);
        // 최초 플레이어 추가
        room.addPlayer(new Player(userName, 0));
        roomMap.put(roomId, room);
        System.out.println("room:"+ roomMap.get(roomId));
        return room;
    }

    /**
     * 방 입장: 기존 방에 플레이어 추가 후 업데이트
     */
    @Transactional
    public GameRoom joinRoom(String roomId, String userName) {
        GameRoom room = roomMap.get(roomId);
        if (room != null) {
            room.addPlayer(new Player(userName, 0));
        }
        return room;
    }

    /**
     * 게임 시작: 해당 방의 상태를 변경 후, 게임 시작 이벤트를 브로드캐스트
     */
    @Transactional
    public void startGame(String roomId) {
        GameRoom room = roomMap.get(roomId);
        System.out.println("room: " + room);
        if (room != null && !room.isGameStarted()) {

            room.setGameStarted(true);
            // 방의 모든 클라이언트에게 게임 시작 이벤트 전달
            System.out.println("방의 모든 클라이언트에게 게임 시작 이벤트 전달");
            messagingTemplate.convertAndSend("/topic/room/" + roomId,
                    new RoomResponse(room.getRoomId(), room.getPlayers(), "GAME_STARTED"));
        }
    }

    /**
     * 스페이스바 연타 이벤트 처리: 해당 플레이어의 점수를 업데이트 후 브로드캐스트
     */
    @Transactional
    public void processPress(PressMessage pressMessage) {
        GameRoom room = roomMap.get(pressMessage.getRoomId());
        if (room != null && room.isGameStarted()) {
            for (Player player : room.getPlayers()) {
                if (player.getUserName().equals(pressMessage.getUserName())) {
                    player.addPressCount(pressMessage.getPressCount());
                    break;
                }
            }
            // 업데이트된 방 상태를 해당 방 구독자에게 브로드캐스트
            messagingTemplate.convertAndSend("/topic/room/" + room.getRoomId(),
                    new RoomResponse(room.getRoomId(), room.getPlayers(), "PRESS_UPDATED"));
        }
    }
}