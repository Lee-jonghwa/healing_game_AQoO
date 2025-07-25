package org.com.aqoo.domain.fish.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
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
    private String rarity;    // 물고기의 희귀도 (예: Common, Rare, Epic, Legendary)

    @Column(name = "size")
    private String size;      // 물고기의 크기 (예: XL, L, M, S, XS)
}
