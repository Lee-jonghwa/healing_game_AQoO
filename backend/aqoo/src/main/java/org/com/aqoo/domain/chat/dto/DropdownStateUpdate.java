package org.com.aqoo.domain.chat.dto;// DropdownStateUpdate.java
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DropdownStateUpdate {
    private String message; // 예: "GAME_DROPDOWN_UPDATED"
    private String gameType;
    private String updatedBy;  // 드롭다운을 변경한 사용자
}