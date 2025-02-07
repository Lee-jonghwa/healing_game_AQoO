package org.com.aqoo.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketBrokerConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // 클라이언트가 구독할 경로
        // topic 은 1:N, queue는 1:1 컨벤션
        config.enableSimpleBroker("/topic", "/queue");
        // 클라이언트가 메시지를 보낼 경로
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // WebSocket 연결 엔드포인트
        registry.addEndpoint("/ws") // webSocket 엔드포인트 설정
                .setAllowedOriginPatterns("*") // 테스트 모든 도메인 허용
//			.setAllowedOriginPatterns("http://localhost:3000") // 특정 도메인 허용
                .addInterceptors(new WebSocketHandshakeInterceptor())
                .withSockJS(); //SockJS 폴백 지원
    }
}
