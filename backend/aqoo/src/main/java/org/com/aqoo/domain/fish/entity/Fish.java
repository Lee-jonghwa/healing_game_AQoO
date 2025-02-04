package org.com.aqoo.domain.fish.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(name = "fish_type")
public class Fish {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    @Column(name = "fish_name", nullable = false)
    private String fishName;
    @Column(name = "image_url")
    private String imageUrl;  // 물고기 이미지 URL
    @Column(name = "rarity")
    private String rarity;  // 물고기의 희귀도 (예: Common, Rare, Epic, Legendary)
}
