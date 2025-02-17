package org.com.aqoo.domain.friend.dto;

import lombok.Data;
import lombok.Getter;
import lombok.Setter;

@Data
public class FriendInfo {
    private int id;              // 친구 관계의 ID
    private String friendId;      // 친구의 ID
    private String nickname;      // 친구의 닉네임
    private int level;            // 친구의 레벨
    private String mainFishImage;      // 친구의 메인 물고기 이미지

    public FriendInfo(int id, String friendId, String nickname, int level, String mainFishImage) {
        this.id = id;
        this.friendId = friendId;
        this.nickname = nickname;
        this.level = level;
        this.mainFishImage = mainFishImage;
    }
}
