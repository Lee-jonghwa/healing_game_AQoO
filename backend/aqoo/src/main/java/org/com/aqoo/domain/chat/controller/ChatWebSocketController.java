package org.com.aqoo.domain.chat.controller;

import lombok.AllArgsConstructor;
import org.com.aqoo.domain.chat.dto.ChatMessageDto;
import org.com.aqoo.domain.chat.service.ChatRoomService;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
@AllArgsConstructor
public class ChatWebSocketController {

    private final SimpMessagingTemplate messagingTemplate;
    private final ChatRoomService chatRoomService;

    /** 채팅 메시지 전송 */
    @MessageMapping("/chat.sendMessage")
    public void sendMessage(ChatMessageDto chatMessage) {
        System.out.println("chat.sendMessage 실행");
        messagingTemplate.convertAndSend("/topic/" + chatMessage.getRoomId(), chatMessage);
    }

    /** 채팅방 참가 */
    @MessageMapping("/chat.joinRoom")
    public void joinRoom(ChatMessageDto chatMessage, SimpMessageHeaderAccessor headerAccessor) {
        System.out.println("chat.joinRoom 실행");

        // 사용자를 채팅방에 추가
        chatRoomService.addMember(chatMessage.getRoomId(), chatMessage.getSender());

        // JOIN 메시지 생성 및 브로드캐스트
        chatMessage.setType(ChatMessageDto.MessageType.JOIN);
        chatMessage.setContent(chatMessage.getSender() + "님이 참가했습니다.");

        headerAccessor.getSessionAttributes().put("userId", chatMessage.getSender());
        headerAccessor.getSessionAttributes().put("roomId", chatMessage.getRoomId());

        messagingTemplate.convertAndSend("/topic/" + chatMessage.getRoomId(), chatMessage);

        // 추가: 최신 사용자 목록을 즉시 브로드캐스트
        chatRoomService.broadcastUserList(chatMessage.getRoomId());
    }


    /** 채팅방 준비 */
    @MessageMapping("/chat.ready")
    public void ready(ChatMessageDto chatMessage, SimpMessageHeaderAccessor headerAccessor) {
        System.out.println("chat.ready 실행");
        // 준비 버튼 클릭 시 호출: 해당 사용자를 준비 상태로 표시
        chatRoomService.markReady(chatMessage.getRoomId(), chatMessage.getSender());
        chatMessage.setType(ChatMessageDto.MessageType.READY);
        chatMessage.setContent(chatMessage.getSender() + "님이 준비 완료되었습니다.");
        messagingTemplate.convertAndSend("/topic/" + chatMessage.getRoomId(), chatMessage);
    }

    /** 채팅방 퇴장 */
    @MessageMapping("/chat.leaveRoom")
    public void leaveRoom(ChatMessageDto chatMessage) {
        System.out.println("chat.leaveRoom 실행");
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

    /** 준비 해제(unready) 처리 */
    @MessageMapping("/chat.unready")
    public void unready(ChatMessageDto chatMessage, SimpMessageHeaderAccessor headerAccessor) {
        System.out.println("chat.unready 실행");
        chatRoomService.unmarkReady(chatMessage.getRoomId(), chatMessage.getSender());
        chatMessage.setType(ChatMessageDto.MessageType.READY); // 필요 시 별도의 UNREADY 타입으로 정의 가능
        chatMessage.setContent(chatMessage.getSender() + "님이 준비 해제되었습니다.");
        messagingTemplate.convertAndSend("/topic/" + chatMessage.getRoomId(), chatMessage);
    }

    /** 게임 종료 후 모든 참가자의 Ready 상태 초기화를 위한 처리 */
    @MessageMapping("/chat.clearReady")
    public void clearReady(ChatMessageDto chatMessage) {
        System.out.println("chat.clearReady 실행");
        chatRoomService.clearReadyStatus(chatMessage.getRoomId());
        // 선택적으로, clear 이후 사용자 목록 업데이트 메시지(USER_LIST)를 브로드캐스트할 수 있음
    }

    /** 채팅방에서 사용자 추방 (Kick) 처리 */
    @MessageMapping("/chat.kickUser")
    public void kickUser(ChatMessageDto chatMessage, SimpMessageHeaderAccessor headerAccessor) {
        System.out.println("chat.kickUser 실행");
        // chatMessage의 sender가 방장임을 전제하고, targetUser를 추방 대상으로 지정
        chatRoomService.kickUser(chatMessage.getRoomId(), chatMessage.getTargetUser(), chatMessage.getSender());
    }
}