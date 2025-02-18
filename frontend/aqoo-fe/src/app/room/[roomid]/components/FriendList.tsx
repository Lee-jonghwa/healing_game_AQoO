'use client';

import { useEffect, useState } from 'react';
import axiosInstance from "@/services/axiosInstance";

interface Friend {
  id: number;
  friendId: string;
  nickname: string;
  level: number;
  mainFishImage: string | null;
}

interface FriendListProps {
  userName: string;
  roomId: string;
  isHost: boolean;
  participantCount: number;
  users: { userName: string }[]; // 현재 참가자 목록
  friendList: Friend[];
  onInvite: (friendId: string) => void;
}

export default function FriendList({ userName, roomId, isHost, participantCount, users, friendList, onInvite }: FriendListProps) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [inviteCooldowns, setInviteCooldowns] = useState<{ [key: string]: number }>({});
  const [searchQuery, setSearchQuery] = useState('');

  console.log("📢 friendList 데이터:", friendList);

  useEffect(() => {
    if (isHost) {
      axiosInstance.get(`/friends/${encodeURIComponent(userName)}`)
        .then((response) => {
          setFriends(response.data.friends);
        })
        .catch((error) => console.error('Error fetching friends:', error));
    }
  }, [isHost, userName]);

  const handleInvite = async (friendId: string) => {
    if (participantCount >= 6) {
      alert('참가자가 최대 인원(6명)을 초과할 수 없습니다.');
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

  const filteredFriends = friends.filter(friend =>
    friend.nickname.includes(searchQuery) || friend.friendId.includes(searchQuery)
  );

  return (
    <div className="relative p-4 bg-transparent w-[300px] h-[500px] flex flex-col">
      {/* 친구 목록 헤더 */}
      {isHost && <h3 className="text-xl font-semibold mb-4">친구 {friends.length}</h3>}

      {/* 친구 리스트 (스크롤 가능) */}
      <div className="flex-grow overflow-y-auto custom-scrollbar">
        {!isHost ? (
          <p className="text-center text-gray-500">방장만 초대할 수 있습니다.</p>
        ) : filteredFriends.length === 0 ? (
          <p className="text-center text-gray-500">초대 가능한 친구가 없습니다.</p>
        ) : (
          <ul className="space-y-2">
            {filteredFriends.map((friend) => {
              const isJoined = users.some((user) => user.userName === friend.friendId); // 현재 방 참가 여부
              const isInvited = !!inviteCooldowns[friend.friendId]; // 초대중 여부
              const friendStatus = isJoined ? 'joined' : isInvited ? 'invited' : 'available';

              return (
                <li key={friend.id} className="flex items-center justify-between px-4 py-2 border rounded bg-gray-100">
                  <div>
                    <p className="text-sm font-semibold">Lv.{friend.level} {friend.nickname}</p>
                    <p className="text-xs text-gray-500">@{friend.friendId}</p>
                  </div>
                  <button
                    disabled={isJoined || isInvited || participantCount >= 6}
                    onClick={() => handleInvite(friend.friendId)}
                    className={`ml-2 px-3 py-1 text-sm text-white rounded transition-colors ${
                      isJoined ? 'bg-gray-400 cursor-not-allowed' :
                      isInvited ? 'bg-yellow-500' :
                      'bg-blue-500 hover:bg-blue-600'
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

      {/* 🔹 검색창: 방장만 보이도록 조건 추가 */}
      {isHost && (
        <div className="mt-4 flex items-center">
          <input
            type="text"
            placeholder="아이디를 입력하세요."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-grow px-3 py-2 text-sm border rounded-l-md focus:outline-none"
          />
          <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded-r-md hover:bg-blue-700">
            검색
          </button>
        </div>
      )}
    </div>
  );
}
