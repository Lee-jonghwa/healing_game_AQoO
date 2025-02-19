"use client";

import { useEffect, useState } from "react";
import FriendList from "@/app/gameroom/FriendList";
import ParticipantList from "@/app/gameroom/ParticipantList";
import { useRecoilState } from "recoil";
import { useRouter, usePathname } from "next/navigation";
import { usersState } from "@/store/participantAtom";
import axiosInstance from "@/services/axiosInstance";

import { useSFX } from "@/hooks/useSFX";
import { bgMusicVolumeState, sfxVolumeState } from "@/store/soundAtom";





// localStorage에 안전하게 접근하는 헬퍼 함수
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
  
  const { play: playModal } = useSFX("/sounds/clickeffect-02.mp3");

  // 클라이언트 사이드에서만 localStorage에 접근하여 사용자 이름을 설정
  useEffect(() => {
    const storedUserName = getLocalStorageItem("loggedInUser", "guest");
    setUserName(storedUserName);
  }, []);

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
      // 채팅방 생성 API 호출
      const response = await axiosInstance.post(`/chatrooms?userId=${encodeURIComponent(userName)}`);
      
      const data = response.data;
      const roomId = data.roomId;
      console.log("Created roomId:", roomId);
      console.log("participants:", participants);

      // 참가자 목록을 순회하며 초대 API 호출 (호스트 제외)
      for (const participant of participants) {
        // 만약 해당 참가자가 호스트라면 초대 API 호출하지 않음
        if (participant.isHost) continue;

        try {
          const inviteResponse = await axiosInstance.post("/chatrooms/invite", {
            hostId: userName, // 채팅방을 생성한 사람(호스트)
            guestId: participant.friendId, // 초대할 참가자 (participant의 식별자)
            roomId: roomId,
          });
          if (inviteResponse.status >= 200 && inviteResponse.status < 300) {
            console.log(`${participant.friendId}님 초대 성공`);
          } else {
            console.error(`${participant.friendId}님 초대 실패`);
          }
        } catch (inviteError) {
          console.error(`${participant.friendId}님 초대 중 에러 발생:`, inviteError);
        }
      }

      // 채팅방 페이지로 이동 (호스트 플래그 true)
      router.push(`/room/${roomId}?userName=${encodeURIComponent(userName)}&isHost=true`);
    } catch (error) {
      console.error("❌ Error creating room:", error);
      const errorMessage = error instanceof Error ? error.message : "알 수 없는 오류 발생";
      alert(`채팅방 생성 실패: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="relative flex flex-col items-center justify-center min-h-screen bg-cover bg-center"
      style={{ backgroundImage: "url('/chat_images/background.png')" }}
    >
      {/* 배경 */}
      <div className="absolute inset-0 bg-white opacity-20"></div>
  
      {/* 전체 컨테이너 - 반응형 최대 너비 적용 */}
      <div className="relative z-0 flex flex-col items-center p-4 w-full
                      max-w-sm  /* 기본: 최대 너비를 작게 */
                      sm:max-w-md  /* sm 사이즈부터 중간 크기 */
                      md:max-w-4xl  /* md 사이즈부터 기존 크기 적용 */
                      mx-auto">
  
        {/* 데스크탑: 친구 리스트와 참가자 리스트를 감싼 박스 */}
        <div className="hidden md:flex gap-6 p-6 bg-white bg-opacity-30 border border-black rounded-lg shadow-lg w-[800px] h-[500px] relative justify-center items-center">
          {/* 데스크탑: 절대 위치로 방 만들기 제목 */}
          <div className="absolute top-[-40px] left-1/2 transform -translate-x-1/2 px-6 py-2 bg-white/70 border border-black rounded-lg shadow-lg">
            <h1 className="text-3xl font-bold text-black text-center">🎮 방 만들기 🕹️</h1>
          </div>
          <FriendList />
          <ParticipantList />
        </div>
  
        {/* 모바일 전용 박스 (md:hidden) */}
        <div className="block md:hidden relative mt-16">
          {/* 박스 자체 */}
          <div className="relative bg-white bg-opacity-30 border border-black rounded-lg shadow-lg p-6">
            {/* 타이틀을 absolute로 겹쳐서 배치 */}
            <h1
              className="
                text-xl md:text-3xl           /* 모바일은 작은 글씨, 데스크탑은 큰 글씨 */
                font-bold 
                text-black 
                text-center 
                bg-white 
                border border-black 
                rounded-lg 
                shadow-lg
                w-40 h-12                /* 모바일에서의 너비와 높이 */
                md:w-64 md:h-20          /* 데스크탑에서의 너비와 높이 */
                flex items-center justify-center /* 텍스트를 가운데 정렬 */
              "
            >
              🎮 방 만들기 🕹️
            </h1>
  
            {/* 박스 내부에 친구 리스트와 참가자 리스트 */}
            <FriendList />
            <ParticipantList />
          </div>
        </div>
  
        {/* 버튼 컨테이너 */}
        <div className="flex w-full justify-center md:justify-end mt-6 mb-10">
          <button
            onClick={() => {
              playModal();
              handleCreateRoom();
            }}
            className="
              px-5 py-2 
              rounded 
              border border-black 
              bg-white 
              text-xl 
              hover:bg-blue-500 hover:text-white 
              transition duration-300
            "
          >
            방 만들기
          </button>
        </div>
      </div>
    </div>
  );  
}
