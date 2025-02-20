package org.com.aqoo.domain.chat.controller;

import lombok.AllArgsConstructor;
import org.com.aqoo.domain.chat.dto.ChatMessageDto;
import org.com.aqoo.domain.chat.dto.DropdownStateUpdate;
import org.com.aqoo.domain.chat.dto.DropdownUpdateMessage;
import org.com.aqoo.domain.chat.service.ChatRoomService;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
@AllArgsConstructor
public class ChatWebSocketController {

    private final SimpMessagingTemplate messagingTemplate;
    private final ChatRoomService chatRoomService;

    /** 채팅 메시지 전송 (사용자 작성 메시지) */
    @MessageMapping("/chat.sendMessage")
    public void sendMessage(ChatMessageDto chatMessage) {
        System.out.println("chat.sendMessage 실행");
        messagingTemplate.convertAndSend("/topic/" + chatMessage.getRoomId(), chatMessage);
    }

    /** 채팅방 참가 */
    @MessageMapping("/chat.joinRoom")
    public void joinRoom(ChatMessageDto chatMessage, SimpMessageHeaderAccessor headerAccessor) {
        System.out.println("chat.joinRoom 실행");
        String originalSender = chatMessage.getSender();
        chatRoomService.addMember(chatMessage.getRoomId(), originalSender);

        // 시스템 메시지로 변환하여 참가 알림 전송
        chatMessage.setType(ChatMessageDto.MessageType.JOIN);
        chatMessage.setSender("SYSTEM");
        chatMessage.setContent(originalSender + "님이 참가했습니다.");

        headerAccessor.getSessionAttributes().put("userId", originalSender);
        headerAccessor.getSessionAttributes().put("roomId", chatMessage.getRoomId());

        messagingTemplate.convertAndSend("/topic/" + chatMessage.getRoomId(), chatMessage);

        // 최신 사용자 목록 브로드캐스트
        chatRoomService.broadcastUserList(chatMessage.getRoomId());
    }

    /** 채팅방 준비 */
    @MessageMapping("/chat.ready")
    public void ready(ChatMessageDto chatMessage, SimpMessageHeaderAccessor headerAccessor) {
        System.out.println("chat.ready 실행");
        String originalSender = chatMessage.getSender();
        chatRoomService.markReady(chatMessage.getRoomId(), originalSender);

        // 시스템 메시지로 준비 완료 알림 전송
        chatMessage.setType(ChatMessageDto.MessageType.READY);
        chatMessage.setSender("SYSTEM");
        chatMessage.setContent(originalSender + "님이 준비되셨습니다.");

        messagingTemplate.convertAndSend("/topic/" + chatMessage.getRoomId(), chatMessage);
    }

    /** 준비 해제(unready) 처리 */
    @MessageMapping("/chat.unready")
    public void unready(ChatMessageDto chatMessage, SimpMessageHeaderAccessor headerAccessor) {
        System.out.println("chat.unready 실행");
        String originalSender = chatMessage.getSender();
        chatRoomService.unmarkReady(chatMessage.getRoomId(), originalSender);

        // 시스템 메시지로 준비 해제 알림 전송
        chatMessage.setType(ChatMessageDto.MessageType.READY); // 필요 시 UNREADY 타입을 별도로 정의 가능
        chatMessage.setSender("SYSTEM");
        chatMessage.setContent(originalSender + "님이 준비해제 되셨습니다.");

        messagingTemplate.convertAndSend("/topic/" + chatMessage.getRoomId(), chatMessage);
    }

    /** 채팅방 퇴장 */
    @MessageMapping("/chat.leaveRoom")
    public void leaveRoom(ChatMessageDto chatMessage) {
        System.out.println("chat.leaveRoom 실행");
        String originalSender = chatMessage.getSender();
        chatRoomService.removeMember(chatMessage.getRoomId(), originalSender);

        // 시스템 메시지로 퇴장 알림 전송
        chatMessage.setType(ChatMessageDto.MessageType.LEAVE);
        chatMessage.setSender("SYSTEM");
        chatMessage.setContent(originalSender + "님이 퇴장했습니다.");
        messagingTemplate.convertAndSend("/topic/" + chatMessage.getRoomId(), chatMessage);

        // 채팅방 인원이 0명이면 삭제
        if (chatRoomService.isRoomEmpty(chatMessage.getRoomId())) {
            chatRoomService.deleteRoom(chatMessage.getRoomId());
        }
    }

    /** 게임 종료 후 모든 참가자의 Ready 상태 초기화를 위한 처리 */
    @MessageMapping("/chat.clearReady")
    public void clearReady(ChatMessageDto chatMessage) {
        System.out.println("chat.clearReady 실행");
        chatRoomService.clearReadyStatus(chatMessage.getRoomId());
        // 필요 시, 사용자 목록 업데이트 메시지(USER_LIST) 전송도 가능합니다.
    }

    /** 채팅방에서 사용자 추방 (Kick) 처리 */
    @MessageMapping("/chat.kickUser")
    public void kickUser(ChatMessageDto chatMessage, SimpMessageHeaderAccessor headerAccessor) {
        System.out.println("chat.kickUser 실행");
        String requester = chatMessage.getSender();
        String targetUser = chatMessage.getTargetUser();

        // 추방 처리는 서비스에서 진행 (요청자가 방장인지 확인 후 대상 사용자 제거)
        chatRoomService.kickUser(chatMessage.getRoomId(), targetUser, requester);

        // 시스템 메시지로 추방 알림 전송
        ChatMessageDto kickMessage = new ChatMessageDto();
        kickMessage.setRoomId(chatMessage.getRoomId());
        kickMessage.setType(ChatMessageDto.MessageType.USER_KICKED);
        kickMessage.setSender("SYSTEM");
        kickMessage.setContent(targetUser + "님이 추방되셨습니다.");
        messagingTemplate.convertAndSend("/topic/" + chatMessage.getRoomId(), kickMessage);
    }

    @MessageMapping("/chat.dropdown")
    public void updateDropdownState(@Payload DropdownUpdateMessage message) {
        // 필요 시 message.sender가 방장인지 검증하는 로직 추가

        // 드롭다운 업데이트 메시지 생성
        DropdownStateUpdate update = new DropdownStateUpdate();
        update.setMessage("GAME_DROPDOWN_UPDATED");
        update.setGameType(message.getGameType());
        update.setUpdatedBy(message.getSender());

        // 해당 채팅방의 모든 클라이언트에게 브로드캐스트 (/topic/room/{roomId} 구독 중)
        messagingTemplate.convertAndSend("/topic/room/" + message.getRoomId(), update);
    }
}