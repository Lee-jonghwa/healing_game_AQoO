package org.com.aqoo.domain.friend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "friend_relationship")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FriendRelationship {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @Column(name = "friend1_id", length = 50)
    private String friend1Id;

    @Column(name = "friend2_id", length = 50)
    private String friend2Id;

    @Column(name = "status", nullable = false)
    private String status;

    @PrePersist
    public void prePersist() {
        this.status = (this.status.isEmpty()) ? "PENDING" : this.status;
    }

}
