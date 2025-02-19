'use client';

import { User } from '@/store/authAtom';
import { useEffect, useRef } from 'react';

import { useSFX } from "@/hooks/useSFX";
import { bgMusicVolumeState, sfxVolumeState } from "@/store/soundAtom";

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

export default function ParticipantList({
  users,
  currentUser,
  currentIsHost,
  onKickUser,
}: ParticipantListProps) {

  return (
    <div className='bg-white/70 border border-gray-300 rounded-lg shadow-lg p-4 z-10 w-[370px] h-[170px] overflow-auto custom-scrollbar'>
      <h3 className='text-lg font-bold mb-2'>참가자 리스트 {users.length}</h3>
      <ul className='space-y-2'>
        {users.map((member) => {
          let displayName = '';
          // 현재 사용자이면 authAtom의 nickname과 level 사용
          if (currentUser?.id === member.userName) {
            displayName = `${currentUser.nickname} (Lv.${currentUser.level})${
              member.isHost ? ' (방장)' : ''
            }`;
          } else {
            // 다른 사용자는 API에서 받아온 nickname과 level 사용
            displayName = `${member.nickname} (Lv.${member.level})${
              member.isHost ? ' (방장)' : ''
            }`;
          }
          return (
            <li
              key={member.userName}
              className='flex justify-between items-center px-4 py-2 border rounded bg-gray-50'
            >
              <div className='text-gray-900 font-medium flex items-center space-x-2'>
                <div className='w-10 h-10 bg-300 rounded-full overflow-hidden'>
                  <img
                    src={member.mainFishImage}
                    alt='참가자대표물고기'
                    className='w-full h-full object-contain rounded-full'
                  />
                </div>
                <div>{displayName}</div>
              </div>
              {member.ready && (
                <span className='text-green-700 font-bold'>Ready</span>
              )}
              {currentIsHost && member.userName !== currentUser?.id && (
                <button
                  onClick={() => onKickUser(member.userName)}
                  className='ml-2 px-2 py-1 bg-red-500 text-black rounded bg-white border border-black shadow-sm'
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
