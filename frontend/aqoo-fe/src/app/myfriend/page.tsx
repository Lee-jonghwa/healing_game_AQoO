"use client";

import "@/lib/firebase"; // Firebase 초기화
import React, { useEffect, useRef, useState, Suspense } from "react";
import axios, { AxiosResponse } from "axios";
import Image from "next/image";
import { gsap } from "gsap";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import CollectionItemCard from "./components/CollectionItemCard"; // 물고기 카드 컴포넌트

// 타입 정의
interface FishInfo {
  fish: string;
  cnt: number;
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
  fishes: FishInfo[];
}

interface UserInfo {
  id: number;
  mainAquarium: number;
  // 기타 필요한 필드
}

const API_BASE_URL = "https://i12e203.p.ssafy.io/api/v1";

// FriendFishContent 컴포넌트: 모든 로직이 여기에 있음.
function FriendFishContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const friendId = searchParams.get("friendId");

  // friendId가 없으면 즉시 /main으로 리다이렉트
  useEffect(() => {
    if (!friendId) {
      router.push("/main");
    }
  }, [friendId, router]);

  // 상태 변수들 (조건 없이 최상위에 선언)
  const [friendUserInfo, setFriendUserInfo] = useState<UserInfo | null>(null);
  const [aquariumData, setAquariumData] = useState<AquariumData | null>(null);
  const [background, setBackground] = useState("/background-1.png");
  const [loading, setLoading] = useState(true);
  const [showFishList, setShowFishList] = useState(false);

  // friendId가 없으면 단순히 null 반환
  if (!friendId) return null;

  // 1. 친구 유저 정보 불러오기
  useEffect(() => {
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
    }
  }, [friendUserInfo]);

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

      {/* 물고기 아이콘 렌더링 (애니메이션) */}
      {aquariumData.fishes && aquariumData.fishes.length > 0 ? (
        aquariumData.fishes.map((fishInfo) =>
          Array.from({ length: fishInfo.cnt }, (_, i) => (
            <Fish key={`${fishInfo.fish}-${i}`} fishInfo={fishInfo} />
          ))
        )
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
          {/* 모달: 작고 반응형 (4열 그리드) */}
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
            {/* 4열 그리드 - 각 카드 아래에 가져오기 버튼 추가 (물고기 개수는 표시하지 않음) */}
            <div className="grid grid-cols-4 gap-2">
              {aquariumData.fishes.map((fishInfo, index) => (
                <div key={index} className="flex flex-col items-center">
                  <CollectionItemCard
                    name={fishInfo.fish}
                    count={1} // 개수 표시 없이 처리
                    imageSrc={getFishImageUrl(fishInfo.fish)}
                  />
                  <button
                    onClick={() => {
                      alert(`${fishInfo.fish}를 가져왔습니다!`);
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

// 헬퍼 함수: 물고기 이름 기반 이미지 URL 생성 (실제 경로에 맞게 수정)
function getFishImageUrl(fishName: string): string {
  return `https://i12e203.p.ssafy.io/images/${encodeURIComponent(
    fishName
  )}.png`;
}

// 물고기 컴포넌트 (GSAP 애니메이션 포함)
function Fish({ fishInfo }: { fishInfo: FishInfo }) {
  const fishRef = useRef<HTMLImageElement | null>(null);
  const directionRef = useRef(1);

  const handleClick = () => {
    if (!fishRef.current) return;
    gsap.to(fishRef.current, {
      scale: 0.9,
      duration: 0.15,
      ease: "power1.inOut",
      yoyo: true,
      repeat: 1,
    });
  };

  useEffect(() => {
    if (!fishRef.current) return;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const safeMargin = 80;
    const bottomMargin = 100;
    const upperLimit = windowHeight * 0.2;
    const randomStartX =
      Math.random() * (windowWidth - 2 * safeMargin) + safeMargin;
    const randomStartY =
      Math.random() * (windowHeight - bottomMargin - 50) + 50;

    gsap.set(fishRef.current, {
      x: randomStartX,
      y: randomStartY,
      scaleX: -1,
    });

    const moveFish = () => {
      if (!fishRef.current) return;
      const randomSpeed = Math.random() * 7 + 9;
      const maxMoveX = windowWidth * (0.4 + Math.random() * 0.4);
      let moveDistanceX = maxMoveX * (Math.random() > 0.5 ? 1 : -1);
      const currentY = parseFloat(gsap.getProperty(fishRef.current, "y") as string);
      let moveDistanceY =
        windowHeight * (0.1 + Math.random() * 0.15) * (Math.random() > 0.65 ? 1 : -1);

      if (currentY < upperLimit) {
        moveDistanceY = windowHeight * (0.1 + Math.random() * 0.2);
      }

      let newX =
        parseFloat(gsap.getProperty(fishRef.current, "x") as string) +
        moveDistanceX;
      let newY = currentY + moveDistanceY;

      if (newX < safeMargin) {
        newX = safeMargin + Math.random() * 50;
        moveDistanceX = Math.abs(moveDistanceX);
      }
      if (newX > windowWidth - safeMargin) {
        newX = windowWidth - safeMargin - Math.random() * 50;
        moveDistanceX = -Math.abs(moveDistanceX);
      }
      if (newY < 50) newY = 50 + Math.random() * 30;
      if (newY > windowHeight - bottomMargin)
        newY = windowHeight - bottomMargin - Math.random() * 30;

      directionRef.current = moveDistanceX > 0 ? -1 : 1;

      gsap.to(fishRef.current, {
        x: newX,
        y: newY,
        scaleX: directionRef.current,
        duration: randomSpeed,
        ease: "power2.inOut",
        onUpdate: () => {
          const prevX = parseFloat(gsap.getProperty(fishRef.current, "x") as string);
          directionRef.current = newX > prevX ? -1 : 1;
          gsap.set(fishRef.current, { scaleX: directionRef.current });
        },
        onComplete: moveFish,
      });
    };

    moveFish();
  }, []);

  return (
    <Image
      loader={({ src }) => src}
      ref={fishRef}
      src={getFishImageUrl(fishInfo.fish)}
      alt={fishInfo.fish}
      width={64}
      height={64}
      className="absolute"
      onClick={handleClick}
      unoptimized
    />
  );
}

// FriendFishPage를 Suspense로 감싸서 searchParams 사용부분을 기다림
export default function FriendFishPageWithSuspense() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <FriendFishPage />
    </Suspense>
  );
}
