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
    @Column(columnDefinition = "TEXT") // TEXT 타입
    private String refreshToken;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String mainFishImage;

    @Column
    private Integer exp; // INTEGER

    @Column
    private Integer level; // INTEGER

    @Column
    private Boolean status; // BOOLEAN

    @Column
    private Integer mainAquarium; // INTEGER

    // 기본값 설정 메서드
    @PrePersist
    public void prePersist() {
        this.mainFishImage = (this.mainFishImage == null) ? "default image url" : this.mainFishImage;
        this.exp = (this.exp == null) ? 0 : this.exp;
        this.level = (this.level == null) ? 1 : this.level;
        this.status = this.status == null || this.status;
    }
}