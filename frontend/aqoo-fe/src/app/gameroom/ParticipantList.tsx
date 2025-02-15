"use client";

import { useEffect } from "react";
import { useRecoilState } from "recoil";
import { usersState, User } from "@/store/participantAtom";

export default function ParticipantList() {
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
    <div className="relative w-96 h-[450px] bg-white bg-opacity-70 border border-black rounded-lg shadow-lg p-4 flex flex-col">
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
              className="p-3 bg-white bg-opacity-80 border border-black rounded-lg flex items-center justify-between shadow-[2px_2px_0_rgba(0,0,0,0.3)] transform transition duration-300 hover:scale-105 animate-fadeInSlideUp"
            >
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-300 rounded-full overflow-hidden">
                    <img
                      src={participant.mainFishImage}
                      alt="참가자의 대표 물고기"
                      className="w-full h-full object-contain rounded-full"
                    />
                </div>
                <div>
                  <p className="text-xs">Lv. {participant.level}</p>
                  <p className="font-bold">{participant.nickname}</p>
                  <p className="text-xs">{participant.friendId}</p>
                </div>
              </div>
              <button
                onClick={() => handleRemoveParticipant(participant)}
                className="px-3 py-1 bg-white text-black rounded border border-black cursor-pointer transition duration-300 hover:bg-red-500 hover:text-white"
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
