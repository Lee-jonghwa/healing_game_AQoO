'use client';

import { connectStompClient, getStompClient } from '@/lib/stompclient';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useMemo } from 'react';
import ChatBox from './ChatBox';
import Game from './Game';
import ParticipantList from './ParticipantList';
import FriendList from './FriendList';
import Fish from "./Fish";
import { User } from '@/store/authAtom';
import { useRecoilValue } from "recoil";
import { authAtom } from "@/store/authAtom";
import axiosInstance from "@/services/axiosInstance";

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
  userName: string; // 원래 userName 저장
}

interface Friend {
  id: number;
  friendId: string;
  nickname: string;
  level: number;
  mainFishImage: string | null;
}

export default function IntegratedRoom({ roomId, userName, user }: IntegratedRoomProps) {
  const [screen, setScreen] = useState<ScreenState>('chat');
  const [users, setUsers] = useState<{ 
    userName: string; 
    ready: boolean; 
    isHost: boolean; 
    mainFishImage: string; 
    nickname: string; 
  }[]>([]);
  const [gamePlayers, setGamePlayers] = useState<Player[]>([]);
  const [currentIsHost, setCurrentIsHost] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [showFriendList, setShowFriendList] = useState(false);
  const hasSentJoinRef = useRef(false);
  const router = useRouter();
  const [fishes, setFishes] = useState<FishData[]>([]);
  const [fishMessages, setFishMessages] = useState<{ [key: string]: string }>({});
  const authState = useRecoilValue(authAtom);

  // 친구 목록 API (nickname 갱신에 사용)
  const [friendList, setFriendList] = useState<Friend[]>([]);

  // 현재 사용자 정보 (authAtom에서 받아온 값)
  const [currentUser, setCurrentUser] = useState<User>(user);

  const participantCount = users.length;

  // displayUsers: 각 사용자에 대해 현재 사용자인지 여부를 확인하여,
  // 현재 사용자이면 반드시 authAtom의 nickname을 사용하고, 그 외는 friendList API를 우선 사용
  const displayUsers = useMemo(() => {
    if (currentIsHost && !users.some((u) => u.userName === userName)) {
      return [
        ...users.map((user) => {
          if (user.userName === userName) {
            return { ...user, nickname: currentUser.nickname };
          } else {
            const friend = friendList.find((f) => f.friendId === user.userName);
            return { ...user, nickname: friend ? friend.nickname : user.nickname };
          }
        }),
        {
          userName,
          nickname: currentUser.nickname,
          ready: false,
          isHost: true,
          mainFishImage: ''
        }
      ];
    } else {
      return users.map((user) => {
        if (user.userName === userName) {
          return { ...user, nickname: currentUser.nickname };
        } else {
          const friend = friendList.find((f) => f.friendId === user.userName);
          return { ...user, nickname: friend ? friend.nickname : user.nickname };
        }
      });
    }
  }, [users, friendList, currentIsHost, userName, currentUser]);

  // 친구 목록 조회
  useEffect(() => {
    axiosInstance.get(`/friends/${encodeURIComponent(userName)}`)
      .then((response) => {
        setFriendList(response.data.friends);
      })
      .catch((error) => console.error("❌ 친구 목록 불러오기 실패:", error));
  }, [userName]);

  // STOMP 연결 활성화
  useEffect(() => {
    connectStompClient(() => {});
  }, []);

  // Fish: 각 물고기에 닉네임 할당 (친구 목록 API를 이용)
  useEffect(() => {
    const fishList: FishData[] = displayUsers.map((user, index) => {
      let computedNickname: string;
      if (user.userName === userName) {
        computedNickname = currentUser.nickname;
      } else {
        const friend = friendList.find((f) => f.friendId === user.userName);
        computedNickname = friend ? friend.nickname : user.nickname;
      }
      const fishItem: FishData = {
        aquariumId: 0,
        fishId: index,
        fishTypeId: 0,
        fishName: computedNickname,
        fishImage: user.mainFishImage,
        userName: user.userName,
      };
      return fishItem;
    });
    setFishes(fishList);
  }, [displayUsers, friendList, currentUser, userName]);

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
          hasSentJoinRef.current = true;
        }
        
        const subscription = client.subscribe(`/topic/room/${roomId}`, (message) => {
          const data: RoomUpdate = JSON.parse(message.body);
          if (data.message === 'GAME_STARTED') {
            setGamePlayers(data.players ?? []);
            setScreen('game');
          } else if (data.message === 'USER_LIST') {
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

  // 친구 초대 함수
  const inviteFriend = async (friendUserId: string) => {
    if (participantCount >= 6) {
      alert('참가자가 최대 인원(6명)을 초과할 수 없습니다.');
      return;
    }
    
    try {
      const response = await axiosInstance.post("/chatrooms/invite", {
        hostId: userName,
        guestId: friendUserId,
        roomId: roomId,
      });
      if (response.status >= 200 && response.status < 300) {
        alert(`${friendUserId}님을 초대했습니다.`);
      } else {
        alert(`${friendUserId} 초대에 실패했습니다.`);
      }
    } catch (error) {
      alert("초대 도중 오류가 발생했습니다.");
    }
  };

  // 현재 사용자의 방장 여부 갱신
  useEffect(() => {
    const me = users.find((u) => u.userName === userName);
    setCurrentIsHost(me ? me.isHost : false);
  }, [users, userName]);

  // ready / start 관련 상태 계산
  const myReady = users.find((u) => u.userName === userName)?.ready;
  const nonHostUsers = currentIsHost
    ? users.filter((u) => u.userName !== userName)
    : users.filter((u) => !u.isHost);
  const allNonHostReady = nonHostUsers.length === 0 || nonHostUsers.every((u) => u.ready);

  // 게임 종료 후 대기 화면으로 복귀 시 호출될 콜백
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

  // 물고기 말풍선 업데이트
  const handleNewMessage = (sender: string, message: string) => {
    // sender는 원래 userName이므로, fishes 배열에서 해당 fish의 computed fishName을 key로 사용
    const fishItem = fishes.find(f => f.userName === sender);
    const key = fishItem ? fishItem.fishName : sender;
    setFishMessages((prev) => ({
      ...prev,
      [key]: message,
    }));
  
    setTimeout(() => {
      setFishMessages((prev) => ({
        ...prev,
        [key]: "",
      }));
    }, 2000);
  };

  // 새로고침 키 감지를 위한 ref
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
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6 opacity-10">
          <p className="text-2xl font-bold text-gray-900">로딩중...</p>
        </div>
      ) : (
        <>
          {screen === 'chat' && (
            <div 
              className="relative w-full h-full min-h-screen flex items-center justify-center bg-gray-100 overflow-hidden"
              style={{ backgroundImage: "url('/chat_images/background.png')", backgroundSize: "cover", backgroundAttachment: "fixed", backgroundPosition: "center" }}
            >
              {/* 물고기 렌더링, 말풍선 표시 */}
              {fishes.map((fish) => (
                <Fish key={fish.fishId} fish={fish} message={fishMessages[fish.fishName] || ''}/>
              ))}
  
              {/* 오른쪽 패널 */}
              <div className="absolute top-24 right-16 flex space-x-4">
                {showFriendList && (
                  <div className="w-[320px] h-[550px] bg-white/70 shadow-md p-4 rounded-lg">
                    <div className="flex justify-end mb-2">
                      <button onClick={() => setShowFriendList(false)} className="text-gray-500 hover:text-black">❌</button>
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
                          alert('참가자가 최대 인원(6명)을 초과할 수 없습니다.');
                          return;
                        }
                        inviteFriend(friendId);
                      }} 
                    />
                  </div>
                )}
  
                <div className="flex flex-col space-y-4 w-[370px] items-center">  
                  <div className="flex space-x-2 w-full">
                    <button 
                      onClick={() => setShowFriendList((prev) => !prev)} 
                      className="w-1/2 px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-center"
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
                      className="w-1/2 px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors text-center"
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
                            body: JSON.stringify({ roomId, targetUser: target, sender: userName }),
                          });
                        }
                      }} 
                    />
                  </div>
  
                  <div className="p-3 bg-white/70 rounded shadow-md w-full">
                    <ChatBox roomId={roomId} userName={userName} onNewMessage={handleNewMessage} />
                  </div>
  
                  <div className="w-full">
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
                        className={`w-full px-6 py-3 bg-yellow-300 text-white text-xl rounded ${allNonHostReady ? '' : 'opacity-50 cursor-not-allowed'}`} 
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
                            } else {
                              client.publish({
                                destination: '/app/chat.ready',
                                body: JSON.stringify({ roomId, sender: userName }),
                              });
                            }
                          }
                        }} 
                        className="w-full px-6 py-3 bg-yellow-300 text-white text-xl rounded"
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
            <div className="w-full h-screen bg-cover bg-center">
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
