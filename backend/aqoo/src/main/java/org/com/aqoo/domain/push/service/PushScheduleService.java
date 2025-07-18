package org.com.aqoo.domain.push.service;

import org.com.aqoo.domain.aquarium.entity.Aquarium;
import org.com.aqoo.domain.push.dto.PushRequest;
import org.com.aqoo.repository.AquariumRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class PushScheduleService {

    @Autowired
    private AquariumRepository aquariumRepository;
    @Autowired
    private PushService pushService;

    @Value("${game.feed-interval}")
    private int feedInterval;

    @Value("${game.clean-interval}")
    private int cleanInterval;

    @Value("${game.water-interval}")
    private int waterInterval;


    // 먹이 상태 알람 (2시간마다 실행)
    @Scheduled(fixedRate = 2 * 60 * 60 * 1000)
    public void checkFeedNotifications() {
        System.out.println("[먹이 점검] 2시간마다 실행");
        processNotificationsForType("FEED");
    }

    // 청소 상태 알람 (5시간마다 실행)
    @Scheduled(fixedRate = 5 * 60 * 60 * 1000)
    public void checkCleanNotifications() {
        System.out.println("[청소 점검] 5시간마다 실행");
        processNotificationsForType("CLEAN");
    }

    // 물 상태 알람 (9시간마다 실행)
    @Scheduled(fixedRate = 7 * 60 * 60 * 1000)
    public void checkWaterNotifications() {
        System.out.println("[물 교체 점검] 7시간마다 실행");
        processNotificationsForType("WATER");
    }

    private void processNotificationsForType(String type) {
        LocalDateTime now = LocalDateTime.now();
        List<Aquarium> aquariums = aquariumRepository.findAll(); // 모든 어항 조회

        for (Aquarium aquarium : aquariums) {
            int level = switch (type) {
                case "FEED" -> getLastPassedInterval(aquarium.getLastFedTime(), feedInterval);
                case "CLEAN" -> getLastPassedInterval(aquarium.getLastCleanedTime(), cleanInterval);
                case "WATER" -> getLastPassedInterval(aquarium.getLastWaterChangeTime(), waterInterval);
                default -> -1;
            };


            if(level == 5 || level == 4)
                return;
            processNotification(aquarium.getUserId(), aquarium.getAquariumName(), type, level);
        }
    }
    public static int getLastPassedInterval(LocalDateTime savedTime, int timeInterval) {
        if (savedTime == null) return -1;

        long minutesElapsed = Duration.between(savedTime, LocalDateTime.now()).toMinutes();

        if (minutesElapsed < timeInterval) {
            return 5;
        } else if (minutesElapsed < 2 * timeInterval) {
            return 4;
        } else if (minutesElapsed < 3 * timeInterval) {
            return 3;
        } else if (minutesElapsed < 4 * timeInterval) {
            return 2;
        } else if (minutesElapsed < 5 * timeInterval) {
            return 1;
        } else {
            return 0;
        }
    }

    private void processNotification(String userId, String aquariumName, String type, int level) {

        if(level == -1){
            System.out.println(userId + "님의 " + aquariumName + " 어항에 푸시 알람을 전송을 실패했습니다.");
            return;
        }


        try {
            System.out.println(userId + "님의 " + aquariumName + " 어항에 푸시 알람을 전송합니다. 현재 상태는 : " + level);
            pushService.sendPush(new PushRequest(aquariumName, userId, type, Integer.toString(level)));
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
