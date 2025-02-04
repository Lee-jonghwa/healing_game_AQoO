package org.com.aqoo.repository;

import org.com.aqoo.domain.fish.entity.FishType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FishTypeRepository extends JpaRepository<FishType, Integer> {
    List<FishType> findAll();
}
