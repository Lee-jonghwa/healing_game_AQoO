package org.com.aqoo.domain.chat.model;

import lombok.Getter;
import lombok.Setter;

import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Getter
@Setter
public class ChatRoom {
    private String id;           // 채팅방 ID
    private String ownerId;      // 채팅방 생성자 (유저 ID)
    private Set<String> members; // 채팅방에 참가한 유저 목록

    public ChatRoom(String id, String ownerId) {
        this.id = id;
        this.ownerId = ownerId;
        this.members = ConcurrentHashMap.newKeySet(); // 스레드 안전한 Set 사용
        this.members.add(ownerId); // 방을 만든 유저를 자동으로 추가
    }

    /** 채팅방에 멤버 추가 */
    public void addMember(String userId) {
        members.add(userId);
    }

    /** 채팅방에서 멤버 제거 */
    public void removeMember(String userId) {
        members.remove(userId);
    }

    /** 채팅방이 비었는지 확인 */
    public boolean isEmpty() {
        return members.isEmpty();
    }
}
