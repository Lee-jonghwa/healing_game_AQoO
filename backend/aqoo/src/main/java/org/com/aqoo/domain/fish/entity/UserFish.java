package org.com.aqoo.domain.fish.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Data
@NoArgsConstructor
@Table(name = "user_fish")
public class UserFish {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "fish_type_id", nullable = false)
    private Integer fishTypeId;

    @Column(name = "user_id", nullable = false, length = 50)
    private String userId;

    @Column(name = "aquarium_id", nullable = false)
    private Integer aquariumId;
}
