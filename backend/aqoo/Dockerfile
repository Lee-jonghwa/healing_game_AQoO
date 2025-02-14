# Base 이미지 선택 (Java 17)
FROM eclipse-temurin:17-jdk as builder

# 작업 디렉토리 설정
WORKDIR /app

# Gradle 관련 파일 복사
COPY build.gradle settings.gradle gradlew ./
COPY gradle gradle

# Gradle Wrapper 실행 권한 부여 (실행 가능하도록 변경)
RUN chmod +x gradlew

# Gradle 의존성 캐싱 (의존성만 먼저 다운로드)
RUN ./gradlew dependencies --no-daemon || true

# 소스 코드 복사
COPY . .

# 다시 실행 권한 부여 (COPY 후 권한이 초기화될 수 있음)
RUN chmod +x gradlew

# 프로젝트 빌드 (Spring Boot 애플리케이션 패키징)
RUN ./gradlew bootJar --no-daemon

# ---- 실행 환경 ----
FROM eclipse-temurin:17-jdk as runtime

# 시간 설정
RUN ln -sf /usr/share/zoneinfo/Asia/Seoul /etc/localtime \
    && echo "Asia/Seoul" > /etc/timezone

# 작업 디렉토리 생성
WORKDIR /app

# ImageMagick 설치 추가 
RUN apt-get update && apt-get install -y imagemagick && rm -rf /var/lib/apt/lists/*

# 빌드된 JAR 파일 복사 (빌드 단계에서 생성된 JAR 파일을 실행 환경으로 이동)
COPY --from=builder /app/build/libs/*.jar app.jar


# 애플리케이션 실행 (환경변수는 컨테이너 실행 시 주입됩니다)
CMD ["java", "-jar", "app.jar"]

