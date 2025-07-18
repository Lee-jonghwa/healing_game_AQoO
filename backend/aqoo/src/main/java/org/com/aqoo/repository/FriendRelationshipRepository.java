package org.com.aqoo.repository;

import org.com.aqoo.domain.friend.entity.FriendRelationship;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface FriendRelationshipRepository extends JpaRepository<FriendRelationship, Integer> {

    //friend1_id 또는 friend2_id에 userId가 포함되며, status가 "ACCEPTED"인 모든 친구 관계를 반환
    @Query("SELECT fr FROM FriendRelationship fr WHERE (fr.friend1Id = :userId OR fr.friend2Id = :userId) AND fr.status = :status")
    List<FriendRelationship> findByFriend1IdOrFriend2IdAndStatus(@Param("userId") String userId, @Param("status") String status);

    // (friend1, friend2) 또는 (friend2, friend1)로 관계 조회
    @Query("SELECT f FROM FriendRelationship f " +
            "WHERE (f.friend1Id = :userId AND f.friend2Id = :friendId) " +
            "   OR (f.friend1Id = :friendId AND f.friend2Id = :userId)")
    Optional<FriendRelationship> findFriendship(@Param("userId") String userId, @Param("friendId") String friendId);

    @Query("SELECT f FROM FriendRelationship f " +
            "WHERE (f.friend1Id = :userId1 AND f.friend2Id = :userId2) " +
            "   OR (f.friend1Id = :userId2 AND f.friend2Id = :userId1)")
    List<FriendRelationship> findAllFriendshipsByUserIds(@Param("userId1") String userId1, @Param("userId2") String userId2);
}
