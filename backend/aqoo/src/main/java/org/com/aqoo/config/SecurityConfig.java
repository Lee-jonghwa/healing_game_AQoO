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

import static org.springframework.security.config.Customizer.withDefaults;

@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter; // 필터 주입
    private final CustomOAuth2AuthenticationSuccessHandler customOAuth2AuthenticationSuccessHandler;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                // CORS 기본 설정 사용
                .cors(cors -> cors.configurationSource(request -> {
                    CorsConfiguration configuration = new CorsConfiguration();
                    configuration.setAllowedOrigins(List.of("http://localhost:3000", "https://localhost:3000" , "https://i12e203.p.ssafy.io:3000", "http://i12e203.p.ssafy.io:3000", "https://i12e203.p.ssafy.io", "http://i12e203.p.ssafy.io")); // 모든 출처 허용
                    configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
                    configuration.setAllowedHeaders(List.of("*")); // 모든 헤더 허용
                    configuration.setAllowCredentials(true);
                    return configuration;
                }))
                // REST API 특성상 CSRF 비활성화
                .csrf(csrf -> csrf.disable())
                // 요청에 대한 인가 설정
                .authorizeHttpRequests(authorize -> authorize
                        // 테스트를 위해 모든 경로 허용 (실제 운영 환경에서는 필요한 경로만 허용하도록 수정)
                        .requestMatchers("/**").permitAll()
                        // 특정 API 경로만 허용할 경우 아래와 같이 설정 가능
                        // .requestMatchers("/api/v1/auth/**", "/oauth2/**").permitAll()
                        .anyRequest().authenticated()
                )
                // JWT 인증 필터를 UsernamePasswordAuthenticationFilter 앞에 추가
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                // OAuth2 로그인 성공 핸들러 설정
                .oauth2Login(oauth2 -> oauth2
                        .successHandler(customOAuth2AuthenticationSuccessHandler)
                )
                .build();
    }

}