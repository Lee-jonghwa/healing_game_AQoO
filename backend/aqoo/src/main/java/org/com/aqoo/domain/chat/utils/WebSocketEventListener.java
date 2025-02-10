package org.com.aqoo.domain.chat.utils;

import lombok.RequiredArgsConstructor;
import org.com.aqoo.domain.chat.dto.ChatMessageDto;
import org.com.aqoo.domain.chat.dto.RoomUpdate;
import org.com.aqoo.domain.chat.service.ChatRoomService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;
import org.springframework.web.socket.messaging.SessionSubscribeEvent;

import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

@Component
@RequiredArgsConstructor
public class WebSocketEventListener {

    private static final Logger logger = LoggerFactory.getLogger(WebSocketEventListener.class);

    private final SimpMessagingTemplate messagingTemplate;
    private final ChatRoomService chatRoomService;

    /**
     * WebSocket 연결이 끊어졌을 때 실행되는 이벤트 리스너
     * (이벤트 발생 시, 일정 그레이스 기간(예: 10초) 후에 재연결 여부를 확인하고, 재연결되지 않았다면 사용자를 제거)
     */
    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        logger.info("연결 끊어짐 이벤트 리스너 실행");

        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        if (headerAccessor.getSessionAttributes() == null) {
            logger.warn("세션 속성이 없어 disconnect 처리를 건너뜁니다.");
            return;
        }

        Boolean processed = (Boolean) headerAccessor.getSessionAttributes().get("disconnectProcessed");
        if (processed != null && processed) {
            logger.debug("이미 disconnect 처리가 완료되었습니다.");
            return;
        }
        headerAccessor.getSessionAttributes().put("disconnectProcessed", true);

        String userId = (String) headerAccessor.getSessionAttributes().get("userId");
        String roomId = (String) headerAccessor.getSessionAttributes().get("roomId");

        if (userId != null && roomId != null) {
            logger.info("사용자 {}의 WebSocket 연결이 끊겼습니다.", userId);

            // 그레이스 기간(10초) 후 재연결 여부 확인 후 최종 제거
            ScheduledExecutorService scheduler = Executors.newSingleThreadScheduledExecutor();
            scheduler.schedule(() -> {
                if (!chatRoomService.isUserReconnected(roomId, userId)) { // isUserReconnected 메서드 구현 필요
                    chatRoomService.removeMember(roomId, userId);
                    logger.info("사용자 {}가 최종적으로 제거되었습니다.", userId);

                    // 퇴장 메시지 전송 (ChatMessageDto의 생성자 순서는 roomId, sender, content, type)
                    ChatMessageDto leaveMessage = new ChatMessageDto(
                            roomId,
                            userId,
                            userId + "님이 연결이 끊겼습니다.",
                            ChatMessageDto.MessageType.LEAVE
                    );
                    messagingTemplate.convertAndSend("/topic/" + roomId, leaveMessage);

                    if (chatRoomService.isRoomEmpty(roomId)) {
                        chatRoomService.deleteRoom(roomId);
                    }
                }
            }, 10, TimeUnit.SECONDS);
        }
    }

    /**
     * 클라이언트가 /user/queue/userList 구독을 시작할 때마다 최신 USER_LIST 메시지를 전송
     * (구독이 완료된 클라이언트에게 사용자 목록을 재전송하여, 초기 연결 시 최신 데이터를 보장)
     */
    @EventListener
    public void handleSessionSubscribeEvent(SessionSubscribeEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String destination = headerAccessor.getDestination();
        if (destination != null && destination.equals("/user/queue/userList")) {
            String sessionId = headerAccessor.getSessionId();
            String roomId = (String) headerAccessor.getSessionAttributes().get("roomId");
            if (roomId != null) {
                logger.info("Session {} subscribed to {}. Sending updated USER_LIST for room {}", sessionId, destination, roomId);
                RoomUpdate update = chatRoomService.createUserListUpdate(roomId);
                if (update != null) {
                    messagingTemplate.convertAndSendToUser(sessionId, "/queue/userList", update);
                }
            }
        }
    }
}