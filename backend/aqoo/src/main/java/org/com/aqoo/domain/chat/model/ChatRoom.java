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
    private Set<String> readyMembers; // 게임 준비 상태를 표시한 사용자 목록

    public ChatRoom(String id, String ownerId) {
        this.id = id;
        this.ownerId = ownerId;
        this.members = ConcurrentHashMap.newKeySet();
        this.members.add(ownerId); // 방을 만든 유저를 자동으로 추가
        this.readyMembers = ConcurrentHashMap.newKeySet();
        // 방장은 준비 버튼 없이 게임 시작 버튼을 사용하므로 자동으로 readyMembers에 포함하지 않습니다.
    }

    /** 채팅방에 멤버 추가 */
    public void addMember(String userId) {
        members.add(userId);
    }

    /** 채팅방에서 멤버 제거 (준비 목록에서도 제거) */
    public void removeMember(String userId) {
        members.remove(userId);
        readyMembers.remove(userId);
    }

    /** 채팅방이 비었는지 확인 */
    public boolean isEmpty() {
        return members.isEmpty();
    }

    /**
     * 해당 사용자를 준비 상태로 표시
     * 단, 멤버 목록에 포함된 경우에만 준비 상태를 기록합니다.
     */
    public void markReady(String userId) {
        if (members.contains(userId)) {
            readyMembers.add(userId);
        }
    }

    /** 해당 사용자의 준비 상태 해제 */
    public void unmarkReady(String userId) {
        readyMembers.remove(userId);
    }

    /**
     * 방장(생성자)을 제외한 모든 멤버가 준비되었는지 확인
     * (방장이 준비할 필요가 없다면)
     */
    public boolean areAllReady() {
        for (String member : members) {
            if (!member.equals(ownerId) && !readyMembers.contains(member)) {
                return false;
            }
        }
        return true;
    }
}
