"use client";

import React from "react";
import { User } from '@/store/authAtom';

interface CurrentUser {
  id: string;
  nickName: string;
  level: number;
}

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

  return (
    <div className="bg-white/70 border border-gray-300 rounded-lg shadow-lg p-4 z-10 w-[370px] h-[170px] overflow-auto custom-scrollbar">
      <h3 className="text-lg font-bold mb-2">참가자 리스트 {users.length}</h3>
      <ul className="space-y-2">
        {users.map((user) => {
          // ✅ `friendList`에서 참가자(user.userName)와 일치하는 닉네임 & 레벨 찾기
          const friend = friendList.find((f) => f.friendId === user.userName);
          const displayName = friend 
            ? `${friend.nickname} (Lv.${friend.level})`
            : (currentUser?.id === user.userName ? `${currentUser.nickName} (Lv.${currentUser.level})` : user.userName);

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
                  {displayName} {user.isHost && "(방장)"}
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
