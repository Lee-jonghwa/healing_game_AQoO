package org.com.aqoo;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class AqooApplication {

	public static void main(String[] args) {
		// (1) .env 파일 로드
		Dotenv dotenv = Dotenv.configure().ignoreIfMissing().load();
		// 기본적으로 프로젝트 루트의 .env 파일
		// (2) .env에서 불러온 키/값을 자바 시스템 프로퍼티에 반영
		dotenv.entries().forEach(entry -> {
			System.setProperty(entry.getKey(), entry.getValue());
		});
		SpringApplication.run(AqooApplication.class, args);
	}

}