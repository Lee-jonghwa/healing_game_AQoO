package org.com.aqoo.domain.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@AllArgsConstructor
@Builder
public class UserInfoResponse {
    private String id;

    @Builder.Default
    private String email = "";

    @Builder.Default
    private String nickname = "닉네임 없음";

    @Builder.Default
    private String mainFishImage = "";

    @Builder.Default
    private int exp = 0;

    @Builder.Default
    private int level = 1;

    @Builder.Default
    private boolean status = true; // 기본 true

    @Builder.Default
    private int mainAquarium = 0;

    @Builder.Default
    private int fishTicket;

}