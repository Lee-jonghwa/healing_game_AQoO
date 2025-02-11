package org.com.aqoo.config;

import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.io.IOException;
import java.util.Map;

public class WebSocketHandshakeInterceptor implements HandshakeInterceptor {

    @Override
    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                   WebSocketHandler wsHandler, Map<String, Object> attributes) throws IOException {

        // HTTP 요청에서 userId와 roomId를 가져와서 WebSocket 세션에 저장
        String userId = request.getHeaders().getFirst("userId");
        String roomId = request.getHeaders().getFirst("roomId");

        System.out.println("핸드쉐이크 before 인터셉터 실행");
        System.out.println(request.getBody().toString());
        System.out.println(request.getHeaders().toString());
//        System.out.println("userId :" + userId);
//        System.out.println("roomId :" + roomId);


        if (userId != null && roomId != null) {
            attributes.put("userId", userId);
            attributes.put("roomId", roomId);
        }

        return true;
    }

    @Override
    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response,
                               WebSocketHandler wsHandler, Exception exception) {
    }
}
