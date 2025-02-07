# 0113 수행(학습) 내용

## 1. Front-end 기술 스택 학습

### [1] React 학습

1. React Event Handler

- 이벤트 종류 학습
- 이벤트 연결 방법 학습
- 간단한 프로젝트 구현

2. React 설치 및 프로젝트 시작

- 데스크탑에 React 설치
- 기초 프로젝트 설치
- 기초 프로젝트 구조

3. 프로젝트 구현(메모장)

- 기본 프로젝트 구조 활용한 프로젝트 구현

# 0114 수행(학습) 내용

### [1] React 학습

1. 프로젝트 구현(메모장)

- CRUD 활용 프로젝트 구현
- component 구조, local storage, debounced, useCallback 등 활용

# 0115 수행(학습) 내용

### [1] 아이디어 회의

- 프로젝트 수행 아이디어 기획
- 각 아이디어 별 수행 내용 구체화
- 팀미팅 진행


# 0116 수행(학습) 내용

### [1] 아이디어 회의

- 프로젝트 수행 아이디어 선정
- 기능 구체화 및 순서도 작성
- 필요 기능 정리 및 사전 테스트 진행
- 기능 관련 지식 학습

# 0117 수행(학습) 내용

### [1] 아이디어 회의

- 프로젝트 수행 아이디어 변경(집중력 페이스메이커 -> 힐링 게임)
- 프로젝트 기능 및 환경 고려
    - 캐릭터 모델링을 위한 3d 프레임워크 search
    - 3d화면의 웹화면 렌더링을 위한 three.js 테스트
- 프로젝트 화면 고려
    - 최소 기능 별 기본 화면 정리


# 0120 수행(학습) 내용

### [1] 아이디어 회의
- 프로젝트 기능 및 화면 설계
- 기본 기능 및 화면 회의
- 프론트 역할 분배

### [2] 목업 설계

- 채팅방 컴포넌트 초안 제작
- 채팅방 만들기 컴포넌트 초안 제작
- 미니게임 시작 컴포넌트 초안 제작
- 미니게임 페이지 초안 제작
- 미니게임 결과 컴포넌트 초안 제작

# 0121 수행(학습) 내용

### [1] 아이디어 회의
- figma 제작 현황 및 기능명세 / API 명세 비교 및 업데이트
- 기능 및 화면 통합, 수정

### [2] 목업 설계
- 채팅방 컴포넌트 보완
- 채팅방 만들기 컴포넌트 보완
- 미니게임 시작 컴포넌트 보완
- 미니게임 페이지 보완
- 미니게임 결과 컴포넌트 보완


# 0122 수행(학습) 내용

### [1] figma 목업 보완
- 전반적 디자인 보완
- 활용 asset search 및 목업 반영
- ERD 및 API 명세서 바탕으로 상호 간 수정
- 필요한 효과(뿌얘지기, 이끼 등) 생성

### [2] 프로그램 활용 자료 수집
- 효과음 자료 수집
- 효과 화면 수집

### [3] frontend 활용 기술스택 조사
- 웹 페이지
    - Next.js (v13 이상)
    - TypeScript(4.9 이상 혹은 5.x)
    - Tailwind + styled-components
    - Recoil + React Query
- 물고기 동작
    - gsap        
- WebSocket
    - sockjs-client 라이브러리, @stomp/stompjs
- WebRTC & MediaPipe
    - openvidu 라이브러리
    - @mediapipe/hands @mediapipe/camera_utils
- 화면에서 오디오 제어
    - Web Audio API

# 0123 수행(학습) 내용

### [1] figma 목업 완료
- 전반적 디자인 확정
- 애니메이션 등 효과 반영
- 유저플로우 고려한 상황별 화면 추가3

### [2] 프로그램 활용 자료 수집
- 효과음 자료 수집
- 수집 자료 아카이빙

# 0124 수행(학습) 내용

### [1] figma 추가 보완
- 회원 탈퇴 및 비밀번호 변경 기능 추가

### [2] Next.js MediaPipe 테스트
```jsx
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true, // 기존 설정 유지

  webpack: (config) => {
    // 필요한 Webpack 설정 추가
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false, // Node.js 파일 시스템 모듈 비활성화
    };

    return config;
  },
};

export default nextConfig;

```

