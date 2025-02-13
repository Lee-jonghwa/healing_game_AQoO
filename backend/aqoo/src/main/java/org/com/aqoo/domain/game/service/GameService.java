package org.com.aqoo.domain.game.service;

import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
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
import java.util.ArrayList;
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

    // 각 방의 finish order(결승 순위)를 관리하는 Map: roomId -> List of userName (100에 도달한 순서)
    private final Map<String, List<String>> finishOrderMap = new ConcurrentHashMap<>();

    /**
     * 게임 시작: 채팅방 멤버의 점수를 0으로 초기화하고 "GAME_STARTED" 메시지를 브로드캐스트
     */
    @Transactional
    public void startGame(String roomId) {
        log.info("startGame() called for roomId: {}", roomId);
        ChatRoom chatRoom = chatRoomService.getRoom(roomId);
        if (chatRoom != null) {
            System.out.println("ChatRoom members: " + chatRoom.getMembers());
            Map<String, Integer> roomScore = new ConcurrentHashMap<>();
            chatRoom.getMembers().forEach(member -> roomScore.put(member, 0));
            scoreMap.put(roomId, roomScore);
            // finishOrder 초기화
            finishOrderMap.put(roomId, new ArrayList<>());

            List<Player> players = roomScore.entrySet().stream()
                    .map(e -> {
                        String userName = e.getKey();
                        int score = e.getValue();
                        String mainFishImage = userService.getUserInfo(userName).getMainFishImage();
                        return new Player(userName, score, mainFishImage);
                    })
                    .collect(Collectors.toList());

            // 게임 시작 시 승자와 finishOrder는 아직 없음
            RoomResponse response = new RoomResponse(roomId, players, "GAME_STARTED", null, null);
            messagingTemplate.convertAndSend("/topic/room/" + roomId, response);
            log.info("Broadcasted GAME_STARTED message for roomId: {}", roomId);
        } else {
            log.error("ChatRoom not found for roomId: {}", roomId);
        }
    }

    /**
     * 스페이스바 탭 이벤트 처리
     * - 100에 도달하면 해당 사용자는 추가 탭을 무시
     * - 100 도달 시 finish order에 순서대로 기록
     * - 모든 사용자가 100에 도달하면 GAME_ENDED 메시지를 브로드캐스트
     */
    @Transactional
    public void processPress(PressMessage pressMessage) {
        String roomId = pressMessage.getRoomId();
        String user = pressMessage.getUserName();
        int press = pressMessage.getPressCount();

        log.info("processPress() called: roomId={}, userName={}, pressCount={}", roomId, user, press);

        Map<String, Integer> roomScore = scoreMap.get(roomId);
        if (roomScore != null) {
            // 이미 100 이상이면 추가 탭 무시
            if (roomScore.getOrDefault(user, 0) >= 100) {
                log.info("User {} already reached 100, ignoring press", user);
                return;
            }

            // 점수를 업데이트하며 100 초과 방지
            roomScore.merge(user, press, (oldVal, pressVal) -> Math.min(100, oldVal + pressVal));
            int currentScore = roomScore.get(user);
            log.info("Updated score for {}: {}", user, currentScore);

            // finishOrder 처리: 100에 도달한 경우 순서대로 기록
            List<String> finishOrder = finishOrderMap.computeIfAbsent(roomId, k -> new ArrayList<>());
            if (currentScore == 100 && !finishOrder.contains(user)) {
                finishOrder.add(user);
                log.info("User {} finished! Finish order: {}", user, finishOrder);
            }

            List<Player> players = roomScore.entrySet().stream()
                    .map(e -> {
                        String userName = e.getKey();
                        int score = e.getValue();
                        String mainFishImage = userService.getUserInfo(userName).getMainFishImage();
                        return new Player(userName, score, mainFishImage);
                    })
                    .collect(Collectors.toList());

            boolean allReached100 = roomScore.values().stream().allMatch(score -> score >= 100);
            if (allReached100) {
                // 모든 사용자가 100에 도달하면 finishOrder의 첫 번째 사용자를 승자로 설정
                String winner = finishOrder.get(0);
                RoomResponse response = new RoomResponse(roomId, players, "GAME_ENDED", winner, finishOrder);
                messagingTemplate.convertAndSend("/topic/room/" + roomId, response);
                log.info("Broadcasted GAME_ENDED message for roomId: {} with finish order: {}", roomId, finishOrder);
            } else {
                RoomResponse response = new RoomResponse(roomId, players, "PRESS_UPDATED", null, null);
                messagingTemplate.convertAndSend("/topic/room/" + roomId, response);
                log.info("Broadcasted PRESS_UPDATED message for roomId: {}", roomId);
            }
        } else {
            log.error("No score map found for roomId: {}", roomId);
        }
    }

    /**
     * 타임아웃 등으로 게임 종료 시 처리
     * - 아직 모든 참가자가 100에 도달하지 않았다 하더라도 최고 점수 기준으로 승자를 결정
     * - finishOrder는 기록된 경우 그대로 전달 (없으면 빈 리스트)
     */
    @Transactional
    public void endGame(String roomId) {
        log.info("endGame() called for roomId: {}", roomId);
        Map<String, Integer> roomScore = scoreMap.get(roomId);
        if (roomScore != null) {
            List<Player> players = roomScore.entrySet().stream()
                    .map(e -> {
                        String userName = e.getKey();
                        int score = e.getValue();
                        String mainFishImage = userService.getUserInfo(userName).getMainFishImage();
                        return new Player(userName, score, mainFishImage);
                    })
                    .collect(Collectors.toList());
            // 최고 점수를 가진 참가자를 승자로 결정
            String computedWinner = players.stream()
                    .max((p1, p2) -> Integer.compare(p1.getTotalPressCount(), p2.getTotalPressCount()))
                    .map(Player::getUserName)
                    .orElse(null);
            List<String> finishOrder = finishOrderMap.getOrDefault(roomId, new ArrayList<>());
            RoomResponse response = new RoomResponse(roomId, players, "GAME_ENDED", computedWinner, finishOrder);
            messagingTemplate.convertAndSend("/topic/room/" + roomId, response);
            log.info("Game ended via timeout for roomId: {}. Winner: {}. Finish order: {}", roomId, computedWinner, finishOrder);
        } else {
            log.error("No score map found for roomId: {}", roomId);
        }
    }
}