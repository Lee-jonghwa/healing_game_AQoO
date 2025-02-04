package org.com.aqoo.repository;

import org.com.aqoo.domain.fish.entity.Fish;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FishRepository extends JpaRepository<Fish, Integer> {
    List<Fish> findAll();
}
