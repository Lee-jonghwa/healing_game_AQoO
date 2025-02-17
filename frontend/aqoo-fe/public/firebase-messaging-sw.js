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

  const title = payload.data.title;
  const body = payload.data.body; // 상태 값 (0~3)
  const icon = payload.data.icon || "/icon/icon-fishTank.png"; // 기본 아이콘 경로

<img src={icon} alt="Fish Tank Icon" style={{ objectFit: 'contain', width: '100%', height: '100%' }} />

  
    const options = {
      body: body,
      icon: icon,
      data: {
        click_action: payload.data.click_action, // 클릭 시 이동할 URL
      },
    };

    self.registration.showNotification(title, options);
 
});


// 클릭 이벤트 처리
self.addEventListener("notificationclick", (event) => {
  event.notification.close(); // 알림 닫기
  const action = event.notification.data.click_action;
  if (action) {
    event.waitUntil(clients.openWindow(action)); // URL로 이동
  }
});