```jsx
//index.tsx

import { useEffect, useRef, useState } from "react";
import { Hands } from "@mediapipe/hands";
import { Camera } from "@mediapipe/camera_utils";
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";

const CameraMirrorPage = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const startCameraAndHandRecognition = async () => {
      if (!videoRef.current || !canvasRef.current) return;

      const videoElement = videoRef.current;
      const canvasElement = canvasRef.current;
      const canvasCtx = canvasElement.getContext("2d");

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });

        videoElement.srcObject = stream;

        // onloadedmetadata 이벤트를 기다린 후 play() 호출
        videoElement.onloadedmetadata = async () => {
          await videoElement.play();

          const hands = new Hands({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
          });

          hands.setOptions({
            maxNumHands: 2,
            modelComplexity: 1,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5,
          });

          hands.onResults((results) => {
            if (!canvasCtx) return;

            canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
            canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

            if (results.multiHandLandmarks) {
              for (const landmarks of results.multiHandLandmarks) {
                drawConnectors(canvasCtx, landmarks, Hands.HAND_CONNECTIONS, {
                  color: "#00FF00",
                  lineWidth: 2,
                });
                drawLandmarks(canvasCtx, landmarks, {
                  color: "#FF0000",
                  lineWidth: 1,
                });
              }
            }
          });

          const camera = new Camera(videoElement, {
            onFrame: async () => {
              await hands.send({ image: videoElement });
            },
          });

          camera.start();
        };
      } catch (err) {
        setError("손 인식을 초기화하는 중 문제가 발생했습니다.");
        console.error("Error initializing hand recognition:", err);
      }
    };

    startCameraAndHandRecognition();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return (
    <div style={{ textAlign: "center" }}>
      <h1>손 인식 테스트</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}

      <video ref={videoRef} style={{ display: "none" }} playsInline muted />
      <canvas ref={canvasRef} style={{ width: "80%", height: "60vh", border: "1px solid black" }} />
    </div>
  );
};

export default CameraMirrorPage;

```

### **코드의 주요 구성 요소**

1. **카메라를 켜서 비디오를 보여줍니다.**
2. **MediaPipe라는 도구를 사용해서 손을 인식합니다.**
3. **손의 모양(랜드마크와 연결선)을 화면에 그립니다.**
4. **사용 중 문제가 생기면 오류를 알려줍니다.**

---

### **코드 설명**

### **1. 컴포넌트 정의 (`CameraMirrorPage`)**

```tsx
tsx
복사편집
const CameraMirrorPage = () => { ... }

```

- 이 코드는 React 컴포넌트입니다. 컴포넌트는 마치 "작은 앱"처럼 특정 기능을 담당합니다.
- 여기서는 카메라를 켜고 손을 인식하는 기능을 구현합니다.

---

### **2. 변수와 상태 정의**

```tsx
tsx
복사편집
const videoRef = useRef<HTMLVideoElement>(null);
const canvasRef = useRef<HTMLCanvasElement>(null);
const [error, setError] = useState<string | null>(null);

```

- **`videoRef`와 `canvasRef`**: 카메라 화면과 그림을 그릴 캔버스를 참조합니다. 이 참조는 HTML 요소를 연결하는 "다리" 역할을 합니다.
- **`error`**: 문제가 생기면 오류 메시지를 저장합니다.

---

### **3. 카메라와 손 인식 시작 (`useEffect`)**

```tsx
tsx
복사편집
useEffect(() => { ... }, []);

```

- React에서는 `useEffect`를 사용해 컴포넌트가 화면에 나타날 때(마운트될 때) 특정 작업을 실행합니다.
- 이 코드는 카메라를 켜고 손 인식을 시작합니다.

---

### **4. 카메라와 손 인식 실행 함수 (`startCameraAndHandRecognition`)**

```tsx
tsx
복사편집
const startCameraAndHandRecognition = async () => { ... }

```

이 함수는 세 가지 주요 일을 합니다:

1. 카메라를 켭니다.
2. 손을 인식하는 MediaPipe의 `Hands`를 설정합니다.
3. 화면에 손의 모양을 그립니다.

### **4.1 카메라 켜기**

```tsx
tsx
복사편집
const stream = await navigator.mediaDevices.getUserMedia({ video: true });
videoElement.srcObject = stream;

```

- **`getUserMedia`**: 브라우저가 컴퓨터의 카메라를 켜도록 요청합니다.
- **`srcObject`**: 비디오 화면에 카메라 영상을 연결합니다.

### **4.2 카메라 데이터 준비 (`onloadedmetadata`)**

```tsx
tsx
복사편집
videoElement.onloadedmetadata = async () => { ... }

```

