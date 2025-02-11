package org.com.aqoo.domain.chat.dto;

import lombok.Data;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class InviteRequest {
    private String hostId;
    private String guestId;
    private String roomId;
}
