package org.com.aqoo.domain.notification.controller;

import org.com.aqoo.domain.notification.dto.NotificationRequest;
import org.com.aqoo.domain.notification.dto.NotificationResponse;
import org.com.aqoo.domain.notification.dto.UserNotificationResponse;
import org.com.aqoo.domain.notification.entity.Notification;
import org.com.aqoo.domain.notification.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/notification")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    @PostMapping("/new")
    public ResponseEntity<Object> createNotification(@RequestBody NotificationRequest notificationRequest) {
        try {
            NotificationResponse response = notificationService.createNotification(notificationRequest);
            return new ResponseEntity<>(response, HttpStatus.CREATED);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.singletonMap("error","알림 생성 중 오류가 발생했습니다."));
        }
    }

    @GetMapping("/{userId}")
    public ResponseEntity<?> getNotifications(@PathVariable String userId) {

        try {
            List<UserNotificationResponse> notifications = notificationService.getNotificationsByUser(userId);

            return ResponseEntity.ok(notifications);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.singletonMap("error","알림 생성 중 오류가 발생했습니다."));
        }
    }
}
