package org.com.aqoo.domain.game.service;

import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.com.aqoo.domain.auth.service.UserService;
import org.com.aqoo.domain.game.dto.PressMessage;
import org.com.aqoo.domain.game.dto.RoomResponse;
import org.com.aqoo.domain.game.entity.Player;
import org.com.aqoo.domain.chat.service.ChatRoomService;
import org.com.aqoo.domain.chat.model.ChatRoom;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
@Slf4j
@AllArgsConstructor
public class GameService {

    private final SimpMessagingTemplate messagingTemplate;
    private final ChatRoomService chatRoomService;
    private final UserService userService;

    // 각 방의 점수를 관리하는 Map: roomId -> (userName -> score)
    private final Map<String, Map<String, Integer>> scoreMap = new ConcurrentHashMap<>();

    /**
     * 게임 시작: 채팅방에 참여한 모든 사용자를 게임 참가자로 간주하고 초기 점수를 0으로 설정한 후,
     * "GAME_STARTED" 메시지와 함께 플레이어 목록을 브로드캐스트합니다.
     */
    @Transactional
    public void startGame(String roomId) {
        log.info("startGame() called for roomId: {}", roomId);
        ChatRoom chatRoom = chatRoomService.getRoom(roomId);
        if (chatRoom != null) {
            System.out.println("채팅방 멤버: " + chatRoom.getMembers());
            Map<String, Integer> roomScore = new ConcurrentHashMap<>();
            chatRoom.getMembers().forEach(member -> roomScore.put(member, 0));
            scoreMap.put(roomId, roomScore);

            List<Player> players = roomScore.entrySet().stream()
                    .map(e -> {
                        String userNameKey = e.getKey();
                        int score = e.getValue();
                        // UserService를 통해 해당 사용자의 정보를 조회하여 mainFishImage를 가져옴
                        String mainFishImage = userService.getUserInfo(userNameKey).getMainFishImage();
                        return new Player(userNameKey, score, mainFishImage);
                    })
                    .collect(Collectors.toList());

            System.out.println("players:" + players);
            RoomResponse response = new RoomResponse(roomId, players, "GAME_STARTED");
            messagingTemplate.convertAndSend("/topic/room/" + roomId, response);
            log.info("Broadcasted GAME_STARTED message for roomId: {}", roomId);
        } else {
            System.out.println("게임 실행 실패");
            log.error("ChatRoom not found for roomId: {}", roomId);
        }
    }

    /**
     * 스페이스바 연타 이벤트 처리: 받은 PressMessage를 기반으로 해당 플레이어의 점수를 업데이트한 후,
     * 업데이트된 플레이어 목록을 생성하고, "PRESS_UPDATED" 또는 "GAME_ENDED" 메시지를 브로드캐스트합니다.
     */
    @Transactional
    public void processPress(PressMessage pressMessage) {
        String roomId = pressMessage.getRoomId();
        String user = pressMessage.getUserName();
        int press = pressMessage.getPressCount();

        log.info("processPress() called: roomId={}, userName={}, pressCount={}", roomId, user, press);

        Map<String, Integer> roomScore = scoreMap.get(roomId);
        if (roomScore != null) {
            roomScore.merge(user, press, Integer::sum);
            int currentScore = roomScore.get(user);
            log.info("Updated score for {}: {}", user, currentScore);

            List<Player> players = roomScore.entrySet().stream()
                    .map(e -> {
                        String userNameKey = e.getKey();
                        int score = e.getValue();
                        String mainFishImage = userService.getUserInfo(userNameKey).getMainFishImage();
                        return new Player(userNameKey, score, mainFishImage);
                    })
                    .collect(Collectors.toList());

            if (currentScore >= 100) {
                RoomResponse response = new RoomResponse(roomId, players, "GAME_ENDED");
                // 필요 시 response.setWinner(user);
                messagingTemplate.convertAndSend("/topic/room/" + roomId, response);
                log.info("Broadcasted GAME_ENDED message for roomId: {} with winner: {}", roomId, user);
            } else {
                RoomResponse response = new RoomResponse(roomId, players, "PRESS_UPDATED");
                messagingTemplate.convertAndSend("/topic/room/" + roomId, response);
                log.info("Broadcasted PRESS_UPDATED message for roomId: {}", roomId);
            }
        } else {
            log.error("No score map found for roomId: {}", roomId);
        }
    }
}