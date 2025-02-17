"use client";

import "@/lib/firebase"; // Firebase 초기화
import React, { useEffect, useState, Suspense } from "react";
import axios, { AxiosResponse } from "axios";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import CollectionItemCard from "./components/CollectionItemCard"; // 물고기 카드 컴포넌트
import Fish from "@/components/Fish"; // 물고기 움직임 로직을 포함한 컴포넌트
import { authAtom } from "@/store/authAtom";
import { useRecoilValue } from "recoil";

// 타입 정의
interface FishData {
  aquariumId: number;
  fishId: number;
  fishTypeId: number;
  fishName: string;
  fishImage: string;
  rarity: "COMMON" | "RARE" | "EPIC" | string;
  size: "XS" | "S" | "M" | "L" | "XL";
}

interface AquariumData {
  id: number;
  aquariumBackground: string;
  aquariumName: string;
  lastFedTime: string;
  lastWaterChangeTime: string;
  lastCleanedTime: string;
  feedStatus: number;
  pollutionStatus: number;
  waterStatus: number;
  userId: string;
  // 기존에는 fishes 필드를 포함했으나, 이제 별도 API로 불러옵니다.
}

interface UserInfo {
  id: number;
  mainAquarium: number;
  // 기타 필요한 필드
}

// 응답 DTO 예시
interface GetFriendFishResponseDto {
  message: string;
  success: boolean;
}

const API_BASE_URL = "https://i12e203.p.ssafy.io/api/v1";

