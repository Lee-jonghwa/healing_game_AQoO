"use client";

import { Friend, SearchUser } from "@/types";
import axios, { AxiosResponse } from "axios";
import { useEffect, useRef, useState } from "react";

import Image from "next/image";
import Link from "next/link";
import axiosInstance from "@/services/axiosInstance";
import { useAuth } from "@/hooks/useAuth";
import { useInput } from "@/hooks/useInput";
import { useRouter } from "next/navigation";

// ✅ 친구 목록을 가져오는 함수 (외부에서도 사용할 수 있도록 분리)
export const fetchFriends = async (userId: string) => {
  try {
    const response = await axiosInstance.get(`/friends/${userId}`);
    return response.data.friends;
  } catch (error) {
    return null;
  }
};

export default function FriendsList({ onClose, userId }: { onClose: () => void; userId: string }) {
  const { auth, fetchUser } = useAuth();
  const [myFriends, setMyFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchInput = useInput("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // dummy Friend 객체 (랜덤방문 셀)
  const dummyFriend: Friend = {
    friendId: "random",
    nickname: "???",
    level: 999,
    id: 0,
    mainFishImage: "/default-fish.png", // 기본 이미지 경로 (적절히 수정)
  };

  // 랜덤방문 버튼 클릭 시: GET /friends/find-non-friend/{userId} 호출
  const handleDummyClick = () => {
    axiosInstance
      .get(`/friends/find-non-friend/${userId}`)
      .then((res: AxiosResponse<string>) => {
        const randomUserId = res.data; // 응답으로 랜덤한 한 사용자의 id만 반환됨
        if (randomUserId) {
          // alert(`랜덤 방문: ${randomUserId} (사용자 ID)`);
          // 예를 들어 해당 사용자 페이지로 이동할 수도 있습니다.
          router.push(`/myfriend?friendId=${randomUserId}`);
        } else {
          alert("방문할 비친구 사용자가 없습니다.");
        }
      })
      .catch((error) => {
        console.error("랜덤 방문 요청 실패:", error);
        alert("랜덤 방문 요청 실패");
      });
  };

  useEffect(() => {
    if (!auth.accessToken) {
      console.warn("🔄 토큰 만료 감지 - 사용자 정보 재요청...");
      fetchUser();
    }
    const fetchAndSetFriends = async () => {
      try {
        const response = await fetchFriends(userId); // 비동기 데이터 가져오기
        setMyFriends(response); // 상태 업데이트
      } catch (error) {
        console.error("친구 목록 불러오기 실패", error);
      }
    };
    fetchAndSetFriends();
  }, [userId]);

  // 친구 추가 함수
  const handleAddFriend = (friendId: string) => {
    axiosInstance
      .post(`/friends/request`, {
        userId: userId,
        friendId: friendId,
        status: "PENDING",
      })
      .then((response: AxiosResponse<{ relationshipId: number }>) => {
        setSearchResults((prev) => prev.map((user) => (user.friendId === friendId ? { ...user, isFriend: 1 } : user)));
      })
      .catch((error) => {
        alert("친구 추가에 실패했습니다. 다시 시도하세요.");
        console.error("친구 추가 요청 실패", error);
      });
  };

  // 친구 삭제 함수
  const handleDeleteFriend = (relationshipId: number) => {
    axiosInstance
      .delete(`/friends/delete`, { data: { relationshipId } })
      .then(() => {
        setMyFriends((prev) => prev.filter((friend) => friend.id !== relationshipId));
      })
      .catch((error) => console.error("친구 삭제 실패", error));
  };

  // 친구 검색 API 호출
  const handleSearch = () => {
    if (!searchInput.value.trim()) {
      setSearchResults([]);
      return;
    }
    axiosInstance
      .get(`/friends/find-users/${searchInput.value}`, {
        withCredentials: true,
      })
      .then((response: AxiosResponse<SearchUser[]>) => {
        setSearchResults(response.data);
      })
      .catch((error) => {
        console.error("사용자 검색 실패", error);
        setError("사용자 목록을 불러오는데 실패했습니다.");
      })
      .finally(() => setLoading(false));
  };

  // 엔터 키 입력 시 검색 실행
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      handleSearch();
    }
  };

  // 검색창 외부 클릭 시 검색 결과 숨기기
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setSearchResults([]);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      className="
    relative
    /* 모바일 기본값 */
    w-[300px] h-[350px]
    /* sm: 640px 이상일 때 적용할 값 */
    sm:w-[400px] sm:h-[600px]
    bg-white bg-opacity-70
    border border-black
    rounded-lg
    shadow-lg
    p-4
    flex
    flex-col
  "
    >
      {" "}
      {/* 헤더 */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">
          친구 <span className="ml-3">{myFriends.length}</span>
        </h2>
        <button onClick={onClose} className="text-xl font-bold hover:text-red-500">
          ✖
        </button>
      </div>
      <div className="mb-4 ml-2 text-sm sm:text-base">친구의 어항이 궁금하다면, 클릭하세요!</div>
      {/* 친구 리스트 */}
      <div className="space-y-2 overflow-y-auto scrollbar-hide flex-grow">
        {/* 맨 첫 칸에 랜덤방문 셀 추가 */}
        <FriendItem friend={dummyFriend} handleDeleteFriend={() => {}} isDummy={true} onDummyClick={handleDummyClick} />
        {myFriends.length > 0 ? (
          myFriends.map((friend) => (
            <FriendItem key={friend.friendId} friend={friend} handleDeleteFriend={handleDeleteFriend} />
          ))
        ) : (
          <p className="text-sm sm:text-base text-center text-gray-500">아직 친구가 없습니다.</p>
        )}
      </div>
      {/* 검색창 + 버튼 + 검색 결과 리스트 */}
      <div className="relative mt-4" ref={searchContainerRef}>
        {searchResults.length > 0 && (
          <div className="absolute bottom-full left-0 w-full bg-white border border-black rounded-lg shadow-lg p-3 max-h-[200px] overflow-y-auto scrollbar-hide z-10">
            {searchResults.map((user, index) => (
              <SearchResultItem key={index} user={user} handleAddFriend={handleAddFriend} />
            ))}
          </div>
        )}
        <div className="flex items-center border border-gray-400 rounded-lg p-2 bg-white w-full">
          <input
            type="text"
            className="w-full px-3 py-1 outline-none text-sm"
            placeholder="아이디로 친구 검색"
            {...searchInput}
            onFocus={handleSearch}
            onKeyDown={handleKeyDown}
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

// FriendItem 컴포넌트: 친구 항목 클릭 시 해당 친구의 ID를 가지고 /myfriend 페이지로 라우팅 또는 dummy일 경우 별도 처리
function FriendItem({
  friend,
  handleDeleteFriend,
  isDummy = false,
  onDummyClick,
}: {
  friend: Friend;
  handleDeleteFriend: (relationshipId: number) => void;
  isDummy?: boolean;
  onDummyClick?: () => void;
}) {
  const customLoader = ({ src }: { src: string }) => src;

  return (
    <div className="relative p-2 sm:p-3 bg-white rounded-lg border border-black flex items-center space-x-3 cursor-pointer hover:bg-gray-100 group">
      {isDummy ? (
        <div
          className="flex items-center space-x-3 w-full"
          onClick={() => {
            if (isDummy && onDummyClick) {
              onDummyClick(); // 더미일 때 클릭 시 실행될 함수
            }
          }}
        >
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden bg-gray-300 flex items-center justify-center">
            <span className="text-xs">?</span>
          </div>
          <div>
            <p className="text-xs sm:text-sm">Lv. ???</p>
            <p className="text-sm sm:text-base font-bold">랜덤방문</p>
            <p className="text-xs sm:text-s text-gray-500">@???</p>
          </div>
        </div>
      ) : (
        <Link href={`/myfriend?friendId=${friend.friendId}`} className="flex items-center space-x-3 w-full">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden">
            <Image
              loader={customLoader}
              src={friend.mainFishImage}
              alt={friend.nickname}
              width={12}
              height={12}
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <p className="text-xs">Lv. {friend.level}</p>
            <p className="text-sm sm:text-base font-bold">{friend.nickname}</p>
            <p className="text-xs sm:text-sm text-gray-500">@{friend.friendId}</p>
          </div>
        </Link>
      )}
      {!isDummy && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDeleteFriend(friend.id); // 삭제 처리
          }}
          className="absolute right-3 px-3 py-1 bg-red-500 text-white text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        >
          삭제
        </button>
      )}
    </div>
  );
}

