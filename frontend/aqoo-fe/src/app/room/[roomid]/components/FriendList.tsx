'use client';

import axiosInstance from '@/services/axiosInstance';
import { useEffect, useState } from 'react';

// API가 반환하는 친구 정보 타입
export interface Friend {
  id: number;
  friendId: string;
  nickname: string;
  level: number;
  mainFishImage: string | null;
}

// FriendList 컴포넌트의 props 타입
interface FriendListProps {
  userName: string;
  roomId: string;
  isHost: boolean;
  participantCount: number;
  users: { userName: string }[]; // 현재 채팅방에 참여한 사용자 목록 (간단한 형태)
  onInvite: (friendId: string) => void;
}

export default function FriendList({
  userName,
  roomId,
  isHost,
  participantCount,
  users,
  onInvite,
}: FriendListProps) {
  // API 호출 결과로 받은 친구 목록
  const [friends, setFriends] = useState<Friend[]>([]);
  const [inviteCooldowns, setInviteCooldowns] = useState<{
    [key: string]: number;
  }>({});
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isHost) {
      axiosInstance
        .get(`/friends/${encodeURIComponent(userName)}`)
        .then((response) => {
          // API 응답 형식: { count: number, friends: Friend[] }
          setFriends(response.data.friends);
        })
        .catch((error) => console.error('Error fetching friends:', error));
    }
  }, [isHost, userName]);

  const handleInvite = async (friendId: string) => {
    if (participantCount >= 6) {
      const electronAPI = (window as any).electronAPI;
      if (electronAPI && electronAPI.showAlert) {
        electronAPI.showAlert('참가자가 최대 인원(6명)을 초과할 수 없습니다.');
      } else {
        alert('참가자가 최대 인원(6명)을 초과할 수 없습니다.');
      }
      return;
    }
    onInvite(friendId);
    setInviteCooldowns((prev) => ({ ...prev, [friendId]: 10 }));
  };

  useEffect(() => {
    if (Object.keys(inviteCooldowns).length === 0) return;
    const timer = setInterval(() => {
      setInviteCooldowns((prevCooldowns) => {
        const newCooldowns = { ...prevCooldowns };
        Object.keys(newCooldowns).forEach((key) => {
          newCooldowns[key] -= 1;
          if (newCooldowns[key] <= 0) {
            delete newCooldowns[key];
          }
        });
        return newCooldowns;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [inviteCooldowns]);

  const filteredFriends = friends.filter(
    (friend) =>
      friend.nickname.includes(searchQuery) ||
      friend.friendId.includes(searchQuery)
  );

  return (
    <div className='relative p-4 bg-transparent w-[300px] h-[500px] flex flex-col'>
      {isHost && (
        <h3 className='text-xl font-semibold mb-4'>친구 {friends.length}</h3>
      )}
      <div className='flex-grow overflow-y-auto custom-scrollbar'>
        {!isHost ? (
          <p className='text-center text-gray-500'>초대 권한이 없습니다.</p>
        ) : filteredFriends.length === 0 ? (
          <p className='text-center text-gray-500'>
            초대 가능한 친구가 없습니다.
          </p>
        ) : (
          <ul className='space-y-2'>
            {filteredFriends.map((friend) => {
              const isJoined = users.some(
                (user) => user.userName === friend.friendId
              );
              const isInvited = !!inviteCooldowns[friend.friendId];
              return (
                <li
                  key={friend.id}
                  className='flex items-center justify-between px-4 py-2 border rounded bg-gray-100 hover:bg-gray-200 transition-colors'
                >
                  <div>
                    <p className='text-sm font-semibold'>
                      Lv.{friend.level} {friend.nickname}
                    </p>
                    <p className='text-xs text-gray-500'>@{friend.friendId}</p>
                  </div>
                  <button
                    disabled={isJoined || isInvited || participantCount >= 6}
                    onClick={() => handleInvite(friend.friendId)}
                    className={`ml-2 px-3 py-1 text-sm text-white rounded transition-colors ${
                      isJoined
                        ? 'bg-gray-400 cursor-not-allowed'
                        : isInvited
                        ? 'bg-yellow-500'
                        : 'bg-blue-500 hover:bg-blue-600'
                    }`}
                  >
                    {isJoined ? '참여중' : isInvited ? '초대중' : '초대'}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {isHost && (
        <div className='mt-4 flex items-center'>
          <input
            type='text'
            placeholder='아이디를 입력하세요.'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='flex-grow px-3 py-2 text-sm border rounded-l-md focus:outline-none'
          />
          <button className='px-4 py-2 bg-blue-600 text-white text-sm rounded-r-md hover:bg-blue-700'>
            검색
          </button>
        </div>
      )}
    </div>
  );
}
