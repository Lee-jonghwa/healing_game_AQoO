package org.com.aqoo.domain.friend.dto;

import lombok.Data;
import lombok.Getter;
import lombok.Setter;

@Data
public class FriendResponse {
    private int id;            // 친구 관계 ID (FriendRelationship 테이블의 id)
    private String friendId;    // 친구의 ID (User 테이블의 id)
    private String nickname;    // 친구의 닉네임
    private String level;       // 친구의 레벨
    private String mainfish;    // 친구의 메인 피시

    public FriendResponse(int id, String friendId, String nickname, String level, String mainfish) {
        this.id = id;
        this.friendId = friendId;
        this.nickname = nickname;
        this.level = level;
        this.mainfish = mainfish;
    }
}
