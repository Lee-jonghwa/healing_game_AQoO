'use client';

import { connectStompClient, getStompClient } from '@/lib/stompclient';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import ChatBox from './ChatBox';
import Game from './Game';
import ParticipantList from './ParticipantList';
import FriendList from './FriendList';
import Fish from "./Fish"
import { User } from '@/store/authAtom';

interface Player {
  userName: string;
  mainFishImage: string;
  totalPressCount: number;
}

type ScreenState = 'chat' | 'game';

interface RoomUpdate {
  roomId: string;
  message: string;
  users?: { userName: string; ready: boolean; isHost: boolean; mainFishImage: string }[];
  players?: Player[];
  targetUser?: string;
}

interface IntegratedRoomProps {
  roomId: string;
  userName: string;
  user: User;
}

interface FishData {
  aquariumId: number;
  fishId: number;
  fishTypeId: number;
  fishName: string;
  fishImage: string;
}

export default function IntegratedRoom({ roomId, userName, user }: IntegratedRoomProps) {
  const [screen, setScreen] = useState<ScreenState>('chat');
  const [users, setUsers] = useState<{ userName: string; ready: boolean; isHost: boolean; mainFishImage: string }[]>([]);
  const [gamePlayers, setGamePlayers] = useState<Player[]>([]);
  const [currentIsHost, setCurrentIsHost] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [showFriendList, setShowFriendList] = useState(false);
  const hasSentJoinRef = useRef(false);
  const router = useRouter();
  const [fishes, setFishes] = useState<FishData[]>([]);

  console.log("IntegratedRoom currentUser:", user);

  const participantCount = users.length;

  const displayUsers =
    currentIsHost && !users.some((u) => u.userName === userName)
      ? [...users, { userName, ready: false, isHost: true, mainFishImage: '' }]
      : users;

  useEffect(() => {
    connectStompClient(() => {
      console.log('STOMP client activated from IntegratedRoom.');
    });
  }, []);

  useEffect(() => {
    const fishList: FishData[] = displayUsers
      .filter((user) => user.mainFishImage)
      .map((user, index) => ({
        aquariumId: 0,
        fishId: index,
        fishTypeId: 0,
        fishName: user.userName,
        fishImage: user.mainFishImage,
      }));
    setFishes(fishList);
  }, [displayUsers]);

  useEffect(() => {
    const client = getStompClient();
    if (!client) return;

    const intervalId = setInterval(() => {
      if (client.connected) {
        setIsConnected(true);
        if (!hasSentJoinRef.current) {
          const joinMessage = { roomId, sender: userName };
          client.publish({
            destination: '/app/chat.joinRoom',
            body: JSON.stringify(joinMessage),
          });
          console.log('Join room message sent:', joinMessage);
          hasSentJoinRef.current = true;
        }
        const subscription = client.subscribe(`/topic/room/${roomId}`, (message) => {
          const data: RoomUpdate = JSON.parse(message.body);
          console.log('Room update received:', data);
          if (data.message === 'GAME_STARTED') {
            setGamePlayers(data.players ?? []);
            setScreen('game');
          } else if (data.message === 'USER_LIST') {
            console.log("data.users:", data.users);
            setUsers(data.users ?? []);
          } else if (data.message === 'USER_KICKED') {
            if (data.targetUser === userName) {
              router.replace('/main?status=kicked');
            } else {
              setUsers((prevUsers) => prevUsers.filter((u) => u.userName !== data.targetUser));
            }
          }
        });
        clearInterval(intervalId);
        return () => subscription.unsubscribe();
      }
    }, 500);

    return () => clearInterval(intervalId);
  }, [roomId, userName, router]);

  const inviteFriend = async (friendUserId: string) => {
    if (participantCount >= 6) {
      alert('참가자가 최대 인원(6명)을 초과할 수 없습니다.');
      return;
    }
    
    try {
      const response = await fetch("https://i12e203.p.ssafy.io/api/v1/chatrooms/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          hostId: userName,
          guestId: friendUserId,
          roomId: roomId,
        }),
      });
      if (!response.ok) {
        console.error(`Invitation failed for ${friendUserId}`);
        alert(`${friendUserId} 초대에 실패했습니다.`);
      } else {
        console.log(`Invitation succeeded for ${friendUserId}`);
        alert(`${friendUserId}님을 초대했습니다.`);
      }
    } catch (error) {
      console.error("Error inviting friend", error);
      alert("초대 도중 오류가 발생했습니다.");
    }
  };

  useEffect(() => {
    const me = users.find((u) => u.userName === userName);
    setCurrentIsHost(me ? me.isHost : false);
  }, [users, userName]);

  const clearReadyAndExit = () => {
    const client = getStompClient();
    if (client && client.connected) {
      client.publish({
        destination: '/app/chat.clearReady',
        body: JSON.stringify({ roomId, sender: userName }),
      });
      console.log('Clear ready status message sent');
    } else {
      console.error('STOMP client is not connected yet.');
    }
    setScreen('chat');
  };

  return (
    <>
      {screen === 'chat' && (
        <div>
          {/* 친구 초대 버튼 */}
          <button onClick={() => setShowFriendList((prev) => !prev)}>친구 초대</button>

          {/* ✅ 친구 목록에서 참가자를 제외하여 전달 */}
          {showFriendList && (
            <FriendList
              userName={userName}
              roomId={roomId}
              isHost={currentIsHost}
              participantCount={users.length}
              participants={users} // ✅ 참가자 목록 전달
              onInvite={(friendId) => {
                if (users.length >= 6) {
                  alert('참가자가 최대 인원(6명)을 초과할 수 없습니다.');
                  return;
                }
                inviteFriend(friendId);
              }}
            />
          )}
        </div>
      )}

      {screen === 'game' && (
        <Game
          roomId={roomId}
          userName={userName}
          initialPlayers={gamePlayers}
          onResultConfirmed={clearReadyAndExit} // ✅ 게임 종료 후 ready 해제 후 채팅방 이동
          user={user}
        />
      )}
    </>
  );
}
