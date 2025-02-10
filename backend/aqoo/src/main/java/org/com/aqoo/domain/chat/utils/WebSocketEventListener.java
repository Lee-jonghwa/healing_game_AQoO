package org.com.aqoo.domain.chat.utils;

import lombok.RequiredArgsConstructor;
import org.com.aqoo.domain.chat.dto.ChatMessageDto;
import org.com.aqoo.domain.chat.service.ChatRoomService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

@Component
@RequiredArgsConstructor
public class WebSocketEventListener {

    private static final Logger logger = LoggerFactory.getLogger(WebSocketEventListener.class);

    private final SimpMessagingTemplate messagingTemplate;
    private final ChatRoomService chatRoomService;

    /** WebSocket 연결이 끊어졌을 때 실행되는 이벤트 리스너 */
    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        logger.info("연결 끊어짐 이벤트 리스너 실행");

        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        // 세션 속성이 없는 경우 빠르게 리턴합니다.
        if (headerAccessor.getSessionAttributes() == null) {
            logger.warn("세션 속성이 없어 disconnect 처리를 건너뜁니다.");
            return;
        }

        // 이미 disconnect 처리가 되었는지 확인하는 플래그
        Boolean processed = (Boolean) headerAccessor.getSessionAttributes().get("disconnectProcessed");
        if (processed != null && processed) {
            logger.debug("이미 disconnect 처리가 완료되었습니다.");
            return;
        }
        // 한 번 처리되었음을 기록합니다.
        headerAccessor.getSessionAttributes().put("disconnectProcessed", true);

        String userId = (String) headerAccessor.getSessionAttributes().get("userId");
        String roomId = (String) headerAccessor.getSessionAttributes().get("roomId");

        if (userId != null && roomId != null) {
            logger.info("사용자 {}의 WebSocket 연결이 끊겼습니다.", userId);

            // 유저 퇴장 처리 (백엔드에서 방장이 나갈 경우 새 방장을 지정하는 로직이 구현되어 있어야 함)
            chatRoomService.removeMember(roomId, userId);

            // 퇴장 메시지 전송
            // ChatMessageDto 생성자 순서: roomId, sender, content, type
            ChatMessageDto leaveMessage = new ChatMessageDto(
                    roomId,
                    userId,
                    userId + "님이 연결이 끊겼습니다.",
                    ChatMessageDto.MessageType.LEAVE
            );
            messagingTemplate.convertAndSend("/topic/" + roomId, leaveMessage);

            // 채팅방에 남은 사용자가 없으면 채팅방 삭제
            if (chatRoomService.isRoomEmpty(roomId)) {
                chatRoomService.deleteRoom(roomId);
            }
        }
    }
}