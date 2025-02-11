"use client";

import { Friend, SearchUser } from "@/types";
import axios, { AxiosResponse } from "axios";
import { useEffect, useRef, useState } from "react";

import axiosInstance from "@/services/axiosInstance"; // ✅ axiosInstance 사용
import { useAuth } from "@/hooks/useAuth"; // ✅ useAuth 훅 사용
import { useInput } from "@/hooks/useInput"; // useInput 훅을 사용

export default function FriendsList({ onClose, userId }: { onClose: () => void; userId: string }) {
  const { auth, fetchUser } = useAuth();
  const [myFriends, setMyFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const searchInput = useInput("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const API_BASE_URL = "https://i12e203.p.ssafy.io/api/v1";

  // ✅ 친구 목록 API 호출
  useEffect(() => {
    if (!auth.accessToken) {
      console.warn("🔄 토큰 만료 감지 - 사용자 정보 재요청...");
      fetchUser(); // ✅ 토큰 갱신 시도
    }

    axios
      .get(`${API_BASE_URL}/friends/${userId}`)
      .then((response: AxiosResponse<{ count: number; friends: Friend[] }>) => {
        console.log("친구 목록 조회:", response.data);
        setMyFriends(response.data.friends);
      })
      .catch((error) => {
        console.error("친구 목록 불러오기 실패", error);
        setError("친구 목록을 불러오는데 실패했습니다.");
      })
      .finally(() => setLoading(false));
  }, []);

  // 친구 추가 함수
  const handleAddFriend = (friendId: string) => {
    axios
      .post(`${API_BASE_URL}/friends/request`, {
        userId: userId, // 현재 로그인된 사용자 ID
        friendId: friendId, // 추가할 친구 ID
        status: "PENDING", // 요청 상태
      })
      .then((response: AxiosResponse<{ relationshipId: number }>) => {
        console.log("친구 추가 요청 성공:", response.data);
        alert("친구 요청을 했습니다.");
        // setSearchResults((prev) => prev.map((user) => (user.friendId === friendId ? { ...user, isFriend: 1 } : user)));
      })
      .catch((error) => {
        alert("친구 추가에 실패했습니다. 다시 시도하세요.");
        console.error("친구 추가 요청 실패", error);
      });
  };

  // 🔹 친구 삭제 함수
  const handleDeleteFriend = (relationshipId: number) => {
    axios
      .delete(`${API_BASE_URL}/friends/delete`, { data: { relationshipId } }) // ✅ 요청 바디 추가
      .then(() => {
        setMyFriends((prev) => prev.filter((friend) => friend.id !== relationshipId)); // ✅ 삭제 후 상태 업데이트
      })
      .catch((error) => console.error("친구 삭제 실패", error));
  };

  // ✅ 친구 검색 API 호출
  const handleSearch = () => {
    if (!searchInput.value.trim()) {
      setSearchResults([]);
      return;
    }

    console.log("검색할 아이디 : ", searchInput.value);

    axios
      .get(`${API_BASE_URL}/friends/find-users/${searchInput.value}`, { withCredentials: true }) // ✅ BASE_URL 추가
      .then((response: AxiosResponse<SearchUser[]>) => {
        console.log("사용자 목록 조회:", response.data);
        setSearchResults(response.data);
      })
      .catch((error) => {
        console.error("사용자 검색 실패", error);
        setError("사용자 목록을 불러오는데 실패했습니다.");
      })
      .finally(() => setLoading(false));
  };

  // 🔹 엔터 키 입력 시 검색 실행
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      handleSearch();
    }
  };

  // 🔹 검색창 외부 클릭 시 검색 결과 숨기기
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setSearchResults([]); // 검색 리스트 숨기기
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-[400px] h-[600px] bg-white bg-opacity-70 border border-black rounded-lg shadow-lg p-4 flex flex-col">
      {/* 헤더 */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">친구 {myFriends.length}</h2>
        <button onClick={onClose} className="text-xl font-bold hover:text-red-500">
          ✖
        </button>
      </div>

      {/* 친구 리스트 - `flex-grow` 추가해서 리스트가 공간을 채우도록 함 */}
      <div className="space-y-3 overflow-y-auto scrollbar-hide flex-grow">
        {myFriends.length > 0 ? (
          myFriends.map((friend) => (
            <FriendItem key={friend.friendId} friend={friend} handleDeleteFriend={handleDeleteFriend} />
          ))
        ) : (
          <p className="text-center text-gray-500">아직 친구가 없습니다.</p>
        )}
      </div>

      {/* 검색창 + 버튼 + 검색 결과 리스트 */}
      <div className="relative mt-4" ref={searchContainerRef}>
        {/* 🔹 검색 결과 리스트 (검색창 바로 위) */}
        {searchResults.length > 0 && (
          <div className="absolute bottom-full left-0 w-full bg-white border border-black rounded-lg shadow-lg p-3 max-h-[200px] overflow-y-auto scrollbar-hide z-10">
            {searchResults.map((user, index) => (
              <SearchResultItem key={index} user={user} handleAddFriend={handleAddFriend} />
            ))}
          </div>
        )}

        {/* 🔹 검색창 + 버튼 */}
        <div className="flex items-center border border-gray-400 rounded-lg p-2 bg-white w-full">
          <input
            type="text"
            className="w-full px-3 py-1 outline-none text-sm"
            placeholder="아이디로 친구 검색"
            {...searchInput}
            onFocus={handleSearch} // 검색창 포커스 시 검색 실행
            onKeyDown={handleKeyDown} // 🔹 엔터 키 입력 시 검색 실행
          />
          <button
            onClick={handleSearch}
            className="ml-2 px-4 py-1 bg-blue-600 text-white text-sm rounded-md w-14 whitespace-nowrap"
          >
            검색
          </button>
        </div>
      </div>
    </div>
  );
}

