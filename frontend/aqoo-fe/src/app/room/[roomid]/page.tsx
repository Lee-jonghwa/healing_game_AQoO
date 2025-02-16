'use client';

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import IntegratedRoom from "./components/IntegratedRoom";
import { fetchUser } from "@/services/authService";   // <-- import fetchUser
import { User } from "@/store/authAtom";              // <-- User 인터페이스


interface RoomPageProps {
  params: { roomid: string };
}

export default function RoomPage({ params }: RoomPageProps) {
  const { roomid } = params;

  const searchParams = useSearchParams();
  const userName = searchParams.get("userName") || "";
  const router = useRouter();

  // (1) 유저 정보를 저장할 상태
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  // (선택) 방 존재 여부 상태
  const [roomExists, setRoomExists] = useState<boolean | null>(null);
  // (선택) 로딩 여부
  const [loading, setLoading] = useState(true);

  // (2) 컴포넌트 마운트 시 fetchUser 호출
  useEffect(() => {
    async function loadUserInfo() {
      try {
        const userData = await fetchUser();
        if (!userData) {
          // 로그인 상태가 아니거나, 사용자 정보를 가져올 수 없는 경우
          alert("로그인 정보가 없습니다. 메인 페이지로 돌아갑니다.");
          router.replace("/main");
          return;
        }
        // 정상적으로 유저 정보를 받아오면 set
        setCurrentUser(userData);
      } catch (error) {
        console.error("유저 정보 로딩 중 오류:", error);
        // 오류 처리 후 메인 페이지 등으로 리다이렉트할지 결정
      } finally {
        setLoading(false);
      }
    }

    loadUserInfo();
  }, [router]);

  // // (3) (선택) 채팅방 존재 여부 체크 로직
  // useEffect(() => {
  //   async function checkRoomExistence() {
  //     try {
  //       const res = await fetch(`/api/v1/chatrooms/${roomid}`);
  //       if (res.ok) {
  //         setRoomExists(true);
  //       } else {
  //         setRoomExists(false);
  //         alert("해당 채팅방은 존재하지 않습니다.");
  //         router.replace("/main");
  //       }
  //     } catch (error) {
  //       console.error("방 존재 여부 확인 중 오류:", error);
  //       setRoomExists(false);
  //       alert("채팅방 정보를 불러오는데 실패했습니다.");
  //       router.replace("/main");
  //     } finally {
  //       setLoading(false);
  //     }
  //   }
  //   checkRoomExistence();
  // }, [roomid, router]);

  // (4) 로딩 중 화면
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
        <p className="text-2xl font-bold text-gray-900">로딩중...</p>
      </div>
    );
  }

  // (5) 방 존재 여부가 false이거나, currentUser가 없다면 리턴
  if (roomExists === false || !currentUser) {
    return null; 
    // 이미 위에서 alert, replace 등 처리했으므로 return null
  }
  console.log("currentUser:", currentUser);

  // (6) 유저 정보와 roomId, userName 등을 통합하여 하위 컴포넌트로 넘김
  return (
    <div 
      className="relative flex flex-col items-center justify-center min-h-screen bg-cover bg-center"
      style={{ backgroundImage: "url('/chat_images/background.png')" }}
    >
      {/* roomId, userName 뿐 아니라 currentUser 전체를 넘겨줄 수도 있음 */}
      <IntegratedRoom roomId={roomid} userName={userName} user={currentUser} />
    </div>
  );
}
