package org.com.aqoo.domain.aquarium.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(name = "aquarium_background")
public class AquariumBackground {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "image_url", columnDefinition = "TEXT")
    private String imageUrl;

    @OneToMany(mappedBy = "aquariumBackground", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Aquarium> aquariums;
}