function FriendFishContent() {
  const auth = useRecoilValue(authAtom);
  const searchParams = useSearchParams();
  const router = useRouter();
  const friendId = searchParams.get("friendId") || "";

  // friendId가 없으면 /main으로 리다이렉트
  useEffect(() => {
    if (!friendId) {
      router.push("/main");
    }
  }, [friendId, router]);

  // 상태 변수 선언
  const [friendUserInfo, setFriendUserInfo] = useState<UserInfo | null>(null);
  const [aquariumData, setAquariumData] = useState<AquariumData | null>(null);
  // 기존 어항 데이터의 fishes 배열 대신 별도 상태로 관리
  const [fishes, setFishes] = useState<FishData[]>([]);
  const [background, setBackground] = useState("/background-1.png");
  const [loading, setLoading] = useState(true);
  const [showFishList, setShowFishList] = useState(false);

  // 1. 친구 유저 정보 불러오기
  useEffect(() => {
    if (friendId) {
      axios
        .get(`${API_BASE_URL}/users/${friendId}`)
        .then((res: AxiosResponse<UserInfo>) => {
          setFriendUserInfo(res.data);
        })
        .catch((err) => {
          setLoading(false);
        });
    }
  }, [friendId]);

  // 2. 어항 상세 정보 불러오기 (친구의 mainAquarium 사용)
  useEffect(() => {
    if (friendUserInfo?.mainAquarium) {
      axios
        .get(`${API_BASE_URL}/aquariums/${friendUserInfo.mainAquarium}`)
        .then((res: AxiosResponse<AquariumData>) => {
          setAquariumData(res.data);
          const bgUrl =
            "https://i12e203.p.ssafy.io/images" + res.data.aquariumBackground;
          setBackground(bgUrl);
        })
        .catch((err) => console.error("어항 정보 불러오기 실패:", err))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [friendUserInfo]);

  // 3. 친구의 물고기 데이터 별도 불러오기 (새 엔드포인트 사용)
  useEffect(() => {
    if (friendUserInfo?.mainAquarium) {
      axios
        .get(`${API_BASE_URL}/aquariums/friend/${friendId}`)
        .then((res: AxiosResponse<FishData[] | { message: string }>) => {
          if (Array.isArray(res.data)) {
            setFishes(res.data);
            console.log("물고기 데이터 : ", res.data);
            console.log("현재 유저 아이디 : ", auth.user?.id);
          } else {
            console.warn("물고기 데이터가 없습니다.");
            setFishes([]);
          }
        })
        .catch((err) =>
          console.error("친구 물고기 데이터 불러오기 실패:", err)
        );
    }
  }, [friendUserInfo?.mainAquarium]);

  // 정렬: rarity가 COMMON, RARE, EPIC 인 물고기는 우선순위 1, 그 외는 0으로 하여 앞쪽에 오도록
  const sortedFishes = [...fishes].sort((a, b) => {
    const raritySet = new Set(["COMMON", "RARE", "EPIC"]);
    const aPriority = raritySet.has(a.rarity) ? 1 : 0;
    const bPriority = raritySet.has(b.rarity) ? 1 : 0;
    return aPriority - bPriority;
  });

  // "가져오기" 버튼 클릭 시 POST 요청 보내는 함수
const handleGetFish = (fish: FishData) => {
  // GetFriendFishRequestDto: { userId, fishTypeId, fishName }
  const payload = {
    userId: auth.user?.id, // authAtom에서 가져온 현재 로그인한 사용자 ID 사용
    friendId,
    fishTypeId: fish.fishTypeId,
    fishName: fish.fishName,
  };

  axios
    .post(`${API_BASE_URL}/aquariums/friendFish`, payload)
    .then((res: AxiosResponse<GetFriendFishResponseDto>) => {
      const { message, success } = res.data;
      alert(message);
      if (success) {
        // 성공 시, 이미 가져온 물고기이므로 목록 업데이트 (예: 해당 물고기 제거)
        setFishes((prev) => prev.filter((f) => f.fishId !== fish.fishId));
      }
    })
    .catch((error) => {
      console.error("친구 물고기 가져오기 실패:", error);
      alert("물고기를 가져오는 데 실패했습니다.");
    });
};

  if (loading) return <div>로딩 중...</div>;
  if (!friendUserInfo || !aquariumData)
    return <div>데이터를 불러오는데 실패했습니다.</div>;

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <title>친구의 아쿠아리움</title>

      {/* 배경 이미지 */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${background})` }}
      ></div>

      {/* 뒤로가기 버튼 */}
      <div className="absolute top-16 left-4 z-50">
        <Link href="/main">
          <button className="bg-black text-white p-2 rounded">뒤로가기</button>
        </Link>
      </div>

      {/* 친구 어항정보 헤더 */}
      <div className="absolute top-32 left-4 z-50 text-white p-2 bg-black/30 rounded">
        <h1 className="text-xl font-bold">친구의 아쿠아리움</h1>
        <p>친구 ID: {friendId}</p>
        <p>어항 이름: {aquariumData.aquariumName}</p>
      </div>

      {/* 물고기 아이콘 렌더링 (Fish 컴포넌트를 사용) */}
      {sortedFishes && sortedFishes.length > 0 ? (
        sortedFishes.map((fish) => <Fish key={fish.fishId} fish={fish} />)
      ) : (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white">
          물고기가 없습니다.
        </div>
      )}

      {/* 친구 물고기 보기 버튼 */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-50">
        <button
          onClick={() => setShowFishList(true)}
          className="bg-blue-500 text-white p-2 rounded"
        >
          친구 물고기 보기
        </button>
      </div>

      {/* 친구 물고기 리스트 모달 */}
{showFishList && (
  <div
    className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center"
    onClick={() => setShowFishList(false)}  // 외부 클릭 시 모달 닫기
  >
    <div
      className="bg-white w-11/12 md:w-3/4 lg:w-1/2 xl:w-1/3 max-h-[80vh] rounded-lg p-4 overflow-y-auto"
      onClick={(e) => e.stopPropagation()} // 내부 클릭 시 전파 차단
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">친구 물고기 컬렉션</h2>
        <button
          onClick={() => setShowFishList(false)}
          className="text-red-500"
        >
          닫기
        </button>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {sortedFishes.map((fish, index) => {
          // rarity가 COMMON, RARE, EPIC 인 경우 버튼 비활성화
          const isEnabled = !["COMMON", "RARE", "EPIC"].includes(
            fish.rarity
          );
          return (
            <div key={index} className="flex flex-col items-center">
              <CollectionItemCard
                name={fish.fishName}
                count={1}
                imageSrc={fish.fishImage}
              />
              <button
                onClick={() => {
                  if (isEnabled) {
                    handleGetFish(fish);
                  }
                }}
                disabled={!isEnabled}
                className={`mt-1 px-2 py-1 rounded text-xs ${
                  isEnabled
                    ? "bg-green-500 text-white"
                    : "bg-gray-400 text-white cursor-not-allowed"
                }`}
              >
                가져오기
              </button>
            </div>
          );
        })}
      </div>
    </div>
  </div>
)}

    </div>
  );
}

export default function FriendFishPageWithSuspense() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <FriendFishContent />
    </Suspense>
  );
}
