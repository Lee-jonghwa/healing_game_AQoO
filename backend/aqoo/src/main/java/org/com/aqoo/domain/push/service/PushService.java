package org.com.aqoo.domain.push.service;

import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.Message;
import org.com.aqoo.domain.push.dto.PushRequest;
import org.com.aqoo.domain.push.entity.UserToken;
import org.com.aqoo.repository.UserTokenRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class PushService {

    @Autowired
    private UserTokenRepository userTokenRepository;
    private FirebaseService firebaseService;  // FirebaseService 추가

    public UserToken createUserToken(String userId, String token) {
        // 중복 토큰 방지 (이미 존재하면 덮어쓰기 or 예외 발생)
        Optional<UserToken> existingToken = userTokenRepository.findByToken(token);
        if (existingToken.isPresent()) {
            throw new IllegalArgumentException("이미 존재하는 토큰입니다.");
        }

        UserToken userToken = new UserToken();
        userToken.setUserId(userId);
        userToken.setToken(token);

        return userTokenRepository.save(userToken);
    }


    // FCM 알림 보내는 메서드
    public void sendPush(String userId, PushRequest request) throws Exception {
        // userId로 모든 FCM 토큰 조회
        List<UserToken> userTokens = userTokenRepository.findByUserId(userId);

        if (userTokens.isEmpty()) {
            System.out.println("해당 유저의 등록된 FCM 토큰이 없습니다.");
            return;
        }

        for (UserToken userToken : userTokens) {
            Message message = Message.builder()
                    .setToken(userToken.getToken())  // 유저의 각 토큰에 대해 메시지 전송
                    .putData("type", request.getType())
                    .putData("title", request.getTitle())
                    .putData("body", request.getBody())
                    .putData("click_action", "https://i12e203.p.ssafy.io/")
                    .build();

            // FCM으로 메시지 전송
            String response = FirebaseMessaging.getInstance().send(message);
            System.out.println("FCM 메시지 전송 성공 (토큰: " + userToken.getToken() + "): " + response);
        }
    }
}
