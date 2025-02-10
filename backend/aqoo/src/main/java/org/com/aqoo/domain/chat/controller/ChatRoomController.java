package org.com.aqoo.domain.chat.controller;

import lombok.AllArgsConstructor;
import org.com.aqoo.domain.chat.dto.ChatRoomDto;
import org.com.aqoo.domain.chat.service.ChatRoomService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@AllArgsConstructor
@RequestMapping("/api/v1/chatrooms")
public class ChatRoomController {

    private final ChatRoomService chatRoomService;

    /** 모든 채팅방 목록 조회 */
    @GetMapping
    public List<ChatRoomDto> getAllChatRooms() {
        return chatRoomService.getAllRooms().stream()
                .map(room -> new ChatRoomDto(room.getId(), room.getOwnerId(), room.getMembers()))
                .collect(Collectors.toList());
    }

    /** 특정 채팅방 조회 */
    @GetMapping("/{roomId}")
    public ChatRoomDto getChatRoom(@PathVariable String roomId) {
        var room = chatRoomService.getRoom(roomId);
        return new ChatRoomDto(room.getId(), room.getOwnerId(), room.getMembers());
    }

    /** 채팅방 생성 */
    @PostMapping
    public ChatRoomDto createChatRoom(@RequestParam String userId) {
        System.out.println("새 채팅방 생성");
        var room = chatRoomService.createRoom(userId);
        return new ChatRoomDto(room.getId(), room.getOwnerId(), room.getMembers());
    }
}