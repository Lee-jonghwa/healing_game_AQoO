package org.com.aqoo.domain.aquarium.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(name = "aquarium")
public class Aquarium {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "aquarium_name", nullable = false)
    private String aquariumName;

    @Column(name = "last_fed_time")
    private LocalDateTime lastFedTime;

    @Column(name = "last_water_change_time")
    private LocalDateTime lastWaterChangeTime;

    @Column(name = "last_cleaned_time")
    private LocalDateTime lastCleanedTime;

    @Column(name = "user_id", nullable = false, length = 50)
    private String userId;

    @Column(name = "aquarium_background_id", nullable = false)
    private Integer aquariumBackgroundId;

    // 추가적인 논리적 필드 (DB 컬럼 X)
    @Transient
    private int waterCondition;

    @Transient
    private int pollutionStatus;
}
