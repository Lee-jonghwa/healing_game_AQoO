package org.com.aqoo.repository;

import org.com.aqoo.domain.auth.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, String> {

    Optional<User> findByEmail(String email);

    boolean existsById(String id);

    boolean existsByEmail(String email);

    boolean existsByNickname(String nickname);

    List<User> findByIdContainingIgnoreCase(String keyword);

    @Query("SELECT u FROM User u " +
            "WHERE u.id <> :userId " +
            "  AND u.id NOT IN (" +
            "      SELECT CASE WHEN fr.friend1Id = :userId THEN fr.friend2Id ELSE fr.friend1Id END " +
            "      FROM FriendRelationship fr " +
            "      WHERE fr.friend1Id = :userId OR fr.friend2Id = :userId" +
            "  )")
    List<User> findNonFriends(@Param("userId") String userId);
}
