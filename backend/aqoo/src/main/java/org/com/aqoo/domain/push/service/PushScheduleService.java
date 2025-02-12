package org.com.aqoo.domain.push.service;

import org.com.aqoo.domain.aquarium.entity.Aquarium;
import org.com.aqoo.domain.push.dto.PushRequest;
import org.com.aqoo.repository.AquariumRepository;
import org.springframework.beans.factory.annotation.Autowired;
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

    // 각 상태 시간 주기
    private static final int FEED_INTERVAL = 4;
    private static final int CLEAN_INTERVAL = 12;
    private static final int WATER_INTERVAL = 24;

    // 먹이 상태 알람 (2시간마다 실행)
    //@Scheduled(fixedRate = 2 * 60 * 60 * 1000)
    @Scheduled(fixedRate = 3  * 60 * 1000)
    public void checkFeedNotifications() {
        System.out.println("[먹이 점검] 2시간마다 실행");
        processNotificationsForType("FEED");
    }

    // 청소 상태 알람 (5시간마다 실행)
    //@Scheduled(fixedRate = 5 * 60 * 60 * 1000)
    @Scheduled(fixedRate = 10  * 60 * 1000)
    public void checkCleanNotifications() {
        System.out.println("[청소 점검] 5시간마다 실행");
        processNotificationsForType("CLEAN");
    }

    // 물 상태 알람 (9시간마다 실행)
    //@Scheduled(fixedRate = 9 * 60 * 60 * 1000)
    @Scheduled(fixedRate = 15  * 60 * 1000)
    public void checkWaterNotifications() {
        System.out.println("[물 교체 점검] 9시간마다 실행");
        processNotificationsForType("WATER");
    }

    private void processNotificationsForType(String type) {
        LocalDateTime now = LocalDateTime.now();
        List<Aquarium> aquariums = aquariumRepository.findAll(); // 모든 어항 조회

        for (Aquarium aquarium : aquariums) {
            int level = switch (type) {
                case "FEED" -> getLastPassedInterval(aquarium.getLastFedTime(), FEED_INTERVAL);
                case "CLEAN" -> getLastPassedInterval(aquarium.getLastCleanedTime(), CLEAN_INTERVAL);
                case "WATER" -> getLastPassedInterval(aquarium.getLastWaterChangeTime(), WATER_INTERVAL);
                default -> -1;
            };

            processNotification(aquarium.getUserId(), type, level);
        }
    }
    public static int getLastPassedInterval(LocalDateTime savedTime, int timeInterval) {
        if(savedTime == null) return -1;

        long hoursElapsed = Duration.between(savedTime, LocalDateTime.now()).toHours();

        if (hoursElapsed < timeInterval) {
            return 5;
        } else if (hoursElapsed < 2 * timeInterval) {
            return 4;
        } else if (hoursElapsed < 3 * timeInterval) {
            return 3;
        } else if (hoursElapsed < 4 * timeInterval) {
            return 2;
        } else if (hoursElapsed < 5 * timeInterval) {
            return 1;
        } else {
            return 0;
        }
    }

    private void processNotification(String userId, String type, int level) {

        if(level == -1){
            System.out.println(userId + "님께  푸시 알람을 전송을 실패했습니다.");
            return;
        }


        try {
            System.out.println(userId + "님께 " + type + " 푸시 알람을 전송합니다. 현재 상태는 : " + level);
            pushService.sendPush(new PushRequest(null, userId, type, Integer.toString(level)));
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
