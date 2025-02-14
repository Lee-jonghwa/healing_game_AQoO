"use client";

import { UserInfo, AquariumData } from "@/types";

import Link from "next/link";
import FishTankTabs from "./components/FishTankTabs";
import axiosInstance from "@/services/axiosInstance";
import { AxiosResponse } from "axios";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";

export default function MyFishTank() {
  const { auth, logout } = useAuth();
  const userId = auth?.user?.id;
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [aquariumData, setAquariumData] = useState<AquariumData | null>(null);
  const [background, setBackground] = useState("/background-1.png");

  useEffect(() => {
    if (!auth.user?.id) return;
    axiosInstance
      .get(`/users/${auth.user.id}`)
      .then((response: AxiosResponse<UserInfo>) => {
        setUserInfo(response.data);
      })
      .catch((error) => {
        console.error("유저 정보 불러오기 실패", error);
      });
  }, [auth.user?.id]);

  useEffect(() => {
    console.log("Fetching aquarium data");
    if (!userInfo?.mainAquarium) return;

    axiosInstance
      .get(`/aquariums/${userInfo.mainAquarium}`)
      .then((response: AxiosResponse<AquariumData>) => {
        setAquariumData(response.data);

        const BACKGROUND_BASE_URL = "https://i12e203.p.ssafy.io/images";

        let bgUrl = response.data.aquariumBackground;

        if (!bgUrl) return;

        if (!bgUrl.startsWith("http")) {
          bgUrl = `${BACKGROUND_BASE_URL}/${bgUrl.replace(/^\/+/, "")}`;
        }
        setBackground(bgUrl);
      })
      .catch((err) => console.log(err));
  }, [userInfo]);
  return (
    <div
      style={{ backgroundImage: `url(${background})` }}
      className="
        flex flex-col
        min-h-screen
        bg-cover bg-center bg-no-repeat
      "
    >
      {/* 상단 내비게이션 버튼 */}
      <div className="absolute top-0 left-0 m-2">
        <Link
          href="/mypage"
          className="
            block
            min-w-[80px] h-10 px-2
            rounded-xl border border-[#040303] bg-white
            shadow-inner
            flex items-center justify-center
            text-[#040303] text-center font-normal text-xl leading-none
            font-[NeoDunggeunmo_Pro]
            sm:min-w-[80px] sm:h-10
            md:min-w-[100px] md:h-12
          "
        >
          BACK
        </Link>
      </div>
      {/* 메인 컨테이너 */}
      <div
        className="
          flex flex-col items-center justify-center
          flex-1 overflow-hidden
          p-4 sm:p-6 md:p-8
        "
      >
        {/* 실제 탭 + 내용 */}
        <FishTankTabs onBackgroundChange={setBackground} />
      </div>
    </div>
  );
}
