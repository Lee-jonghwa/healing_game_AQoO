"use client";

import { connectStompClient, getStompClient } from "@/lib/stompclient";
import { useEffect, useMemo, useRef, useState } from "react";

import ChatBox from "./ChatBox";
import Fish from "./Fish";
import FriendList from "./FriendList";
import Game from "./Game";
import GameA from "./GameA";
import GameB from "./GameB";
import ParticipantList from "./ParticipantList";
import { User } from "@/store/authAtom";
import axiosInstance from "@/services/axiosInstance";
import { useRouter } from "next/navigation";
import { useSFX } from "@/hooks/useSFX";
import { useRecoilState } from "recoil";
import { screenStateAtom } from "@/store/screenStateAtom";
import { selectedGameAtom } from "@/store/gameAtom";



type ScreenState = "chat" | "game";

interface Player {
  userName: string;
  mainFishImage: string;
  totalPressCount: number;
  nickname: string;
}

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
  // 드롭다운 동기화용 추가 필드 (서버에서 보내는 DropdownStateUpdate)
  gameType?: string;
  updatedBy?: string;
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
  const [screen, setScreen] = useState<"chat" | "game">("chat");
  const [users, setUsers] = useState<Member[]>([]);
  const [gamePlayers, setGamePlayers] = useState<Player[]>([]);
  const [currentIsHost, setCurrentIsHost] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [fishes, setFishes] = useState<FishData[]>([]);

  const { play: playHostSound } = useSFX("/sounds/카운트다운-02.mp3");
  const { play: playUserSound } = useSFX("/sounds/clickeffect-02.mp3");
  const [fishMessages, setFishMessages] = useState<{ [key: string]: string }>({});
  const [selectedGame, setSelectedGame] = useState<string>("Game");
  const [showFriendList, setShowFriendList] = useState<boolean>(false);

