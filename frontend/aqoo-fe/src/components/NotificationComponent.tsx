import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { useEffect, useState, useRef } from "react";
import { app } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";

export default function NotificationComponent({ 
  refreshAquariumData,
  setNewNotifications,
 }: { 
  refreshAquariumData: () => void;
  setNewNotifications: (newNotifications: boolean) => void;
 }) {
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const { auth } = useAuth();
  const tokenSentRef = useRef<boolean>(false); // 중복 요청 방지 ref

  useEffect(() => {
    const requestPermissionAndGetToken = async () => {
        if (typeof window === "undefined" || tokenSentRef.current) return;
        tokenSentRef.current = true; // 중복 실행 방지

        const messaging = getMessaging(app);

        try {
            const permission = await Notification.requestPermission();
            console.log("📢 알림 권한 상태:", permission);

            if (permission !== "granted") {
                console.log("❌ 알림 권한이 거부됨");
                return;
            }

            const currentToken = await getToken(messaging, {
                vapidKey: "BEUpmeaw0oerqu0AtiyAgUgJ-sKN0NNqtFaDORztzyl14h97JgCjxiLwFjnQkdcR8aY6XAaFp1AqWf3P05JlkVU",
            });

            if (currentToken) {
                console.log("✅ FCM 토큰:", currentToken);
                setFcmToken(currentToken);

                // 🔹 서버에 FCM 토큰 전송 (userId와 함께 전송)
                if (auth?.user?.id) {
                    await sendTokenToServer(auth.user.id, currentToken);
                } else {
                    console.error("❌ 유저 ID가 없습니다.");
                }
            } else {
                console.log("⚠️ FCM 토큰을 가져오지 못했습니다.");
            }
        } catch (err) {
            console.error("🔥 FCM 토큰 가져오기 오류:", err);
        }
    };

    requestPermissionAndGetToken();

     // 포그라운드 알림 처리
     if (typeof window !== "undefined") {
      const messaging = getMessaging(app);
      onMessage(messaging, (payload) => {
        console.log("📢 포그라운드 메시지 수신:", payload);

        const title =  payload.data?.title;
        const body = payload.data?.body;
        const type = payload.data?.type;

      // 알림을 수신하면 `refreshAquariumData()`를 호출
      refreshAquariumData()

        if (title && body) {
          if(type === "FRIEND REQUEST" || type === "FRIEND ACCEPT" || type === "GAME INVITE" || type === "FRIEND FISH")
            //알람 테이블에 추가해야 할 알람 처리 ->
            //alert(`알림 제목: ${title}\n알림 내용: ${body}`);

            // 새로운 알림이 있을 경우 상태 업데이트
            setNewNotifications(true); // BottomMenuBar에 알림 상태 변경 전달

        } else {
          console.log("⚠️ 알림 정보가 없습니다.");
        }
      });
    }

  }, [refreshAquariumData, auth?.user?.id, setNewNotifications]); // `refreshAquariumData`와 `auth?.user?.id`에 의존


  // 🔥 **Axios 대신 Fetch를 사용하여 서버로 토큰 전송 (중복 요청 방지)**
const sendTokenToServer = async (userId: string, token: string) => {
  try {
      const response = await fetch("https://i12e203.p.ssafy.io/api/v1/push/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, token }),
      });

      const data = await response.text();
      console.log("✅ 서버로 토큰 전송 성공:", data);
  } catch (error) {
      console.error("🔥 FCM 토큰 서버 전송 실패:", error);
  }
};

  return null;
}
