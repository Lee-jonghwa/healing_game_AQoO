"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useRecoilState } from "recoil";
import { usersState } from "@/store/participantAtom";
import FriendList from "./FriendList";
import ParticipantList from "./ParticipantList";

// localStorage 안전하게 접근하는 헬퍼 함수
const getLocalStorageItem = (key: string, defaultValue: string = "guest"): string => {
  if (typeof window !== "undefined") {
    return localStorage.getItem(key) ?? defaultValue;
  }
  return defaultValue;
};

export default function GameRoomPage() {
  const [participants, setParticipants] = useRecoilState(usersState);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [userName, setUserName] = useState<string | null>(null);

  // 클라이언트 사이드에서만 localStorage에 접근하여 사용자 이름을 설정
  useEffect(() => {
    const storedUserName = getLocalStorageItem("loggedInUser", "guest");
    setUserName(storedUserName);
  }, []);

  // 방장 자동 지정 (이전 참가자가 있을 경우만)
  useEffect(() => {
    if (participants.length > 0 && !participants[0]?.isHost) {
      setParticipants((prev) => {
        const updatedParticipants = [...prev];
        updatedParticipants[0] = { ...updatedParticipants[0], isHost: true };
        return updatedParticipants;
      });
    }
  }, [participants.length]);

  // 채팅방 생성 핸들러
  const handleCreateRoom = async () => {
    if (participants.length === 0) {
      alert("⚠ 참가자를 한 명 이상 추가해주세요.");
      return;
    }

    if (!userName) {
      alert("⚠ 사용자 이름을 확인할 수 없습니다.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://i12e203.p.ssafy.io/api/v1/chatrooms?userId=${encodeURIComponent(userName)}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Room creation failed");
      }

      const data = await response.json();
      const roomId = data.roomId;
      console.log("✅ Created roomId:", roomId);

      // 새로운 경로로 이동
      router.push(
        `/room/${roomId}?userName=${encodeURIComponent(userName)}&isHost=true`
      );
    } catch (error) {
      console.error("❌ Error creating room:", error);
      const errorMessage =
        error instanceof Error ? error.message : "알 수 없는 오류 발생";
      alert(`채팅방 생성 실패: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="relative flex flex-col items-center justify-center min-h-screen bg-cover bg-center"
      style={{ backgroundImage: "url('/images/background.png"}}
    >
      {/* 배경 */}
      <div className="absolute inset-0 bg-white opacity-20"></div>

      {/* 내용물 */}
      <div className="relative z-10 flex flex-col items-center">
        <h1 className="ext-4xl font-bold mb-6 text-black text-5xl">🎮 방 만들기 🕹️</h1>
        <div className="flex gap-6">
          <FriendList />
          <ParticipantList />
        </div>
      </div>

      {/* 만들기 버튼 */}
      <button
        className="fixed bottom-10 right-7 px-10 py-1 rounded border border-black bg-white text-2xl"
        onClick={handleCreateRoom} // 버튼 클릭 시 실행
      >
        만들기
      </button>

      {/* 뒤로가기 버튼 */}
      <button className="fixed bottom-10 left-7 px-10 py-1 rounded border border-black bg-white text-2xl">
        BACK
      </button>
    </div>
  );

  
}