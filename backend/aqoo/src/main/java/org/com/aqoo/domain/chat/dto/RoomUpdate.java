package org.com.aqoo.domain.chat.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@AllArgsConstructor
public class RoomUpdate {
    private String roomId;
    private String message; // 예: "USER_LIST"
    private List<UserInfo> users;

    @Getter
    @Setter
    @AllArgsConstructor
    public static class UserInfo {
        private String userName;
        private boolean ready;

        @JsonProperty("isHost")
        private boolean isHost;
    }
}
