package org.com.aqoo.domain.push.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_tokens")
@Getter
@Setter
@NoArgsConstructor
public class UserToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "token_id")
    private Long tokenId;  // 토큰 ID (자동 증가)

    @Column(name = "user_id", nullable = false, length = 50)
    private String userId;  // 유저 ID (VARCHAR)

    @Column(name = "token", nullable = false, unique = true, length = 255)
    private String token;  // 토큰 값

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;  // 토큰 생성 시간

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;  // 마지막 업데이트 시간

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
