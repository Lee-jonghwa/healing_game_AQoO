package org.com.aqoo.domain.friend.dto;

import lombok.Data;

@Data
public class FriendRequest {
    private String userId; //요청 보낸 사람
    private String friendId; //요청 보낼 사람
    private String status;
}
