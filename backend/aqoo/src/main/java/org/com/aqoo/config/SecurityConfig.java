package org.com.aqoo.config;

import lombok.RequiredArgsConstructor;
import org.com.aqoo.domain.auth.service.CustomOAuth2AuthenticationSuccessHandler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter; // 필터 주입
    private final CustomOAuth2AuthenticationSuccessHandler customOAuth2AuthenticationSuccessHandler;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf().disable() // REST API이므로 CSRF 비활성화
                .authorizeHttpRequests(authorize -> authorize
                                .requestMatchers("/**").permitAll() // 테스트를 위해 모두 허용
//                                .requestMatchers("/api/v1/auth/**", "/oauth2/**").permitAll() // 인증 API 경로는 모두 허용
                                .anyRequest().authenticated() // 나머지 경로는 인증 필요
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class) // JWT 필터 추가
                .oauth2Login(oauth2 -> oauth2
                        .successHandler(customOAuth2AuthenticationSuccessHandler)
                );
        return http.build();
    }

}