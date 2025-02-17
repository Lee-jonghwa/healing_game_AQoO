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

  const [logoWidth, setLogoWidth] = useState<number>(0);

  useEffect(() => {
    const updateLogoWidth = () => {
      const logoElement = document.getElementById("navbar-logo");
      if (logoElement) {
        setLogoWidth(logoElement.offsetWidth);
      }
    };

    // 처음 한 번 실행
    updateLogoWidth();

    // 창 크기 변경 시 재측정 (옵션)
    window.addEventListener("resize", updateLogoWidth);
    return () => window.removeEventListener("resize", updateLogoWidth);
  }, [logoWidth]);

  return (
    <div
      style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.3), rgba(255,255,255,0.3)), url(${background})`,
        paddingLeft: `${logoWidth}px`,
      }}
      className={`
        flex
        h-screen
        bg-cover bg-center bg-no-repeat
        relative
      `}
    >
      {/* 메인 컨테이너 (내 정보 & 도감) */}
      <div
        className="
        relative z-10 h-screen w-[70%] max-w-8xl mx-auto
        flex flex-col items-center overflow-hidden
        pt-12
        "
      >
        <Profile fishTotal={totalFishCount} />
        <MyCollection allFishList={allFishList} userFishList={userFishList} customFishList={customFishList} />
      </div>
    </div>
  );
}
