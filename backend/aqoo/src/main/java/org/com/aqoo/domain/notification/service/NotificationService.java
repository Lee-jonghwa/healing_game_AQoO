package org.com.aqoo.domain.notification.service;

import org.com.aqoo.domain.notification.dto.NotificationRequest;
import org.com.aqoo.domain.notification.dto.NotificationResponse;
import org.com.aqoo.domain.notification.dto.UserNotificationResponse;
import org.com.aqoo.domain.notification.entity.Notification;
import org.com.aqoo.domain.push.service.FirebaseService;
import org.com.aqoo.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Transactional
    public NotificationResponse createNotification(NotificationRequest notificationRequest) {
        try {
            Notification notification = new Notification();
            notification.setUserId(notificationRequest.getUserId());
            notification.setType(notificationRequest.getType());
            notification.setData(notificationRequest.getData());
            notification.setMessage(notificationRequest.getMessage());

            Notification savedNotification = notificationRepository.save(notification);

            return new NotificationResponse("알림이 성공적으로 생성되었습니다.", savedNotification.getId());
        } catch (Exception e) {
            throw new RuntimeException("알림 생성 중 오류가 발생했습니다.", e);
        }
    }

    public List<UserNotificationResponse> getNotificationsByUser(String userId) {
        List<Notification> notifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);

        return notifications.stream()
                .map(n -> new UserNotificationResponse(
                        n.getId(),
                        n.getUserId(),
                        n.getType(),
                        n.getData(),
                        n.getMessage(),
                        n.getStatus(),
                        n.getCreatedAt()
                ))
                .collect(Collectors.toList());
    }

    @Transactional
    public String readNotification(Long notificationId) {
        Optional<Notification> notificationOptional = notificationRepository.findById(notificationId);

        if (notificationOptional.isPresent()) {
            Notification notification = notificationOptional.get();
            notification.setStatus(true);  // status 값을 1로 변경
            notificationRepository.save(notification);
            return "알림 읽음 처리를 완료했습니다.";
        } else {
            throw new IllegalArgumentException("해당 ID의 알림을 찾을 수 없습니다.");
        }
    }

    @Transactional
    public String deleteNotification(Long notificationId) {
        if (!notificationRepository.existsById(notificationId)) {
            throw new IllegalArgumentException("해당 ID의 알림을 찾을 수 없습니다.");
        }

        notificationRepository.deleteById(notificationId);
        return "알림이 성공적으로 삭제되었습니다.";
    }

}
