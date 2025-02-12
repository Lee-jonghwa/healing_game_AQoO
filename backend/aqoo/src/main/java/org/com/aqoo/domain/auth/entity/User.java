package org.com.aqoo.domain.auth.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "user")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @Column(length = 50) // VARCHAR(50)
    private String id;

    @Lob
    @Column(columnDefinition = "TEXT") // TEXT 타입
    private String pw;

    @Column(length = 255) // VARCHAR(255)
    private String email;

    @Column(length = 50) // VARCHAR(50)
    private String nickname;

    @Lob
    @Column(name="refresh_token",columnDefinition = "TEXT") // TEXT 타입
    private String refreshToken;

    @Lob
    @Column(name="main_fish_image",columnDefinition = "TEXT")
    private String mainFishImage;

    @Column
    private Integer exp; // INTEGER

    @Column
    private Integer level; // INTEGER

    @Column
    private Boolean status; // BOOLEAN

    @Column(name = "main_aquarium")
    private Integer mainAquarium; // INTEGER

    @Column(name = "is_first_login")
    private Integer isFirstLogin; // INTEGER

    @Column(name = "fish_ticket")
    private Integer fishTicket; // INTEGER


    // 기본값 설정 메서드
    @PrePersist
    public void prePersist() {
        this.mainFishImage = (this.mainFishImage == null) ? "/fish.png" : this.mainFishImage;
        this.exp = (this.exp == null) ? 0 : this.exp;
        this.level = (this.level == null) ? 1 : this.level;
        this.status = this.status == null || this.status;
        this.isFirstLogin = (this.isFirstLogin == null) ? 1 : this.isFirstLogin;
        this.fishTicket = (this.fishTicket == null) ? 1 : this.fishTicket;
    }
}