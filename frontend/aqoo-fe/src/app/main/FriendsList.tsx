"use client";

import { useEffect, useRef, useState } from "react";

import { useInput } from "@/hooks/useInput"; // useInput 훅을 사용

export default function FriendsList({ onClose }: { onClose: () => void }) {
  const [myFriends, setMyFriends] = useState([
    { username: "닉네임1", level: 12, handle: "아이디1" },
    { username: "닉네임2", level: 1, handle: "아이디2" },
    { username: "닉네임3", level: 4, handle: "아이디3" },
  ]);

  const searchInput = useInput("");
  const [searchResults, setSearchResults] = useState<{ username: string; level: number; handle: string }[]>([]);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // 🔹 친구 삭제 함수
  const handleDeleteFriend = (handle: string) => {
    setMyFriends((prev) => prev.filter((friend) => friend.handle !== handle));
  };

  // 🔹 검색 API 호출 (더미 데이터로 대체)
  const handleSearch = () => {
    if (!searchInput.value.trim()) {
      setSearchResults([]); // 검색어가 없으면 리스트 초기화
      return;
    }

    const allUsers = [
      { username: "닉네임1", level: 12, handle: "아이디1" },
      { username: "닉네임5", level: 8, handle: "아이디5" },
      { username: "닉네임6", level: 3, handle: "아이디6" },
    ];

    // 검색어를 포함하는 유저 필터링 (대소문자 무시)
    const results = allUsers.filter((user) => user.handle.toLowerCase().includes(searchInput.value.toLowerCase()));

    setSearchResults(results);
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
            <FriendItem key={friend.handle} friend={friend} handleDeleteFriend={handleDeleteFriend} />
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
              <SearchResultItem key={index} user={user} />
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
  friend: { username: string; level: number; handle: string };
  handleDeleteFriend: (handle: string) => void;
}) {
  return (
    <div className="relative p-3 bg-white rounded-lg border border-black flex items-center space-x-3 cursor-pointer hover:bg-gray-100 group">
      <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
      <div>
        <p className="text-xs">Lv. {friend.level}</p>
        <p className="font-bold">{friend.username}</p>
        <p className="text-sm text-gray-500">@{friend.handle}</p>
      </div>
      {/* 🔹 hover 시만 보이는 삭제 버튼 */}
      <button
        onClick={() => handleDeleteFriend(friend.handle)}
        className="absolute right-3 px-3 py-1 bg-red-500 text-white text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200"
      >
        삭제
      </button>
    </div>
  );
}

// 검색 결과 아이템 (친구 추가 가능)
function SearchResultItem({ user }: { user: { username: string; level: number; handle: string } }) {
  return (
    <div className="p-3 bg-white mb-2 rounded-lg border border-black flex items-center justify-between space-x-3">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
        <div>
          <p className="text-xs">Lv. {user.level}</p>
          <p className="font-bold">{user.username}</p>
          <p className="text-sm text-gray-500">@{user.handle}</p>
        </div>
      </div>
      <button className="px-3 py-1 bg-blue-500 text-white text-xs rounded-md">친구 추가</button>
    </div>
  );
}
