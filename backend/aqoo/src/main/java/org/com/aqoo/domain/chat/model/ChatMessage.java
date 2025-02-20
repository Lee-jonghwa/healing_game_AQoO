package org.com.aqoo.domain.chat.model;

import lombok.*;

@Getter
@Setter
public class ChatMessage {
    public enum MessageType {
        CHAT, JOIN, LEAVE
    }

    private MessageType type;
    private String roomId;
    private String sender;
    private String content;
    private long timestamp;
}
