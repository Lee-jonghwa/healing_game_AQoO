"use client";

import { UserInfo, AquariumData } from "@/types";

import MyCollection from "./components/MyCollection";
import Profile from "./components/Profile";

import { useUserFishCollectionTest } from "@/hooks/useUserFishCollection";
import { useAllFishCollectionTest } from "@/hooks/useAllFishCollection";
import { useCustomFishCollectionTest } from "@/hooks/useCustomFishCollection";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import axiosInstance from "@/services/axiosInstance";
import { AxiosResponse } from "axios";

export default function MyPage() {
  const { auth, logout } = useAuth();
  const router = useRouter();
  const userId = auth?.user?.id;
  const { fishList: userFishList, isLoading: userLoading } = useUserFishCollectionTest(userId);
  const { fishList: allFishList } = useAllFishCollectionTest();
  const { fishList: customFishList, isLoading: customLoading } = useCustomFishCollectionTest(userId);

  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [aquariumData, setAquariumData] = useState<AquariumData | null>(null);
  const [background, setBackground] = useState("/background-1.png");

  // 총 물고기
  const totalFishCount = userFishList.reduce((acc, fish) => acc + fish.cnt, 0) + customFishList.length;

  const API_BASE_URL = "https://i12e203.p.ssafy.io";

  // 로그아웃 기능 핸들러
  const handleLogout = async () => {
    try {
      await logout();
      router.push("/");
    } catch (error) {
      console.error("Logout Failed:", error);
    }
  };

  // 접속 유저의 정보 조회
  useEffect(() => {
    if (!auth.user?.id) return; // 로그인한 유저 ID가 없으면 API 호출 안 함
    axiosInstance
      .get(`/users/${auth.user.id}`)
      .then((response: AxiosResponse<UserInfo>) => {
        console.log("✅ 유저 정보:", response.data);
        setUserInfo(response.data);
      })
      .catch((error) => {
        console.error("❌ 유저 정보 불러오기 실패", error);
      });
  }, [auth.user?.id]);

  // 어항 상세 정보 및 배경 정보 조회
  useEffect(() => {
    console.log("Fetching aquarium data...");
    if (!userInfo?.mainAquarium) return;

    console.log("🐠 메인 아쿠아리움 ID:", userInfo.mainAquarium);

    axiosInstance
      .get(`/aquariums/${userInfo.mainAquarium}`)
      .then((res: AxiosResponse<AquariumData>) => {
        console.log("✅ 어항 상세 정보:", res.data);
        setAquariumData(res.data);

        const BACKGROUND_BASE_URL = "https://i12e203.p.ssafy.io/images";
        // TODO  배경화면 제대로 불러오기 로직 추가
        // const savedBg = localStorage.getItem("background");

        let bgUrl = res.data.aquariumBackground; // API에서 받아온 값

        if (!bgUrl) return;

        // bgUrl이 전체 URL이 아니라면 BASE_URL을 붙임
        if (!bgUrl.startsWith("http")) {
          bgUrl = `${BACKGROUND_BASE_URL}/${bgUrl.replace(/^\/+/, "")}`;
        }
        console.log("Setting background to:", bgUrl);
        setBackground(bgUrl);
      })
      .catch((err) => console.error("❌ 어항 정보 불러오기 실패", err));
  }, [userInfo]);

  return (
    <div
      style={{ backgroundImage: `url(${background})` }}
      className={`
        flex
        h-screen
        bg-cover bg-center bg-no-repeat
        relative
      `}
    >
      {/* 왼쪽 상단 Home 버튼 */}
      <Link
        href="/main"
        className="
          absolute top-2 left-2 z-50
          flex items-center justify-center
          min-w-[80px] h-10 px-2
          border border-[#040303] rounded-xl
          [box-shadow:-2px_-2px_0px_1px_rgba(0,0,0,0.5)_inset]
          bg-white
          text-[#070707] text-center font-medium text-2xl leading-none
          sm:h-12 sm:text-lg
          md:min-w-[60px] md:h-8 md:text-xl
          lg:min-w-[80px] lg:h-10 lg:text-2xl
        "
      >
        Home
      </Link>
      <button
        onClick={handleLogout}
        className="
          absolute bottom-2 left-2 z-50
          flex items-center justify-center
          min-w-[80px] h-10 px-2
          border border-[#040303] rounded-xl
          [box-shadow:-2px_-2px_0px_1px_rgba(0,0,0,0.5)_inset]
          bg-white
          text-[#070707] text-center font-medium text-2xl leading-none
          sm:h-12 sm:text-lg
          md:min-w-[60px] md:h-8 md:text-xl
          lg:min-w-[80px] lg:h-10 lg:text-2xl
        "
      >
        Logout
      </button>

      {/* 메인 컨테이너 (내 정보 & 도감) */}
      <div
        className="
        relative z-10 min-h-screen w-full max-w-8xl mx-auto
        flex flex-col items-center overflow-hidden"
      >
        <Profile fishTotal={totalFishCount} />
        <MyCollection allFishList={allFishList} userFishList={userFishList} customFishList={customFishList} />
      </div>
    </div>
  );
}
