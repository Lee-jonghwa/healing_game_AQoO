package org.com.aqoo.domain.chat.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DropdownUpdateMessage {
    private String roomId;
    private String sender;  // 드롭다운을 변경한 사용자 (방장)
    private String gameType;
}