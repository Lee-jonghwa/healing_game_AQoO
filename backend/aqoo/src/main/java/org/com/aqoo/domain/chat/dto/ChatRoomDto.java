package org.com.aqoo.domain.chat.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.Set;

@Getter
@Setter
public class ChatRoomDto {
    private String roomId;  // 채팅방 ID
    private String ownerId; // 채팅방 생성자 (유저 ID)
    private Set<String> members; // 채팅방 멤버 목록

    public ChatRoomDto(String roomId, String ownerId, Set<String> members) {
        this.roomId = roomId;
        this.ownerId = ownerId;
        this.members = members;
    }
}