// 🔹 친구 리스트 아이템 (hover 시 삭제 버튼 표시)
function FriendItem({
  friend,
  handleDeleteFriend,
}: {
  friend: Friend;
  handleDeleteFriend: (relationshipId: number) => void;
}) {
  return (
    <div className="relative p-3 bg-white rounded-lg border border-black flex items-center space-x-3 cursor-pointer hover:bg-gray-100 group">
      <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
      <div>
        <p className="text-xs">Lv. {friend.level}</p>
        <p className="font-bold">{friend.nickname}</p>
        <p className="text-sm text-gray-500">@{friend.friendId}</p>
      </div>
      {/* 🔹 hover 시만 보이는 삭제 버튼 */}
      <button
        onClick={() => handleDeleteFriend(friend.id)}
        className="absolute right-3 px-3 py-1 bg-red-500 text-white text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200"
      >
        삭제
      </button>
    </div>
  );
}

// 검색 결과 아이템 (친구 추가 가능)
function SearchResultItem({
  user,
  handleAddFriend,
}: {
  user: SearchUser;
  handleAddFriend: (friendId: string) => void;
}) {
  return (
    <div className="p-3 bg-white mb-2 rounded-lg border border-black flex items-center justify-between space-x-3">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
        <div>
          <p className="text-xs">Lv. {user.level}</p>
          <p className="font-bold">{user.nickname}</p>
          <p className="text-sm text-gray-500">@{user.friendId}</p>
        </div>
      </div>

      {/* ✅ isFriend 값에 따라 버튼 표시 */}
      {user.isFriend === 1 ? (
        <button className="px-3 py-1 bg-gray-400 text-white text-xs rounded-md cursor-default" disabled>
          친구
        </button>
      ) : (
        <button
          onClick={() => handleAddFriend(user.friendId)}
          className="px-3 py-1 bg-blue-500 text-white text-xs rounded-md hover:bg-blue-600"
        >
          친구 추가
        </button>
      )}
    </div>
  );
}
