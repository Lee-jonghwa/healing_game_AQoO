"use client";

import { AquariumData, UserInfo } from "@/types";
import axios, { AxiosResponse } from "axios";
import { useEffect, useState } from "react";

import MenuButton from "./MenuButton";
import { useAuth } from "@/hooks/useAuth"; // 로그인된 유저 정보 가져오기
import { useRouter } from "next/navigation";
import { useSFX } from "@/hooks/useSFX"; // useSFX 적용

const API_BASE_URL = "https://i12e203.p.ssafy.io/api/v1";

interface BottomMenuBarProps {
  setActiveComponent: (value: string | null) => void;
  activeComponent: string | null;
  userInfo: UserInfo;
  aquariumData?: AquariumData;
  refreshAquariumData: () => void;
  handleIncreaseExp: (earnedExp: number) => void;
  onOpenFishModal: () => void;
  newNotifications: boolean;
  handleToggleOverlay: () => void; // 오버레이 토글 함수
}

export default function BottomMenuBar({
  setActiveComponent,
  activeComponent,
  userInfo,
  aquariumData,
  refreshAquariumData,
  onOpenFishModal,
  handleIncreaseExp,
  newNotifications,
  handleToggleOverlay,
}: BottomMenuBarProps) {
  const router = useRouter();

  const { play: playModal } = useSFX("/sounds/clickeffect-03.mp3");
  const { play: playSuccess } = useSFX("/sounds/gaugeeffect-02.mp3");
  const { play: playWater } = useSFX("/sounds/waterEffect.mp3"); // 물 갈이 소리
  const { play: playFeed } = useSFX("/sounds/feedEffect.mp3"); // 먹이 주는 소리

  // 메뉴바 보이기/숨기기 상태
  const [isMenuVisible, setIsMenuVisible] = useState(true);

  // 토글 버튼 클릭 시 메뉴바 보이기/숨기기 변경
  const toggleMenuBar = () => {
    setIsMenuVisible((prev) => !prev);
    setActiveComponent(null); // 열려 있는 메뉴 닫기
  };

  // 버튼 비활성화 상태 체크
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

  // Water & Feed 버튼 클릭 시 실행할 함수 (type에 따라 분기)
  const handleAquariumUpdate = async (type: "water" | "feed") => {
    if (!userInfo?.mainAquarium) return;

    if ((type === "water" && isWaterMaxed) || (type === "feed" && isFeedMaxed)) {
      alert(
        `👍👍 ${
          type === "water"
            ? "수질이 이미 최고 상태입니다!"
            : "먹이가 이미 가득 찼습니다!"
        } 👍👍`
      );
      return;
    }

    try {
      await axios
        .post(`${API_BASE_URL}/aquariums/update`, {
          aquariumId: userInfo.mainAquarium,
          type: type,
          data: "",
        })
        .then(() => {
          console.log(
            `✅ 어항 ${type === "water" ? "수질 변경" : "먹이 상태 변경"} 성공`
          );

          if (type === "water") {
            playWater();
          } else {
            playFeed();
          }

          alert(
            `${type === "water" ? "물 갈이 성공!" : "먹이 주기 성공!"}`
          );
        });

      await handleIncreaseExp(10);
      console.log("✅ 경험치 지급 성공");

      refreshAquariumData();
      playSuccess();
    } catch (error) {
      console.error(`❌ 어항 ${type} 변경 실패`, error);
    }
  };

  // 현재 레벨에서 필요한 경험치량 계산
  const expToNextLevel = userInfo.level * 20;
  // 현재 경험치 진행도 계산 (최소 0%, 최대 100%)
  const expProgress = Math.max(
    0,
    Math.min((userInfo.exp / expToNextLevel) * 100, 100)
  );

  // Electron 환경 감지 (오버레이 토글 버튼 표시 여부에 사용)
  const isElectron =
    typeof navigator !== "undefined" &&
    navigator.userAgent.toLowerCase().includes("electron");

  return (
    <div className="fixed bottom-0 w-full flex flex-col items-center pb-2 md:pb-4">
      {/* 상단에 메뉴바 토글 버튼과 오버레이 토글 버튼을 같이 감싼 컨테이너 */}
      <div className="relative w-full max-w-[1400px]">
        {/* 메뉴바 보이기/숨기기 토글 버튼 */}
        <button
          onClick={toggleMenuBar}
          className={`absolute left-1/2 transform -translate-x-1/2 px-3 py-1 bg-white/80 rounded-full shadow-md hover:bg-white transition-all ease-in-out duration-500 ${
            isMenuVisible
              ? "bottom-[100%] mb-1 translate-y-0"
              : "bottom-2 translate-y-1"
          }`}
        >
          {isMenuVisible ? "▼" : "▲"}
        </button>

        {/* Electron 환경에서 오버레이 토글 버튼 (메뉴바와 함께 이동) */}
        {isElectron && (
          <button
            onClick={handleToggleOverlay}
            className={`absolute left-0 transition-all duration-500 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 z-50 ${
              isMenuVisible
                ? "bottom-[100%] mb-1 translate-y-0"
                : "bottom-2 translate-y-1"
            }`}
          >
            오버레이 온/오프
          </button>
        )}

        {/* BottomMenuBar 콘텐츠 */}
        <div
          className={`w-full bg-white/70 rounded-lg px-3 flex flex-wrap items-center justify-between shadow-lg backdrop-blur-md transition-all duration-500 ${
            isMenuVisible
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-12 pointer-events-none"
          } relative`}
        >
          {/* 좌측 메뉴 */}
          <div className="flex space-x-2 md:space-x-4">
            <MenuButton
              icon="/icon/icon-fishTank.png"
              label="MyPage"
              onClick={() => router.push("/mypage")}
            />

            <MenuButton
              icon="/icon/friendIcon.png"
              label="Friends"
              onClick={() => {
                playModal();
                handleButtonClick("friends");
              }}
              isActive={activeComponent === "friends"}
            />

            <div className="relative">
              <MenuButton
                icon="/icon/alertIcon.png"
                label="Push"
                onClick={() => {
                  playModal();
                  handleButtonClick("push");
                }}
                isActive={activeComponent === "push"}
              />
              {newNotifications && (
                <div className="notification-dot absolute top-2 right-2" />
              )}
            </div>

            <MenuButton
              icon="/icon/gameIcon.png"
              label="Game"
              onClick={() => router.push("/gameroom")}
            />

            <MenuButton
              icon="/icon/fishticketIcon.png"
              label="Ticket"
              onClick={() => {
                playModal();
                onOpenFishModal();
              }}
            />
          </div>

          {/* 중앙: 사용자 정보 및 경험치 */}
          <div className="flex flex-col items-center text-center">
            <p className="text-sm md:text-lg font-bold">
              Lv. {userInfo.level} {userInfo.nickname}
            </p>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-3 w-full">
                <p className="text-lg font-bold">exp</p>
                <div className="relative w-48 h-6 bg-gray-300 rounded-full overflow-hidden flex items-center">
                  <div
                    className="bg-blue-600 h-full transition-all duration-300"
                    style={{ width: `${expProgress}%` }}
                  ></div>
                  <p className="absolute inset-0 flex justify-center items-center text-base font-bold">
                    {userInfo.exp}
                  </p>
                </div>
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
            <StatusBar
              icon="icon/feedIcon.png"
              label="포만감"
              value={aquariumData?.feedStatus ?? 0}
              color="bg-cyan-400"
            />
          </div>

          {/* 우측 메뉴 */}
          <div className="flex space-x-2 md:space-x-4">
            <MenuButton
              icon="/icon/waterIcon.png"
              label="Water"
              onClick={() => handleAquariumUpdate("water")}
            />
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
              isActive={activeComponent === "clean"}
            />
            <MenuButton
              icon="/icon/feedIcon.png"
              label="Feed"
              onClick={() => handleAquariumUpdate("feed")}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* 상태 바 컴포넌트 */
function StatusBar({
  icon,
  label,
  value,
  color,
}: {
  icon: string;
  label: string;
  value: number;
  color: string;
}) {
  const segmentCount = 5;
  const activeSegments = Math.max(0, Math.min(value, segmentCount));

  return (
    <div className="flex items-center space-x-3">
      <img
        src={`/${icon}`}
        alt={label}
        className="w-[24px] h-[24px] md:w-[24px] md:h-[24px]"
      />
      <span className="w-[72px] md:w-[86px] text-xs md:text-base text-black text-center">
        {label}
      </span>
      <div className="w-40 md:w-48 h-4 md:h-5 flex border-2 border-black rounded-full overflow-hidden">
        {Array.from({ length: segmentCount }).map((_, index) => (
          <div
            key={index}
            className={`flex-1 border-l border-black ${
              index < activeSegments ? color : "bg-white"
            } ${index === 0 ? "rounded-l-full" : ""} ${
              index === segmentCount - 1 ? "rounded-r-full" : ""
            }`}
          />
        ))}
      </div>
    </div>
  );
}
