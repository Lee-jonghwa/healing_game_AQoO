package org.com.aqoo.repository;

import org.com.aqoo.domain.fish.entity.UserFish;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface UserFishRepository extends JpaRepository<UserFish, Integer> {

    @Query("SELECT uf.fishTypeId, COUNT(uf) FROM UserFish uf WHERE uf.aquariumId = :aquariumId GROUP BY uf.fishTypeId")
    List<Object[]> countFishesInAquarium(Integer aquariumId);

    // 어항에 속하지 않은 물고기 개수 조회
    @Query("SELECT uf.fishTypeId, COUNT(uf) FROM UserFish uf WHERE uf.userId = :userId AND uf.aquariumId IS NULL GROUP BY uf.fishTypeId")
    List<Object[]> countNonGroupedFishes(String userId);

    boolean existsByUserIdAndFishTypeId(String userId, Integer fishTypeId);
    @Transactional
    void removeAllByAquariumId(Integer aquariumId);
}
