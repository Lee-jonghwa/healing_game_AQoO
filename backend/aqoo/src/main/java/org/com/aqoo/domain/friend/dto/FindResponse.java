package org.com.aqoo.domain.friend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class FindResponse {
    private String userId;
    private String friendId;
    private int isFriend; // 0: 친구 아님, 1: 친구임
    private String nickname;
    private int level;
    private String mainFishImage;
}
