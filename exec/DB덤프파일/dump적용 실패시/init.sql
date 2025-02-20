-- 기존 스키마 삭제
DROP SCHEMA IF EXISTS aqoo;

-- 새로운 스키마 생성
CREATE SCHEMA aqoo;
USE aqoo;

-- 사용자 테이블 생성
CREATE TABLE user (
    id VARCHAR(50) PRIMARY KEY,
    pw TEXT NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    nickname VARCHAR(50),
    main_fish_image TEXT,
    exp INT DEFAULT 0,
    level INT DEFAULT 1,
    refresh_token TEXT,
    status BOOLEAN DEFAULT TRUE,
    main_aquarium INT, -- 메인 어항 참조 필드는 나중에 FOREIGN KEY 추가
    is_first_login INT DEFAULT 1,  -- 첫 로그인 여부 (0: 첫 로그인 아님, 1: 첫 로그인)
    fish_ticket INT DEFAULT 3  -- 물고기 티켓 (기본값 1)
);

-- 어항 배경 테이블 생성
CREATE TABLE aquarium_background (
    id INT AUTO_INCREMENT PRIMARY KEY,
    image_url TEXT
);

-- 어항 테이블 생성
CREATE TABLE aquarium (
    id INT AUTO_INCREMENT PRIMARY KEY,
    aquarium_name VARCHAR(255),
    last_fed_time DATETIME,
    last_water_change_time DATETIME,
    last_cleaned_time DATETIME,
    user_id VARCHAR(50) NOT NULL,
    aquarium_background_id INT,
    FOREIGN KEY (aquarium_background_id) REFERENCES aquarium_background(id)
);

-- 사용자 테이블의 main_aquarium에 대한 FOREIGN KEY 추가
-- user 테이블의 main_aquarium 필드는 아직 외래 키 설정하지 않음
ALTER TABLE user ADD CONSTRAINT fk_main_aquarium FOREIGN KEY (main_aquarium) REFERENCES aquarium(id) ON DELETE SET NULL;

-- 물고기 타입 테이블 생성 (rarity : common, rare, epic, {userId})
CREATE TABLE fish_type (
    id INT AUTO_INCREMENT PRIMARY KEY,
    image_url TEXT,
    fish_name VARCHAR(100),
    rarity VARCHAR(50) DEFAULT 'COMMON',
    size VARCHAR(255)
);

-- 사용자 물고기 테이블 생성
CREATE TABLE user_fish (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fish_type_id INT NOT NULL,
    user_id VARCHAR(50) NOT NULL,
    aquarium_id INT,
    FOREIGN KEY (fish_type_id) REFERENCES fish_type(id),
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE, -- 사용자 삭제 시 사용자 물고기 삭제
    FOREIGN KEY (aquarium_id) REFERENCES aquarium(id)
);

-- 친구 관계 테이블 생성
CREATE TABLE friend_relationship (
    id INT AUTO_INCREMENT PRIMARY KEY,
    friend1_id VARCHAR(50) NOT NULL,
    friend2_id VARCHAR(50) NOT NULL,
    status VARCHAR(50),
    FOREIGN KEY (friend1_id) REFERENCES user(id) ON DELETE CASCADE, -- 사용자 삭제 시 친구 관계 삭제
    FOREIGN KEY (friend2_id) REFERENCES user(id) ON DELETE CASCADE
);

-- 알림 테이블 생성
CREATE TABLE notification (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    type VARCHAR(50),
    data VARCHAR(255) NOT NULL,
    message VARCHAR(255) NOT NULL,
    status BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE -- 사용자 삭제 시 알림 삭제
);

-- 푸시 알람을 위한 fcm 토큰
CREATE TABLE user_tokens (
    token_id BIGINT AUTO_INCREMENT PRIMARY KEY,  -- 토큰 ID (자동 증가)
    user_id VARCHAR(255),  -- 유저 ID
    token VARCHAR(255),  -- 토큰 값
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- 토큰 생성 시간
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,  -- 마지막 업데이트 시간
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE  -- 유저 삭제 시 토큰도 삭제
);

-- 트리거: user 삭제 시 연관된 user_fish, fish_type 삭제
DELIMITER $$

CREATE TRIGGER delete_user_fish BEFORE DELETE ON user
FOR EACH ROW
BEGIN
    DELETE FROM user_fish WHERE user_id = OLD.id;
    DELETE FROM fish_type WHERE id IN (SELECT fish_type_id FROM user_fish WHERE user_id = OLD.id);
END $$

DELIMITER ;
