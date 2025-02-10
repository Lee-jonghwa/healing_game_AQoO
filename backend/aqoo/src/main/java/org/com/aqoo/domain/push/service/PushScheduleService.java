package org.com.aqoo.domain.push.service;

import org.com.aqoo.domain.aquarium.entity.Aquarium;
import org.com.aqoo.domain.push.dto.PushRequest;
import org.com.aqoo.repository.AquariumRepository;
import org.com.aqoo.repository.NotificationRepository;
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

    //각 상태 시간 주기
    private static final List<Integer> FEED_INTERVALS = List.of(4, 8, 12, 16, 20);
    private static final List<Integer> CLEAN_INTERVALS = List.of(12, 24, 36, 48, 60);
    private static final List<Integer> WATER_INTERVALS = List.of(24, 48, 72, 96, 120);

    // 어항 테이블을 2시간마다 조회하고 알림 처리하는 메서드
    // @Scheduled(fixedRate = 2 * 60 * 60 * 1000)  // 2시간마다 실행
    @Scheduled(fixedRate = 5 * 60 * 1000) //5분마다 실행 테스트
    public void checkAndSendNotifications() {

        System.out.println("어항 상태 점검 시간");
        LocalDateTime now = LocalDateTime.now();
        List<Aquarium> aquariums = aquariumRepository.findAll();  // 모든 어항 조회

        for (Aquarium aquarium : aquariums) {
            processNotification(aquarium.getUserId(), "FEED", aquarium.getLastFedTime(), now, FEED_INTERVALS);
            processNotification(aquarium.getUserId(), "CLEAN", aquarium.getLastCleanedTime(), now, CLEAN_INTERVALS);
            processNotification(aquarium.getUserId(), "WATER", aquarium.getLastWaterChangeTime(), now, WATER_INTERVALS);
        }
    }

    private void processNotification(String userId, String type, LocalDateTime lastTime, LocalDateTime now, List<Integer> intervals) {
        if (lastTime == null) return;
        int elapsedHours = getElapsedHours(lastTime, now);

        getLastPassedInterval(elapsedHours, intervals).ifPresent(interval -> {
            int warningLevel = getWarningLevel(interval, intervals);

            try {
                System.out.println(userId + "님께 " + type + " 푸시 알람을 전송합니다. 현재 상태는 : " + warningLevel);
                pushService.sendPush(new PushRequest(null, userId, type, Integer.toString(warningLevel)));
            } catch (Exception e) {
                throw new RuntimeException(e);
            }
        });
    }

    private int getElapsedHours(LocalDateTime lastTime, LocalDateTime now) {
        return (int) Duration.between(lastTime, now).toHours();
    }

    private Optional<Integer> getLastPassedInterval(int elapsedHours, List<Integer> intervals) {
        return intervals.stream()
                .filter(i -> i <= elapsedHours)  // 경과 시간보다 작거나 같은 값 필터링
                .max(Integer::compareTo);        // 가장 큰 값 선택
    }

    private int getWarningLevel(int lastPassedInterval, List<Integer> intervals) {
        int index = intervals.indexOf(lastPassedInterval);
        return 5 - index;  // 전체 5단계에서 몇 단계 남았는지 반환
    }


}
