package org.com.aqoo.domain.push.service;

import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.Message;
import org.com.aqoo.domain.auth.entity.User;
import org.com.aqoo.domain.notification.dto.NotificationRequest;
import org.com.aqoo.domain.notification.service.NotificationService;
import org.com.aqoo.domain.push.dto.PushRequest;
import org.com.aqoo.domain.push.entity.UserToken;
import org.com.aqoo.repository.UserTokenRepository;
import org.com.aqoo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class PushService {

    @Autowired
    private UserTokenRepository userTokenRepository;
    @Autowired
    private NotificationService notificationService;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private FirebaseService firebaseService;  // FirebaseService 추가

    public UserToken createUserToken(String userId, String token) {
        Optional<UserToken> existingToken = userTokenRepository.findByToken(token);

        if (existingToken.isPresent()) {
            UserToken userToken = existingToken.get();

            if (userToken.getUserId().equals(userId)) {
                // 이미 존재하는 토큰이고 유저 아이디도 동일 -> 기존 토큰 반환
                return userToken;
            } else {
                // 이미 존재하는 토큰이지만 다른 유저 아이디 -> 유저 아이디 업데이트
                userToken.setUserId(userId);
                return userTokenRepository.save(userToken);
            }
        }

        // 존재하지 않는 토큰 -> 새로 등록
        UserToken newUserToken = new UserToken();
        newUserToken.setUserId(userId);
        newUserToken.setToken(token);

        return userTokenRepository.save(newUserToken);
    }



    // FCM 알림 보내는 메서드
    public void sendPush(PushRequest request) throws Exception {

        //타입별로 알람 나누기 (FRIEND REQUEST, FRIEND ACCEPT, GAME INVITE, WATER, CLEAN, FEED)
        //title, body 구성
        String type = request.getType();
        String title = getMessageTitle(type);
        String body = getMessageBody(type, request.getSenderId(), request.getData());

        // 알람 저장
        if(type.equals("FRIEND REQUEST") || type.equals("FRIEND ACCEPT") || type.equals("GAME INVITE")){
            String recipient = request.getRecipientId();
            String data = request.getData();

            NotificationRequest notification =
                    new NotificationRequest(recipient, type, data, body);

            notificationService.createNotification(notification);
        }

        // push 알람 보내기
        // userId로 모든 FCM 토큰 조회
        List<UserToken> userTokens = userTokenRepository.findByUserId(request.getRecipientId());

        if (userTokens.isEmpty()) {
            System.out.println(request.getRecipientId() + " 유저의 등록된 FCM 토큰이 없습니다.");
            return;
        }

        // 해당 유저의 refreshToken이 없으면 푸시 알람을 보내지 않음
        User user = userRepository.findById(request.getRecipientId()).orElse(null);
        if (user == null || user.getRefreshToken() == null || user.getRefreshToken().isEmpty()) {
            System.out.println(request.getRecipientId() + " 유저는 로그아웃되었습니다. 푸시 알람을 보내지 않습니다.");
            return;
        }

        for (UserToken userToken : userTokens) {
            Message message = Message.builder()
                    .setToken(userToken.getToken())  // 유저의 각 토큰에 대해 메시지 전송
                    .putData("type", type)
                    .putData("title", title)
                    .putData("body", body)
                    .putData("click_action", "https://i12e203.p.ssafy.io/main") //게임 메인 페이지로 이동
                    .build();

            // FCM으로 메시지 전송
            String response = FirebaseMessaging.getInstance().send(message);
            System.out.println("FCM 메시지 전송 성공 (토큰: " + userToken.getToken() + "): " + response);
        }
    }

    public static String getMessageTitle(String type) {
        return switch (type) {
            case "FRIEND REQUEST" -> "\uD83C\uDF1F 친구 요청 \uD83C\uDF1F";
            case "FRIEND ACCEPT" -> "\uD83E\uDD1D 친구 수락 \uD83E\uDD1D";
            case "GAME INVITE" -> "\uD83C\uDFAE 게임 초대 \uD83C\uDFAE";
            case "FEED" -> "\uD83C\uDF7D 어항 먹이 상태 \uD83C\uDF7D";
            case "CLEAN" -> "\uD83E\uDDFD 어항 청소 상태 \uD83E\uDDFD";
            case "WATER" -> "\uD83D\uDCA7 어항 물 상태 \uD83D\uDCA7";
            default -> "알림";
        };
    }

    public static String getMessageBody(String type, String sender, String data) {
        return switch (type) {
            case "FRIEND REQUEST" -> sender + "님께서 친구를 요청하였습니다.";
            case "FRIEND ACCEPT" -> sender + "님께서 친구를 수락하였습니다.";
            case "GAME INVITE" -> sender + "님께서 게임에 초대하였습니다.";
            case "FEED" -> generateFeedMessage(data);
            case "CLEAN" -> generateCleanMessage(data);
            case "WATER" -> generateWaterMessage(data);
            default -> "알 수 없는 알림입니다.";
        };
    }

    private static String generateFeedMessage(String data) {
        return switch (data) {
            case "5" -> "물고기들이 깨끗한 물 속에서 행복해요!";
            case "4" -> "어항의 물이 맑고 깨끗해요!";
            case "3" -> "어항의 물이 조금씩 탁해지고 있어요!";
            case "2" -> "어항 속 물이 점점 더 혼탁해지고 있어요!";
            case "1" -> "수질이 심각하게 나빠졌어요!";
            case "0" -> "즉시 물을 교체하지 않으면 물고기들이 아파해요!";
            default -> "어항의 먹이 상태를 확인할 수 없습니다.";
        };
    }

    private static String generateCleanMessage(String data) {
        return switch (data) {
            case "5" -> "어항이 완벽하게 청소되었어요!";
            case "4" -> "어항이 깨끗하게 유지되고 있어요!";
            case "3" -> "어항을 깨끗하게 닦아주는 게 좋겠어요!";
            case "2" -> "어항이 점점 지저분해지고 있어요. 청소가 필요해요!";
            case "1" -> "어항이 너무 더러워져서 물고기들이 움직이기 어려워해요.";
            case "0" -> "지금 당장 청소하지 않으면 물고기들이 위험해요!";
            default -> "어항의 청소 상태를 확인할 수 없습니다.";
        };
    }

    private static String generateWaterMessage(String data) {
        return switch (data) {
            case "5" -> "어항의 물 상태가 아주 좋습니다.";
            case "4" -> "어항의 물 상태가 좋습니다.";
            case "3" -> "어항의 물 상태가 양호합니다.";
            case "2" -> "어항의 물이 조금 탁해지고 있습니다.";
            case "1" -> "어항의 물이 많이 더러워졌습니다. 물을 갈아주세요!";
            case "0" -> "어항의 물이 매우 오염되었습니다! 당장 물을 갈아주세요!";
            default -> "어항의 물 상태를 확인할 수 없습니다.";
        };
    }
}
