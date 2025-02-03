package org.com.aqoo.domain.fish.repository;

import org.com.aqoo.domain.fish.entity.UserFish;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserFishRepository extends JpaRepository<UserFish, Integer> {

    @Query("SELECT uf.fishTypeId, COUNT(uf) FROM UserFish uf WHERE uf.aquariumId = :aquariumId GROUP BY uf.fishTypeId")
    List<Object[]> countFishesInAquarium(Integer aquariumId);
}
