'use client';

import { connectStompClient, getStompClient } from '@/lib/stompclient';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import ChatBox from './ChatBox';
import Game from './game';
import ParticipantList from './ParticipantList';
import FriendList from './FriendList';

// 플레이어 타입 정의
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
}

export default function IntegratedRoom({ roomId, userName }: IntegratedRoomProps) {
  const [screen, setScreen] = useState<ScreenState>('chat');
  const [users, setUsers] = useState<{ userName: string; ready: boolean; isHost: boolean; mainFishImage: string }[]>([]);
  const [gamePlayers, setGamePlayers] = useState<Player[]>([]);
  const [currentIsHost, setCurrentIsHost] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [showFriendList, setShowFriendList] = useState(false);
  const hasSentJoinRef = useRef(false);
  const router = useRouter();

  // STOMP 연결 활성화
  useEffect(() => {
    connectStompClient(() => {
      console.log('STOMP client activated from IntegratedRoom.');
    });
  }, []);

  // join 메시지 전송 및 구독 설정
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
              router.push('/room?status=kicked');
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

  // 현재 사용자의 방장 여부 갱신
  useEffect(() => {
    const me = users.find((u) => u.userName === userName);
    setCurrentIsHost(me ? me.isHost : false);
  }, [users, userName]);

  // 친구 초대 함수
  const inviteFriend = async (friendUserId: string) => {
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

  return (
    <>
      {!isConnected ? (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6 opacity-10">
          <p className="text-2xl font-bold text-gray-900">로딩중...</p>
        </div>
      ) : (
        <>
          {screen === 'chat' && (
            <div 
              className="relative w-full h-full min-h-screen flex items-center justify-center bg-gray-100"
              style={{ 
                backgroundImage: "url('/chat_images/background.png')" ,
                backgroundSize: "cover",
                backgroundAttachment: "fixed",
                backgroundPosition: "center"
              }}
            >
            <div className="absolute inset-0 bg-white opacity-20"></div>

              {/* 나가기 버튼 + 친구 초대 버튼 + 참가자 리스트 (오른쪽 상단) */}
              <div className="absolute top-20 right-[110px] w-[250px]">
                {/* 친구 초대 버튼과 목록을 감싸는 relative 컨테이너 */}
                <div className="relative inline-block">
                  <div className="flex space-x-2 mb-2">
                    {/* 친구 초대 버튼 */}
                    <button 
                      onClick={() => setShowFriendList((prev) => !prev)} 
                      className="w-40 px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors whitespace-nowrap text-center"
                    >
                      친구 초대
                    </button>

                    {/* 나가기 버튼 */}
                    <button 
                      onClick={() => {
                        const client = getStompClient();
                        if (client && client.connected) {
                          client.publish({
                            destination: '/app/chat.leaveRoom',
                            body: JSON.stringify({ roomId, sender: userName }),
                          });
                          console.log('Leave room message sent');
                          router.push('/room');
                        } else {
                          console.error('STOMP client is not connected yet.');
                        }
                      }} 
                      className="w-40 px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors whitespace-nowrap text-center"
                    >
                      나가기
                    </button>

                  </div>
                  {/* 친구 초대 목록 - 버튼의 왼쪽에 나타나도록 설정 */}
                  {showFriendList && (
                    <div className="absolute top-0 right-full mr-2 w-[300px] bg-white shadow-md p-4 rounded-lg">
                      <button 
                        onClick={() => setShowFriendList(false)} 
                        className="absolute top-2 right-2 text-gray-600 hover:text-black"
                      >
                        ❌
                      </button>
                      <FriendList userName={userName} roomId={roomId} isHost={currentIsHost} onInvite={inviteFriend} />
                    </div>
                  )}
                </div>

                {/* 참가자 리스트 */}
                <ParticipantList 
                  users={users} 
                  currentUser={userName} 
                  currentIsHost={currentIsHost} 
                  onKickUser={(target) => {
                    const client = getStompClient();
                    if (client && client.connected) {
                      client.publish({
                        destination: '/app/chat.kickUser',
                        body: JSON.stringify({ roomId, targetUser: target, sender: userName }),
                      });
                      console.log('Kick user message sent for:', target);
                    } else {
                      console.error('STOMP client is not connected yet.');
                    }
                  }} 
                />
              </div>

              {/* 채팅창 + 입력 필드 */}
              <div className="absolute top-[300px] right-8 w-[330px] p-3 bg-white rounded shadow-md">
                <ChatBox roomId={roomId} userName={userName} />
              </div>

              {currentIsHost && (
                <button 
                  onClick={() => {
                    const client = getStompClient();
                    if (client && client.connected) {
                      client.publish({
                        destination: '/app/game.start',
                        body: JSON.stringify({ roomId }),
                      });
                      console.log('Game start message sent');
                    } else {
                      console.error('STOMP client is not connected yet.');
                    }
                  }} 
                  className="absolute bottom-2 right-8 w-[330px] px-6 py-3 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                >
                  Start Game
                </button>
              )}

            </div>
          )}
          {screen === 'game' && (
            <div className="w-full h-screen bg-cover bg-center">
            <Game
              roomId={roomId}
              userName={userName}
              initialPlayers={gamePlayers}
              onResultConfirmed={() => setScreen('chat')}
            />
          </div>
          )}

        </>
      )}
    </>
  );
}
