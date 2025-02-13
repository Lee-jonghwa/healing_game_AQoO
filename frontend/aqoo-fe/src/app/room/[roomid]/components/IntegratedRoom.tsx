'use client';

import { connectStompClient, getStompClient } from '@/lib/stompclient';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import ChatBox from './ChatBox';
import Game from './game';
import ParticipantList from './ParticipantList';
import FriendList from './FriendList';
import { gsap } from "gsap";

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

interface FishData {
  aquariumId: number;
  fishId: number;
  fishTypeId: number;
  fishName: string;
  fishImage: string;
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
  const [fishes, setFishes] = useState<FishData[]>([]);

  // 사용자 목록 상태 및 displayUsers 선언
  const displayUsers =
    currentIsHost && !users.some((u) => u.userName === userName)
      ? [...users, { userName, ready: false, isHost: true, mainFishImage: '' }]
      : users;

  function Fish({ fish }: { fish: FishData }) {
    const fishRef = useRef<HTMLImageElement | null>(null);
    const directionRef = useRef(1);

    const handleClick = () => {
      if (!fishRef.current) return;
      gsap.to(fishRef.current, {
        scale: 0.9,
        duration: 0.15,
        ease: "power1.inOut",
        yoyo: true,
        repeat: 1,
      });
    };

    useEffect(() => {
      if (!fishRef.current) return;

      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      // 안전 범위 (필요하다면 줄이거나 제거)
      const safeMargin = 80;
      const bottomMargin = 100;
      const upperLimit = windowHeight * 0.2;

      // 시작 위치 설정
      const randomStartX = Math.random() * (windowWidth - 2 * safeMargin) + safeMargin;
      const randomStartY = Math.random() * (windowHeight - bottomMargin - 50) + 50;

      gsap.set(fishRef.current, {
        x: randomStartX,
        y: randomStartY,
        scaleX: -1,
      });

      const moveFish = () => {
        if (!fishRef.current) return;
        const randomSpeed = Math.random() * 7 + 9;
        const maxMoveX = windowWidth * (0.4 + Math.random() * 0.4);
        let moveDistanceX = maxMoveX * (Math.random() > 0.5 ? 1 : -1);

        const currentY = parseFloat(gsap.getProperty(fishRef.current, "y") as string);
        let moveDistanceY = windowHeight * (0.1 + Math.random() * 0.15) * (Math.random() > 0.65 ? 1 : -1);

        if (currentY < upperLimit) {
          moveDistanceY = windowHeight * (0.1 + Math.random() * 0.2);
        }

        let newX = parseFloat(gsap.getProperty(fishRef.current, "x") as string) + moveDistanceX;
        let newY = currentY + moveDistanceY;

        // 경계 체크
        if (newX < safeMargin) {
          newX = safeMargin + Math.random() * 50;
          moveDistanceX = Math.abs(moveDistanceX);
        }
        if (newX > windowWidth - safeMargin) {
          newX = windowWidth - safeMargin - Math.random() * 50;
          moveDistanceX = -Math.abs(moveDistanceX);
        }
        if (newY < 50) newY = 50 + Math.random() * 30;
        if (newY > windowHeight - bottomMargin) {
          newY = windowHeight - bottomMargin - Math.random() * 30;
        }

        directionRef.current = moveDistanceX > 0 ? -1 : 1;

        gsap.to(fishRef.current, {
          x: newX,
          y: newY,
          scaleX: directionRef.current,
          duration: randomSpeed,
          ease: "power2.inOut",
          onUpdate: () => {
            const prevX = parseFloat(gsap.getProperty(fishRef.current, "x") as string);
            directionRef.current = newX > prevX ? -1 : 1;
            gsap.set(fishRef.current, { scaleX: directionRef.current });
          },
          onComplete: moveFish,
        });
      };

      moveFish();
    }, []);

    return (
      <img
        ref={fishRef}
        src={fish.fishImage}
        alt={fish.fishName}
        width={128}
        height={128}
        className="absolute"
        style={{ zIndex: 9999 }}
        onClick={handleClick}
      />
    );
  }

