// "use client";

// import { useEffect, useRef, useState } from "react";
// import { useRouter, useSearchParams } from "next/navigation";
// import { RecoilRoot, useRecoilState } from "recoil";
// import { usersState, User } from "@/store/participantAtom";
// import { connectStompClient, getStompClient } from "@/lib/stompclient";
// import ChatBox from "@/app/chat/ChatBox";
// import ParticipantList from "@/app/chat/ParticipantList";
// import HostManager from "@/app/chat/HostManager";
// import Game from "./game";

// // ✅ 채팅방과 게임 화면을 전환할 수 있도록 상태 추가
// type ScreenState = "chat" | "game";

// export default function IntegratedRoom() {
//   return (
//     <RecoilRoot>
//       <ChatScreen />
//     </RecoilRoot>
//   );
// }

// // ✅ 메인 채팅방 컴포넌트
// function ChatScreen() {
//   const router = useRouter();
//   const searchParams = useSearchParams();
//   const [participants, setParticipants] = useRecoilState(usersState);
//   const [chatRoomId] = useState<string | null>(searchParams.get("roomId"));
//   const [hostUser, setHostUser] = useState<User | null>(null);
//   const [screen, setScreen] = useState<ScreenState>("chat"); // ✅ 채팅 & 게임 화면 전환
//   const hasSentJoinRef = useRef(false);
//   const prevUsersRef = useRef<string>(""); // ✅ 이전 참가자 상태 저장

//   const [error, setError] = useState<string | null>(null);

//   // ✅ STOMP 연결 설정
//   useEffect(() => {
//     console.log("✅ IntegratedRoom 페이지 마운트됨");
//     connectStompClient(() => {
//       console.log("✅ STOMP client activated.");
//     });
//   }, []);

//   // ✅ 참가자 정보 수신 및 업데이트
//   useEffect(() => {
//     const client = getStompClient();
//     if (!client || !chatRoomId) return;

//     if (client.connected && !hasSentJoinRef.current) {
//       hasSentJoinRef.current = true;
//       const joinMessage = { roomId: chatRoomId, sender: searchParams.get("userName") || "unknown" };
//       client.publish({ destination: "/app/chat.joinRoom", body: JSON.stringify(joinMessage) });
//       console.log("✅ Join room message sent:", joinMessage);
//     }

//     // ✅ 메시지 수신 설정
//     const subscription = client.subscribe(`/topic/room/${chatRoomId}`, (message) => {
//       const data = JSON.parse(message.body);
//       console.log("✅ Room update received:", data);

//       if (data.message === "USER_LIST") {
//         const updatedUsers = data.users?.map((u) => ({
//           ...u,
//           id: u.userName,
//         })) ?? [];

//         const newUsersString = JSON.stringify(updatedUsers);
//         if (prevUsersRef.current !== newUsersString) {
//           prevUsersRef.current = newUsersString;
//           setParticipants(updatedUsers);
//           console.log("✅ 참가자 리스트 업데이트됨:", updatedUsers);
//         }
//       }

//       // ✅ 게임 시작 이벤트 처리
//       if (data.message === "GAME_STARTED") {
//         console.log("🚀 게임이 시작됩니다!");
//         setScreen("game");
//       }
//     });

//     return () => subscription.unsubscribe();
//   }, [chatRoomId]);

//   // ✅ 현재 사용자 방장 여부 업데이트
//   useEffect(() => {
//     const me = participants.find((u) => u.id === searchParams.get("userName"));
//     if (me) {
//       setHostUser(me);
//     }
//   }, [participants]);

//   // ✅ 게임 종료 후 다시 채팅방으로 복귀
//   const handleGameEnd = () => {
//     setScreen("chat");

//     const client = getStompClient();
//     if (client && client.connected) {
//       client.publish({
//         destination: "/app/chat.clearReady",
//         body: JSON.stringify({ roomId: chatRoomId, sender: searchParams.get("userName") }),
//       });
//       console.log("✅ 게임 종료 후 Ready 상태 초기화 요청됨.");
//     }
//   };

//   // ✅ 채팅방 나가기
//   const handleLeaveRoom = () => {
//     const client = getStompClient();
//     if (client && client.connected && chatRoomId) {
//       client.publish({
//         destination: "/app/chat.leaveRoom",
//         body: JSON.stringify({ roomId: chatRoomId, sender: searchParams.get("userName") }),
//       });
//       console.log("✅ Leave room message sent");
//       router.push("/gameroom");
//     } else {
//       console.error("❌ STOMP client is not connected yet.");
//     }
//   };

//   return (
//     <div
//       className="relative flex flex-col items-center justify-center min-h-screen bg-cover bg-center p-6"
//       style={{ backgroundImage: "url('/images/background.png')" }}
//     >
//       {screen === "chat" ? (
//         <>
//           {/* ✅ 방장 정보 로드 */}
//           <HostManager TEST_MODE={true} TEST_USER_ID={"test_user"} setHostUser={setHostUser} />

//           {/* ✅ 참가자 리스트 */}
//           <div className="absolute top-4 right-4">
//             <ParticipantList />
//           </div>

//           {/* ✅ 채팅방 UI */}
//           <div className="bg-white bg-opacity-80 border border-gray-300 rounded-lg p-4 w-[400px] shadow-md">
//             {error ? <p className="text-center text-red-500">{error}</p> : <ChatBox />}
//           </div>

//           {/* ✅ 나가기 버튼 */}
//           <button
//             onClick={handleLeaveRoom}
//             className="fixed bottom-10 left-7 px-10 py-2 rounded-lg border border-black bg-white text-2xl shadow-md hover:bg-gray-100"
//           >
//             나가기
//           </button>
//         </>
//       ) : (
//         <>
//           {/* ✅ 게임 화면 */}
//           <div className="max-w-2xl mx-auto p-6 bg-white rounded shadow">
//             <Game roomId={chatRoomId!} userName={searchParams.get("userName")!} onResultConfirmed={handleGameEnd} />
//           </div>
//         </>
//       )}
//     </div>
//   );
// }
