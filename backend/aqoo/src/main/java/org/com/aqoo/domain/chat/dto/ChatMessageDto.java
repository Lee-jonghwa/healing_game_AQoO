package org.com.aqoo.domain.chat.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class ChatMessageDto {
    private String roomId;
    private String sender;
    private String content;
    private MessageType type;
    private String targetUser;

    public enum MessageType {
        CHAT,
        JOIN,
        LEAVE,
        READY,
        USER_KICKED
    }
}
