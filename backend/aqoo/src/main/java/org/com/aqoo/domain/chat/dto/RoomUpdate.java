package org.com.aqoo.domain.chat.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class RoomUpdate {
    private String roomId;
    private String message; // 예: "USER_LIST"
    private List<UserInfo> users;
    private String targetUser;

    public RoomUpdate(String roomId, String message, List<UserInfo> users) {
        this.roomId = roomId;
        this.message = message;
        this.users = users;
    }

    @Getter
    @Setter
    @AllArgsConstructor
    public static class UserInfo {
        private String userName;
        private String nickname;
        private boolean ready;

        @JsonProperty("isHost")
        private boolean isHost;

        private String mainFishImage;

        private int level;
    }
}