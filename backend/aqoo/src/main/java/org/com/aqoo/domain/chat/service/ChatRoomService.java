package org.com.aqoo.domain.chat.service;

import lombok.RequiredArgsConstructor;
import org.com.aqoo.domain.auth.dto.UserInfoResponse;
import org.com.aqoo.domain.auth.service.UserService;
import org.com.aqoo.domain.chat.dto.InviteRequest;
import org.com.aqoo.domain.chat.dto.RoomUpdate;
import org.com.aqoo.domain.chat.model.ChatRoom;
import org.com.aqoo.domain.push.dto.PushRequest;
import org.com.aqoo.domain.push.service.PushService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatRoomService {

    private final Map<String, ChatRoom> chatRooms = new ConcurrentHashMap<>();
    // messagingTemplate을 이용하여 각종 메시지를 브로드캐스트
    private final SimpMessagingTemplate messagingTemplate;
    private final UserService userService;
    private final PushService pushService;

    /** 모든 채팅방 목록 조회 */
    public List<ChatRoom> getAllRooms() {
        return List.copyOf(chatRooms.values());
    }

    /** 채팅방 생성 */
    public ChatRoom createRoom(String ownerId) {
        String roomId = UUID.randomUUID().toString();
        ChatRoom room = new ChatRoom(roomId, ownerId);
        chatRooms.put(roomId, room);
        System.out.println("Created room: " + roomId);
        return room;
    }

    /** 특정 채팅방 조회 */
    public ChatRoom getRoom(String roomId) {
        return chatRooms.get(roomId);
    }

    /** 채팅방 멤버 추가 */
    public void addMember(String roomId, String userId) {
        ChatRoom room = chatRooms.get(roomId);
        if (room == null) {
            // 방이 존재하지 않는 경우, 예외를 던지거나 에러 처리를 수행합니다.
            throw new IllegalStateException("해당 채팅방은 존재하지 않거나 이미 삭제되었습니다.");
        }
        room.addMember(userId);
        broadcastUserList(roomId);
    }


    /** 채팅방 멤버 제거 */
    public void removeMember(String roomId, String userId) {
        ChatRoom room = chatRooms.get(roomId);
        if (room != null) {
            // 방장이 퇴장한 경우, 남아 있는 멤버 중 한 명을 새 방장으로 지정 (예: 첫 번째 멤버)
            if (userId.equals(room.getOwnerId())) {
                room.removeMember(userId);
                if (!room.getMembers().isEmpty()) {
                    String newOwner = room.getMembers().iterator().next();
                    room.setOwnerId(newOwner);
                }
            } else {
                room.removeMember(userId);
            }
        }
        // 준비 상태에서도 해당 사용자 제거
        unmarkReady(roomId, userId);
        broadcastUserList(roomId);
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

    /** 준비 상태 표시: 해당 채팅방에서 사용자가 준비되었다고 표시 */
    public void markReady(String roomId, String userId) {
        ChatRoom room = chatRooms.get(roomId);
        if (room != null) {
            room.markReady(userId);
            broadcastUserList(roomId);
        }
    }

    /** 준비 상태 해제 */
    public void unmarkReady(String roomId, String userId) {
        ChatRoom room = chatRooms.get(roomId);
        if (room != null) {
            room.unmarkReady(userId);
            broadcastUserList(roomId);
        }
    }

    /** 모든 멤버가 준비되었는지 확인 */
    public boolean areAllReady(String roomId) {
        ChatRoom room = chatRooms.get(roomId);
        return room != null && room.areAllReady();
    }

    /** USER_LIST 메시지를 생성하고 브로드캐스트 */
    public void broadcastUserList(String roomId) {
        RoomUpdate update = createUserListUpdate(roomId);
        if (update != null) {
            messagingTemplate.convertAndSend("/topic/room/" + roomId, update);
        }
    }

    /** 게임 종료 후 사용자 준비 상태 전원 해제 */
    public void clearReadyStatus(String roomId) {
        ChatRoom room = getRoom(roomId);
        if (room != null) {
            room.getReadyMembers().clear();
            // 최신 사용자 목록을 브로드캐스트
            broadcastUserList(roomId);
        }
    }

    // 재연결 여부를 확인하는 예시 메소드 (구현은 상황에 맞게)
    public boolean isUserReconnected(String roomId, String userId) {
        // 예: 현재 채팅방의 멤버 목록에 userId가 있는지 확인
        ChatRoom room = getRoom(roomId);
        return room != null && room.getMembers().contains(userId);
    }

    /** 최신 사용자 목록을 생성하여 RoomUpdate로 반환 */
    public RoomUpdate createUserListUpdate(String roomId) {
        ChatRoom room = getRoom(roomId);
        if (room != null) {
            System.out.println("RoomUpdate 실행");
            List<RoomUpdate.UserInfo> userList = room.getMembers().stream()
                    .map(userName -> {
                        boolean isHost = userName.equals(room.getOwnerId());
                        boolean ready = room.getReadyMembers().contains(userName);
                        UserInfoResponse tmpUser = userService.getUserInfo(userName);
                        String mainFishImage = tmpUser.getMainFishImage();
                        return new RoomUpdate.UserInfo(userName, ready, isHost, mainFishImage);
                    })
                    .collect(Collectors.toList());
            return new RoomUpdate(roomId, "USER_LIST", userList);
        }
        return null;
    }

    public Map<String, String> inviteFriend(InviteRequest request) throws Exception {
        //친구 요청 알람 보내기
        String sender = request.getHostId();
        String recipient = request.getGuestId();
        PushRequest pushRequest =
                new PushRequest(sender, recipient, "GAME INVITE", request.getRoomId());
        pushService.sendPush(pushRequest);

        // 결과를 Map으로 변환하여 반환
        Map<String, String> response = new HashMap<>();
        response.put("message", request.getGuestId() + "님을 초대했습니다.");
        return response;
    }

    /** 채팅방에서 사용자 추방 (Kick) 처리 */
    public void kickUser(String roomId, String targetUser, String requester) {
        ChatRoom room = getRoom(roomId);
        if (room != null) {
            // 요청자가 방장이 아니라면 추방 불가
            if (!room.getOwnerId().equals(requester)) {
                System.out.println("추방 요청 실패: 요청자 " + requester + "는 방장이 아님");
                return;
            }
            // 방장이 자신을 추방하는 경우 방지
            if (targetUser.equals(requester)) {
                System.out.println("추방 요청 실패: 방장은 자신을 추방할 수 없음");
                return;
            }
            // 대상 사용자 제거
            removeMember(roomId, targetUser);
            // 추방 메시지 브로드캐스트 (RoomUpdate를 이용하여 targetUser 정보를 포함)
            RoomUpdate update = new RoomUpdate(roomId, "USER_KICKED", null);
            update.setTargetUser(targetUser);
            messagingTemplate.convertAndSend("/topic/room/" + roomId, update);
        }
    }


}