// SearchResultItem 컴포넌트: 검색 결과 목록
function SearchResultItem({
  user,
  handleAddFriend,
}: {
  user: SearchUser;
  handleAddFriend: (friendId: string) => void;
}) {
  const customLoader = ({ src }: { src: string }) => src;

  return (
    <div className="p-3 bg-white mb-2 rounded-lg border border-black flex items-center justify-between space-x-3">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-300 rounded-full">
          <Image
            loader={customLoader}
            src={user.mainFishImage}
            alt={user.nickname}
            width={10}
            height={10}
            className="w-full h-full object-contain"
          />
        </div>
        <div>
          <p className="text-xs">Lv. {user.level}</p>
          <p className="text-sm sm:text-base font-bold">{user.nickname}</p>
          <p className="text-xs sm:text-sm text-gray-500">@{user.friendId}</p>
        </div>
      </div>
      {user.isFriend === 0 ? (
        <button
          onClick={() => handleAddFriend(user.friendId)}
          className="py-1 sm:px-3 px-2 bg-blue-500 text-white text-xs rounded-md hover:bg-blue-600"
        >
          친구 추가
        </button>
      ) : user.isFriend === 1 ? (
        <button className="px-3 py-1 bg-yellow-400 text-white text-xs rounded-md cursor-default" disabled>
          대기 중
        </button>
      ) : (
        <button className="px-3 py-1 bg-gray-400 text-white text-xs rounded-md cursor-default" disabled>
          친구
        </button>
      )}
    </div>
  );
}
