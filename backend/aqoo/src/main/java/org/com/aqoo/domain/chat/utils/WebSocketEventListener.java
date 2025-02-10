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
        System.out.println(headerAccessor.toString());


        String userId = (String) headerAccessor.getSessionAttributes().get("userId");
        String roomId = (String) headerAccessor.getSessionAttributes().get("roomId");

        if (userId != null && roomId != null) {
            logger.info("사용자 {}의 WebSocket 연결이 끊겼습니다.", userId);

            // 유저 퇴장 처리
            chatRoomService.removeMember(roomId, userId);

            // 퇴장 메시지 전송
            ChatMessageDto leaveMessage = new ChatMessageDto();
            leaveMessage.setType(ChatMessageDto.MessageType.LEAVE);
            leaveMessage.setRoomId(roomId);
            leaveMessage.setSender(userId);
            leaveMessage.setContent(userId + "님이 연결이 끊겼습니다.");
            messagingTemplate.convertAndSend("/topic/" + roomId, leaveMessage);


            // 채팅방에 남아있는 사용자가 없으면 삭제
            if (chatRoomService.isRoomEmpty(roomId)) {
                chatRoomService.deleteRoom(roomId);
            }
        }
    }
}
