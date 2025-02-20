package org.com.aqoo.domain.chat.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 각 채팅방 멤버의 정보를 담는 DTO
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class MemberDto {
    private String userId;
    private String nickname;
    private String mainFishImage;
    private boolean isHost;
    private int level;
}
