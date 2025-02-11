'use client';

import { connectStompClient, getStompClient } from '@/lib/stompclient';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import ChatBox from './chatbox';
import Game from './game';

// 플레이어 타입 정의 (Game 컴포넌트와 동일한 구조)
interface Player {
  userName: string;
  totalPressCount: number;
}

type ScreenState = 'chat' | 'game';

interface RoomUpdate {
  roomId: string;
  message: string;
  // 게임 관련 메시지와 함께 유저 목록 업데이트용 필드 (채팅방 사용자용)
  users?: { userName: string; ready: boolean; isHost: boolean }[];
  // GAME_STARTED 메시지의 경우 players 필드가 포함됨
  players?: Player[];
  // 추방 메시지 전송 시 대상 사용자를 지정하기 위한 필드
  targetUser?: string;
}

interface IntegratedRoomProps {
  roomId: string; // 예: "e0ec13d4-9101-4ae0-a22f-681b8c0fe32f"
  userName: string;
}

// 친구 관계 API 응답에 맞춘 Friend 인터페이스 정의
interface Friend {
  id: number; // 친구 관계 아이디
  friendId: string;
  nickname: string;
  level: number;
  mainFishImage: string | null;
}

export default function IntegratedRoom({ roomId, userName }: IntegratedRoomProps) {
  const [screen, setScreen] = useState<ScreenState>('chat');
  const [users, setUsers] = useState<
    { userName: string; ready: boolean; isHost: boolean }[]
  >([]);
  const [gamePlayers, setGamePlayers] = useState<Player[]>([]); // 게임 시작 시 사용할 플레이어 목록
  const [currentIsHost, setCurrentIsHost] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]); // 친구 목록 상태
  // 초대 후 재초대까지 남은 시간을 friendId별로 관리 (초 단위)
  const [inviteCooldowns, setInviteCooldowns] = useState<{ [key: string]: number }>({});
  const hasSentJoinRef = useRef(false);
  const router = useRouter();

  // userName이 없을 경우 랜덤 이름 생성 후 URL 업데이트 (리다이렉트)
  useEffect(() => {
    if (!userName || userName.trim() === '') {
      const randomUserName = `User${Math.floor(Math.random() * 10000)}`;
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set('userName', randomUserName);
      router.replace(currentUrl.toString());
    }
  }, [userName, router]);

  // STOMP 연결 활성화
  useEffect(() => {
    connectStompClient(() => {
      console.log('STOMP client activated from IntegratedRoom.');
    });
  }, []);

  // join 메시지 전송 및 구독 설정 (client 연결 후)
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
        const subscription = client.subscribe(
          `/topic/room/${roomId}`,
          (message) => {
            const data: RoomUpdate = JSON.parse(message.body);
            console.log('Room update received:', data);
            if (data.message === 'GAME_STARTED') {
              setGamePlayers(data.players ?? []);
              setScreen('game');
            } else if (data.message === 'USER_LIST') {
              setUsers(data.users ?? []);
            } else if (data.message === 'USER_KICKED') {
              if (data.targetUser === userName) {
                router.push('/room?status=kicked');
              } else {
                setUsers((prevUsers) =>
                  prevUsers.filter((u) => u.userName !== data.targetUser)
                );
              }
            }
          }
        );
        clearInterval(intervalId);
        return () => subscription.unsubscribe();
      }
    }, 500);

    return () => clearInterval(intervalId);
  }, [roomId, userName, router]);

  // 매번 users 업데이트 시 현재 사용자의 isHost 값 갱신
  useEffect(() => {
    const me = users.find((u) => u.userName === userName);
    setCurrentIsHost(me ? me.isHost : false);
  }, [users, userName]);

  // 디버깅: 상태 업데이트 시 사용자 정보 출력
  useEffect(() => {
    console.log('Updated users:', users);
    users.forEach((user) =>
      console.log(
        `User ${user.userName}: isHost = ${user.isHost}, ready = ${user.ready}`
      )
    );
  }, [users]);

  // 친구 목록을 불러오는 useEffect (방장일 때만)
  useEffect(() => {
    if (currentIsHost) {
      fetch(`https://i12e203.p.ssafy.io/api/v1/friends/${encodeURIComponent(userName)}`)
        .then((response) => {
          if (!response.ok) {
            throw new Error('Friend list fetch failed');
          }
          console.log('친구목록 불러오기 API 호출');
          return response.json();
        })
        .then((data) => {
          // data는 { count: number, friends: Friend[] } 형태로 넘어옴
          setFriends(data.friends);
        })
        .catch((error) => {
          console.error('Failed to fetch friend list', error);
        });
    }
  }, [currentIsHost, userName]);

  // 초대 버튼 클릭 시 처리 및 해당 친구에 대해 10초 동안 버튼 비활성화
  const inviteFriend = async (friendUserId: string) => {
    try {
      const response = await fetch("https://i12e203.p.ssafy.io/api/v1/chatrooms/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          hostId: userName, // 방장(초대한 사람)
          guestId: friendUserId, // 초대받을 친구 (friend.friendId)
          roomId: roomId,
        }),
      });
      if (!response.ok) {
        console.error(`Invitation failed for ${friendUserId}`);
        alert(`${friendUserId} 초대에 실패했습니다.`);
      } else {
        console.log(`Invitation succeeded for ${friendUserId}`);
        alert(`${friendUserId}님을 초대했습니다.`);
        // 초대 성공 시 10초 동안 해당 친구 버튼 비활성화 (재초대 금지)
        setInviteCooldowns((prev) => ({ ...prev, [friendUserId]: 10 }));
      }
    } catch (error) {
      console.error("Error inviting friend", error);
      alert("초대 도중 오류가 발생했습니다.");
    }
  };

  // 초대 후 남은 시간을 매초 업데이트하는 타이머 효과
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

  // 게임 종료 후 대기 화면으로 복귀 시 호출될 콜백
  const handleResultConfirmed = () => {
    setScreen('chat');
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
  };

  // "채팅방 나가기" 버튼 클릭 시 처리 함수
  const handleLeave = () => {
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
  };

  // 방장이 다른 사용자를 추방하는 함수
  const handleKickUser = (targetUser: string) => {
    const client = getStompClient();
    if (client && client.connected) {
      client.publish({
        destination: '/app/chat.kickUser',
        body: JSON.stringify({ roomId, targetUser, sender: userName }),
      });
      console.log('Kick user message sent for:', targetUser);
    } else {
      console.error('STOMP client is not connected yet.');
    }
  };

  // 현재 사용자의 Ready 상태
  const myReady = users.find((u) => u.userName === userName)?.ready;

  // 방장의 Start 버튼 활성화 조건: 방장이 아닐 경우 자신의 기록은 제외한 나머지 사용자가 모두 Ready여야 함
  const nonHostUsers = currentIsHost
    ? users.filter((u) => u.userName !== userName)
    : users.filter((u) => !u.isHost);
  const allNonHostReady =
    nonHostUsers.length === 0 || nonHostUsers.every((u) => u.ready);

  // 렌더링할 사용자 목록: 현재 사용자가 방장인데, 목록에 없다면 추가
  const displayUsers =
    currentIsHost && !users.some((u) => u.userName === userName)
      ? [...users, { userName, ready: false, isHost: true }]
      : users;

  // 초대 가능한 친구 목록: 이미 방에 들어온 친구(userName === friend.friendId)는 제외
  const availableFriends = friends.filter(
    (friend) => !users.some((u) => u.userName === friend.friendId)
  );

  return (
    <>
      {!isConnected ? (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
          <p className="text-2xl font-bold text-gray-900">로딩중...</p>
        </div>
      ) : (
        <>
          {screen === 'chat' && (
            <div className="max-w-2xl mx-auto p-6 bg-white rounded shadow text-center">
              <h2 className="text-3xl font-bold mb-4 text-gray-900">채팅방</h2>
              <p className="mb-4 text-lg text-gray-900">
                Logged in as: <strong>{userName}</strong>{' '}
                {currentIsHost && <span className="ml-2 text-red-600">(방장)</span>}
              </p>

              {/* 채팅방 참여 목록 */}
              <div className="my-6">
                <h3 className="text-xl font-semibold mb-2 text-gray-900">
                  채팅방 참여 목록
                </h3>
                <ul className="space-y-2">
                  {displayUsers.map((user) => (
                    <li
                      key={user.userName}
                      className="flex justify-between items-center px-4 py-2 border rounded bg-gray-50"
                    >
                      <div className="flex items-center">
                        <span className="text-gray-900 font-medium">
                          {user.userName}{' '}
                          {user.isHost && (
                            <span className="ml-1 text-sm font-bold text-red-600">(방장)</span>
                          )}
                        </span>
                        {currentIsHost && user.userName !== userName && (
                          <button
                            onClick={() => handleKickUser(user.userName)}
                            className="ml-2 px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                          >
                            추방
                          </button>
                        )}
                      </div>
                      {user.ready && <span className="text-green-700 font-bold">Ready</span>}
                    </li>
                  ))}
                </ul>
              </div>

              {/* 방장 전용 친구 목록 (초대 기능) */}
              {currentIsHost && (
                <div className="mt-6">
                  <h3 className="text-xl font-semibold mb-2">친구 목록 (초대 가능)</h3>
                  {availableFriends.length === 0 ? (
                    <p>초대 가능한 친구가 없습니다.</p>
                  ) : (
                    <ul className="space-y-2">
                      {availableFriends.map((friend) => (
                        <li
                          key={friend.id}
                          className="flex justify-between items-center px-4 py-2 border rounded bg-gray-50"
                        >
                          <span>
                            {friend.nickname} (@{friend.friendId})
                          </span>
                          <button
                            disabled={!!inviteCooldowns[friend.friendId]}
                            onClick={() => inviteFriend(friend.friendId)}
                            className="ml-2 px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50"
                          >
                            {inviteCooldowns[friend.friendId]
                              ? `초대 (${inviteCooldowns[friend.friendId]}초)`
                              : '초대'}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* 채팅 영역 */}
              <ChatBox roomId={roomId} userName={userName} />

              {/* 버튼 영역 */}
              <div className="mt-6 flex flex-col items-center space-y-4">
                {currentIsHost ? (
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
                {/* 채팅방 나가기 버튼 */}
                <button
                  onClick={handleLeave}
                  className="w-full px-6 py-3 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                >
                  Leave Chat Room
                </button>
              </div>

              {currentIsHost ? (
                <p className="mt-4 text-base text-gray-800">
                  {allNonHostReady
                    ? 'Start Game 버튼을 누르면 게임을 시작할 수 있습니다.'
                    : '참가자들이 모두 Ready 하여야 시작할 수 있습니다.'}
                </p>
              ) : (
                <p className="mt-4 text-base text-gray-800">
                  {myReady
                    ? 'Unready 버튼을 눌러 준비를 취소할 수 있습니다.'
                    : 'Ready 버튼을 눌러 게임 준비를 할 수 있습니다.'}
                </p>
              )}
            </div>
          )}

          {screen === 'game' && (
            <div
            className="min-h-screen w-full bg-cover bg-center p-6"
            style={{ backgroundImage: "url('/images/game_background.png')" }}
            >
              <Game
                roomId={roomId}
                userName={userName}
                initialPlayers={gamePlayers}
                onResultConfirmed={handleResultConfirmed}
              />
            </div>
          )}
        </>
      )}
    </>
  );
}
