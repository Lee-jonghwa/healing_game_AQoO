package org.com.aqoo.domain.push.service;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import org.springframework.stereotype.Service;

import java.io.FileInputStream;
import java.io.IOException;

@Service
public class FirebaseService {
    public FirebaseService() {
        try {
            // 서비스 계정 키 파일 경로
            String serviceAccountPath = "src/main/resources/serviceAccountKey.json";

            // 서비스 계정 키 파일을 읽어오는 코드
            FileInputStream serviceAccount = null;
            try {
                serviceAccount = new FileInputStream(serviceAccountPath);
                System.out.println("서비스 계정 키 파일을 읽었습니다: " + serviceAccountPath);
            } catch (IOException e) {
                System.out.println("파일을 읽는 중 오류가 발생했습니다: " + e.getMessage());
                throw new RuntimeException("서비스 계정 키 파일을 열 수 없습니다.", e);
            }

            // GoogleCredentials 사용하여 FirebaseOptions 설정
            GoogleCredentials credentials = GoogleCredentials.fromStream(serviceAccount);
            FirebaseOptions options = new FirebaseOptions.Builder()
                    .setCredentials(credentials)
                    .build();

            // Firebase App이 초기화되어 있지 않다면 초기화
            if (FirebaseApp.getApps().isEmpty()) {
                FirebaseApp.initializeApp(options);
                System.out.println("FirebaseApp이 성공적으로 초기화되었습니다.");
            } else {
                System.out.println("FirebaseApp이 이미 초기화되어 있습니다.");
            }
        } catch (IOException e) {
            e.printStackTrace();
            System.out.println("서비스 계정 키 파일을 읽는 중 오류가 발생했습니다: " + e.getMessage());
            throw new RuntimeException("Firebase Admin SDK 초기화 오류", e);
        }
    }
}