// 배경음악, 효과음 관련 코드
  const [screenState, setScreenState] = useRecoilState(screenStateAtom);
  const { play: playModal } = useSFX("/sounds/clickeffect-02.mp3"); // 버튼 누를 때 효과음
  const { play: entranceRoom } = useSFX("/sounds/샤라랑-01.mp3"); // 채팅방 입장 사운드
  

  // 현재 참가자 수
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User>(user);
  const participantCount = users.length;
  const hasSentJoinRef = useRef<boolean>(false);

  const prevUsersRef = useRef<Member[]>([]); // 이전 참가자 리스트 저장

  useEffect(() => {
    if (users.length > prevUsersRef.current.length) {
      console.log("🎵 참가자 추가됨! 효과음 실행");
      entranceRoom(); // 참가자 등장 효과음 실행
    }
  
    prevUsersRef.current = users;
  }, [users]);
  
  


  
  // [1] 채팅방 멤버 정보 조회: API (/chatrooms/{roomId})
  useEffect(() => {
    axiosInstance
      .get(`/chatrooms/${roomId}`)
      .then((response) => {
        // 응답이 배열 형태로 전달됨
        const updatedUsers = response.data.map((member: any) => ({
          userName: member.userId,
          nickname: member.nickname,
          mainFishImage: member.mainFishImage || "",
          isHost: member.isHost,
          ready: false,
          level: member.level,
        }));
        setUsers(updatedUsers);
      })

      .catch((error) => console.error("❌ 채팅방 멤버 정보 불러오기 실패:", error));
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
            destination: "/app/chat.joinRoom",
            body: JSON.stringify(joinMessage),
          });
          hasSentJoinRef.current = true;
        }

        const subscription = client.subscribe(`/topic/room/${roomId}`, (messageFrame) => {
          const data: RoomUpdate = JSON.parse(messageFrame.body);
          if (data.message === "GAME_STARTED") {
            setGamePlayers(data.players ?? []);
            setScreen("game");
          } else if (data.message === "USER_LIST") {
            setUsers(data.users ?? []);
          } else if (data.message === "USER_KICKED") {
            if (data.targetUser === userName) {
              router.replace("/main?status=kicked");
            } else {
              setUsers((prev) => prev.filter((u) => u.userName !== data.targetUser));
            }
          } else if (data.message === "GAME_DROPDOWN_UPDATED") {
            // 드롭다운 동기화 메시지 수신 시 상태 업데이트
            if (data.gameType) {
              setSelectedGame(data.gameType);
            }
          }
        });
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
        electronAPI.showAlert("참가자가 최대 인원(6명)을 초과할 수 없습니다.");
      } else {
        alert("참가자가 최대 인원(6명)을 초과할 수 없습니다.");
      }
      return;
    }
    try {
      const response = await axiosInstance.post("/chatrooms/invite", {
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
        electronAPI.showAlert("초대 도중 오류가 발생했습니다.");
      } else {
        alert("초대 도중 오류가 발생했습니다.");
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
  const nonHostUsers = currentIsHost ? users.filter((u) => u.userName !== userName) : users.filter((u) => !u.isHost);
  const allNonHostReady = nonHostUsers.length === 0 || nonHostUsers.every((u) => u.ready);

  // [8] 게임 종료 후 대기 화면 복귀 콜백
  const handleResultConfirmed = async () => {
    setScreen("chat");

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
        [key]: "",
      }));
    }, 2000);
  };

  // Helper 함수: 게임에 따른 destination 반환
  const getGameDestination = (game: string) => {
    if (game === "Game") return "/app/game.start";
    if (game === "gameA") return "/app/game.start";
    if (game === "gameB") return "/app/game.start";
    return "/app/game.start";
  };

  // [F5 키 동작 수정: ready/unready 또는 게임 시작 동작, 드롭다운 포함]
  const isRefreshRef = useRef(false);
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "F5") {
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
            alert("아직 준비되지 않은 물고기가 있습니다.");
          }
        } else {
          if (myReady) {
            client.publish({
              destination: "/app/chat.unready",
              body: JSON.stringify({ roomId, sender: userName }),
            });
          } else {
            client.publish({
              destination: "/app/chat.ready",
              body: JSON.stringify({ roomId, sender: userName }),
            });
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [roomId, userName, currentIsHost, myReady, allNonHostReady, selectedGame]);

  // 새로고침 키 감지
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === "F5" ||
        (event.ctrlKey && event.key.toLowerCase() === "r") ||
        (event.metaKey && event.key.toLowerCase() === "r")
      ) {
        isRefreshRef.current = true;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isRefreshRef.current) {
        const client = getStompClient();
        if (client && client.connected) {
          client.publish({
            destination: "/app/chat.leaveRoom",
            body: JSON.stringify({ roomId, sender: userName }),
          });
        }
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [roomId, userName]);

  // 화면 전환 시 Recoil Atom 업데이트
  useEffect(() => {
    setScreenState(screen);
  }, [screen, setScreenState]);


  return (
    <>
      {!isConnected ? (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6 opacity-10">
          <p className="text-2xl font-bold text-gray-900">로딩중...</p>
        </div>
      ) : (
        <>
          {screen === "chat" && (
            <div
              className="relative w-full h-full min-h-screen flex items-center justify-center bg-gray-100 overflow-hidden"
              style={{
                backgroundImage: "url('/chat_images/background.png')",
                backgroundSize: "cover",
                backgroundAttachment: "fixed",
                backgroundPosition: "center",
              }}
            >
              
              {/* 물고기 렌더링, 말풍선 표시 */}
              {fishes.map((fish) => (
                <Fish key={fish.fishId} fish={fish} message={fishMessages[fish.fishName] || ""} />
              ))}

              {/* 오른쪽 패널 전체 */}
              <div className="absolute top-20 sm:right-16 flex flex-col space-y-4 w-[370px] h-[90vh]">
                {/* 참가자 리스트 + 채팅창 + 버튼 묶은 div */}
                <div className="flex flex-col justify-between h-full w-full">
                  {/* 초대 및 나가기 버튼 div */}
                  <div className="flex space-x-2 w-full">
                    {/* 친구 초대 버튼을 감싸는 영역을 relative로 처리 */}
                    <div className="relative w-1/2 space-x-2">
                      <button
                        onClick={() => {
                          playModal();
                          setShowFriendList((prev) => !prev);
                        }}
                        className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-center sm:text-base text-sm"
                      >
                        친구 초대
                      </button>
                      {showFriendList && (
                        <div
                          className={`absolute  shadow-md p-4 rounded-lg z-50 
                          ${
                            window.innerWidth < 640
                              ? "top-10 left-10 transform -translate-x-10 -translate-y-10 max-w-[350px] bg-white"
                              : "right-full top-0 mr-2 w-[320px] h-[550px] bg-white/70"
                          }`}
                        >
                          <div className="relative h-full">
                            {/* FriendList 컴포넌트 */}
                            <FriendList
                              userName={userName}
                              roomId={roomId}
                              isHost={currentIsHost}
                              participantCount={users.length}
                              users={displayUsers}
                              onInvite={(memberId) => {
                                if (users.length >= 6) {
                                  const electronAPI = (window as any).electronAPI;
                                  if (electronAPI && electronAPI.showAlert) {
                                    electronAPI.showAlert("참가자가 최대 인원(6명)을 초과할 수 없습니다.");
                                  } else {
                                    alert("참가자가 최대 인원(6명)을 초과할 수 없습니다.");
                                  }
                                  return;
                                }
                                inviteFriend(memberId);
                              }}
                            />
                            {/* 닫기 버튼 */}
                            <button
                              onClick={() => {
                                playModal();
                                setShowFriendList(false);
                              }}
                              className="absolute top-2 right-2 text-gray-500 hover:text-black"
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
                            destination: "/app/chat.leaveRoom",
                            body: JSON.stringify({ roomId, sender: userName }),
                          });
                          router.replace("/main");
                        }
                      }}
                      className="w-1/2 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors text-center sm:text-base text-sm"
                    >
                      나가기
                    </button>
                  </div>

                  {/* 참가자 리스트 div */}
                  <div className="transition-all duration-300 my-2">
                    <ParticipantList
                      users={displayUsers}
                      currentUser={currentUser}
                      currentIsHost={currentIsHost}
                      onKickUser={(target) => {
                        const client = getStompClient();
                        if (client && client.connected) {
                          client.publish({
                            destination: "/app/chat.kickUser",
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

                  {/* 채팅창 div */}
                  <div className="flex-grow overflow-hidden min-h-0 flex flex-col sm:bg-white/70 rounded shadow-md sm:p-2 p-1">
                    <ChatBox
                      roomId={roomId}
                      users={displayUsers}
                      currentUser={currentUser}
                      onNewMessage={handleNewMessage}
                    />
                  </div>

                  {/* 드롭다운과 게임 시작 버튼 영역 */}
                  <div className="w-full flex flex-col items-center space-y-2 flex-shrink-0 mb-4">
                    <>
                      <select
                        value={selectedGame}
                        onChange={(e) => {
                          if (currentIsHost) {
                            const newGame = e.target.value;
                            setSelectedGame(newGame);
                            const client = getStompClient();
                            if (client && client.connected) {
                              client.publish({
                                destination: "/app/chat.dropdown",
                                body: JSON.stringify({
                                  roomId,
                                  sender: userName,
                                  gameType: newGame,
                                }),
                              });
                            }
                          }
                        }}
                        className="w-full px-4 py-2 border rounded"
                        disabled={!currentIsHost}
                      >
                        <option value="Game">Game</option>
                        <option value="gameA">Game A</option>
                        <option value="gameB">Game B</option>
                      </select>
                      <button
                        onClick={() => {
                          // 조건에 따라 다른 사운드 재생
                          if (currentIsHost) {
                            playHostSound();
                          } else {
                            playUserSound();
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
                              // 게임 시작 시 화면 상태를 "game"으로 전환합니다.
                              setScreen("game");
                              setScreenState("game"); // Recoil 상태 업데이트 (필요한 경우)
                            } else {
                              client.publish({
                                destination: myReady ? "/app/chat.unready" : "/app/chat.ready",
                                body: JSON.stringify({
                                  roomId,
                                  sender: userName,
                                }),
                              });
                            }
                          }
                          
                        }}
                        className={`w-full px-6 py-3 text-xl rounded transition-colors 
                          ${
                            currentIsHost
                              ? "bg-yellow-300" // Start Game 버튼 (방장)
                              : myReady
                              ? "bg-green-600 hover:bg-green-700 text-white" // Unready 버튼 (진한 초록)
                              : "bg-green-400 hover:bg-green-500" // Ready 버튼 (연한 초록)
                          }
                          ${currentIsHost && !allNonHostReady ? "opacity-50 cursor-not-allowed" : ""}`}
                        disabled={currentIsHost ? !allNonHostReady : false}
                      >
                        {currentIsHost ? "Start Game(F5)" : myReady ? "Unready(F5)" : "Ready(F5)"}
                      </button>
                    </>
                  </div>
                </div>
              </div>
            </div>
          )}

          {screen === "game" && (
            <div className="w-full h-screen bg-cover bg-center">
              {selectedGame === "Game" ? (
                <Game
                  roomId={roomId}
                  userName={userName}
                  initialPlayers={gamePlayers}
                  onResultConfirmed={handleResultConfirmed}
                  user={currentUser}
                />
              ) : selectedGame === "gameA" ? (
                <GameA
                  roomId={roomId}
                  userName={userName}
                  initialPlayers={gamePlayers}
                  onResultConfirmed={handleResultConfirmed}
                  user={currentUser}
                />
              ) : selectedGame === "gameB" ? (
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
