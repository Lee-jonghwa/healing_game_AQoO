import { FirebaseApp, getApp, getApps, initializeApp } from "firebase/app";

import { FirebaseOptions } from "firebase/app";

// Firebase 설정 객체 타입 지정
const firebaseConfig: FirebaseOptions = {
  apiKey: "AIzaSyD331gS46jCW24EjPrIk6ZLM1zOF-7FAJU",
  authDomain: "aqoo-6ff04.firebaseapp.com",
  projectId: "aqoo-6ff04",
  storageBucket: "aqoo-6ff04.firebasestorage.app",
  messagingSenderId: "477360750442",
  appId: "1:477360750442:web:171a77b5cb7528aea26f13",
  measurementId: "G-9WT1MZZREY",
};

// 중복 초기화 방지 (중요)
const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

// console.log("✅ Firebase 앱 초기화 완료:", app);

export { app };