  // STOMP 연결 활성화
  useEffect(() => {
    connectStompClient(() => {
      console.log('STOMP client activated from IntegratedRoom.');
    });
  }, []);

  // 참가자 대표 물고기 -> fishes 배열 업데이트
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

  // 현재 사용자의 방장 여부 갱신
  useEffect(() => {
    const me = users.find((u) => u.userName === userName);
    setCurrentIsHost(me ? me.isHost : false);
  }, [users, userName]);

  // 디버깅
  useEffect(() => {
    console.log('Updated users:', users);
    users.forEach((user) =>
      console.log(`User ${user.userName}: isHost = ${user.isHost}, ready = ${user.ready}`)
    );
  }, [users]);

  // ready / start 관련 상태 계산
  const myReady = users.find((u) => u.userName === userName)?.ready;
  const nonHostUsers = currentIsHost
    ? users.filter((u) => u.userName !== userName)
    : users.filter((u) => !u.isHost);
  const allNonHostReady = nonHostUsers.length === 0 || nonHostUsers.every((u) => u.ready);

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
                backgroundImage: "url('/chat_images/background.png')",
                backgroundSize: "cover",
                backgroundAttachment: "fixed",
                backgroundPosition: "center"
              }}
            >
              {/* 🐠 물고기 렌더링을 가장 상위 컨테이너에 배치 */}
              {fishes.map((fish) => (
                <Fish key={fish.fishId} fish={fish} />
              ))}

              <div className="absolute inset-0 bg-white opacity-20"></div>

              {/* 나가기 버튼 + 친구 초대 버튼 + 참가자 리스트 (오른쪽 상단) */}
              <div className="absolute top-20 right-[110px] w-[250px]">
                <div className="relative inline-block">
                  <div className="flex space-x-2 mb-2">
                    <button
                      onClick={() => setShowFriendList((prev) => !prev)}
                      className="w-40 px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors whitespace-nowrap text-center"
                    >
                      친구 초대
                    </button>
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
                  {showFriendList && (
                    <div className="absolute top-0 right-full mr-2 w-[300px] bg-white shadow-md p-4 rounded-lg">
                      <button
                        onClick={() => setShowFriendList(false)}
                        className="absolute top-2 right-2 text-gray-600 hover:text-black"
                      >
                        ❌
                      </button>
                      <FriendList
                        userName={userName}
                        roomId={roomId}
                        isHost={currentIsHost}
                        onInvite={inviteFriend}
                      />
                    </div>
                  )}
                </div>

                <ParticipantList
                  users={displayUsers}
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

              {/* Ready / Start 버튼 영역 */}
              <div className="absolute bottom-2 right-8 w-[330px]">
                <div className="mt-6 flex flex-col items-center space-y-4">
                  {currentIsHost ? (
                    <button
                      onClick={() => {
                        if (!allNonHostReady) {
                          console.warn("Not all non-host users are ready yet.");
                          return;
                        }
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
                      className={`w-full px-6 py-3 bg-green-600 text-white rounded hover:bg-green-700 transition-colors ${
                        allNonHostReady ? '' : 'opacity-50 cursor-not-allowed'
                      }`}
                      disabled={!allNonHostReady}
                    >
                      Start Game
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        const client = getStompClient();
                        if (client && client.connected) {
                          if (myReady) {
                            client.publish({
                              destination: '/app/chat.unready',
                              body: JSON.stringify({ roomId, sender: userName }),
                            });
                            console.log('Unready message sent');
                          } else {
                            client.publish({
                              destination: '/app/chat.ready',
                              body: JSON.stringify({ roomId, sender: userName }),
                            });
                            console.log('Ready message sent');
                          }
                        } else {
                          console.error('STOMP client is not connected yet.');
                        }
                      }}
                      className="w-full px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                      {myReady ? 'Unready' : 'Ready'}
                    </button>
                  )}
                </div>
              </div>
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
