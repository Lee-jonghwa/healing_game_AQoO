package org.com.aqoo.repository;

import org.com.aqoo.domain.aquarium.entity.Aquarium;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface AquariumRepository extends JpaRepository<Aquarium, Integer> {
    List<Aquarium> findByUserId(String userId);

    @Query("SELECT a FROM Aquarium a WHERE a.id = :aquariumId")
    Optional<Aquarium> findAquariumById(@Param("aquariumId") Integer aquariumId);

    @Modifying
    @Transactional
    @Query("UPDATE UserFish uf SET uf.aquariumId = NULL WHERE uf.aquariumId = :aquariumId")
    void setAquariumIdToNullByAquariumId(@Param("aquariumId") Integer aquariumId);
}
