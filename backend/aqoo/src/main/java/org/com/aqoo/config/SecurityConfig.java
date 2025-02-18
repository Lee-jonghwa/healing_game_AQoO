package org.com.aqoo.config;

import lombok.RequiredArgsConstructor;
import org.com.aqoo.domain.auth.service.CustomOAuth2AuthenticationSuccessHandler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;

import java.util.List;

@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final CustomOAuth2AuthenticationSuccessHandler customOAuth2AuthenticationSuccessHandler;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                // CORS 설정: 프론트엔드 도메인을 허용 (쿠키 전송 포함)
                .cors(cors -> cors.configurationSource(request -> {
                    CorsConfiguration configuration = new CorsConfiguration();
                    configuration.setAllowedOrigins(List.of(
                            "http://localhost:3000",
                            "https://localhost:3000",
                            "https://i12e203.p.ssafy.io:3000",
                            "http://i12e203.p.ssafy.io:3000",
                            "https://i12e203.p.ssafy.io",
                            "http://i12e203.p.ssafy.io"
                    ));
                    configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
                    configuration.setAllowedHeaders(List.of("*"));
                    configuration.setAllowCredentials(true);
                    return configuration;
                }))
                // CSRF 비활성화 (API 서버이므로)
                .csrf(csrf -> csrf.disable())
                // 모든 요청에 대해 인증 없이 접근 허용 (필요시 개별 엔드포인트별 접근 정책 추가)
                .authorizeHttpRequests(authorize -> authorize
                        // 예: 채팅방 관련 API는 인증 필요하도록 설정
                        .requestMatchers(
                                "/api/v1/auth/logout/**",
                                "/api/v1/users/exp-up",
                                "/api/v1/aquariums/fish/**",
                                "/api/v1/aquariums/friend/**",
                                "/api/v1/aquariums/friendFish",
                                "/api/v1/aquariums/update",
                                "/api/v1/fish/gotcha",
                                "/api/v1/fish/ticket/**",
                                "/api/v1/fish/painting",
                                "/api/v1/friends/**"
                        ).authenticated()
                        // 인증 없이 접근 가능한 경로
                        .requestMatchers(
                                "/api/v1/auth/refresh/**",
                                "/api/v1/auth/**",
                                "/oauth2/**",
                                "/api/v1/chatrooms/**",
                                "/api/v1/email/**",
                                "/api/v1/users/**",
                                "/api/v1/aquariums/**"
                        ).permitAll()
                        // 그 외의 모든 요청은 기본적으로 접근 허용 (필요에 따라 변경 가능)
                        .anyRequest().permitAll()
                )
                // JWT 인증 필터 추가 (UsernamePasswordAuthenticationFilter 앞에)
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                // OAuth2 로그인 성공 시 커스텀 핸들러 적용
                .oauth2Login(oauth2 -> oauth2.successHandler(customOAuth2AuthenticationSuccessHandler))
                .build();
    }
}
