package org.com.aqoo.repository;

import org.com.aqoo.domain.auth.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, String> {

    Optional<User> findByEmail(String email);

    boolean existsById(String id);

    boolean existsByEmail(String email);
}
