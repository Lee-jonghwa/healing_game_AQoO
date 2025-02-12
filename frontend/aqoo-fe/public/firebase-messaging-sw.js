// public/firebase-messaging-sw.js

importScripts("https://www.gstatic.com/firebasejs/11.2.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/11.2.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyD331gS46jCW24EjPrIk6ZLM1zOF-7FAJU",
  authDomain: "aqoo-6ff04.firebaseapp.com",
  projectId: "aqoo-6ff04",
  storageBucket: "aqoo-6ff04.firebasestorage.app",
  messagingSenderId: "477360750442",
  appId: "1:477360750442:web:171a77b5cb7528aea26f13",
  measurementId: "G-9WT1MZZREY",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("📢 백그라운드 메시지 수신:", payload);

  const type = payload.data.type;
  const bodyState = Number(payload.data.body); // 상태 값 (0~3)
  const icon = payload.data.icon || "/icon/icon-fishTank.png"; // 기본 아이콘 경로

  // 상태별 메시지 매핑
  const messages = {
    WATER: {
      title: "💧 어항 물 상태 💧",
      body: [
        "어항의 물이 너무 오염됐어요! <br>즉시 물을 교체하지 않으면 물고기들이 생존할 수 없어요!",
        "수질이 심각하게 나빠졌어요! <br>빨리 물을 갈아주지 않으면 물고기들이 아플 수도 있어요!",
        "어항 속 물이 점점 더 혼탁해지고 있어요. <br>물고기들이 불편해할 거예요!",
        "어항의 물이 조금씩 탁해지고 있어요. <br>물갈이를 해주는 게 좋겠어요!"
      ]
    },
    CLEAN: {
      title: "🧽 어항 청소 상태 🧽",
      body: [
        "이끼와 찌꺼기로 가득 찬 어항! <br>지금 당장 청소하지 않으면 물고기들이 위험해요!",
        "어항이 너무 더러워져서 물고기들이 움직이기 어려워해요. <br>당장 청소해 주세요!",
        "이끼와 찌꺼기가 쌓이면서 어항이 점점 더 지저분해지고 있어요. <br>청소가 필요해요!",
        "어항 벽에 이끼가 생기기 시작했어요. <br>깨끗하게 닦아주는 게 좋겠어요!"
      ]
    },
    FEED: {
      title: "🍽 어항 먹이 상태 🍽",
      body: [
        "먹이가 완전히 떨어졌어요! <br>지금 먹이를 주지 않으면 물고기들이 굶어 죽을 수도 있어요!",
        "물고기들이 오랫동안 굶주렸어요. <br>더 이상 버틸 수 없을지도 몰라요!",
        "먹이를 제때 주지 않아서 물고기들이 힘을 잃고 있어요. <br>빨리 먹이를 주세요!",
        "먹이가 조금씩 줄어들고 있어요. <br>물고기들이 배고파하기 전에 먹이를 주세요!"
      ]
    }
  };

  // 유효한 type인지 확인 후 알림 생성
  if (messages[type] && bodyState >= 0 && bodyState <= 3) {
    const title = messages[type].title;
    const body = messages[type].body[bodyState];

    const options = {
      body: body,
      icon: icon,
      data: {
        click_action: payload.data.click_action, // 클릭 시 이동할 URL
      },
    };

    self.registration.showNotification(title, options);
  } else {
    console.warn("🚨 잘못된 알림 데이터:", payload.data);
  }
});


// 클릭 이벤트 처리
self.addEventListener("notificationclick", (event) => {
  event.notification.close(); // 알림 닫기
  const action = event.notification.data.click_action;
  if (action) {
    event.waitUntil(clients.openWindow(action)); // URL로 이동
  }
});
