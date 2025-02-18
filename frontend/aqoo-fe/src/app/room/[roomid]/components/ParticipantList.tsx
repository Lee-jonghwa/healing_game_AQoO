"use client";

import React from "react";
import { User } from '@/store/authAtom';
import { useEffect, useRef } from 'react';

import { useSFX } from "@/hooks/useSFX";
import { bgMusicVolumeState, sfxVolumeState } from "@/store/soundAtom";

interface Friend {
  friendId: string;
  nickname: string;
  level: number;
}

interface Participant {
  userName: string;
  ready: boolean;
  isHost: boolean;
  mainFishImage: string;
  nickname?: string;
}

interface ParticipantListProps {
  users: Participant[]; // ✅ 참가자 리스트
  friendList: Friend[]; // ✅ 친구 리스트 추가
  currentUser: User; // ✅ 로그인한 사용자 정보 추가
  currentIsHost: boolean;
  onKickUser: (userName: string) => void;
}

export default function ParticipantList({ users, friendList, currentUser, currentIsHost, onKickUser }: ParticipantListProps) {
  console.log("현재 참가자 목록:", users);
  console.log("현재 친구 목록:", friendList);
  console.log("현재 로그인한 사용자:", currentUser);

  const { play: entranceRoom } = useSFX("/sounds/샤라랑.mp3"); // 채팅방입장

    // 현재 참가자 수
    const participantCount = users.length;
  
    // 이전 참가자 수를 추적하는 ref
    const prevUsersCountRef = useRef<number>(users.length);
  
    // 참가자 수(users.length)가 변경될 때마다 효과음 재생
    useEffect(() => {
      if (users.length > prevUsersCountRef.current) {
        // 참가자가 새로 추가된 경우
        entranceRoom();
      }
      // 현재 참가자 수를 업데이트
      prevUsersCountRef.current = users.length;
    }, [users.length, entranceRoom]);
  

  return (
    <div className="bg-white/70 border border-gray-300 rounded-lg shadow-lg p-4 z-10 w-[370px] h-[170px] overflow-auto custom-scrollbar">
      <h3 className="text-lg font-bold mb-2">참가자 리스트 {users.length}</h3>
      <ul className="space-y-2">
        {users.map((user) => {
          let displayName;
          // ✅ `authAtom`의 User에서 직접 닉네임 가져오기
          if (user.isHost) {
            displayName = (currentUser?.id === user.userName) 
              ? `${currentUser.nickname} (Lv.${currentUser.level}) (방장)` 
              : `${user.userName} (방장)`;
          } else {
            // ✅ 일반 참가자는 `friendList`에서 가져오되, 없으면 `authAtom`에서 가져오기
            const friend = friendList.find((f) => f.friendId === user.userName);
            displayName = friend 
              ? `${friend.nickname} (Lv.${friend.level})` 
              : (currentUser?.id === user.userName 
                ? `${currentUser.nickname} (Lv.${currentUser.level})` 
                : user.userName);
          }

          return (
            <li key={user.userName} className="flex justify-between items-center px-4 py-2 border rounded bg-gray-50">
              <div className="text-gray-900 font-medium flex items-center space-x-2">
                <div className="w-10 h-10 bg-300 rounded-full overflow-hidden">
                  <img 
                    src={user.mainFishImage} 
                    alt="참가자대표물고기"  
                    className="w-full h-full object-contain rounded-full"
                  />
                </div>
                <div>
                  {displayName}
                </div>
              </div>
              {user.ready && <span className="text-green-700 font-bold">Ready</span>}
              {currentIsHost && user.userName !== currentUser?.id && (
                <button
                  onClick={() => onKickUser(user.userName)}
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
  );
}