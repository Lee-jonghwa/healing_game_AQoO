package org.com.aqoo.repository;

import org.com.aqoo.domain.aquarium.entity.AquariumBackground;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AquariumBackgroundRepository extends JpaRepository<AquariumBackground, Integer> {
    List<AquariumBackground> findAll();
}
