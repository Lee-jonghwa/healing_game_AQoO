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

    private final JwtAuthenticationFilter jwtAuthenticationFilter; // 필터 주입
    private final CustomOAuth2AuthenticationSuccessHandler customOAuth2AuthenticationSuccessHandler;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                // 모든 요청에 대해 HTTPS를 강제 (HTTP로 요청하면 HTTPS로 리다이렉트)
                .requiresChannel(channel -> channel.anyRequest().requiresSecure())
                // CORS 설정
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
                // CSRF 비활성화 (REST API의 경우)
                .csrf(csrf -> csrf.disable())
                // 요청에 대한 인가 설정
                .authorizeHttpRequests(authorize -> authorize
                        .requestMatchers("/**").permitAll()
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