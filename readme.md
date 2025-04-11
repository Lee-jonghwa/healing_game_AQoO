# Aqoo

> **나만의 어항에서 물고기를 키우며 ‘물멍’으로 힐링하는 Web · Mobile 서비스**

---

## 1. 서비스 소개
- **가상 어항 시뮬레이션**으로 물고기·수초를 키우고, 물 주기·청소·먹이주기를 통해 어항을 관리합니다.
- Web / PWA / Electron(데스크톱) 3종 빌드를 제공하여 언제 어디서든 ‘물멍’ 가능!
- 실시간 WebSocket으로 친구의 어항을 구경하고, Firebase WebPush로 이벤트 알림을 받습니다.

---

## 2. 팀원 소개
| 이름 | 역할 | 주요 담당 모듈 |
|------|------|----------------|
| 이진호 | **팀장 / BE / Infra** | API 개발, CI/CD |
| 최영환 | **BE / Infra** | API 개발, BE CI/CD |
| 한송헌 | **BE / Infra** | API 개발, FE CI/CD |
| 이조은 | **FE Leader** | FE개발, GSAP · Mediapipe |
| 장은정 | **FE** | FE 개발, PPT |
| 이종화 | **FE, 발표자** | FE개발, Mediapipe |

---

## 3. 기술 스택
### 3‑1. Frontend
[![Next.js](https://img.shields.io/badge/Next.js-000?logo=next.js&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind](https://img.shields.io/badge/TailwindCSS-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Recoil](https://img.shields.io/badge/Recoil-3578E5?logo=recoil&logoColor=white)](https://recoiljs.org)
[![Axios](https://img.shields.io/badge/Axios-5A29E4?logo=axios&logoColor=white)](https://axios-http.com)
[![WebSocket](https://img.shields.io/badge/WebSocket-35495E?logo=websocket&logoColor=white)]()
[![Socket.IO](https://img.shields.io/badge/Socket.IO-010101?logo=socket.io&logoColor=white)]()

### 3‑2. Backend
[![Spring Boot](https://img.shields.io/badge/Spring Boot-6DB33F?logo=spring&logoColor=white)](https://spring.io)
[![Java 17](https://img.shields.io/badge/Java 17-007396?logo=openjdk&logoColor=white)](https://openjdk.org)
[![Spring Security](https://img.shields.io/badge/Spring Security-6DB33F?logo=spring&logoColor=white)]()
[![JPA](https://img.shields.io/badge/JPA-59666C?logo=hibernate&logoColor=white)]()
[![JWT](https://img.shields.io/badge/JWT-000000?logo=jsonwebtokens&logoColor=white)]()
[![WebSocket](https://img.shields.io/badge/WebSocket-35495E?logo=websocket&logoColor=white)]()
[![STOMP](https://img.shields.io/badge/STOMP-4F4F4F?logo=stomp&logoColor=white)]()
[![Webpush](https://img.shields.io/badge/Webpush-FF4500?logo=webpush&logoColor=white)]()
[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?logo=firebase&logoColor=black)]()

### 3‑3. DB
[![MySQL](https://img.shields.io/badge/MySQL-4479A1?logo=mysql&logoColor=white)](https://mysql.com)

### 3‑4. Infra & DevOps
[![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white)](https://docker.com)
[![Jenkins](https://img.shields.io/badge/Jenkins-D24939?logo=jenkins&logoColor=white)](https://jenkins.io)
[![Nginx](https://img.shields.io/badge/Nginx-009639?logo=nginx&logoColor=white)](https://nginx.org)
[![AWS EC2](https://img.shields.io/badge/AWS EC2-FF9900?logo=amazonaws&logoColor=white)](https://aws.amazon.com/ec2)
[![Certbot](https://img.shields.io/badge/Certbot-003A70?logo=letsencrypt&logoColor=white)](https://certbot.eff.org)

Citations:

[1] https://img.shields.io/badge/Next.js-000?logo=next.js&logoColor=white

[2] https://nextjs.org

[3] https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white

---

## 4. 주요 기능
1. **어항 시뮬레이션** : 물고기·수초 추가, 성장 애니메이션, 수질 관리(먹이·청소·물갈이 주기).
2. **실시간 상호작용** : WebSocket(STOMP) 기반 친구 어항 방문 & 채팅.
3. **멀티 플랫폼** : Web(PWA) + Electron 데스크톱 패키지 자동 배포.
4. **OAuth2 소셜 로그인** : Google, Naver 지원 + JWT 세션 유지.
5. **푸시 알림** : Firebase Cloud Messaging으로 어항 이벤트 알림.
6. **이미지 CDN** : `/images` 경로로 정적 리소스 서빙 (Nginx Alias).

---

## 5. 배포 특이사항
- **정적 이미지**는 EC2 `/home/ubuntu/images` 외부 볼륨에 두고, Nginx `alias`로 노출합니다.
- **환경 변수**는 `.env` 로 관리하며, Jenkins에서 Build‑time Secret 으로 주입합니다.
- **Nginx Reverse Proxy** : 443 → Next.js :3000 / Spring API :8089 / WebSocket :8089.
- **CI/CD** : Jenkins Pipeline이 프론트·백엔드 Docker 이미지를 빌드 후 `docker compose up -d` 로 롤링 업데이트.

---

## 6. ERD
![ERD](ERD-20.png)

---

## 7. 시스템 아키텍처
```
Browser / Electron ↔ Nginx(SSL) ↔ ① Next.js (SSR)  ↔  Redis (세션)
                               ↔ ② Spring Boot API ↔  MySQL 8.0
                               ↔ ③ WebSocket Hub  ↔  Firebase FCM
```
- **1** : 프론트 서버‑사이드 렌더링 & 정적 자산 제공
- **2** : 비즈니스 로직, OAuth2, JWT, JPA
- **3** : STOMP 메시지 브로커 (Spring WebSocket)

---

## 미리보기
![img1.webp](img1.webp)
![img2.webp](img2.webp)
![img3.webp](img3.webp)
![img4.webp](img4.webp)


### 이미지 폴더 위치
`exec/images` → **컨테이너 외부** `/home/ubuntu/images` (심볼릭 링크 권장)

---

> © 2025 Aqoo Team – MIT License

