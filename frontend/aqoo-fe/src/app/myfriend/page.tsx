"use client";

import "@/lib/firebase"; // Firebase 초기화
import React, { useEffect, useState, Suspense } from "react";
import axios, { AxiosResponse } from "axios";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import CollectionItemCard from "./components/CollectionItemCard"; // 물고기 카드 컴포넌트
import Fish from "@/components/Fish"; // 물고기 움직임 로직을 포함한 컴포넌트

// 타입 정의
interface FishData {
  aquariumId: number;
  fishId: number;
  fishTypeId: number;
  fishName: string;
  fishImage: string;
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

const API_BASE_URL = "https://i12e203.p.ssafy.io/api/v1";

function FriendFishContent() {
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
          console.log("친구 유저 정보:", res.data);
          setFriendUserInfo(res.data);
        })
        .catch((err) => {
          console.error("친구 유저 정보 불러오기 실패:", err);
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
          console.log("어항 상세 정보:", res.data);
          setAquariumData(res.data);
          const bgUrl =
            "https://i12e203.p.ssafy.io/images" + res.data.aquariumBackground;
          console.log("배경 이미지 URL:", bgUrl);
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
          console.log("친구 물고기 데이터:", res.data);
          if (Array.isArray(res.data)) {
            setFishes(res.data);
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
      {fishes && fishes.length > 0 ? (
        fishes.map((fish) => <Fish key={fish.fishId} fish={fish} />)
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
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white w-11/12 max-w-sm rounded-lg p-4 overflow-auto">
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
              {fishes.map((fish, index) => (
                <div key={index} className="flex flex-col items-center">
                  <CollectionItemCard
                    name={fish.fishName}
                    count={1}
                    imageSrc={fish.fishImage}
                  />
                  <button
                    onClick={() => {
                      alert(`${fish.fishName}를 가져왔습니다!`);
                    }}
                    className="mt-1 bg-green-500 text-white px-2 py-1 rounded text-xs"
                  >
                    가져오기
                  </button>
                </div>
              ))}
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
