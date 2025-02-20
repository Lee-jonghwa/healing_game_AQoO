package org.com.aqoo.repository;

import org.com.aqoo.domain.fish.entity.Fish;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FishRepository extends JpaRepository<Fish, Integer> {
    @Query("SELECT f FROM Fish f WHERE LOWER(f.rarity) IN ('common', 'rare', 'epic') " +
            "ORDER BY CASE LOWER(f.rarity) " +
            "WHEN 'common' THEN 1 " +
            "WHEN 'rare' THEN 2 " +
            "WHEN 'epic' THEN 3 END")
    List<Fish> findByRarityInIgnoreCase();

    @Query("SELECT f FROM Fish f WHERE f.id IN :ids AND LOWER(f.rarity) IN ('common', 'rare', 'epic')")
    List<Fish> findByIdInAndRarityIgnoreCase(@Param("ids") List<Integer> ids);

    List<Fish> findByIdIn(List<Integer> ids);

    List<Fish> findByRarity(String rarity);

    boolean existsByImageUrl(String imageUrl);

}
