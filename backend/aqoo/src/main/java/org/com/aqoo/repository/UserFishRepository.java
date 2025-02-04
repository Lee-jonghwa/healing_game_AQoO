package org.com.aqoo.repository;

import org.com.aqoo.domain.fish.entity.UserFish;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Repository
public interface UserFishRepository extends JpaRepository<UserFish, Integer> {

    @Query("SELECT DISTINCT uf.fishTypeId FROM UserFish uf WHERE uf.userId = :userId")
    List<Integer> findDistinctFishTypeIdsByUserId(@Param("userId") String userId);

    @Query("SELECT uf.fishTypeId, COUNT(uf) FROM UserFish uf WHERE uf.userId = :userId GROUP BY uf.fishTypeId")
    List<Object[]> countFishByUserId(@Param("userId") String userId);

    @Query("SELECT uf.fishTypeId, COUNT(uf) FROM UserFish uf WHERE uf.aquariumId = :aquariumId GROUP BY uf.fishTypeId")
    List<Object[]> countFishesInAquarium(Integer aquariumId);

    // 어항에 속하지 않은 물고기 개수 조회
    @Query("SELECT uf.fishTypeId, COUNT(uf) FROM UserFish uf WHERE uf.userId = :userId AND uf.aquariumId IS NULL GROUP BY uf.fishTypeId")
    List<Object[]> countNonGroupedFishes(String userId);

    boolean existsByUserIdAndFishTypeId(String userId, Integer fishTypeId);
    @Transactional
    void removeAllByAquariumId(Integer aquariumId);
}
