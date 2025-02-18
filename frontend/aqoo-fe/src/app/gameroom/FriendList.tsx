"use client";

import { User, usersState } from "@/store/participantAtom";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRecoilState } from "recoil";
import axiosInstance from "@/services/axiosInstance";

import { useSFX } from "@/hooks/useSFX";
import { bgMusicVolumeState, sfxVolumeState } from "@/store/soundAtom";



interface Friend {
  id: string; // 친구 관계 아이디
  friendId: string; // 실제 친구의 유저 아이디
  nickname: string;
  level: number;
  mainFishImage: string;
}

export default function FriendList() {
  const { auth } = useAuth();
  console.log("useAuth에서 가져온 사용자 정보", auth);

  // localStorage 접근을 위한 상태 변수
  const [loggedInUser, setLoggedInUser] = useState("");
  const [myFriends, setMyFriends] = useState<Friend[]>([]);
  const [users, setUsers] = useRecoilState(usersState);

  
  const { play: playModal } = useSFX("/sounds/clickeffect-02.mp3");

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
    axiosInstance
      .get(`/friends/${loggedInUser}`)
      .then((response) => {
        console.log("loggedInUser", loggedInUser);
        console.log("친구 목록 조회 성공:", response.data);
        setMyFriends(response.data.friends);
      })
      .catch((error) => {
        console.error("❌ 친구 목록 불러오기 실패", error);
      });
  }, [loggedInUser]);

  // 참가자 토글 함수: 이미 추가되어 있으면 제거, 없으면 추가 (단, 최대 5명 제한)
  const handleToggleParticipant = (friend: Friend) => {
    if (users.some((u) => u.friendId === friend.friendId)) {
      // 이미 추가되어 있으면 제거
      setUsers(users.filter((u) => u.friendId !== friend.friendId));
    } else {
      // 추가되어 있지 않으면 추가 전에 최대 참가자 수(5명) 확인
      if (users.length >= 5) {
        alert("참가자는 최대 5명을 초과할 수 없습니다.");
        return;
      }
      const newUser: User = {
        ...friend,
        mainFishImage: friend.mainFishImage ?? "",
        ready: false,
        isHost: false,
      };
      setUsers((prev) => [...prev, newUser]);
    }
  };

  return (
    <div className="relative w-96 h-[450px] bg-white bg-opacity-70 border border-black rounded-lg shadow-lg p-4 flex flex-col">
      {/* 헤더 */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">친구 {myFriends.length}</h2>
      </div>

      {/* 친구 리스트 */}
      <div className="space-y-3 overflow-y-auto overflow-x-hidden scrollbar-styled flex-grow">
        {myFriends.length > 0 ? (
          myFriends.map((friend) => (
            <div
              key={friend.friendId}
              className="p-3 bg-white bg-opacity-80 border border-black rounded-lg flex items-center justify-between shadow-[2px_2px_0_rgba(0,0,0,0.3)] transform transition duration-300 hover:scale-105"
            >
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-300 rounded-full overflow-hidden"> 
                    <img
                      src={friend.mainFishImage}
                      alt="친구의 대표 물고기"
                      className="w-full h-full object-contain rounded-full"
                    />
                </div>
                <div>
                  <p className="text-xs">Lv. {friend.level}</p>
                  <p className="font-bold">{friend.nickname}</p>
                  <p className="text-xs">{friend.friendId}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  playModal();
                  handleToggleParticipant(friend)}}
                disabled={!users.some((u) => u.friendId === friend.friendId) && users.length >= 5}
                className={`px-3 py-1 text-sm rounded-md border border-black cursor-pointer transition duration-300 ${
                  users.some((u) => u.friendId === friend.friendId)
                    ? "bg-white text-black hover:bg-red-500 hover:text-white"
                    : "bg-white text-black hover:bg-blue-500 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                }`}
              >
                {users.some((u) => u.friendId === friend.friendId)
                  ? "제거"
                  : "추가"}
              </button>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500">아직 친구가 없습니다.</p>
        )}
      </div>
      <style jsx>{`
        /* 수평 스크롤바 숨김 */
        .overflow-x-hidden::-webkit-scrollbar {
          display: none;
        }
        .overflow-x-hidden {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        /* 수직 스크롤바 커스텀 스타일 */
        .scrollbar-styled::-webkit-scrollbar {
          width: 8px;
        }
        .scrollbar-styled::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 8px;
        }
        .scrollbar-styled::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 8px;
        }
        .scrollbar-styled::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}</style>
    </div>
  );
}
