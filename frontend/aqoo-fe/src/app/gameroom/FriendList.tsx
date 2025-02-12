"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRecoilState } from "recoil";
import { usersState, User } from "@/store/participantAtom";

interface Friend {
  id: string; // 친구 관계 아이디
  friendId: string; // 실제 친구의 유저 아이디
  nickname: string;
  level: number;
  mainFishImage?: string | null;
}

export default function FriendList() {
  const { auth } = useAuth();
  console.log("useAuth에서 가져온 사용자 정보", auth);

  // localStorage 접근을 위한 상태 변수
  const [loggedInUser, setLoggedInUser] = useState("");
  const [myFriends, setMyFriends] = useState<Friend[]>([]);
  const [users, setUsers] = useRecoilState(usersState);
  const API_BASE_URL = "https://i12e203.p.ssafy.io/api/v1";

  // 클라이언트 사이드에서만 localStorage 접근
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("loggedInUser") || "";
      setLoggedInUser(storedUser);
      console.log("현재 아이디", storedUser);
    }
  }, []);

  // 친구 목록 API 호출
  useEffect(() => {
    if (!loggedInUser) {
      console.warn("⚠ userId가 없음. API 요청을 중단합니다.");
      return;
    }

    axios
      .get(`${API_BASE_URL}/friends/${loggedInUser}`)
      .then((response) => {
        console.log("loggedInUser", loggedInUser);
        console.log("친구 목록 조회 성공:", response.data);
        setMyFriends(response.data.friends);
      })
      .catch((error) => {
        console.error("❌ 친구 목록 불러오기 실패", error);
      });
  }, [loggedInUser]);

  // 참가자 추가 함수
  const handleAddParticipant = (friend: Friend) => {
    if (users.some((u) => u.friendId === friend.friendId)) return;
  
    const newUser: User = {
      ...friend,
      // mainFishImage가 null일 경우 빈 문자열로 변환
      mainFishImage: friend.mainFishImage ?? "",
      ready: false,
      isHost: false,
    };
  
    setUsers((prev) => [...prev, newUser]);
  };

  return (
    <div className="relative w-96 h-[450px] bg-white bg-opacity-70 border border-black rounded-lg shadow-lg p-4 flex flex-col">
      {/* 헤더 */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">친구 {myFriends.length}</h2>
      </div>

      {/* 친구 리스트 */}
      <div className="space-y-3 overflow-y-auto scrollbar-hide flex-grow">
        {myFriends.length > 0 ? (
          myFriends.map((friend) => (
            <div
              key={friend.friendId}
              className="p-3 bg-white border border-black flex items-center justify-between shadow-[2px_2px_0_rgba(0,0,0,0.3)]"
            >
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gray-300 rounded-full">
                  {friend.mainFishImage ? (
                    <img
                      src={friend.mainFishImage}
                      alt="친구의 대표 물고기"
                      className="w-full h-full rounded-full"
                    />
                  ) : (
                    <img
                      src="/fish/default.png"
                      alt="기본 물고기 이미지"
                      className="w-full h-full rounded-full"
                    />
                  )}
                </div>
                <div>
                  <p className="text-xs">Lv. {friend.level}</p>
                  <p className="font-bold">{friend.nickname}</p>
                  <p className="text-xs">{friend.friendId}</p>
                </div>
              </div>
              <button
                onClick={() => handleAddParticipant(friend)}
                className={`px-3 py-1 text-sm rounded-md ${
                  users.some((u) => u.friendId === friend.friendId)
                    ? "bg-white text-black border border-black shadow-[2px_2px_0_rgba(0,0,0,0.3)] cursor-default"
                    : "bg-white text-black border border-black cursor-pointer"
                }`}
              >
                {users.some((u) => u.friendId === friend.friendId) ? "✔" : "추가"}
              </button>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500">아직 친구가 없습니다.</p>
        )}
      </div>
    </div>
  );
}