- 카메라가 데이터를 준비하면 `onloadedmetadata` 이벤트가 발생합니다.
- 이 시점에 `play()`를 호출해 비디오 재생을 시작합니다.

---

### **4.3 MediaPipe의 `Hands` 설정**

```tsx
tsx
복사편집
const hands = new Hands({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
});

```

- **`Hands`**: MediaPipe의 손 인식 도구입니다.
- **`locateFile`**: MediaPipe가 사용하는 파일들을 CDN(서버)에서 불러옵니다.

### **4.4 손 인식 옵션 설정**

```tsx
tsx
복사편집
hands.setOptions({
  maxNumHands: 2,
  modelComplexity: 1,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5,
});

```

- **`maxNumHands`**: 최대 몇 개의 손을 인식할지 설정합니다. 여기서는 2개로 설정했습니다.
- **`minDetectionConfidence`**: 손을 감지하는 최소 신뢰도입니다. 값이 0에 가까우면 부정확해지고, 1에 가까우면 더 정확하게 인식합니다.
- **`minTrackingConfidence`**: 손이 움직이는 것을 추적하는 최소 신뢰도입니다.

---

### **4.5 손 인식 결과 처리 (`onResults`)**

```tsx
tsx
복사편집
hands.onResults((results) => { ... });

```

- 손이 감지되면 결과를 처리하는 함수입니다.
- **`results.image`**: 현재 비디오 화면.
- **`results.multiHandLandmarks`**: 손의 랜드마크(관절 위치) 데이터.

---

### **4.6 랜드마크와 연결선 그리기**

```tsx
tsx
복사편집
if (results.multiHandLandmarks) {
  for (const landmarks of results.multiHandLandmarks) {
    drawConnectors(canvasCtx, landmarks, Hands.HAND_CONNECTIONS, {
      color: "#00FF00",
      lineWidth: 2,
    });
    drawLandmarks(canvasCtx, landmarks, {
      color: "#FF0000",
      lineWidth: 1,
    });
  }
}

```

- **`drawConnectors`**: 손가락과 손바닥의 연결선을 그립니다.
- **`drawLandmarks`**: 손가락 관절 위치를 표시합니다.
- **`canvasCtx`**: 그림을 그릴 캔버스의 2D 컨텍스트입니다.

---

### **4.7 MediaPipe 카메라 설정**

```tsx
tsx
복사편집
const camera = new Camera(videoElement, {
  onFrame: async () => {
    await hands.send({ image: videoElement });
  },
});
camera.start();

```

- MediaPipe의 `Camera` 객체를 사용해 비디오 프레임을 가져오고, 각 프레임을 `hands.send`로 처리해 손을 인식합니다.

---

### **5. 에러 처리**

```tsx
tsx
복사편집
catch (err) {
  setError("손 인식을 초기화하는 중 문제가 발생했습니다.");
  console.error("Error initializing hand recognition:", err);
}

```

- 오류가 발생하면 사용자에게 오류 메시지를 보여줍니다.

---

### **6. 컴포넌트 반환**

```tsx
tsx
복사편집
return (
  <div style={{ textAlign: "center" }}>
    <h1>손 인식 테스트</h1>
    {error && <p style={{ color: "red" }}>{error}</p>}
    <video ref={videoRef} style={{ display: "none" }} playsInline muted />
    <canvas ref={canvasRef} style={{ width: "80%", height: "60vh", border: "1px solid black" }} />
  </div>
);

```

- 사용자 화면에 **손 인식 테스트 제목**, **오류 메시지**, **비디오 및 캔버스**를 표시합니다.

---

### **코드의 장점**

1. **React의 강점을 활용**: `useEffect`와 상태 관리를 통해 간결하고 직관적으로 구현되었습니다.
2. **실시간 손 인식**: MediaPipe와 WebRTC를 결합해 브라우저에서 실시간 손 인식을 구현했습니다.
3. **사용자 친화적 오류 처리**: 오류 발생 시 사용자에게 알림을 제공합니다.

---

### **개선점**

1. **스타일 개선**:
    - 캔버스와 UI를 더 보기 좋게 꾸밀 수 있습니다.
2. **권한 확인**:
    - 카메라 권한이 없을 때 사용자에게 안내 메시지를 추가할 수 있습니다.
3. **성능 최적화**:
    - 손 인식 로직이 모든 프레임에서 실행되므로, 특정 간격으로 실행되도록 최적화할 수 있습니다.