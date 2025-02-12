package org.com.aqoo.util;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;

@Component
public class JwtUtil {

    private static final Key SECRET_KEY = Keys.secretKeyFor(SignatureAlgorithm.HS256); // 안전한 키 생성
    //    private static final long ACCESS_TOKEN_EXPIRATION = 1000 * 60 * 60; // 1시간
    private static final long ACCESS_TOKEN_EXPIRATION = 1000 * 30; // 테스트용, 30초
    private static final long REFRESH_TOKEN_EXPIRATION = 1000 * 60 * 60 * 24 * 7; // 7일

    //토큰 생성 메서드
    public String generateToken(String userId, String type) {
        System.out.println(type + " 토큰 생성");
        long expiration = type.equals("ACCESS") ? ACCESS_TOKEN_EXPIRATION : REFRESH_TOKEN_EXPIRATION;

        return Jwts.builder()
                .setSubject(userId)
                .setExpiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(SECRET_KEY, SignatureAlgorithm.HS256)
                .compact();
    }

    // 토큰 유효성 검증 메서드
    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder()
                    .setSigningKey(SECRET_KEY)
                    .build()
                    .parseClaimsJws(token);
            return true;
        } catch (ExpiredJwtException e) {
            System.out.println("액세스 토큰이 만료되었습니다.");
            return false;
        } catch (Exception e) {
            System.out.println("유효하지 않은 토큰입니다.");
            return false;
        }
    }

    // 토큰에서 사용자 ID 추출 메서드
    public String extractUsername(String token) throws Exception {
        try{
            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(SECRET_KEY)
                    .build()
                    .parseClaimsJws(token)
                    .getBody();
            return claims.getSubject();
        }
        catch (Exception e) {
            throw new Exception("JWT 검증 오류: " + e.getMessage());
        }
    }
}