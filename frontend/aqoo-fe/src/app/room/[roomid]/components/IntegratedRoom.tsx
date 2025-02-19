'use client';

import { connectStompClient, getStompClient } from '@/lib/stompclient';
import axiosInstance from '@/services/axiosInstance';
import { User } from '@/store/authAtom';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import ChatBox from './ChatBox';
import Fish from './Fish';
import FriendList from './FriendList';
import Game from './Game';
import GameA from './GameA';
import GameB from './GameB';
import ParticipantList from './ParticipantList';

import { useSFX } from "@/hooks/useSFX";

interface Player {
  userName: string;
  mainFishImage: string;
  totalPressCount: number;
  nickname: string;
}

type ScreenState = 'chat' | 'game';

interface RoomUpdate {
  roomId: string;
  message: string;
  users?: {
    userName: string;
    ready: boolean;
    isHost: boolean;
    mainFishImage: string;
    nickname: string;
    level: number;
  }[];
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
  userName: string; // 원래 userId (여기서는 userName로 사용)
}

export interface Member {
  userName: string;
  nickname: string;
  mainFishImage: string;
  isHost: boolean;
  ready: boolean;
  level: number;
}

export default function IntegratedRoom({
  roomId,
  userName,
  user,
}: IntegratedRoomProps) {
  const [screen, setScreen] = useState<ScreenState>('chat');
  const [users, setUsers] = useState<Member[]>([]);
  const [gamePlayers, setGamePlayers] = useState<Player[]>([]);
  const [currentIsHost, setCurrentIsHost] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [fishes, setFishes] = useState<FishData[]>([]);
  const [fishMessages, setFishMessages] = useState<{ [key: string]: string }>(
    {}
  );
  const [selectedGame, setSelectedGame] = useState<string>('Game');
  const [showFriendList, setShowFriendList] = useState<boolean>(false);


  const { play: playModal } = useSFX("/sounds/clickeffect-02.mp3"); // 버튼 누를 때때
  const { play: entranceRoom } = useSFX("/sounds/샤라랑.mp3"); // 채팅방입장
  const playHostSound = () => {
    // 호스트용 사운드를 재생하는 코드
    new Audio('/sounds/카운트다운-02.mp3').play();
  };
  
  const playUserSound = () => {
    // 일반 유저용 사운드를 재생하는 코드
    new Audio("/sounds/clickeffect-02.mp3").play();
  };
  


  // 현재 참가자 수
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User>(user);
  const participantCount = users.length;
  const hasSentJoinRef = useRef<boolean>(false);


  // [1] 채팅방 멤버 정보 조회: API (/chatrooms/{roomId})
  useEffect(() => {
    axiosInstance
      .get(`/chatrooms/${roomId}`)
      .then((response) => {
        // 응답이 배열 형태로 전달됨:
        // [ { "userId": "user1", "nickname": "Alice", "mainFishImage": "이미지경로", "isHost": true, "level": 5 }, ... ]
        const updatedUsers = response.data.map((member: any) => ({
          userName: member.userId,
          nickname: member.nickname,
          mainFishImage: member.mainFishImage || '',
          isHost: member.isHost,
          ready: false,
          level: member.level,
        }));
        setUsers(updatedUsers);
      })
      .catch((error) =>
        console.error('❌ 채팅방 멤버 정보 불러오기 실패:', error)
      );
  }, [roomId]);

  // [2] STOMP 연결 활성화 및 메시지 구독
  useEffect(() => {
    connectStompClient(() => {});
  }, []);

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
          hasSentJoinRef.current = true;
        }
        const subscription = client.subscribe(
          `/topic/room/${roomId}`,
          (messageFrame) => {
            const data: RoomUpdate = JSON.parse(messageFrame.body);
            if (data.message === 'GAME_STARTED') {
              setGamePlayers(data.players ?? []);
              setScreen('game');
            } else if (data.message === 'USER_LIST') {
              setUsers(data.users ?? []);
            } else if (data.message === 'USER_KICKED') {
              if (data.targetUser === userName) {
                router.replace('/main?status=kicked');
              } else {
                setUsers((prev) =>
                  prev.filter((u) => u.userName !== data.targetUser)
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

  // [3] displayUsers: API에서 받아온 사용자 정보를 그대로 사용.
  const displayUsers = useMemo(() => users, [users]);

  // [4] Fish 리스트 생성: displayUsers 기반
  useEffect(() => {
    const fishList: FishData[] = displayUsers.map((member, index) => ({
      aquariumId: 0,
      fishId: index,
      fishTypeId: 0,
      fishName: member.nickname,
      fishImage: member.mainFishImage,
      userName: member.userName,
    }));
    setFishes(fishList);
  }, [displayUsers]);

  // [5] 친구 초대 함수
  const inviteFriend = async (memberId: string) => {
    if (participantCount >= 6) {
      const electronAPI = (window as any).electronAPI;
      if (electronAPI && electronAPI.showAlert) {
        electronAPI.showAlert('참가자가 최대 인원(6명)을 초과할 수 없습니다.');
      } else {
        alert('참가자가 최대 인원(6명)을 초과할 수 없습니다.');
      }
      return;
    }
    try {
      const response = await axiosInstance.post('/chatrooms/invite', {
        hostId: userName,
        guestId: memberId,
        roomId,
      });
      if (response.status >= 200 && response.status < 300) {
        const electronAPI = (window as any).electronAPI;
        if (electronAPI && electronAPI.showAlert) {
          electronAPI.showAlert(`${memberId}님을 초대했습니다.`);
        } else {
          alert(`${memberId}님을 초대했습니다.`);
        }
      } else {
        const electronAPI = (window as any).electronAPI;
        if (electronAPI && electronAPI.showAlert) {
          electronAPI.showAlert(`${memberId} 초대에 실패했습니다.`);
        } else {
          alert(`${memberId} 초대에 실패했습니다.`);
        }
      }
    } catch (error) {
      const electronAPI = (window as any).electronAPI;
      if (electronAPI && electronAPI.showAlert) {
        electronAPI.showAlert('초대 도중 오류가 발생했습니다.');
      } else {
        alert('초대 도중 오류가 발생했습니다.');
      }
    }
  };

  // [6] 현재 사용자의 방장 여부 갱신
  useEffect(() => {
    const me = users.find((u) => u.userName === userName);
    setCurrentIsHost(me ? me.isHost : false);
  }, [users, userName]);

  // [7] ready / start 관련 상태 계산
  const myReady = users.find((u) => u.userName === userName)?.ready;
  const nonHostUsers = currentIsHost
    ? users.filter((u) => u.userName !== userName)
    : users.filter((u) => !u.isHost);
  const allNonHostReady =
    nonHostUsers.length === 0 || nonHostUsers.every((u) => u.ready);

  // [8] 게임 종료 후 대기 화면 복귀 콜백
  const handleResultConfirmed = async () => {
    setScreen('chat');
    const client = getStompClient();
    if (client && client.connected) {
      client.publish({
        destination: '/app/chat.clearReady',
        body: JSON.stringify({ roomId, sender: userName }),
      });
    }
    const response = await axiosInstance.get(`/users/${userName}`);
    if (response.status >= 200 && response.status < 300) {
      const updatedUser: User = response.data;
      setCurrentUser(updatedUser);
    }
  };

  // [9] 물고기 말풍선 업데이트
  const handleNewMessage = (sender: string, message: string) => {
    const fishItem = fishes.find((f) => f.userName === sender);
    const key = fishItem ? fishItem.fishName : sender;
    setFishMessages((prev) => ({
      ...prev,
      [key]: message,
    }));
    setTimeout(() => {
      setFishMessages((prev) => ({
        ...prev,
        [key]: '',
      }));
    }, 2000);
  };

  // Helper 함수: 게임에 따른 destination 반환
  const getGameDestination = (game: string) => {
    if (game === 'Game') return '/app/game.start';
    if (game === 'gameA') return '/app/game.start';
    if (game === 'gameB') return '/app/game.start';
    return '/app/game.start';
  };

  // [F5 키 동작 수정: ready/unready 또는 게임 시작 동작, 드롭다운 포함]
  const isRefreshRef = useRef(false);
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'F5') {
        event.preventDefault();
        const client = getStompClient();
        if (!client || !client.connected) return;
        if (currentIsHost) {
          if (allNonHostReady) {
            const destination = getGameDestination(selectedGame);
            client.publish({
              destination,
              body: JSON.stringify({ roomId, gameType: selectedGame }),
            });
          } else {
            alert('아직 준비되지 않은 물고기가 있습니다.');
          }
        } else {
          if (myReady) {
            client.publish({
              destination: '/app/chat.unready',
              body: JSON.stringify({ roomId, sender: userName }),
            });
          } else {
            client.publish({
              destination: '/app/chat.ready',
              body: JSON.stringify({ roomId, sender: userName }),
            });
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [roomId, userName, currentIsHost, myReady, allNonHostReady, selectedGame]);

  // 새로고침 키 감지
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === 'F5' ||
        (event.ctrlKey && event.key.toLowerCase() === 'r') ||
        (event.metaKey && event.key.toLowerCase() === 'r')
      ) {
        isRefreshRef.current = true;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isRefreshRef.current) {
        const client = getStompClient();
        if (client && client.connected) {
          client.publish({
            destination: '/app/chat.leaveRoom',
            body: JSON.stringify({ roomId, sender: userName }),
          });
        }
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [roomId, userName]);

  return (
    <>
      {!isConnected ? (
        <div className='min-h-screen flex items-center justify-center bg-gray-100 p-6 opacity-10'>
          <p className='text-2xl font-bold text-gray-900'>로딩중...</p>
        </div>
      ) : (
        <>
          {screen === 'chat' && (
            <div
              className='relative w-full h-full min-h-screen flex items-center justify-center bg-gray-100 overflow-hidden'
              style={{
                backgroundImage: "url('/chat_images/background.png')",
                backgroundSize: 'cover',
                backgroundAttachment: 'fixed',
                backgroundPosition: 'center',
              }}
            >
              {/* 물고기 렌더링, 말풍선 표시 */}
              {fishes.map((fish) => (
                <Fish
                  key={fish.fishId}
                  fish={fish}
                  message={fishMessages[fish.fishName] || ''}
                />
              ))}

              {/* 오른쪽 패널 */}
              <div className='absolute top-24 right-16 flex flex-col space-y-4'>
                {/* 친구 목록 오버레이는 "친구 초대" 버튼의 왼쪽에 나타남 */}
                <div className='flex flex-col space-y-4 w-[370px] items-center'>
                  <div className='flex space-x-2 w-full'>
                    {/* 친구 초대 버튼을 감싸는 영역을 relative로 처리 */}
                    <div className='relative w-1/2'>
                      <button
                        onClick={() => {
                          playModal();
                          setShowFriendList((prev) => !prev)}}
                        className='w-full px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-center'
                      >
                        친구 초대
                      </button>
                      {showFriendList && (
                        <div className='absolute right-full top-0 mr-2 w-[320px] h-[550px] bg-white/70 shadow-md p-4 rounded-lg'>
                          <div className='relative h-full'>
                            {/* FriendList 컴포넌트 */}
                            <FriendList
                              userName={userName}
                              roomId={roomId}
                              isHost={currentIsHost}
                              participantCount={users.length}
                              users={displayUsers}
                              onInvite={(memberId) => {
                                if (users.length >= 6) {
                                  const electronAPI = (window as any)
                                    .electronAPI;
                                  if (electronAPI && electronAPI.showAlert) {
                                    electronAPI.showAlert(
                                      '참가자가 최대 인원(6명)을 초과할 수 없습니다.'
                                    );
                                  } else {
                                    alert(
                                      '참가자가 최대 인원(6명)을 초과할 수 없습니다.'
                                    );
                                  }
                                  return;
                                }
                                inviteFriend(memberId);
                              }}
                            />
                            {/* 닫기 버튼이 FriendList 내부 우측 상단에 위치 */}
                            <button
                              onClick={() => {
                                playModal();
                                setShowFriendList(false)}}
                              className='absolute top-2 right-2 text-gray-500 hover:text-black'
                            >
                              ❌
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        playModal();
                        const client = getStompClient();
                        if (client && client.connected) {
                          client.publish({
                            destination: '/app/chat.leaveRoom',
                            body: JSON.stringify({ roomId, sender: userName }),
                          });
                          router.replace('/main');
                        }
                      }}
                      className='w-1/2 px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors text-center'
                    >
                      나가기
                    </button>
                  </div>

                  <div>
                    <ParticipantList
                      users={displayUsers}
                      currentUser={currentUser}
                      currentIsHost={currentIsHost}
                      onKickUser={(target) => {
                        const client = getStompClient();
                        if (client && client.connected) {
                          client.publish({
                            destination: '/app/chat.kickUser',
                            body: JSON.stringify({
                              roomId,
                              targetUser: target,
                              sender: userName,
                            }),
                          });
                        }
                      }}
                    />
                  </div>

                  <div className='p-3 bg-white/70 rounded shadow-md w-full'>
                    <ChatBox
                      roomId={roomId}
                      users={displayUsers}
                      currentUser={currentUser}
                      onNewMessage={handleNewMessage}
                    />
                  </div>

                  {/* 드롭다운과 게임 시작 버튼 영역 */}
                  <div className='w-full flex flex-col items-center space-y-2'>
                    <>
                      <select
                        value={selectedGame}
                        onChange={(e) =>
                          currentIsHost && setSelectedGame(e.target.value)
                        }
                        className='w-full px-4 py-2 border rounded'
                        disabled={!currentIsHost}
                      >
                        <option value='Game'>Game</option>
                        <option value='gameA'>Game A</option>
                        <option value='gameB'>Game B</option>
                      </select>
                      <button
  onClick={() => {
    // 조건에 따라 다른 사운드를 재생합니다.
    if (currentIsHost) {
      playHostSound(); // "Start Game(F5)" 사운드
    } else {
      playUserSound(); // "Ready(F5)" 또는 "Unready(F5)" 사운드
    }

    // 기존 로직 실행
    const client = getStompClient();
    if (client && client.connected) {
      if (currentIsHost) {
        const destination = getGameDestination(selectedGame);
        client.publish({
          destination,
          body: JSON.stringify({
            roomId,
            gameType: selectedGame,
          }),
        });
      } else {
        client.publish({
          destination: myReady ? '/app/chat.unready' : '/app/chat.ready',
          body: JSON.stringify({
            roomId,
            sender: userName,
          }),
        });
      }
    }
  }}
  className={`w-full px-6 py-3 bg-yellow-300 text-white text-xl rounded ${
    currentIsHost && !allNonHostReady ? 'opacity-50 cursor-not-allowed' : ''
  }`}
  disabled={currentIsHost ? !allNonHostReady : false}
>
  {currentIsHost
    ? 'Start Game(F5)'
    : myReady
    ? 'Unready(F5)'
    : 'Ready(F5)'}
</button>

                    </>
                  </div>
                </div>
              </div>
            </div>
          )}

          {screen === 'game' && (
            <div className='w-full h-screen bg-cover bg-center'>
              {selectedGame === 'Game' ? (
                <Game
                  roomId={roomId}
                  userName={userName}
                  initialPlayers={gamePlayers}
                  onResultConfirmed={handleResultConfirmed}
                  user={currentUser}
                />
              ) : selectedGame === 'gameA' ? (
                <GameA
                  roomId={roomId}
                  userName={userName}
                  initialPlayers={gamePlayers}
                  onResultConfirmed={handleResultConfirmed}
                  user={currentUser}
                />
              ) : selectedGame === 'gameB' ? (
                <GameB
                  roomId={roomId}
                  userName={userName}
                  initialPlayers={gamePlayers}
                  onResultConfirmed={handleResultConfirmed}
                  user={currentUser}
                />
              ) : null}
            </div>
          )}
        </>
      )}
    </>
  );
}
