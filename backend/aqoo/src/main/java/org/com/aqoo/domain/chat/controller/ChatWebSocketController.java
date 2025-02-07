package org.com.aqoo.domain.chat.controller;

import org.com.aqoo.domain.chat.dto.ChatMessageDto;
import org.com.aqoo.domain.chat.service.ChatRoomService;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Controller;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;


@Controller
public class ChatWebSocketController {

    private final SimpMessagingTemplate messagingTemplate;
    private final ChatRoomService chatRoomService;

    public ChatWebSocketController(SimpMessagingTemplate messagingTemplate, ChatRoomService chatRoomService) {
        this.messagingTemplate = messagingTemplate;
        this.chatRoomService = chatRoomService;
    }

    /** 채팅 메시지 전송 */
    @MessageMapping("/chat.sendMessage")
    public void sendMessage(ChatMessageDto chatMessage) {
        messagingTemplate.convertAndSend("/topic/" + chatMessage.getRoomId(), chatMessage);
    }

    /** 채팅방 참가 */
    @MessageMapping("/chat.joinRoom")
    public void joinRoom(ChatMessageDto chatMessage, SimpMessageHeaderAccessor headerAccessor) {
        chatRoomService.addMember(chatMessage.getRoomId(), chatMessage.getSender());
        chatMessage.setType(ChatMessageDto.MessageType.JOIN);
        chatMessage.setContent(chatMessage.getSender() + "님이 참가했습니다.");

        headerAccessor.getSessionAttributes().put("userId", chatMessage.getSender());
        headerAccessor.getSessionAttributes().put("roomId", chatMessage.getRoomId());

        messagingTemplate.convertAndSend("/topic/" + chatMessage.getRoomId(), chatMessage);
    }

    /** 채팅방 퇴장 */
    @MessageMapping("/chat.leaveRoom")
    public void leaveRoom(ChatMessageDto chatMessage) {
        chatRoomService.removeMember(chatMessage.getRoomId(), chatMessage.getSender());

        // 퇴장 메시지 브로드캐스트
        chatMessage.setType(ChatMessageDto.MessageType.LEAVE);
        chatMessage.setContent(chatMessage.getSender() + "님이 퇴장했습니다.");
        messagingTemplate.convertAndSend("/topic/" + chatMessage.getRoomId(), chatMessage);

        // 채팅방 인원이 0명이면 삭제
        if (chatRoomService.isRoomEmpty(chatMessage.getRoomId())) {
            chatRoomService.deleteRoom(chatMessage.getRoomId());
        }
    }
}
