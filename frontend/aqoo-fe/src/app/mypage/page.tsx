"use client";

import { UserInfo, AquariumData } from "@/types";

import MyCollection from "./components/MyCollection";
import Profile from "./components/Profile";
import HowToPlay from "./components/HowToPlay"

import { useUserFishCollectionTest } from "@/hooks/useUserFishCollection";
import { useAllFishCollectionTest } from "@/hooks/useAllFishCollection";
import { useCustomFishCollectionTest } from "@/hooks/useCustomFishCollection";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import axiosInstance from "@/services/axiosInstance";
import { AxiosResponse } from "axios";

import { useSFX } from "@/hooks/useSFX";

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

  const [logoWidth, setLogoWidth] = useState<number>(0);

  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false)


  // 접속 유저의 정보 조회
  useEffect(() => {
    if (!auth.user?.id) return; // 로그인한 유저 ID가 없으면 API 호출 안 함
    axiosInstance
      .get(`/users/${auth.user.id}`)
      .then((response: AxiosResponse<UserInfo>) => {
        // console.log("✅ 유저 정보:", response.data);
        setUserInfo(response.data);
      })
      .catch((error) => {
        // console.error("❌ 유저 정보 불러오기 실패", error);
      });
  }, [auth.user?.id]);

  useEffect(() => {
    // console.log("Fetching aquarium data...");

    if (!userInfo?.mainAquarium) return;

    // console.log("🐠 메인 아쿠아리움 ID:", userInfo.mainAquarium);

    axiosInstance
      .get(`/aquariums/${userInfo.mainAquarium}`)
      .then((res: AxiosResponse<AquariumData>) => {
        // console.log("✅ 어항 상세 정보:", res.data);
        setAquariumData(res.data);

        const BACKGROUND_BASE_URL = "https://i12e203.p.ssafy.io/images";
        console.log(res.data.aquariumBackground);
        let bgUrl = res.data.aquariumBackground; // API에서 받아온 값
        if (!bgUrl) return;

        // bgUrl이 전체 URL이 아니라면 BASE_URL을 붙임
        if (!bgUrl.startsWith("http")) {
          bgUrl = `${BACKGROUND_BASE_URL}/${bgUrl.replace(/^\/+/, "")}`;
        }
        // console.log("Setting background to:", bgUrl);
        setBackground(bgUrl);
      })
      .catch((err) => console.error("❌ 어항 정보 불러오기 실패"));
  }, [userInfo]);

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
        backgroundImage: `url(${background})`,
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
        relative h-screen w-[90%] sm:w-[70%] max-w-8xl mx-auto
        flex flex-col items-center overflow-hidden
        pt-16 sm:pt-12
        "
      >
        {/* 설정창 테스트 */}
        {/* <button
        onClick={() => setIsHowToPlayOpen(true)}
        className="text-3xl"
        >
          ?
        </button> */}
        {isHowToPlayOpen && <HowToPlay isOpen={isHowToPlayOpen} onClose={() => setIsHowToPlayOpen(false)}/>}
        <Profile fishTotal={totalFishCount} />
        <MyCollection allFishList={allFishList} userFishList={userFishList} customFishList={customFishList} />
      </div>
    </div>
  );
}
