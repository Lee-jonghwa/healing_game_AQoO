package org.com.aqoo.domain.fish.repository;

import org.com.aqoo.domain.fish.entity.FishType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FishTypeRepository extends JpaRepository<FishType, Integer> {
}
