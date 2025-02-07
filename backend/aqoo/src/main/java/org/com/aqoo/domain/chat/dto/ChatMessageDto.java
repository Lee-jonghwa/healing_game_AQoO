package org.com.aqoo.domain.chat.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ChatMessageDto {
    public enum MessageType {
        CHAT, JOIN, LEAVE
    }

    private MessageType type; // 메시지 유형 (채팅, 입장, 퇴장)
    private String roomId;    // 채팅방 ID
    private String sender;    // 메시지 보낸 사람
    private String content;   // 메시지 내용

    public ChatMessageDto() {}

    public ChatMessageDto(MessageType type, String roomId, String sender, String content) {
        this.type = type;
        this.roomId = roomId;
        this.sender = sender;
        this.content = content;
    }
}
