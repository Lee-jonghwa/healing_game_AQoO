package org.com.aqoo.domain.push.service;

import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.WebpushConfig;
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
        Optional<UserToken> existingUser = userTokenRepository.findByUserId(userId);

        // 기존의 같은 유저, 같은 토큰이 있는 경우 → 삭제하지 않고 그대로 유지
        if (existingUser.isPresent() && existingUser.get().getToken().equals(token)) {
            System.out.println("이미 존재하는 유저와 토큰: " + userId + ", " + token);
            return existingUser.get();
        }

        // 기존 토큰이 있지만 해당 유저와 다르면 → 기존 토큰 삭제 후, 해당 유저의 데이터만 유지
        if (existingToken.isPresent() && !existingToken.get().getUserId().equals(userId)) {
            userTokenRepository.delete(existingToken.get()); // 기존 토큰 삭제
        }

        // 기존 유저가 있지만, 기존 토큰과 다르면 → 토큰 값 업데이트
        if (existingUser.isPresent()) {
            UserToken updatedUserToken = existingUser.get();
            updatedUserToken.setToken(token);
            System.out.println("기존 유저의 토큰 업데이트: " + userId + " → " + token);
            return userTokenRepository.save(updatedUserToken);
        }

        // 기존의 없는 유저, 없는 토큰일 때만 새로 추가
        UserToken newUserToken = new UserToken();
        newUserToken.setUserId(userId);
        newUserToken.setToken(token);

        System.out.println("새로운 유저 토큰 추가: " + userId + ", " + token);
        return userTokenRepository.save(newUserToken);
    }





    // FCM 알림 보내는 메서드
    public void sendPush(PushRequest request) throws Exception {

        //타입별로 알람 나누기 (FRIEND REQUEST, FRIEND ACCEPT, GAME INVITE, WATER, CLEAN, FEED)
        //title, body 구성
        String type = request.getType();
        String title = getMessageTitle(type, request.getSenderId());
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
        Optional<UserToken> data = userTokenRepository.findByUserId(request.getRecipientId());

        if (!data.isPresent()) {
            System.out.println(request.getRecipientId() + " 유저의 등록된 FCM 토큰이 없습니다.");
            return;
        }

        // 해당 유저의 refreshToken이 없으면 푸시 알람을 보내지 않음
        User user = userRepository.findById(request.getRecipientId()).orElse(null);
        if (user == null || user.getRefreshToken() == null || user.getRefreshToken().isEmpty()) {
            System.out.println(request.getRecipientId() + " 유저는 로그아웃되었습니다. 푸시 알람을 보내지 않습니다.");
            return;
        }

        if(request.getData().equals("5") || request.getData().equals("4")) return;

        UserToken userToken = data.get();
            Message message = Message.builder()
                    .setToken(userToken.getToken())  // 유저의 각 토큰에 대해 메시지 전송
                    .putData("type", type)
                    .putData("title", title)
                    .putData("body", body)
                    .putData("data", request.getData())
                    .putData("click_action", "https://i12e203.p.ssafy.io/main") //게임 메인 페이지로 이동
                    .setWebpushConfig(WebpushConfig.builder()
                            .putHeader("TTL", "10") // TTL 설정 (10초 후 만료)
                            .build()
                    )
                    .build();

            // FCM으로 메시지 전송
            String response = FirebaseMessaging.getInstance().send(message);
            System.out.println("FCM 메시지 전송 성공 (토큰: " + userToken.getToken() + "): " + response);
    }

    public static String getMessageTitle(String type, String aquariumName) {
        return switch (type) {
            case "FRIEND REQUEST" -> "\uD83C\uDF1F 친구 요청 \uD83C\uDF1F";
            case "FRIEND ACCEPT" -> "\uD83E\uDD1D 친구 수락 \uD83E\uDD1D";
            case "GAME INVITE" -> "\uD83C\uDFAE 게임 초대 \uD83C\uDFAE";
            case "FEED" -> "\uD83C\uDF7D 어항 먹이 상태 \uD83C\uDF7D : " + aquariumName;
            case "CLEAN" -> "\uD83E\uDDFD 어항 청소 상태 \uD83E\uDDFD : " + aquariumName;
            case "WATER" -> "\uD83D\uDCA7 어항 물 상태 \uD83D\uDCA7 : " + aquariumName;
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
            case "5" -> "먹이를 잘 주셨네요! 물고기들이 행복하고 건강해 보입니다!";
            case "4" -> "물고기들이 충분히 먹이를 받았어요! 건강한 상태를 유지하고 있어요.";
            case "3" -> "물고기들이 배고파하기 전에 먹이를 주세요!";
            case "2" -> "먹이를 제때 주지 않아서 물고기들이 힘을 잃고 있어요.";
            case "1" -> "물고기들이 오랫동안 굶주렸어요.";
            case "0" -> "먹이가 완전히 떨어졌어요! 물고기가 버틸 수 없어요!";
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
            case "5" -> "물고기들이 깨끗한 물 속에서 행복해요!";
            case "4" -> "어항의 물이 맑고 깨끗해요!";
            case "3" -> "어항의 물이 조금씩 탁해지고 있어요!";
            case "2" -> "어항 속 물이 점점 더 혼탁해지고 있어요!";
            case "1" -> "수질이 심각하게 나빠졌어요!";
            case "0" -> "즉시 물을 교체하지 않으면 물고기들이 아파해요!";
            default -> "어항의 먹이 상태를 확인할 수 없습니다.";
        };
    }
}
