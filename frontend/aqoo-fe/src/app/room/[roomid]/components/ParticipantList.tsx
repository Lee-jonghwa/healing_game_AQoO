"use client";

import { bgMusicVolumeState, sfxVolumeState } from "@/store/soundAtom";
import { useEffect, useRef, useState } from "react";

import { User } from "@/store/authAtom";
import { useSFX } from "@/hooks/useSFX";

// API에서 받아온 채팅방 멤버 정보 타입 (Member)
export interface Member {
  userName: string;
  nickname: string;
  mainFishImage: string;
  isHost: boolean;
  ready: boolean;
  level: number;
}

interface ParticipantListProps {
  users: Member[]; // API에서 받아온 채팅방 멤버 정보 목록
  currentUser: User; // 로그인한 사용자 정보 (authAtom)
  currentIsHost: boolean;
  onKickUser: (userName: string) => void;
}

export default function ParticipantList({ users, currentUser, currentIsHost, onKickUser }: ParticipantListProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white/70 border border-gray-300 rounded-lg shadow-lg p-2 z-10 w-[370px] h-auto">
      {/* 토글 버튼 */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full px-2 rounded transition-colors text-center flex justify-between"
      >
        <span className="text-lg">참가자 리스트 </span>
        <span className="ml-4 mr-auto text-lg">{users.length}</span>
        {isOpen ? "▲" : "▼"}
      </button>

      {/* 참가자 리스트 (isOpen 상태일 때만 보이게) */}
      {isOpen && (
        <div className="overflow-auto custom-scrollbar max-h-[130px] mt-2">
          <ul className="space-y-2">
            {users.map((member) => {
              let displayName = "";
              if (currentUser?.id === member.userName) {
                displayName = `${currentUser.nickname} (Lv.${currentUser.level})${member.isHost ? " (방장)" : ""}`;
              } else {
                displayName = `${member.nickname} (Lv.${member.level})${member.isHost ? " (방장)" : ""}`;
              }
              return (
                <li
                  key={member.userName}
                  className="flex justify-between items-center px-4 py-2 border rounded bg-gray-50"
                >
                  <div className="text-gray-900 font-medium flex items-center space-x-2">
                    <div className="w-10 h-10 bg-300 rounded-full overflow-hidden">
                      <img
                        src={member.mainFishImage}
                        alt="참가자대표물고기"
                        className="w-full h-full object-contain rounded-full"
                      />
                    </div>
                    <div>{displayName}</div>
                  </div>
                  {member.ready && <span className="text-green-700 font-bold">Ready</span>}
                  {currentIsHost && member.userName !== currentUser?.id && (
                    <button
                      onClick={() => onKickUser(member.userName)}
                      className="ml-2 px-2 py-1 bg-red-500 text-black rounded bg-white border border-black shadow-sm"
                    >
                      추방
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
