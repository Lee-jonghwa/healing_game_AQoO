"use client";

import { useState } from "react";
import MyFishCollection from "./MyFishCollection";
import TankFishCollection from "./TankFishCollection";
import BackgroundList from "./BackgroundList";
import { Suspense } from "react";
import { useRecoilValue } from "recoil";
import { authAtom } from "@/store/authAtom";
import axiosInstance from "@/services/axiosInstance";

interface FishTankTabContentProps {
  aquariumId: number;
  aquariumName: string;
}

export default function FishTankTabContent({ aquariumId, aquariumName }: FishTankTabContentProps) {
  // MyFishCollection 새로고침을 위한 트리거
  const [refreshMyFish, setRefreshMyFish] = useState(0);
  // TankFishCollection 새로고침을 위한 트리거
  const [refreshTankFish, setRefreshTankFish] = useState(0);

  // TankFishCollection에서 물고기 제거 후 MyFishCollection 갱신
  const handleFishRemoval = () => {
    setRefreshMyFish((prev) => prev + 1);
  };

  // MyFishCollection에서 물고기를 어항에 넣은 후 TankFishCollection 갱신
  const handleFishAdded = () => {
    setRefreshTankFish((prev) => prev + 1);
  };

  const auth = useRecoilValue(authAtom);

  // "대표어항 설정" 버튼 클릭 핸들러
  const handleSetMainAquarium = async () => {
    if (!auth.user) return;
    try {
      await axiosInstance.post("/aquariums/main-aqua", {
        userId: auth.user.id,
        aquariumId: aquariumId,
      });
      alert("대표 어항 설정이 완료되었습니다.");
    } catch (error) {
      console.error("Error setting main aquarium:", error);
    }
  };

  return (
    <div className="w-full h-full flex flex-col m-0 p-0">
      {/* 상단 영역 (MyFishCollection + TankFishCollection) */}
      <div className="h-3/5 flex gap-2">
        {/* 왼쪽: MyFishCollection */}
        <div className="flex-1 w-full h-full m-0 p-5 flex flex-col items-center">
          <p
            className="
              m-1 p-1 min-w-[200px] h-[50px] px-2 flex items-center justify-center self-start
              rounded-xl border border-[#040303] bg-white [box-shadow:-2px_-2px_0px_1px_rgba(0,0,0,0.5)_inset]
              text-[#070707] text-center text-xl font-[NeoDunggeunmo_Pro]
            "
          >
            내 물고기
          </p>
          {/* refresh와 onFishAdded를 전달 */}
          <MyFishCollection
            aquariumId={aquariumId}
            aquariumName={aquariumName}
            refresh={refreshMyFish}
            onFishAdded={handleFishAdded}
          />
        </div>
        {/* 오른쪽: TankFishCollection */}
        <div className="flex-1 w-full h-full m-0 p-5 flex flex-col items-center">
          <div className="flex items-center justify-between w-full">
            <p
              className="
                m-1 p-1 min-w-[200px] h-[50px] px-2 flex items-center justify-center
                rounded-xl border border-[#040303] bg-white [box-shadow:-2px_-2px_0px_1px_rgba(0,0,0,0.5)_inset]
                text-[#070707] text-center text-xl font-[NeoDunggeunmo_Pro]
              "
            >
              {aquariumName} 어항의 물고기
            </p>
            <button
              onClick={handleSetMainAquarium}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              대표어항 설정
            </button>
          </div>
          {/* refresh와 onFishRemoved를 전달 */}
          <TankFishCollection
            aquariumId={aquariumId}
            refresh={refreshTankFish}
            onFishRemoved={handleFishRemoval}
          />
        </div>
      </div>

      {/* 하단 영역 (배경화면) */}
      <div className="flex-1 h-full w-full m-0 p-5 flex flex-col items-center">
        <p
          className="
            mb-1 p-1 self-start flex items-center justify-center min-w-[200px] h-[50px] px-2
            rounded-xl border border-[#040303] bg-white [box-shadow:-2px_-2px_0px_1px_rgba(0,0,0,0.5)_inset]
            text-[#070707] text-center text-xl font-[NeoDunggeunmo_Pro]
          "
        >
          어항 배경 선택
        </p>
        <Suspense fallback={<div>Loading Backgrounds...</div>}>
          <BackgroundList aquariumId={aquariumId} />
        </Suspense>
      </div>
    </div>
  );
}
