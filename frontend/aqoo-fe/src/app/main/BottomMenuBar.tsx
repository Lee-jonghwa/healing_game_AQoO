"use client";

import { AquariumData, UserInfo } from "@/types";
import axios, { AxiosResponse } from "axios";
import { useEffect, useState } from "react";

import MenuButton from "./MenuButton";
import { useAuth } from "@/hooks/useAuth"; // ✅ 로그인된 유저 정보 가져오기
import { useRouter } from "next/navigation";
import { useSFX } from "@/hooks/useSFX"; // ✅ useSFX 적용

const API_BASE_URL = "https://i12e203.p.ssafy.io/api/v1";

export default function BottomMenuBar({
  setActiveComponent,
  activeComponent, // 현재 활성화된 컴포넌트 상태 추가
  userInfo,
  aquariumData,
  refreshAquariumData, // ✅ 어항 상태 새로고침 함수
  onOpenFishModal,
  handleIncreaseExp, // ✅ 경험치 증가 함수 추가
  newNotifications,
}: {
  setActiveComponent: (value: string | null) => void;
  activeComponent: string | null; // 현재 활성화된 컴포넌트 상태 추가
  userInfo: UserInfo;
  aquariumData?: AquariumData;
  refreshAquariumData: () => void;
  handleIncreaseExp: (earnedExp: number) => void;
  onOpenFishModal: () => void;
  newNotifications: boolean;
}) {
  const router = useRouter();

  const { play: playModal } = useSFX("/sounds/clickeffect-03.mp3");
  const { play: playFeed } = useSFX("/sounds/gaugeeffect-02.mp3");

  // ✅ 버튼이 비활성화되는 상태 체크
  const isWaterMaxed = aquariumData?.waterStatus === 5;
  const isPollutionMaxed = aquariumData?.pollutionStatus === 5;
  const isFeedMaxed = aquariumData?.feedStatus === 5;

  // 버튼 클릭 핸들러
  const handleButtonClick = (component: string) => {
    if (activeComponent === component) {
      setActiveComponent(null);
    } else {
      setActiveComponent(component);
    }
  };

  // ✅ Water & Feed 버튼 클릭 시 실행할 함수 (type에 따라 분기)
  const handleAquariumUpdate = async (type: "water" | "feed") => {
    if (!userInfo?.mainAquarium) return;

    // ✅ 만약 상태가 최대(5)라면 실행 X, Alert 띄우기
    if ((type === "water" && isWaterMaxed) || (type === "feed" && isFeedMaxed)) {
      alert(`👍👍 ${type === "water" ? "수질이 이미 최고 상태입니다!" : "먹이가 이미 가득 찼습니다!"} 👍👍`);
      return;
    }

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
      await handleIncreaseExp(type === "water" ? 10 : 10);
      console.log("✅ 경험치 지급 성공");

      // 3️⃣ 어항 상태 & 유저 정보 다시 불러오기
      refreshAquariumData();
      playFeed();
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
  const progressBarWidth = Math.max(0, Math.min(expProgress, 100));
  const { auth } = useAuth(); // ✅ 로그인된 사용자 정보 가져오기

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-full max-w-[1400px] bg-white/70 rounded-lg px-3 flex flex-wrap items-center justify-between shadow-lg backdrop-blur-md">
      {/* 좌측 메뉴 */}
      <div className="flex space-x-2 md:space-x-4">
        {/* ✅ MyPage는 페이지 이동 */}
        <MenuButton icon="/icon/icon-fishTank.png" label="MyPage" onClick={() => router.push("/mypage")} />

        {/* ✅ 친구 목록 */}
        <MenuButton
          icon="/icon/friendIcon.png"
          label="Friends"
          onClick={() => {
            playModal();
            handleButtonClick("friends");
          }}
          isActive={activeComponent === "friends"}
        />

        {/* ✅ Push 알림 */}
        <div className="relative">
          {/* 푸시 알람 버튼 */}
          <MenuButton
            icon="/icon/alertIcon.png"
            label="Push"
            onClick={() => {
              playModal();
              handleButtonClick("push");
            }}
            isActive={activeComponent === "push"}
          />

          {/* 알림 동그라미 애니메이션 */}
          {newNotifications && <div className="notification-dot absolute top-2 right-2" />}
        </div>

        {/* ✅ Game 히스토리 */}
        <MenuButton icon="/icon/gameIcon.png" label="Game" onClick={() => router.push("/gameroom")} />

        {/* ✅ FishTicket 물고기 뽑기 */}
        <MenuButton
          icon="/icon/fishticketIcon.png"
          label="Ticket"
          onClick={() => {
            playModal();
            onOpenFishModal();
          }}
        />
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
        <StatusBar
          icon="icon/waterIcon.png"
          label="어항 수질"
          value={aquariumData?.waterStatus ?? 0}
          color="bg-blue-900"
        />
        <StatusBar
          icon="icon/cleanIcon.png"
          label="청결도"
          value={aquariumData?.pollutionStatus ?? 0}
          color="bg-indigo-400"
        />
        <StatusBar icon="icon/feedIcon.png" label="포만감" value={aquariumData?.feedStatus ?? 0} color="bg-cyan-400" />{" "}
      </div>

      {/* 우측 메뉴 */}
      {/* TODO 청소하는 거 미디어파이프 말고 버튼으로도 처리할 수 있도록 */}
      <div className="flex space-x-2 md:space-x-4">
        <MenuButton icon="/icon/waterIcon.png" label="Water" onClick={() => handleAquariumUpdate("water")} />
        <MenuButton
          icon="/icon/cleanIcon.png"
          label="Clean"
          onClick={() => {
            if (isPollutionMaxed) {
              alert("👍👍 청결 상태가 이미 최고 상태입니다! 👍👍");
              return;
            }
            setActiveComponent("clean");
          }}
          isActive={activeComponent === "clean"} // 현재 활성화 여부
        />
        <MenuButton icon="/icon/feedIcon.png" label="Feed" onClick={() => handleAquariumUpdate("feed")} />
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
      <img src={`/${icon}`} alt={label} className="w-[24px] h-[24px] md:w-[24px] md:h-[24px]" />

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
