package org.com.aqoo.domain.push.controller;

import org.com.aqoo.domain.push.dto.UserTokenRequest;
import org.com.aqoo.domain.push.entity.UserToken;
import org.com.aqoo.domain.push.service.PushScheduleService;
import org.com.aqoo.domain.push.service.PushService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/push")
public class PushController {

    @Autowired
    private PushService pushService;

    @Autowired
    private PushScheduleService scheduleService;

    @PostMapping("/token")
    public ResponseEntity<UserToken> saveUserToken(@RequestBody UserTokenRequest request) {

        UserToken savedToken = pushService.createUserToken(request.getUserId(), request.getToken());
        return ResponseEntity.ok(savedToken);
    }
}
