'use client';

import { useEffect, useState } from 'react';

interface Friend {
  id: number;
  friendId: string;
  nickname: string;
  level: number;
  mainFishImage: string | null;
}

interface Participant {
  userName: string;
  ready: boolean;
  isHost: boolean;
  mainFishImage: string;
}

interface FriendListProps {
  userName: string;
  roomId: string;
  isHost: boolean;
  participantCount: number; // 현재 참가자 수
  onInvite: (friendId: string) => void;
  participants: Participant[]; // ✅ 참가자 목록 추가됨
}

export default function FriendList({ userName, roomId, isHost, participantCount, onInvite, participants }: FriendListProps) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [inviteCooldowns, setInviteCooldowns] = useState<{ [key: string]: number }>({});

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

  // ✅ 참가자 목록과 비교하여, 참가자가 아닌 친구만 필터링
  const filteredFriends = friends.filter(
    (friend) => !participants.some((participant) => participant.userName === friend.friendId)
  );

  // 참가자 제외된 친구리스트 데이터
  useEffect(() => {
    console.log("🚀 [FriendList] participants:", participants);
    console.log("✅ [FriendList] filteredFriends:", filteredFriends);
  }, [participants, filteredFriends]);

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

  return (
    <div className="mt-6">
      <h3 className="text-xl font-semibold mb-2">친구 목록 (초대 가능)</h3>
      {filteredFriends.length === 0 ? (
        <p>초대 가능한 친구가 없습니다.</p>
      ) : (
        <ul className="space-y-2">
          {filteredFriends.map((friend) => (
            <li
              key={friend.id}
              className="flex justify-between items-center px-4 py-2 border rounded bg-gray-50"
            >
              <span>
                {friend.nickname} (@{friend.friendId})
              </span>
              <button
                disabled={!!inviteCooldowns[friend.friendId] || participantCount >= 6}
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
