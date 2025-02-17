package org.com.aqoo.repository;

import org.com.aqoo.domain.push.entity.UserToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserTokenRepository extends JpaRepository<UserToken, Long> {
    Optional<UserToken> findByToken(String token);
    boolean existsByToken(String token);

    Optional<UserToken> findByUserId(String userId);  // 특정 유저의 모든 FCM 토큰 조회
}
