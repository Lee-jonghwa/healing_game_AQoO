'use client';

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import IntegratedRoom from "./components/integratedroom";

interface RoomPageProps {
  params: { roomid: string }; // [roomid] 폴더에서 추출한 roomid
}

export default function RoomPage({ params }: RoomPageProps) {
  const { roomid } = params;
  console.log("Extracted roomid from URL:", roomid);

  const searchParams = useSearchParams();
  const userName = searchParams.get("userName") || "";
  const router = useRouter();
  const [roomExists, setRoomExists] = useState<boolean | null>(null);

  // useEffect(() => {
  //   async function checkRoomExistence() {
  //     try {
  //       // 백엔드의 채팅방 조회 API: /api/v1/chatrooms/{roomId}
  //       const res = await fetch(`/api/v1/chatrooms/${roomid}`);
  //       if (res.ok) {
  //         setRoomExists(true);
  //       } else {
  //         setRoomExists(false);
  //         alert("해당 채팅방은 존재하지 않습니다.");
  //         router.push("/");
  //       }
  //     } catch (error) {
  //       console.error("방 존재 여부 확인 중 오류 발생:", error);
  //       setRoomExists(false);
  //       alert("채팅방 정보를 불러오는데 실패했습니다.");
  //       router.push("/");
  //     }
  //   }
  //   checkRoomExistence();
  // }, [roomid, router]);

  // if (roomExists === null) {
  //   return (
  //     <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
  //       <p className="text-2xl font-bold text-gray-900">로딩중...</p>
  //     </div>
  //   );
  // }

  return (
    <div 
    className="relative flex flex-col items-center justify-center min-h-screen bg-cover bg-center"
    style={{ backgroundImage: "url('/images/background.png')" }}
    >
      <IntegratedRoom roomId={roomid} userName={userName} />
    </div>
  );
}