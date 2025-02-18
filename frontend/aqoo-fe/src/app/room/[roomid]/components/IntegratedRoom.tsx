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
import ParticipantList from './ParticipantList';

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
  users?: {
    userName: string;
    ready: boolean;
    isHost: boolean;
    mainFishImage: string;
    nickname: string;
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

interface Friend {
  id: number;
  friendId: string;
  nickname: string;
  level: number;
  mainFishImage: string | null;
}

export default function IntegratedRoom({
  roomId,
  userName,
  user,
}: IntegratedRoomProps) {
  const [screen, setScreen] = useState<ScreenState>('chat');
  // 백엔드 API에서 받아올 채팅방 멤버 정보: userName, nickname, mainFishImage, isHost, ready (기본 false)
  const [users, setUsers] = useState<
    {
      userName: string;
      nickname: string;
      mainFishImage: string;
      isHost: boolean;
      ready: boolean;
    }[]
  >([]);
  const [gamePlayers, setGamePlayers] = useState<Player[]>([]);
  const [currentIsHost, setCurrentIsHost] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [showFriendList, setShowFriendList] = useState(false);
  const hasSentJoinRef = useRef(false);
  const router = useRouter();
  const [fishes, setFishes] = useState<FishData[]>([]);
  const [fishMessages, setFishMessages] = useState<{ [key: string]: string }>(
    {}
  );

  // 친구 목록은 여전히 별도로 조회 (현재 사용자가 친구인 경우 nickname 갱신 용도)
  const [friendList, setFriendList] = useState<Friend[]>([]);
  const [currentUser, setCurrentUser] = useState<User>(user);

  const participantCount = users.length;

  // [1] 채팅방 멤버 정보 조회: 백엔드 API (/chatrooms/{roomId})를 호출하여 멤버 정보를 받아옴
  // API 응답은 아래와 같은 배열 형식으로 가정:
  // [
  //   { "userId": "user1", "nickname": "Alice", "mainFishImage": "이미지경로", "isHost": true },
  //   { "userId": "user2", "nickname": "Bob", "mainFishImage": "이미지경로", "isHost": false },
  //   { "userId": "user3", "nickname": "Charlie", "mainFishImage": "이미지경로", "isHost": false }
  // ]
  useEffect(() => {
    axiosInstance
      .get(`/chatrooms/${roomId}`)
      .then((response) => {
        console.log('api호출 완료: ', response);
        const members = Array.isArray(response.data.members)
          ? response.data.members
          : Array.from(response.data.members);
        const updatedUsers = members.map((member: any) => ({
          userName: member.userId,
          nickname: member.nickname, // 백엔드가 nickname을 제공
          mainFishImage: member.mainFishImage || '',
          isHost: member.isHost,
          ready: false,
        }));
        setUsers(updatedUsers);
      })
      .catch((error) =>
        console.error('❌ 채팅방 멤버 정보 불러오기 실패:', error)
      );
  }, [roomId]);

  // [2] 친구 목록 조회 (기존 방식)
  useEffect(() => {
    axiosInstance
      .get(`/friends/${encodeURIComponent(userName)}`)
      .then((response) => {
        setFriendList(response.data.friends);
      })
      .catch((error) => console.error('❌ 친구 목록 불러오기 실패:', error));
  }, [userName]);

  // [3] STOMP 연결 활성화 및 채팅방 관련 메시지 구독
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

  // [4] displayUsers: 현재 사용자는 authAtom의 nickname을, 다른 사용자는 friendList가 있으면 해당 값을 사용
  const displayUsers = useMemo(() => {
    return users.map((userObj) => {
      if (userObj.userName === userName) {
        return { ...userObj, nickname: currentUser.nickname };
      } else {
        const friend = friendList.find((f) => f.friendId === userObj.userName);
        return {
          ...userObj,
          nickname: friend ? friend.nickname : userObj.nickname,
        };
      }
    });
  }, [users, friendList, userName, currentUser]);

  // [5] Fish 리스트 생성: displayUsers를 바탕으로 물고기 데이터 생성
  useEffect(() => {
    const fishList: FishData[] = displayUsers.map((userObj, index) => {
      const computedNickname = userObj.nickname;
      return {
        aquariumId: 0,
        fishId: index,
        fishTypeId: 0,
        fishName: computedNickname,
        fishImage: userObj.mainFishImage,
        userName: userObj.userName,
      };
    });
    setFishes(fishList);
  }, [displayUsers]);

  // [6] 친구 초대 함수 (기존 그대로)
  const inviteFriend = async (friendUserId: string) => {
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
        guestId: friendUserId,
        roomId,
      });
      if (response.status >= 200 && response.status < 300) {
        const electronAPI = (window as any).electronAPI;
        if (electronAPI && electronAPI.showAlert) {
          electronAPI.showAlert(`${friendUserId}님을 초대했습니다.`);
        } else {
          alert(`${friendUserId}님을 초대했습니다.`);
        }
      } else {
        const electronAPI = (window as any).electronAPI;
        if (electronAPI && electronAPI.showAlert) {
          electronAPI.showAlert(`${friendUserId} 초대에 실패했습니다.`);
        } else {
          alert(`${friendUserId} 초대에 실패했습니다.`);
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

  // [7] 현재 사용자의 방장 여부 갱신
  useEffect(() => {
    const me = users.find((u) => u.userName === userName);
    setCurrentIsHost(me ? me.isHost : false);
  }, [users, userName]);

  // [8] ready / start 관련 상태 계산
  const myReady = users.find((u) => u.userName === userName)?.ready;
  const nonHostUsers = currentIsHost
    ? users.filter((u) => u.userName !== userName)
    : users.filter((u) => !u.isHost);
  const allNonHostReady =
    nonHostUsers.length === 0 || nonHostUsers.every((u) => u.ready);

  // [9] 게임 종료 후 대기 화면 복귀 콜백
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

  // [10] 물고기 말풍선 업데이트
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

  // 새로고침 키 감지
  const isRefreshRef = useRef(false);
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
              <div className='absolute top-24 right-16 flex space-x-4'>
                {showFriendList && (
                  <div className='w-[320px] h-[550px] bg-white/70 shadow-md p-4 rounded-lg'>
                    <div className='flex justify-end mb-2'>
                      <button
                        onClick={() => setShowFriendList(false)}
                        className='text-gray-500 hover:text-black'
                      >
                        ❌
                      </button>
                    </div>
                    <FriendList
                      userName={userName}
                      friendList={friendList}
                      roomId={roomId}
                      isHost={currentIsHost}
                      participantCount={users.length}
                      users={displayUsers}
                      onInvite={(friendId) => {
                        if (users.length >= 6) {
                          const electronAPI = (window as any).electronAPI;
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
                        inviteFriend(friendId);
                      }}
                    />
                  </div>
                )}

                <div className='flex flex-col space-y-4 w-[370px] items-center'>
                  <div className='flex space-x-2 w-full'>
                    <button
                      onClick={() => setShowFriendList((prev) => !prev)}
                      className='w-1/2 px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-center'
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
                      friendList={friendList}
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
                      userName={userName}
                      friendList={friendList}
                      onNewMessage={handleNewMessage}
                    />
                  </div>

                  <div className='w-full'>
                    {currentIsHost ? (
                      <button
                        onClick={() => {
                          if (!allNonHostReady) return;
                          const client = getStompClient();
                          if (client && client.connected) {
                            client.publish({
                              destination: '/app/game.start',
                              body: JSON.stringify({ roomId }),
                            });
                          }
                        }}
                        className={`w-full px-6 py-3 bg-yellow-300 text-white text-xl rounded ${
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
                                body: JSON.stringify({
                                  roomId,
                                  sender: userName,
                                }),
                              });
                            } else {
                              client.publish({
                                destination: '/app/chat.ready',
                                body: JSON.stringify({
                                  roomId,
                                  sender: userName,
                                }),
                              });
                            }
                          }
                        }}
                        className='w-full px-6 py-3 bg-yellow-300 text-white text-xl rounded'
                      >
                        {myReady ? 'Unready' : 'Ready'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {screen === 'game' && (
            <div className='w-full h-screen bg-cover bg-center'>
              <Game
                roomId={roomId}
                userName={userName}
                initialPlayers={gamePlayers}
                onResultConfirmed={handleResultConfirmed}
                user={currentUser}
              />
            </div>
          )}
        </>
      )}
    </>
  );
}
