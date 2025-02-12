'use client';

import { useEffect, useState } from 'react';

// 친구 목록 타입
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
  onInvite: (friendId: string) => void;
}

export default function FriendList({ userName, roomId, isHost, onInvite }: FriendListProps) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [inviteCooldowns, setInviteCooldowns] = useState<{ [key: string]: number }>({});

  // 친구 목록 불러오기 (방장일 때만 실행)
  useEffect(() => {
    if (isHost) {
      fetch(`https://i12e203.p.ssafy.io/api/v1/friends/${encodeURIComponent(userName)}`)
        .then((response) => {
          if (!response.ok) {
            throw new Error('Failed to fetch friends list');
          }
          return response.json();
        })
        .then((data) => {
          setFriends(data.friends);
        })
        .catch((error) => {
          console.error('Error fetching friends:', error);
        });
    }
  }, [isHost, userName]);

  // 초대 버튼 클릭 시
  const handleInvite = async (friendId: string) => {
    onInvite(friendId);
    setInviteCooldowns((prev) => ({ ...prev, [friendId]: 10 })); // 초대 후 10초 동안 비활성화
  };

  // 초대 후 남은 시간을 매초 업데이트하는 타이머
  useEffect(() => {
    if (Object.keys(inviteCooldowns).length === 0) return;

    const timer = setInterval(() => {
      setInviteCooldowns((prevCooldowns) => {
        const newCooldowns = { ...prevCooldowns };
        Object.keys(newCooldowns).forEach((key) => {
          newCooldowns[key] = newCooldowns[key] - 1;
          if (newCooldowns[key] <= 0) {
            delete newCooldowns[key];
          }
        });
        return newCooldowns;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [inviteCooldowns]);

  return (
    <div className="mt-6">
      <h3 className="text-xl font-semibold mb-2">친구 목록 (초대 가능)</h3>
      {friends.length === 0 ? (
        <p>초대 가능한 친구가 없습니다.</p>
      ) : (
        <ul className="space-y-2">
          {friends.map((friend) => (
            <li
              key={friend.id}
              className="flex justify-between items-center px-4 py-2 border rounded bg-gray-50"
            >
              <span>
                {friend.nickname} (@{friend.friendId})
              </span>
              <button
                disabled={!!inviteCooldowns[friend.friendId]}
                onClick={() => handleInvite(friend.friendId)}
                className="ml-2 px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                {inviteCooldowns[friend.friendId] ? `초대 (${inviteCooldowns[friend.friendId]}초)` : '초대'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
