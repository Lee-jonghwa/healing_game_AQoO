"use client";

import { AquariumData, UserInfo } from "@/types";
import { useEffect, useState } from "react";

import axios from "axios";

import MenuButton from "./MenuButton";
import { useRouter } from "next/navigation";

const API_BASE_URL = "https://i12e203.p.ssafy.io/api/v1";

export default function BottomMenuBar({
  setActiveComponent,
  userInfo,
  aquariumData,
  refreshAquariumData, // ✅ 어항 상태 새로고침 함수
  refreshUserData, // ✅ 추가

  handleIncreaseExp, // ✅ 경험치 증가 함수 추가
}: {
  setActiveComponent: (value: string | null) => void;
  userInfo: UserInfo;
  aquariumData?: AquariumData;
  refreshAquariumData: () => void;
  refreshUserData: () => Promise<void>; // ✅ 추가
  handleIncreaseExp: (earnedExp: number) => void;
}) {
  const router = useRouter();

  // ✅ Water & Feed 버튼 클릭 시 실행할 함수 (type에 따라 분기)
  const handleAquariumUpdate = async (type: "water" | "feed") => {
    if (!userInfo?.mainAquarium) return;
    try {
      // 1️⃣ 어항 상태 업데이트 API 호출
      await axios
        .post(`${API_BASE_URL}/aquariums/update`, {
          aquariumId: userInfo.mainAquarium,
          type: type,
          data: "",
        })
        .then(() => {
          console.log(`✅ 어항 ${type === "water" ? "수질 변경" : "먹이 상태 변경"} 성공`);
          alert(`${type === "water" ? "물 갈이 성공!" : "먹이 주기 성공!"}`);
        });

      // ✅ 경험치 증가 및 레벨업 체크
      await handleIncreaseExp(type === "water" ? 5 : 8);
      console.log("✅ 경험치 지급 성공");

      // 3️⃣ 어항 상태 & 유저 정보 다시 불러오기
      refreshAquariumData();
    } catch (error) {
      console.error(`❌ 어항 ${type} 변경 실패`, error);
    }
  };

  // ✅ 현재 레벨에서 필요한 경험치량 계산
  // 🚀 현재 레벨에서 필요한 경험치 (다음 레벨업까지)
  const expToNextLevel = userInfo.level * 20;

  // 🚀 현재 경험치 진행도 (경험치 / 목표 경험치 비율)
  const expProgress = (userInfo.exp / expToNextLevel) * 100;

  // 🚀 경험치 바 최소 5% 보장
  const progressBarWidth = Math.max(5, Math.min(expProgress, 100));

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-full max-w-[1400px] bg-white/70 rounded-lg px-3 flex flex-wrap items-center justify-between shadow-lg backdrop-blur-md">
      {/* 좌측 메뉴 */}
      <div className="flex space-x-2 md:space-x-4">
        {/* ✅ MyPage는 페이지 이동 */}
        <MenuButton icon="/icon-fishTank.png" label="MyPage" onClick={() => router.push("/mypage")} />

        {/* ✅ 친구 목록 */}
        <MenuButton icon="/friendIcon.png" label="Friends" onClick={() => setActiveComponent("friends")} />

        {/* ✅ Push 알림 */}
        <MenuButton icon="/alertIcon.png" label="Push" onClick={() => setActiveComponent("push")} />

        {/* ✅ Game 히스토리 */}
        <MenuButton icon="/gameIcon.png" label="Game" onClick={() => router.push("/gameroom")} />
      </div>
      {/* 중앙: 사용자 정보 */}
      <div className="flex flex-col items-center text-center">
        <p className="text-sm md:text-lg font-bold">
          Lv. {userInfo.level} {userInfo.nickname}
        </p>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-3 w-full">
            {/* "exp" 텍스트 (왼쪽) */}
            <p className="text-lg font-bold">exp</p>

            {/* 경험치 바 컨테이너 */}
            <div className="relative w-48 h-6 bg-gray-300 rounded-full overflow-hidden flex items-center">
              {/* 경험치 진행 바 */}
              <div
                className="bg-blue-600 h-full transition-all duration-300"
                style={{ width: `${progressBarWidth}%` }}
              ></div>

              {/* 현재 경험치 텍스트 (바 안에 중앙) */}
              <p className="absolute inset-0 flex justify-center items-center text-base font-bold text">
                {userInfo.exp}
              </p>
            </div>

            {/* 목표 경험치 텍스트 (오른쪽) */}
            <p className="text-lg font-bold">{expToNextLevel}</p>
          </div>
        </div>
      </div>
      {/* 중앙: 어항 상태 바 */}
      <div className="flex flex-col space-y-1 p-1">
        <StatusBar icon="waterIcon.png" label="어항 수질" value={aquariumData?.waterStatus ?? 0} color="bg-blue-900" />
        <StatusBar
          icon="cleanIcon.png"
          label="청결도"
          value={aquariumData?.pollutionStatus ?? 0}
          color="bg-indigo-400"
        />
        <StatusBar icon="feedIcon.png" label="포만감" value={aquariumData?.feedStatus ?? 0} color="bg-cyan-400" />{" "}
      </div>

      {/* 우측 메뉴 */}
      {/* TODO 상태가 full일 경우는 동작할 수 없도록 막아야 함 */}
      <div className="flex space-x-2 md:space-x-4">
        <MenuButton icon="/waterIcon.png" label="Water" onClick={() => handleAquariumUpdate("water")} />
        <MenuButton icon="/cleanIcon.png" label="Clean" onClick={() => setActiveComponent("clean")} />
        <MenuButton icon="/feedIcon.png" label="Feed" onClick={() => handleAquariumUpdate("feed")} />
      </div>
    </div>
  );
}

/* 상태 바 */
function StatusBar({ icon, label, value, color }: { icon: string; label: string; value: number; color: string }) {
  const segmentCount = 5; // ✅ 상태 바는 총 5칸
  const activeSegments = Math.max(0, Math.min(value, segmentCount)); // ✅ 0~5 범위로 유지

  return (
    <div className="flex items-center space-x-3">
      {/* 아이콘 */}
      <img src={`/${icon}`} alt={label} className="w-6 h-6 md:w-8 md:h-8" />

      {/* 라벨 */}
      <span className="w-[72px] md:w-[86px] text-xs md:text-base text-black text-center">{label}</span>

      {/* 상태 바 */}
      <div className="w-40 md:w-48 h-4 md:h-5 flex border-2 border-black rounded-full overflow-hidden">
        {Array.from({ length: segmentCount }).map((_, index) => (
          <div
            key={index}
            className={`flex-1 border-l border-black ${index < activeSegments ? color : "bg-white"} ${
              index === 0 ? "rounded-l-full" : ""
            } ${index === segmentCount - 1 ? "rounded-r-full" : ""}`}
          />
        ))}
      </div>
    </div>
  );
}
