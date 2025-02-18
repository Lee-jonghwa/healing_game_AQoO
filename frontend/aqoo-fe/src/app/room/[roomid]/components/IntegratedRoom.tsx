'use client';

import { connectStompClient, getStompClient } from '@/lib/stompclient';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import ChatBox from './ChatBox';
import Game from './Game';
import ParticipantList from './ParticipantList';
import FriendList from './FriendList';
import Fish from "./Fish";
import { User } from '@/store/authAtom';
import { useRecoilValue } from "recoil";
import { authAtom } from "@/store/authAtom";

import { useMemo } from 'react';

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
  users?: { userName: string; ready: boolean; isHost: boolean; mainFishImage: string, nickname: string; }[];
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

interface Friend {
  id: number;
  friendId: string;
  nickname: string;
  level: number;
  mainFishImage: string | null;
}

export default function IntegratedRoom({ roomId, userName, user }: IntegratedRoomProps) {
  const [screen, setScreen] = useState<ScreenState>('chat');
  const [users, setUsers] = useState<{ userName: string; ready: boolean; isHost: boolean; mainFishImage: string, nickname: string; }[]>([]);
  const [gamePlayers, setGamePlayers] = useState<Player[]>([]);
  const [currentIsHost, setCurrentIsHost] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [showFriendList, setShowFriendList] = useState(false);
  const hasSentJoinRef = useRef(false);
  const router = useRouter();
  const [fishes, setFishes] = useState<FishData[]>([]);
  const [fishMessages, setFishMessages] = useState<{ [key: string]: string }>({});
  const authState = useRecoilValue(authAtom);

  // 물고기 밑에 닉네임 띄우기 위해 친구리스트 받아오기
  const [friendList, setFriendList] = useState<Friend[]>([]);

  // 기존 props의 user 대신 내부 상태로 관리하여 업데이트할 수 있도록 함
  const [currentUser, setCurrentUser] = useState<User>(user);

  console.log("IntegratedRoom currentUser:", currentUser);
  console.log("usernickname:", user.nickname);
  // 현재 참가자 수
  const participantCount = users.length;

  // 사용자 목록 상태 및 displayUsers 선언
  const displayUsers = useMemo(() => {
    return currentIsHost && !users.some((u) => u.userName === userName)
      ? [
          ...users.map((user) => ({
            ...user,
            nickname: user.nickname ?? friendList.find(f => f.friendId === user.userName)?.nickname ?? user.userName, // ✅ 닉네임 보장
          })),
          { 
            userName, 
            nickname: currentUser?.nickname ?? userName, // ✅ 방장 닉네임 추가
            ready: false, 
            isHost: true, 
            mainFishImage: '' 
          }
        ]
      : users.map((user) => ({
          ...user,
          nickname: user.nickname ?? friendList.find(f => f.friendId === user.userName)?.nickname ?? user.userName, // ✅ 기존 참가자들도 닉네임 추가
        }));
  }, [users, friendList, currentIsHost, userName, currentUser?.nickname]);



  // 친구 목록 조회 (axiosInstance 사용)
  useEffect(() => {
    axiosInstance.get(`/friends/${encodeURIComponent(userName)}`)
      .then((response) => {
        setFriendList(response.data.friends);
      })
      .catch((error) => console.error("❌ 친구 목록 불러오기 실패:", error));
  }, [userName]);

  // STOMP 연결 활성화
  useEffect(() => {
    connectStompClient(() => {
      console.log('STOMP client activated from IntegratedRoom.');
    });
  }, []);

 // Fish 

 useEffect(() => {
  const fishList: FishData[] = displayUsers
    .filter((user) => user.mainFishImage) // ✅ mainFishImage가 있는 유저만 필터링
    .map((user, index) => {
      console.log(`🐟 [DEBUG] User: ${user.userName}, Nickname: ${user.nickname}, FishImage: ${user.mainFishImage}`);
      return {
        aquariumId: 0,
        fishId: index,
        fishTypeId: 0,
        fishName: user.nickname, // 닉네임이 있으면 사용, 없으면 userName 사용
        fishImage: user.mainFishImage,
      };
    });

  console.log("🐠 Final Fish List:", fishList);
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

  // 친구 초대 함수 (참가자가 6명 이상이면 초대 불가)
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
        console.log(`Invitation succeeded for ${friendUserId}`);
        alert(`${friendUserId}님을 초대했습니다.`);
      } else {
        console.error(`Invitation failed for ${friendUserId}`);
        alert(`${friendUserId} 초대에 실패했습니다.`);
      }
    } catch (error) {
      console.error("Error inviting friend", error);
      alert("초대 도중 오류가 발생했습니다.");
    }
  };

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

  // 게임 종료 후 대기 화면으로 복귀 시 호출될 콜백
  const handleResultConfirmed = async () => {
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
    
    // 게임 종료 후 최신 유저 정보를 API를 통해 가져옴
    try {
      const response = await axiosInstance.get(`/users/${userName}`);
      if (response.status >= 200 && response.status < 300) {
        const updatedUser: User = response.data;
        setCurrentUser(updatedUser);
        console.log('User updated:', updatedUser);
      } else {
        console.error('Failed to fetch updated user info. Status:', response.status);
      }
    } catch (error) {
      console.error('Error fetching updated user info:', error);
    }
  };

  // 물고기 말풍선 업데이트
  const handleNewMessage = (sender: string, message: string) => {
    console.log(`🐟 [DEBUG] New Message from "${sender}": "${message}"`);
    
    setFishMessages((prev) => ({
      ...prev,
      [sender]: message,
    }));
  
    setTimeout(() => {
      console.log(`💨 [DEBUG] Message cleared for ${sender}`);
      setFishMessages((prev) => ({
        ...prev,
        [sender]: "",
      }));
    }, 3000);
  };

  /*  
    ===================================================
    아래의 useEffect들은 브라우저를 닫거나 다른 페이지로 이동할 때,
    chat.leaveRoom API를 호출하도록 합니다.
    단, 키보드 새로고침(F5, Ctrl/Cmd+R)을 감지한 경우에는
    새로고침으로 동작하도록 (즉, leave 메시지 전송을 생략) 합니다.
    ===================================================
  */
  // 새로고침 키(F5, Ctrl/Cmd+R) 감지를 위한 ref
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
      // 새로고침이 아니라면 leaveRoom API 실행
      if (!isRefreshRef.current) {
        const client = getStompClient();
        if (client && client.connected) {
          client.publish({
            destination: '/app/chat.leaveRoom',
            body: JSON.stringify({ roomId, sender: userName }),
          });
          console.log('chat.leaveRoom 메시지가 beforeunload에서 전송되었습니다.');
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
  
              {/* 오른쪽 패널 (참가자 리스트, 친구 초대, 나가기 버튼, 채팅창, Ready/Start 버튼) */}
              <div className="absolute top-24 right-16 flex space-x-4">
  
                {/* 친구 목록 리스트 (초대 버튼을 눌렀을 때만 보임) */}
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
  
                {/* 오른쪽 기능 패널 (참가자 리스트 포함) */}
                <div className="flex flex-col space-y-4 w-[370px] items-center">  
  
                  {/* 친구 초대 & 나가기 버튼 (상단 배치) */}
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
  
                  {/* 참가자 리스트 */}
                  <div>
                    <ParticipantList 
                      users={displayUsers} 
                      currentUser={currentUser} 
                      currentIsHost={currentIsHost} 
                      friendList={friendList}  // 친구 목록 전달
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
  
                  {/* 채팅창 */}
                  <div className="p-3 bg-white/70 rounded shadow-md w-full">
                    <ChatBox roomId={roomId} userName={userName} onNewMessage={handleNewMessage} />
                  </div>
  
                  {/* Ready / Start 버튼 */}
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
  
          {/* 게임 화면 */}
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
