package org.com.aqoo.domain.chat.service;

import org.com.aqoo.domain.chat.model.ChatRoom;
import org.com.aqoo.util.ImageUrlUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class ChatRoomService {

    private final Map<String, ChatRoom> chatRooms = new ConcurrentHashMap<>();

    /** 모든 채팅방 목록 조회 */
    public List<ChatRoom> getAllRooms() {
        return List.copyOf(chatRooms.values());
    }

    /** 채팅방 생성 */
    public ChatRoom createRoom(String ownerId) {
        String roomId = UUID.randomUUID().toString();
        ChatRoom room = new ChatRoom(roomId, ownerId);
        chatRooms.put(roomId, room);
        return room;
    }

    /** 특정 채팅방 조회 */
    public ChatRoom getRoom(String roomId) {
        return chatRooms.get(roomId);
    }

    /** 채팅방 멤버 추가 */
    public void addMember(String roomId, String userId) {
        chatRooms.computeIfAbsent(roomId, k -> new ChatRoom(roomId, userId))
                .addMember(userId);
    }

    /** 채팅방 멤버 제거 */
    public void removeMember(String roomId, String userId) {
        ChatRoom room = chatRooms.get(roomId);
        if (room != null) {
            room.removeMember(userId);
        }
    }

    /** 채팅방이 비었는지 확인 */
    public boolean isRoomEmpty(String roomId) {
        ChatRoom room = chatRooms.get(roomId);
        return room != null && room.isEmpty();
    }

    /** 채팅방 삭제 */
    public void deleteRoom(String roomId) {
        chatRooms.remove(roomId);
        System.out.println("채팅방 " + roomId + " 삭제됨");
    }

}
