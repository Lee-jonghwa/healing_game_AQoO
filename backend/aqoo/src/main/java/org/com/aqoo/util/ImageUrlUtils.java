package org.com.aqoo.util;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class ImageUrlUtils {
    @Value("${server.url}")
    private String serverUrl;

    // 이미지 경로를 절대경로로 변환하는 메서드
    public String toAbsoluteUrl(String imagePath) {
        if (imagePath == null || imagePath.isEmpty()) {
            throw new IllegalArgumentException("Invalid image path");
        }
        return serverUrl + imagePath;
    }
}
