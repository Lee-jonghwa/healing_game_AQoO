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
                // 특정 경로에 대한 접근 제어
                .authorizeHttpRequests(authorize -> authorize
                        .requestMatchers("/api/v1/users/isActivate/*",
                                "/api/v1/auth/register/*",
                                "/api/v1/auth/login/*",
                                "/api/v1/users/*",
                                "/oauth2/*",
                                "/api/v1/auth/validate-id",
                                "/api/v1/auth/validate-email",
                                "/api/v1/auth/find-id",
                                "/api/v1/email/send",
                                "/api/v1/email/verify",
                                "/api/v1/auth/refresh").permitAll() // `/api/v1/users` 경로는 인증 없이 접근 허용
                        .anyRequest().authenticated() // 그 외 모든 요청은 인증 필요
                )
                // JWT 인증 필터 추가 (UsernamePasswordAuthenticationFilter 앞에)
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                // OAuth2 로그인 성공 시 커스텀 핸들러 적용
                .oauth2Login(oauth2 -> oauth2.successHandler(customOAuth2AuthenticationSuccessHandler))
                .build();
    }
}
