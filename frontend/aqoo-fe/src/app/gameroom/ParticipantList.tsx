"use client";

import { useEffect } from "react";
import { useRecoilState } from "recoil";
import { usersState, User } from "@/store/participantAtom";

import { useSFX } from "@/hooks/useSFX";
import { bgMusicVolumeState, sfxVolumeState } from "@/store/soundAtom";



export default function ParticipantList() { 
  const { play: playModal } = useSFX("/sounds/clickeffect-02.mp3");

  const [users, setUsers] = useRecoilState(usersState);

  const handleRemoveParticipant = (participant: User) => {
    setUsers(users.filter((u) => u.friendId !== participant.friendId));
  };

  // 페이지를 벗어날 때 참가자 목록을 초기화
  useEffect(() => {
    return () => {
      setUsers([]);
    };
  }, [setUsers]);

  return (
    <div className="relative w-full max-w-xs md:w-96 h-[350px] md:h-[450px] bg-white bg-opacity-70 border border-black rounded-lg shadow-lg p-4 flex flex-col">
      {/* 헤더 */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">참가자 {users.length}</h2>
      </div>
  
      {/* 참가자 리스트 */}
      <div className="space-y-3 overflow-y-auto scrollbar-hide flex-grow transition-all duration-300">
        {users.length > 0 ? (
          users.map((participant) => (
        <div
          key={participant.friendId}
          className="
            p-3 bg-white bg-opacity-80 border border-black rounded-lg
            flex items-center justify-between
            shadow-[2px_2px_0_rgba(0,0,0,0.3)]
            transform transition duration-300 hover:scale-105
            animate-fadeInSlideUp
          "
        >
          {/* 왼쪽 영역 */}
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-12 h-12 bg-300 rounded-full overflow-hidden">
              <img
                src={participant.mainFishImage}
                alt="참가자의 대표 물고기"
                className="w-full h-full object-contain rounded-full"
              />
            </div>
            <div className="min-w-0">
              {/* Lv */}
              <p className="
                text-[10px]  /* 모바일에서 글자 크기 줄이기 */
                md:text-xs   /* 데스크탑(md 이상)에서 원래 크기로 */
                whitespace-nowrap
              ">
                Lv. {participant.level}
              </p>
              {/* 닉네임 */}
              <p className="
                font-bold
                text-[10px]  /* 모바일에서 글자 크기 줄이기 */
                md:text-base /* 데스크탑(md 이상)에서 원래(또는 더 큰) 크기로 */
                whitespace-nowrap
                overflow-hidden
                text-ellipsis
              ">
                {participant.nickname}
              </p>
              {/* friendId */}
              <p className="
                text-[10px]  /* 모바일에서 글자 크기 줄이기 */
                md:text-xs   /* 데스크탑(md 이상)에서 원래 크기로 */
                whitespace-nowrap
              ">
                {participant.friendId}
              </p>
            </div>
          </div>

          {/* 제거 버튼 */}
          <button
            onClick={() => {
              playModal();
              handleRemoveParticipant(participant);
            }}
            className="
              px-2 py-1
              bg-white text-black
              rounded border border-black
              cursor-pointer
              transition duration-300
              hover:bg-red-500 hover:text-white

              text-[10px]  /* 모바일에서 글자 크기 줄이기 */
              md:text-sm   /* 데스크탑(md 이상)에서 원래(또는 더 큰) 크기로 */
              whitespace-nowrap
            "
          >
            제거
          </button>
        </div>
          ))
        ) : (
          <p className="text-center text-gray-500">참가자가 없습니다.</p>
        )}
      </div>
    </div>
  );
  
}
